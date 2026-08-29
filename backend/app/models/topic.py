from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class DifficultyLevel(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class TopicStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    order_index = Column(Integer, default=0)
    prerequisites = Column(JSON, nullable=True)  # list of topic names
    learning_objectives = Column(JSON, nullable=True)  # list of strings
    key_concepts = Column(JSON, nullable=True)
    status = Column(Enum(TopicStatus), default=TopicStatus.NOT_STARTED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="topics")
    subtopics = relationship("Subtopic", back_populates="topic", cascade="all, delete-orphan")
    masteries = relationship("TopicMastery", back_populates="topic", cascade="all, delete-orphan")
    study_tasks = relationship("StudyTask", back_populates="topic", cascade="all, delete-orphan")
    mistakes = relationship("Mistake", back_populates="topic")
    conversations = relationship("AIConversation", back_populates="topic")


class Subtopic(Base):
    __tablename__ = "subtopics"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

    topic = relationship("Topic", back_populates="subtopics")
