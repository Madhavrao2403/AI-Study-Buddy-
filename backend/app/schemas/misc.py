from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class ChatMessage(BaseModel):
    message: str
    explanation_mode: str = "simple"
    topic_id: Optional[int] = None


class ChatResponse(BaseModel):
    message_id: int
    response: str
    used_rag: bool
    source_note: Optional[str]
    conversation_id: int


class ConversationResponse(BaseModel):
    id: int
    title: Optional[str]
    explanation_mode: str
    topic_id: Optional[int]
    message_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class MistakeResponse(BaseModel):
    id: int
    question_text: str
    student_answer: Optional[str]
    correct_answer: str
    explanation: Optional[str]
    topic_name: Optional[str]
    difficulty: Optional[str]
    occurrence_count: int
    is_resolved: bool
    last_occurred_at: datetime

    model_config = {"from_attributes": True}


class ProgressResponse(BaseModel):
    overall_mastery: float
    total_study_minutes: int
    topics_mastered: int
    total_topics: int
    quiz_attempts: int
    average_quiz_score: float
    weak_topics: List[Dict]
    mastery_by_topic: List[Dict]
    recent_quiz_scores: List[Dict]
    study_streak_days: int


class AdaptiveRecommendResponse(BaseModel):
    action: str
    topic: str
    reason: str
    difficulty: str
    recommended_duration: int
    specific_focus: str
