from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class TopicMastery(Base):
    __tablename__ = "topic_masteries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    mastery_score = Column(Float, default=0.0)  # 0-100
    quiz_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    last_studied = Column(DateTime(timezone=True), nullable=True)
    last_quiz_score = Column(Float, nullable=True)
    weakness_level = Column(String(50), default="critical")  # critical/needs_attention/developing/good/mastered
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    topic = relationship("Topic", back_populates="masteries")
    course = relationship("Course", back_populates="topic_masteries")
    history = relationship("MasteryHistory", back_populates="mastery", cascade="all, delete-orphan")


class MasteryHistory(Base):
    __tablename__ = "mastery_history"

    id = Column(Integer, primary_key=True, index=True)
    mastery_id = Column(Integer, ForeignKey("topic_masteries.id", ondelete="CASCADE"), nullable=False)
    mastery_score = Column(Float, nullable=False)
    event_type = Column(String(100), nullable=True)  # quiz, assessment, revision
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    mastery = relationship("TopicMastery", back_populates="history")
