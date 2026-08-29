from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProfileUpdate(BaseModel):
    learning_goal: Optional[str] = None
    current_skill_level: Optional[str] = None
    daily_study_time_minutes: Optional[int] = None
    preferred_explanation_style: Optional[str] = None
    exam_date: Optional[datetime] = None
    bio: Optional[str] = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    learning_goal: Optional[str]
    current_skill_level: Optional[str]
    daily_study_time_minutes: int
    preferred_explanation_style: Optional[str]
    exam_date: Optional[datetime]
    bio: Optional[str]

    model_config = {"from_attributes": True}
