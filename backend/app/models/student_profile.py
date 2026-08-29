from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class LearningStyle(str, enum.Enum):
    SIMPLE = "simple"
    EXAMPLES_FIRST = "examples_first"
    THEORY_FIRST = "theory_first"
    CODE_EXAMPLES = "code_examples"
    EXAM_FOCUSED = "exam_focused"
    INTERVIEW_FOCUSED = "interview_focused"


class SkillLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    learning_goal = Column(Text, nullable=True)
    current_skill_level = Column(Enum(SkillLevel), default=SkillLevel.BEGINNER)
    daily_study_time_minutes = Column(Integer, default=60)
    preferred_explanation_style = Column(Enum(LearningStyle), default=LearningStyle.SIMPLE)
    exam_date = Column(DateTime(timezone=True), nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")
