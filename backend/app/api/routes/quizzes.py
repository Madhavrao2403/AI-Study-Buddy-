from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.quiz_service import quiz_service
from app.schemas.quiz import QuizSubmit

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


@router.post("/generate")
def generate_quiz(
    course_id: int,
    topic_id: Optional[int] = None,
    difficulty: Optional[str] = None,
    num_questions: int = Query(default=10, ge=3, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = quiz_service.generate_quiz(
        db=db,
        course_id=course_id,
        user_id=current_user.id,
        topic_id=topic_id,
        difficulty=difficulty,
        num_questions=num_questions,
    )
    from app.models.quiz import Question
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
    return {
        "id": quiz.id,
        "title": quiz.title,
        "quiz_type": quiz.quiz_type.value if hasattr(quiz.quiz_type, 'value') else quiz.quiz_type,
        "difficulty": quiz.difficulty.value if hasattr(quiz.difficulty, 'value') else quiz.difficulty,
        "total_questions": quiz.total_questions,
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


@router.get("/{quiz_id}")
def get_quiz(quiz_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quiz = quiz_service.get_quiz(db, quiz_id, current_user.id)
    from app.models.quiz import Question
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
    return {
        "id": quiz.id,
        "title": quiz.title,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "question_type": q.question_type.value if hasattr(q.question_type, 'value') else q.question_type,
                "difficulty": q.difficulty.value if hasattr(q.difficulty, 'value') else q.difficulty,
                "options": q.options,
                "order_index": q.order_index,
            }
            for q in questions
        ],
    }


@router.post("/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    data: QuizSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return quiz_service.submit_quiz(db, quiz_id, current_user.id, data)
