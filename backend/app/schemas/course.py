from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CourseCreate(BaseModel):
    name: str
    description: Optional[str] = None
    subject: Optional[str] = None


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None


class CourseResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    subject: Optional[str]
    status: str
    overall_mastery: float
    created_at: datetime

    model_config = {"from_attributes": True}


class CourseDetailResponse(CourseResponse):
    document_count: int = 0
    topic_count: int = 0
    weak_topics: List[str] = []
