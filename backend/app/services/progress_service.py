from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.quiz import QuizAttempt
from app.models.mastery import TopicMastery
from app.models.mistake import Mistake
from app.models.study_session import StudySession
from app.models.topic import Topic
from app.services.mastery_service import mastery_service
import logging

logger = logging.getLogger(__name__)


class ProgressService:
    def get_progress(self, db: Session, user_id: int, course_id: int) -> dict:
        # Overall mastery
        masteries = mastery_service.get_course_mastery(db, user_id, course_id)
        overall = sum(m["mastery_score"] for m in masteries) / len(masteries) if masteries else 0

        # Quiz attempts
        attempts = db.query(QuizAttempt).filter(
            QuizAttempt.course_id == course_id,
            QuizAttempt.user_id == user_id,
            QuizAttempt.completed_at.isnot(None),
        ).order_by(QuizAttempt.completed_at.desc()).all()

        avg_quiz_score = 0.0
        if attempts:
            avg_quiz_score = sum(a.score for a in attempts) / len(attempts)

        recent_scores = [
            {
                "date": a.completed_at.strftime("%Y-%m-%d") if a.completed_at else "",
                "score": a.score,
                "topic": a.topic_scores and list(a.topic_scores.keys())[0] or "General",
            }
            for a in attempts[:10]
        ]

        # Study time
        sessions = db.query(StudySession).filter(
            StudySession.user_id == user_id,
            StudySession.course_id == course_id,
        ).all()
        total_study = sum(s.duration_minutes for s in sessions)

        # Topics mastered
        topics_mastered = len([m for m in masteries if m["mastery_score"] >= 70])
        total_topics = len(masteries)

        # Weak topics
        weak = [m for m in masteries if m["mastery_score"] < 50]

        # Study streak
        streak = self._calculate_streak(db, user_id)

        return {
            "overall_mastery": round(overall, 1),
            "total_study_minutes": total_study,
            "topics_mastered": topics_mastered,
            "total_topics": total_topics,
            "quiz_attempts": len(attempts),
            "average_quiz_score": round(avg_quiz_score, 1),
            "weak_topics": weak[:5],
            "mastery_by_topic": masteries,
            "recent_quiz_scores": recent_scores,
            "study_streak_days": streak,
        }

    def _calculate_streak(self, db: Session, user_id: int) -> int:
        """Calculate consecutive days studied."""
        sessions = db.query(StudySession).filter(
            StudySession.user_id == user_id,
        ).order_by(StudySession.start_time.desc()).all()

        if not sessions:
            return 0

        streak = 0
        current_date = datetime.utcnow().date()
        session_dates = sorted(set(s.start_time.date() for s in sessions if s.start_time), reverse=True)

        for date in session_dates:
            if date == current_date or date == current_date - timedelta(days=streak):
                streak += 1
                current_date = date
            else:
                break

        return streak


progress_service = ProgressService()
