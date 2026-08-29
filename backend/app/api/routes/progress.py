from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.progress_service import progress_service
from app.services.mastery_service import mastery_service

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/{course_id}")
def get_progress(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return progress_service.get_progress(db, current_user.id, course_id)


@router.get("/{course_id}/mastery")
def get_mastery(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return mastery_service.get_course_mastery(db, current_user.id, course_id)
