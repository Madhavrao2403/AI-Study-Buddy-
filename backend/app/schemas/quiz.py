from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class QuestionResponse(BaseModel):
    id: int
    question_text: str
    question_type: str
    difficulty: str
    topic_name: Optional[str]
    options: Optional[List[str]]
    order_index: int

    model_config = {"from_attributes": True}


class QuizResponse(BaseModel):
    id: int
    course_id: int
    topic_id: Optional[int]
    title: str
    quiz_type: str
    difficulty: str
    total_questions: int
    questions: List[QuestionResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class AnswerSubmit(BaseModel):
    question_id: int
    student_answer: str


class QuizSubmit(BaseModel):
    answers: List[AnswerSubmit]
    time_taken_seconds: Optional[int] = None


class AnswerResultResponse(BaseModel):
    question_id: int
    question_text: str
    student_answer: str
    correct_answer: str
    is_correct: bool
    score: float
    explanation: Optional[str]
    ai_feedback: Optional[str]


class QuizResultResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    score: float
    total_questions: int
    correct_count: int
    incorrect_count: int
    topic_scores: Optional[Dict]
    answers: List[AnswerResultResponse]
    adaptive_recommendation: Optional[Dict] = None
