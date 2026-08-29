from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.assessment_service import assessment_service
from app.schemas.study_plan import AssessmentResponse
from app.schemas.quiz import QuizSubmit

router = APIRouter(prefix="/api/courses", tags=["assessment"])


@router.post("/{course_id}/assessment")
def create_assessment(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assessment = assessment_service.get_or_create_assessment(db, course_id, current_user.id)
    from app.models.quiz import Question
    questions = db.query(Question).filter(Question.quiz_id == assessment.quiz_id).all()
    return {
        "assessment_id": assessment.id,
        "quiz_id": assessment.quiz_id,
        "status": assessment.status.value if hasattr(assessment.status, 'value') else assessment.status,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "question_type": q.question_type.value if hasattr(q.question_type, 'value') else q.question_type,
                "difficulty": q.difficulty.value if hasattr(q.difficulty, 'value') else q.difficulty,
                "topic_name": q.topic_name,
                "options": q.options,
                "order_index": q.order_index,
            }
            for q in questions
        ],
    }


@router.post("/{course_id}/assessment/{assessment_id}/submit")
def submit_assessment(
    course_id: int,
    assessment_id: int,
    data: QuizSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return assessment_service.submit_assessment(db, assessment_id, current_user.id, data)


@router.get("/{course_id}/assessment")
def get_assessment(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.assessment import Assessment, AssessmentStatus
    assessment = db.query(Assessment).filter(
        Assessment.course_id == course_id,
        Assessment.user_id == current_user.id,
    ).order_by(Assessment.created_at.desc()).first()

    if not assessment:
        return {"exists": False}

    return {
        "exists": True,
        "assessment_id": assessment.id,
        "status": assessment.status.value if hasattr(assessment.status, 'value') else assessment.status,
        "overall_score": assessment.overall_score,
        "topic_scores": assessment.topic_scores,
        "knowledge_gaps": assessment.knowledge_gaps,
        "strong_topics": assessment.strong_topics,
        "weak_topics": assessment.weak_topics,
    }
