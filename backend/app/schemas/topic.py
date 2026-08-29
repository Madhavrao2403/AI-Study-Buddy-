from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DocumentResponse(BaseModel):
    id: int
    course_id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    processing_status: str
    total_chunks: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SubtopicResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    order_index: int

    model_config = {"from_attributes": True}


class TopicResponse(BaseModel):
    id: int
    course_id: int
    name: str
    description: Optional[str]
    difficulty: str
    order_index: int
    prerequisites: Optional[List[str]]
    learning_objectives: Optional[List[str]]
    key_concepts: Optional[List[str]]
    status: str
    subtopics: List[SubtopicResponse] = []

    model_config = {"from_attributes": True}


class TopicMasteryResponse(BaseModel):
    topic_id: int
    topic_name: str
    mastery_score: float
    weakness_level: str
    quiz_count: int
    last_studied: Optional[datetime]

    model_config = {"from_attributes": True}
