from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class AssessmentStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(AssessmentStatus), default=AssessmentStatus.PENDING)
    overall_score = Column(Float, nullable=True)
    topic_scores = Column(JSON, nullable=True)
    knowledge_gaps = Column(JSON, nullable=True)  # list of topic names
    strong_topics = Column(JSON, nullable=True)
    weak_topics = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    course = relationship("Course", back_populates="assessments")
