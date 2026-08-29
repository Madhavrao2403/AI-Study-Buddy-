from typing import List, Dict, Optional
from pydantic import BaseModel
from app.ai.openai_service import openai_service
from app.ai.prompts import COURSE_ANALYZER_PROMPT
import logging

logger = logging.getLogger(__name__)


class SubtopicSchema(BaseModel):
    name: str
    description: str = ""


class TopicSchema(BaseModel):
    name: str
    description: str = ""
    difficulty: str = "medium"
    order_index: int = 0
    prerequisites: List[str] = []
    learning_objectives: List[str] = []
    key_concepts: List[str] = []
    subtopics: List[SubtopicSchema] = []


class CourseAnalysisResult(BaseModel):
    course_summary: str
    suggested_difficulty: str = "intermediate"
    topics: List[TopicSchema]


class CourseAnalyzerAgent:
    def analyze(self, content: str, course_name: str) -> CourseAnalysisResult:
        """Analyze course content and extract structured topic information."""
        # Truncate content to avoid token limits
        max_chars = 12000
        if len(content) > max_chars:
            content = content[:max_chars] + "\n\n[Content truncated for analysis]"

        messages = [
            {"role": "system", "content": COURSE_ANALYZER_PROMPT},
            {
                "role": "user",
                "content": f"Course Name: {course_name}\n\nLearning Material:\n{content}\n\nAnalyze this and return the structured JSON.",
            },
        ]

        try:
            data = openai_service.chat_completion_json(messages, temperature=0.2)
            result = CourseAnalysisResult(**data)
            # Normalize difficulties
            for topic in result.topics:
                if topic.difficulty not in ["easy", "medium", "hard"]:
                    topic.difficulty = "medium"
            return result
        except Exception as e:
            logger.error(f"Course analysis failed: {e}")
            raise
