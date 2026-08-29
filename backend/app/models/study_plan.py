from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class TaskActivity(str, enum.Enum):
    LEARN = "learn"
    PRACTICE = "practice"
    QUIZ = "quiz"
    REVISE = "revise"
    REVIEW_MISTAKES = "review_mistakes"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    MISSED = "missed"


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    course = relationship("Course", back_populates="study_plans")
    tasks = relationship("StudyTask", back_populates="study_plan", cascade="all, delete-orphan")


class StudyTask(Base):
    __tablename__ = "study_tasks"

    id = Column(Integer, primary_key=True, index=True)
    study_plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    activity_type = Column(Enum(TaskActivity), default=TaskActivity.LEARN)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, default=30)
    priority = Column(Integer, default=5)  # 1=highest, 10=lowest
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    learning_objective = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    study_plan = relationship("StudyPlan", back_populates="tasks")
    topic = relationship("Topic", back_populates="study_tasks")
