from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from typing import List, Optional
from app.models.quiz import Quiz, Question, QuizAttempt, Answer, QuizType
from app.models.topic import Topic
from app.models.mistake import Mistake
from app.ai.agents.quiz_agent import QuizAgent
from app.ai.agents.adaptive_agent import AdaptiveAgent
from app.ai.rag.retrieval import retrieval_service
from app.services.mastery_service import mastery_service
from app.schemas.quiz import QuizSubmit
import logging

logger = logging.getLogger(__name__)


class QuizService:
    def generate_quiz(
        self,
        db: Session,
        course_id: int,
        user_id: int,
        topic_id: Optional[int],
        difficulty: Optional[str],
        num_questions: int = 10,
        quiz_type: str = "practice",
    ) -> Quiz:
        topic = None
        topic_name = "General"
        mastery_score = 50.0

        if topic_id:
            topic = db.query(Topic).filter(Topic.id == topic_id, Topic.course_id == course_id).first()
            if not topic:
                raise HTTPException(404, "Topic not found")
            topic_name = topic.name

            # Get mastery for adaptive difficulty
            mastery = mastery_service.get_mastery(db, user_id, course_id, topic_id)
            mastery_score = mastery.mastery_score

            # Adaptive difficulty if not specified
            if not difficulty:
                if mastery_score < 30:
                    difficulty = "easy"
                elif mastery_score < 70:
                    difficulty = "medium"
                else:
                    difficulty = "hard"

        if not difficulty:
            difficulty = "medium"

        # Get relevant course content via RAG
        course_context = ""
        try:
            chunks = retrieval_service.retrieve_relevant_chunks(
                db=db, course_id=course_id, query=f"{topic_name} quiz questions", top_k=3, topic_hint=topic_name
            )
            course_context = "\n".join([c["text"] for c in chunks])
        except Exception as e:
            logger.warning(f"RAG retrieval failed for quiz: {e}")

        agent = QuizAgent()
        result = agent.generate_questions(
            topic_name=topic_name,
            difficulty=difficulty,
            mastery_score=mastery_score,
            num_questions=num_questions,
            question_types=["mcq", "true_false", "short_answer"],
            course_context=course_context,
        )

        quiz = Quiz(
            course_id=course_id,
            topic_id=topic_id,
            title=f"{topic_name} - {difficulty.title()} Quiz",
            quiz_type=quiz_type,
            difficulty=difficulty,
            total_questions=len(result.questions),
        )
        db.add(quiz)
        db.flush()

        for idx, q in enumerate(result.questions):
            question = Question(
                quiz_id=quiz.id,
                topic_id=topic_id,
                question_text=q.question_text,
                question_type=q.question_type,
                difficulty=q.difficulty,
                options=q.options,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                topic_name=q.topic_name or topic_name,
                order_index=idx,
            )
            db.add(question)

        db.commit()
        db.refresh(quiz)
        return quiz

    def get_quiz(self, db: Session, quiz_id: int, user_id: int) -> Quiz:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(404, "Quiz not found")
        # Verify course ownership
        from app.models.course import Course
        course = db.query(Course).filter(Course.id == quiz.course_id, Course.user_id == user_id).first()
        if not course:
            raise HTTPException(403, "Not authorized")
        return quiz

    def submit_quiz(self, db: Session, quiz_id: int, user_id: int, data: QuizSubmit) -> dict:
        quiz = self.get_quiz(db, quiz_id, user_id)
        questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()
        q_map = {q.id: q for q in questions}

        attempt = QuizAttempt(
            quiz_id=quiz_id,
            course_id=quiz.course_id,
            user_id=user_id,
            time_taken_seconds=data.time_taken_seconds,
        )
        db.add(attempt)
        db.flush()

        answers_result = []
        topic_scores: dict = {}
        topic_counts: dict = {}
        correct_count = 0

        agent = QuizAgent()

        for ans_data in data.answers:
            q = q_map.get(ans_data.question_id)
            if not q:
                continue

            is_correct = False
            score = 0.0
            ai_feedback = None

            if q.question_type in ["mcq", "true_false"]:
                is_correct = ans_data.student_answer.strip().lower() == q.correct_answer.strip().lower()
                score = 1.0 if is_correct else 0.0
            elif q.question_type == "short_answer":
                try:
                    eval_result = agent.evaluate_short_answer(
                        question=q.question_text,
                        expected_answer=q.correct_answer,
                        student_answer=ans_data.student_answer,
                    )
                    is_correct = eval_result.is_correct
                    score = eval_result.score
                    ai_feedback = eval_result.feedback
                except Exception as e:
                    logger.error(f"Short answer eval failed: {e}")
                    is_correct = False
                    score = 0.0

            answer = Answer(
                attempt_id=attempt.id,
                question_id=q.id,
                student_answer=ans_data.student_answer,
                is_correct=is_correct,
                score=score,
                ai_feedback=ai_feedback,
            )
            db.add(answer)

            if is_correct:
                correct_count += 1
            else:
                # Store as mistake
                self._record_mistake(db, user_id, quiz.course_id, q, ans_data.student_answer)

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
                "score": score,
                "explanation": q.explanation,
                "ai_feedback": ai_feedback,
            })

        total = len(data.answers)
        overall_score = (correct_count / total * 100) if total > 0 else 0

        topic_pct = {}
        for topic, score in topic_scores.items():
            count = topic_counts.get(topic, 1)
            topic_pct[topic] = round(score / count * 100, 1)

        attempt.score = overall_score
        attempt.total_questions = total
        attempt.correct_count = correct_count
        attempt.incorrect_count = total - correct_count
        attempt.topic_scores = topic_pct
        attempt.completed_at = datetime.utcnow()

        # Update mastery
        if quiz.topic_id:
            mastery_service.update_mastery(
                db=db,
                user_id=user_id,
                course_id=quiz.course_id,
                topic_id=quiz.topic_id,
                quiz_score=overall_score,
                event_type="quiz",
            )
        else:
            # Update mastery for each topic in the quiz
            topics = db.query(Topic).filter(Topic.course_id == quiz.course_id).all()
            topic_id_map = {t.name: t.id for t in topics}
            for topic_name, score_pct in topic_pct.items():
                topic_id = next((v for k, v in topic_id_map.items() if topic_name.lower() in k.lower()), None)
                if topic_id:
                    mastery_service.update_mastery(db, user_id, quiz.course_id, topic_id, score_pct)

        db.commit()

        # Get adaptive recommendation
        adaptive_rec = None
        try:
            if quiz.topic_id:
                mastery = mastery_service.get_mastery(db, user_id, quiz.course_id, quiz.topic_id)
                adaptive_agent = AdaptiveAgent()
                rec = adaptive_agent.recommend_next_action(
                    topic_name=quiz.topic_id and db.query(Topic).filter(Topic.id == quiz.topic_id).first().name or "Topic",
                    mastery_score=mastery.mastery_score,
                    recent_score=overall_score,
                    mistake_patterns=f"Wrong answers: {attempt.incorrect_count}/{total}",
                    study_history=f"Quiz count: {mastery.quiz_count}",
                    student_context="",
                )
                adaptive_rec = {
                    "action": rec.action,
                    "topic": rec.topic,
                    "reason": rec.reason,
                    "difficulty": rec.difficulty,
                    "recommended_duration": rec.recommended_duration,
                }
        except Exception as e:
            logger.warning(f"Adaptive recommendation failed: {e}")

        return {
            "attempt_id": attempt.id,
            "quiz_id": quiz_id,
            "score": overall_score,
            "total_questions": total,
            "correct_count": correct_count,
            "incorrect_count": total - correct_count,
            "topic_scores": topic_pct,
            "answers": answers_result,
            "adaptive_recommendation": adaptive_rec,
        }

    def _record_mistake(self, db: Session, user_id: int, course_id: int, question: Question, student_answer: str):
        existing = db.query(Mistake).filter(
            Mistake.user_id == user_id,
            Mistake.question_id == question.id,
        ).first()

        if existing:
            existing.occurrence_count += 1
            existing.last_occurred_at = datetime.utcnow()
            existing.student_answer = student_answer
        else:
            mistake = Mistake(
                user_id=user_id,
                course_id=course_id,
                topic_id=question.topic_id,
                question_id=question.id,
                question_text=question.question_text,
                student_answer=student_answer,
                correct_answer=question.correct_answer,
                explanation=question.explanation,
                topic_name=question.topic_name,
                difficulty=question.difficulty.value if hasattr(question.difficulty, 'value') else question.difficulty,
            )
            db.add(mistake)


quiz_service = QuizService()
