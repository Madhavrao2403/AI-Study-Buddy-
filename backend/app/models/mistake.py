from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class Mistake(Base):
    __tablename__ = "mistakes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="SET NULL"), nullable=True)
    question_text = Column(Text, nullable=False)
    student_answer = Column(Text, nullable=True)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    topic_name = Column(String(500), nullable=True)
    difficulty = Column(String(50), nullable=True)
    occurrence_count = Column(Integer, default=1)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_occurred_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="mistakes")
    topic = relationship("Topic", back_populates="mistakes")
