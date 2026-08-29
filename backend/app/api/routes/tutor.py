from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.tutor_service import tutor_service
from app.schemas.misc import ChatMessage

router = APIRouter(prefix="/api/tutor", tags=["tutor"])


@router.post("/chat/{course_id}")
def chat(
    course_id: int,
    data: ChatMessage,
    conversation_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return tutor_service.chat(
        db=db,
        user_id=current_user.id,
        course_id=course_id,
        message=data.message,
        topic_id=data.topic_id,
        explanation_mode=data.explanation_mode,
        conversation_id=conversation_id,
    )


@router.get("/conversations/{course_id}")
def get_conversations(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return tutor_service.get_conversations(db, current_user.id, course_id)


@router.get("/conversations/{course_id}/{conversation_id}/messages")
def get_messages(
    course_id: int,
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    messages = tutor_service.get_messages(db, conversation_id, current_user.id)
    return [
        {
            "id": m.id,
            "role": m.role.value if hasattr(m.role, 'value') else m.role,
            "content": m.content,
            "used_rag": m.used_rag,
            "created_at": m.created_at,
        }
        for m in messages
    ]
