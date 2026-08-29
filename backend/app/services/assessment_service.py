from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from app.models.assessment import Assessment, AssessmentStatus
from app.models.quiz import Quiz, Question, QuizAttempt, Answer, QuizType
from app.models.topic import Topic
from app.models.mastery import TopicMastery, MasteryHistory
from app.models.course import Course
from app.ai.agents.assessment_agent import AssessmentAgent
from app.ai.agents.adaptive_agent import AdaptiveAgent
from app.schemas.quiz import QuizSubmit
from app.services.mastery_service import mastery_service
import logging

logger = logging.getLogger(__name__)


class AssessmentService:
    def get_or_create_assessment(self, db: Session, course_id: int, user_id: int) -> Assessment:
        """Get existing or create new diagnostic assessment."""
        existing = db.query(Assessment).filter(
            Assessment.course_id == course_id,
            Assessment.user_id == user_id,
            Assessment.status == AssessmentStatus.PENDING,
        ).first()

        if existing and existing.quiz_id:
            return existing

        # Get topics
        topics = db.query(Topic).filter(Topic.course_id == course_id).all()
        if not topics:
            raise HTTPException(400, "Course must be analyzed before assessment. No topics found.")

        topics_data = [
            {"name": t.name, "difficulty": t.difficulty.value if hasattr(t.difficulty, 'value') else t.difficulty}
            for t in topics
        ]

        # Get some document content for context
        from app.models.document import DocumentChunk
        chunks = db.query(DocumentChunk).filter(
            DocumentChunk.course_id == course_id
        ).limit(5).all()
        context = " ".join([c.chunk_text for c in chunks])[:2000]

        course = db.query(Course).filter(Course.id == course_id).first()
        agent = AssessmentAgent()
        result = agent.generate_diagnostic(
            topics=topics_data,
            course_name=course.name,
            num_questions=min(15, len(topics) * 3),
            course_content=context,
        )

        # Create quiz
        quiz = Quiz(
            course_id=course_id,
            title=f"Diagnostic Assessment - {course.name}",
            quiz_type=QuizType.DIAGNOSTIC,
            total_questions=len(result.questions),
        )
        db.add(quiz)
        db.flush()

        topic_map = {t.name.lower(): t.id for t in topics}
        for idx, q in enumerate(result.questions):
            topic_id = next(
                (v for k, v in topic_map.items() if q.topic_name and q.topic_name.lower() in k),
                None
            )
            question = Question(
                quiz_id=quiz.id,
                topic_id=topic_id,
                question_text=q.question_text,
                question_type=q.question_type,
                difficulty=q.difficulty,
                options=q.options,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                topic_name=q.topic_name,
                order_index=idx,
            )
            db.add(question)

        assessment = Assessment(
            course_id=course_id,
            user_id=user_id,
            quiz_id=quiz.id,
            status=AssessmentStatus.IN_PROGRESS,
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        return assessment

    def submit_assessment(
        self, db: Session, assessment_id: int, user_id: int, data: QuizSubmit
    ) -> dict:
        assessment = db.query(Assessment).filter(
            Assessment.id == assessment_id,
            Assessment.user_id == user_id,
        ).first()
        if not assessment:
            raise HTTPException(404, "Assessment not found")

        quiz = db.query(Quiz).filter(Quiz.id == assessment.quiz_id).first()
        questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
        q_map = {q.id: q for q in questions}

        attempt = QuizAttempt(
            quiz_id=quiz.id,
            course_id=assessment.course_id,
            user_id=user_id,
        )
        db.add(attempt)
        db.flush()

        answers_result = []
        topic_scores: dict = {}
        topic_counts: dict = {}
        correct_count = 0

        for ans_data in data.answers:
            q = q_map.get(ans_data.question_id)
            if not q:
                continue

            is_correct = False
            score = 0.0

            if q.question_type in ["mcq", "true_false"]:
                is_correct = ans_data.student_answer.strip().lower() == q.correct_answer.strip().lower()
                score = 1.0 if is_correct else 0.0
            else:
                # Short answer - simple check for now
                is_correct = len(ans_data.student_answer.strip()) > 10
                score = 0.7 if is_correct else 0.0

            answer = Answer(
                attempt_id=attempt.id,
                question_id=q.id,
                student_answer=ans_data.student_answer,
                is_correct=is_correct,
                score=score,
            )
            db.add(answer)

            if is_correct:
                correct_count += 1

            topic = q.topic_name or "General"
            if topic not in topic_scores:
                topic_scores[topic] = 0
                topic_counts[topic] = 0
            topic_scores[topic] += score
            topic_counts[topic] += 1

            answers_result.append({
                "question_id": q.id,
                "question_text": q.question_text,
                "student_answer": ans_data.student_answer,
                "correct_answer": q.correct_answer,
                "is_correct": is_correct,
                "explanation": q.explanation,
            })

        total = len(data.answers)
        overall_score = (correct_count / total * 100) if total > 0 else 0

        # Normalize topic scores to %
        topic_pct = {}
        for topic, score in topic_scores.items():
            count = topic_counts.get(topic, 1)
            topic_pct[topic] = round(score / count * 100, 1)

        weak_topics = [t for t, s in topic_pct.items() if s < 50]
        strong_topics = [t for t, s in topic_pct.items() if s >= 70]

        attempt.score = overall_score
        attempt.total_questions = total
        attempt.correct_count = correct_count
        attempt.incorrect_count = total - correct_count
        attempt.topic_scores = topic_pct
        attempt.completed_at = datetime.utcnow()

        assessment.status = AssessmentStatus.COMPLETED
        assessment.overall_score = overall_score
        assessment.topic_scores = topic_pct
        assessment.knowledge_gaps = weak_topics
        assessment.strong_topics = strong_topics
        assessment.weak_topics = weak_topics
        assessment.completed_at = datetime.utcnow()

        # Initialize mastery for all topics
        topics = db.query(Topic).filter(Topic.course_id == assessment.course_id).all()
        for topic in topics:
            score_pct = topic_pct.get(topic.name, overall_score * 0.7)
            mastery_service.update_mastery(
                db=db,
                user_id=user_id,
                course_id=assessment.course_id,
                topic_id=topic.id,
                quiz_score=score_pct,
                event_type="assessment",
            )

        db.commit()

        return {
            "assessment_id": assessment.id,
            "overall_score": overall_score,
            "topic_scores": topic_pct,
            "weak_topics": weak_topics,
            "strong_topics": strong_topics,
            "answers": answers_result,
        }


assessment_service = AssessmentService()
