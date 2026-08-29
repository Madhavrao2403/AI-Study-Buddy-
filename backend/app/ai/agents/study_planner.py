from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.ai.openai_service import openai_service
from app.ai.prompts import STUDY_PLANNER_PROMPT
import logging

logger = logging.getLogger(__name__)


class StudyTaskSchema(BaseModel):
    title: str
    description: str = ""
    topic_name: str = ""
    activity_type: str = "learn"
    scheduled_date: str = ""
    duration_minutes: int = 30
    priority: int = 5
    learning_objective: str = ""


class StudyPlanResult(BaseModel):
    title: str
    description: str = ""
    tasks: List[StudyTaskSchema]


class StudyPlannerAgent:
    def generate_plan(
        self,
        course_name: str,
        topics: List[Dict],
        mastery_data: List[Dict],
        student_profile: Dict,
        exam_date: Optional[str] = None,
        existing_weak_topics: List[str] = None,
    ) -> StudyPlanResult:
        """Generate a personalized study plan."""
        mastery_str = "\n".join([
            f"- {m['topic_name']}: {m['mastery_score']:.0f}% mastery ({m.get('weakness_level', 'unknown')})"
            for m in mastery_data[:20]
        ])

        topics_str = "\n".join([
            f"- {t.get('name', '')} (difficulty: {t.get('difficulty', 'medium')}, prereqs: {', '.join(t.get('prerequisites', [])[:3])})"
            for t in topics[:20]
        ])

        daily_mins = student_profile.get("daily_study_time_minutes", 60)
        learning_style = student_profile.get("preferred_explanation_style", "simple")
        
        exam_info = f"Exam Date: {exam_date}" if exam_date else "No specific exam date"
        weak_info = f"Weak topics (priority): {', '.join(existing_weak_topics)}" if existing_weak_topics else ""

        today = datetime.now().strftime("%Y-%m-%d")
        
        messages = [
            {"role": "system", "content": STUDY_PLANNER_PROMPT},
            {
                "role": "user",
                "content": f"""Course: {course_name}
Today's Date: {today}
Daily Study Time: {daily_mins} minutes
Learning Style: {learning_style}
{exam_info}
{weak_info}

Topics in Course:
{topics_str}

Current Mastery Levels:
{mastery_str if mastery_str else "No assessments taken yet - start from beginning"}

Generate a 2-week personalized study plan (at least 14 tasks). 
Focus more on weak/unstarted topics. Respect prerequisites.
Each task should fit within the daily study time limit.""",
            },
        ]

        data = openai_service.chat_completion_json(messages, temperature=0.3, max_tokens=4000)
        result = StudyPlanResult(**data)

        # Validate activity types
        valid_activities = ["learn", "practice", "quiz", "revise", "review_mistakes"]
        for task in result.tasks:
            if task.activity_type not in valid_activities:
                task.activity_type = "learn"
            if task.priority < 1:
                task.priority = 1
            if task.priority > 10:
                task.priority = 10

        return result
