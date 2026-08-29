from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class StudyTaskResponse(BaseModel):
    id: int
    study_plan_id: int
    topic_id: Optional[int]
    title: str
    description: Optional[str]
    activity_type: str
    scheduled_date: Optional[datetime]
    duration_minutes: int
    priority: int
    status: str
    learning_objective: Optional[str]
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class StudyPlanResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    is_active: bool
    tasks: List[StudyTaskResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class TaskUpdate(BaseModel):
    status: str


class AssessmentResponse(BaseModel):
    id: int
    course_id: int
    status: str
    overall_score: Optional[float]
    topic_scores: Optional[Dict]
    knowledge_gaps: Optional[List[str]]
    strong_topics: Optional[List[str]]
    weak_topics: Optional[List[str]]
    quiz_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}
