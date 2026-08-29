from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.topic import Topic
from app.ai.agents.adaptive_agent import AdaptiveAgent
from app.services.mastery_service import mastery_service
from app.services.study_plan_service import study_plan_service
from app.models.student_profile import StudentProfile
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/adaptive", tags=["adaptive"])


class RecommendRequest(BaseModel):
    course_id: int
    topic_id: int


class ApplyRequest(BaseModel):
    course_id: int
    topic_id: int
    action: str


@router.post("/recommend")
def get_recommendation(
    data: RecommendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topic = db.query(Topic).filter(Topic.id == data.topic_id).first()
    if not topic:
        from fastapi import HTTPException
        raise HTTPException(404, "Topic not found")

    mastery = mastery_service.get_mastery(db, current_user.id, data.course_id, data.topic_id)

    from app.models.quiz import QuizAttempt
    recent_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.course_id == data.course_id,
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.completed_at.isnot(None),
    ).order_by(QuizAttempt.completed_at.desc()).limit(3).all()

    recent_score = recent_attempts[0].score if recent_attempts else 0.0

    from app.models.mistake import Mistake
    mistakes = db.query(Mistake).filter(
        Mistake.user_id == current_user.id,
        Mistake.topic_id == data.topic_id,
    ).order_by(Mistake.occurrence_count.desc()).limit(3).all()
    mistake_str = ", ".join([m.topic_name or "unknown" for m in mistakes]) or "No recorded mistakes"

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    student_context = f"Skill: {profile.current_skill_level if profile else 'beginner'}"

    agent = AdaptiveAgent()
    rec = agent.recommend_next_action(
        topic_name=topic.name,
        mastery_score=mastery.mastery_score,
        recent_score=recent_score,
        mistake_patterns=mistake_str,
        study_history=f"Quiz count: {mastery.quiz_count}, last studied: {mastery.last_studied}",
        student_context=student_context,
    )

    return {
        "action": rec.action,
        "topic": rec.topic,
        "reason": rec.reason,
        "difficulty": rec.difficulty,
        "recommended_duration": rec.recommended_duration,
        "specific_focus": rec.specific_focus,
        "mastery_score": mastery.mastery_score,
        "weakness_level": mastery.weakness_level,
    }


@router.post("/apply")
def apply_recommendation(
    data: ApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    study_plan_service.adapt_plan(db, data.course_id, current_user.id, data.topic_id, data.action)
    return {"message": "Study plan adapted", "action": data.action}


@router.get("/dashboard-recommendation/{course_id}")
def dashboard_recommendation(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.mastery import TopicMastery
    from app.models.quiz import QuizAttempt

    masteries = db.query(TopicMastery).filter(
        TopicMastery.course_id == course_id,
        TopicMastery.user_id == current_user.id,
    ).all()

    recent_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.course_id == course_id,
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.completed_at.isnot(None),
    ).order_by(QuizAttempt.completed_at.desc()).limit(5).all()

    stats = {
        "avg_mastery": sum(m.mastery_score for m in masteries) / len(masteries) if masteries else 0,
        "weak_topics": [m.topic_id for m in masteries if m.mastery_score < 40],
        "recent_avg_score": sum(a.score for a in recent_attempts) / len(recent_attempts) if recent_attempts else 0,
    }

    activity = f"Recent attempts: {len(recent_attempts)}, Avg score: {stats['recent_avg_score']:.0f}%"

    try:
        agent = AdaptiveAgent()
        rec = agent.get_recommendation(
            student_name=current_user.full_name,
            stats=stats,
            recent_activity=activity,
        )
        return {
            "title": rec.title,
            "description": rec.description,
            "action_type": rec.action_type,
            "topic_name": rec.topic_name,
            "urgency": rec.urgency,
            "estimated_minutes": rec.estimated_minutes,
        }
    except Exception as e:
        logger.error(f"Dashboard recommendation failed: {e}")
        return {
            "title": "Continue Studying",
            "description": "Keep up your learning momentum!",
            "action_type": "learn",
            "urgency": "medium",
            "estimated_minutes": 30,
        }
