from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.course import Course, CourseStatus
from app.models.topic import Topic, Subtopic
from app.models.mastery import TopicMastery
from app.models.document import Document
from app.schemas.course import CourseCreate, CourseUpdate
from app.ai.agents.course_analyzer import CourseAnalyzerAgent
import logging

logger = logging.getLogger(__name__)


class CourseService:
    def get_courses(self, db: Session, user_id: int):
        return db.query(Course).filter(Course.user_id == user_id).order_by(Course.created_at.desc()).all()

    def get_course(self, db: Session, course_id: int, user_id: int) -> Course:
        course = db.query(Course).filter(Course.id == course_id, Course.user_id == user_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        return course

    def create_course(self, db: Session, data: CourseCreate, user_id: int) -> Course:
        course = Course(
            user_id=user_id,
            name=data.name,
            description=data.description,
            subject=data.subject,
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        return course

    def update_course(self, db: Session, course_id: int, data: CourseUpdate, user_id: int) -> Course:
        course = self.get_course(db, course_id, user_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(course, field, value)
        db.commit()
        db.refresh(course)
        return course

    def delete_course(self, db: Session, course_id: int, user_id: int):
        course = self.get_course(db, course_id, user_id)

        # Remove uploaded files from disk
        import os, shutil
        upload_dir = os.path.join("uploads", str(course_id))
        if os.path.exists(upload_dir):
            try:
                shutil.rmtree(upload_dir)
            except Exception as e:
                logger.warning(f"Could not remove upload dir {upload_dir}: {e}")

        db.delete(course)
        db.commit()

    def analyze_course(self, db: Session, course_id: int, user_id: int) -> Course:
        course = self.get_course(db, course_id, user_id)

        # Get all document text
        documents = db.query(Document).filter(
            Document.course_id == course_id,
            Document.processing_status == "ready",
        ).all()

        content = ""
        for doc in documents:
            # Read from stored path
            try:
                with open(doc.storage_path, "rb") as f:
                    raw = f.read()
                from app.utils.document_processor import extract_text_from_content
                text = extract_text_from_content(raw, doc.file_type, doc.original_filename)
                content += f"\n\n--- {doc.original_filename} ---\n{text}"
            except Exception as e:
                logger.warning(f"Could not read document {doc.id}: {e}")

        if not content.strip():
            content = f"Course: {course.name}\nDescription: {course.description or 'No description'}"

        course.status = CourseStatus.ANALYZING
        db.commit()

        try:
            agent = CourseAnalyzerAgent()
            result = agent.analyze(content, course.name)

            # Remove existing topics
            for t in db.query(Topic).filter(Topic.course_id == course_id).all():
                db.delete(t)
            db.flush()

            # Create new topics
            for topic_data in result.topics:
                topic = Topic(
                    course_id=course_id,
                    name=topic_data.name,
                    description=topic_data.description,
                    difficulty=topic_data.difficulty,
                    order_index=topic_data.order_index,
                    prerequisites=topic_data.prerequisites,
                    learning_objectives=topic_data.learning_objectives,
                    key_concepts=topic_data.key_concepts,
                )
                db.add(topic)
                db.flush()

                for idx, sub in enumerate(topic_data.subtopics):
                    subtopic = Subtopic(
                        topic_id=topic.id,
                        name=sub.name,
                        description=sub.description,
                        order_index=idx,
                    )
                    db.add(subtopic)

            course.status = CourseStatus.READY
            db.commit()
            db.refresh(course)

        except Exception as e:
            logger.error(f"Course analysis error: {e}")
            course.status = CourseStatus.ERROR
            db.commit()
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

        return course


course_service = CourseService()
