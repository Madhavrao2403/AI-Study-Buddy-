from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class CourseStatus(str, enum.Enum):
    CREATED = "created"
    ANALYZING = "analyzing"
    READY = "ready"
    ERROR = "error"


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String(255), nullable=True)
    status = Column(Enum(CourseStatus), default=CourseStatus.CREATED)
    overall_mastery = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="courses")
    documents = relationship("Document", back_populates="course", cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="course", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="course", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="course", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="course", cascade="all, delete-orphan")
    topic_masteries = relationship("TopicMastery", back_populates="course", cascade="all, delete-orphan")
    mistakes = relationship("Mistake", back_populates="course", cascade="all, delete-orphan")
    conversations = relationship("AIConversation", back_populates="course", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="course", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="course", cascade="all, delete-orphan")
