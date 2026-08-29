from sqlalchemy.orm import Session
from app.models.mastery import TopicMastery, MasteryHistory
from app.models.topic import Topic
from app.models.course import Course
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

MASTERY_THRESHOLDS = {
    "critical": (0, 30),
    "needs_attention": (31, 50),
    "developing": (51, 70),
    "good": (71, 85),
    "mastered": (86, 100),
}


def get_weakness_level(score: float) -> str:
    for level, (low, high) in MASTERY_THRESHOLDS.items():
        if low <= score <= high:
            return level
    return "critical"


class MasteryService:
    def get_mastery(self, db: Session, user_id: int, course_id: int, topic_id: int) -> TopicMastery:
        mastery = db.query(TopicMastery).filter(
            TopicMastery.user_id == user_id,
            TopicMastery.course_id == course_id,
            TopicMastery.topic_id == topic_id,
        ).first()
        if not mastery:
            mastery = TopicMastery(
                user_id=user_id,
                course_id=course_id,
                topic_id=topic_id,
                mastery_score=0.0,
                weakness_level="critical",
            )
            db.add(mastery)
            db.flush()
        return mastery

    def update_mastery(
        self,
        db: Session,
        user_id: int,
        course_id: int,
        topic_id: int,
        quiz_score: float,
        event_type: str = "quiz",
    ) -> TopicMastery:
        """Update mastery using weighted average of historical performance."""
        mastery = self.get_mastery(db, user_id, course_id, topic_id)

        # Weighted update: 70% existing + 30% new score for established mastery
        if mastery.quiz_count == 0:
            new_score = quiz_score * 0.8  # First assessment, conservative
        else:
            # Weight recent performance more heavily
            weight_new = 0.4
            weight_old = 0.6
            new_score = (mastery.mastery_score * weight_old) + (quiz_score * weight_new)

        new_score = max(0.0, min(100.0, new_score))

        mastery.mastery_score = new_score
        mastery.quiz_count += 1
        mastery.total_questions += 1
        mastery.last_studied = datetime.utcnow()
        mastery.last_quiz_score = quiz_score
        mastery.weakness_level = get_weakness_level(new_score)

        if quiz_score > 0:
            mastery.correct_count += 1

        # Record history
        history = MasteryHistory(
            mastery_id=mastery.id,
            mastery_score=new_score,
            event_type=event_type,
        )
        db.add(history)

        # Update overall course mastery
        self._update_course_mastery(db, user_id, course_id)
        db.commit()
        return mastery

    def _update_course_mastery(self, db: Session, user_id: int, course_id: int):
        masteries = db.query(TopicMastery).filter(
            TopicMastery.user_id == user_id,
            TopicMastery.course_id == course_id,
        ).all()
        if masteries:
            overall = sum(m.mastery_score for m in masteries) / len(masteries)
            course = db.query(Course).filter(Course.id == course_id).first()
            if course:
                course.overall_mastery = overall

    def get_course_mastery(self, db: Session, user_id: int, course_id: int):
        masteries = db.query(TopicMastery).filter(
            TopicMastery.user_id == user_id,
            TopicMastery.course_id == course_id,
        ).all()

        result = []
        for m in masteries:
            topic = db.query(Topic).filter(Topic.id == m.topic_id).first()
            result.append({
                "topic_id": m.topic_id,
                "topic_name": topic.name if topic else "Unknown",
                "mastery_score": m.mastery_score,
                "weakness_level": m.weakness_level,
                "quiz_count": m.quiz_count,
                "last_studied": m.last_studied,
                "last_quiz_score": m.last_quiz_score,
            })

        return sorted(result, key=lambda x: x["mastery_score"])


mastery_service = MasteryService()
