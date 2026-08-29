from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.topic import Topic, Subtopic
from app.models.document import Document
from app.services.course_service import course_service
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseDetailResponse
from app.schemas.topic import TopicResponse

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("", response_model=List[CourseResponse])
def list_courses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return course_service.get_courses(db, current_user.id)


@router.post("", response_model=CourseResponse)
def create_course(data: CourseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return course_service.create_course(db, data, current_user.id)


@router.get("/{course_id}", response_model=CourseDetailResponse)
def get_course(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = course_service.get_course(db, course_id, current_user.id)
    doc_count = db.query(Document).filter(Document.course_id == course_id).count()
    topic_count = db.query(Topic).filter(Topic.course_id == course_id).count()
    from app.models.mastery import TopicMastery
    weak = db.query(TopicMastery).filter(
        TopicMastery.course_id == course_id,
        TopicMastery.user_id == current_user.id,
        TopicMastery.mastery_score < 50,
    ).all()
    weak_names = []
    for m in weak[:5]:
        t = db.query(Topic).filter(Topic.id == m.topic_id).first()
        if t:
            weak_names.append(t.name)
    return {
        **course.__dict__,
        "document_count": doc_count,
        "topic_count": topic_count,
        "weak_topics": weak_names,
    }


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, data: CourseUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return course_service.update_course(db, course_id, data, current_user.id)


@router.delete("/{course_id}")
def delete_course(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course_service.delete_course(db, course_id, current_user.id)
    return {"message": "Course deleted"}


@router.post("/{course_id}/analyze", response_model=CourseResponse)
def analyze_course(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return course_service.analyze_course(db, course_id, current_user.id)


@router.get("/{course_id}/topics", response_model=List[TopicResponse])
def get_topics(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course_service.get_course(db, course_id, current_user.id)
    topics = db.query(Topic).filter(Topic.course_id == course_id).order_by(Topic.order_index).all()
    return topics
