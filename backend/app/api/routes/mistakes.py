from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.mistake import Mistake

router = APIRouter(prefix="/api/mistakes", tags=["mistakes"])


@router.get("")
def get_mistakes(
    course_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Mistake).filter(Mistake.user_id == current_user.id)
    if course_id:
        query = query.filter(Mistake.course_id == course_id)
    mistakes = query.order_by(Mistake.last_occurred_at.desc()).all()
    return [
        {
            "id": m.id,
            "question_text": m.question_text,
            "student_answer": m.student_answer,
            "correct_answer": m.correct_answer,
            "explanation": m.explanation,
            "topic_name": m.topic_name,
            "difficulty": m.difficulty,
            "occurrence_count": m.occurrence_count,
            "is_resolved": m.is_resolved,
            "last_occurred_at": m.last_occurred_at,
            "course_id": m.course_id,
        }
        for m in mistakes
    ]


@router.put("/{mistake_id}/resolve")
def resolve_mistake(
    mistake_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mistake = db.query(Mistake).filter(
        Mistake.id == mistake_id,
        Mistake.user_id == current_user.id,
    ).first()
    if not mistake:
        from fastapi import HTTPException
        raise HTTPException(404, "Mistake not found")
    mistake.is_resolved = True
    db.commit()
    return {"message": "Marked as resolved"}
