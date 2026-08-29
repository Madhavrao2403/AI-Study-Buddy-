from typing import List, Dict, Optional
from pydantic import BaseModel
from app.ai.openai_service import openai_service
from app.ai.prompts import ASSESSMENT_GENERATOR_PROMPT
import logging

logger = logging.getLogger(__name__)


class QuestionSchema(BaseModel):
    question_text: str
    question_type: str = "mcq"
    difficulty: str = "medium"
    topic_name: str = ""
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str = ""


class AssessmentResult(BaseModel):
    questions: List[QuestionSchema]


class AssessmentAgent:
    def generate_diagnostic(
        self,
        topics: List[Dict],
        course_name: str,
        num_questions: int = 15,
        course_content: str = "",
    ) -> AssessmentResult:
        """Generate diagnostic assessment questions."""
        topics_str = "\n".join([
            f"- {t.get('name', '')} (difficulty: {t.get('difficulty', 'medium')})"
            for t in topics[:20]
        ])

        prompt = ASSESSMENT_GENERATOR_PROMPT.replace("{num_questions}", str(num_questions))

        content_section = ""
        if course_content:
            content_section = f"\n\nCourse Material Excerpt:\n{course_content[:3000]}"

        messages = [
            {"role": "system", "content": prompt},
            {
                "role": "user",
                "content": f"Course: {course_name}\n\nTopics to assess:\n{topics_str}{content_section}\n\nGenerate {num_questions} diagnostic questions covering these topics.",
            },
        ]

        data = openai_service.chat_completion_json(messages, temperature=0.3)
        result = AssessmentResult(**data)

        # Validate questions
        valid_questions = []
        for q in result.questions:
            if q.question_type not in ["mcq", "true_false", "short_answer"]:
                q.question_type = "mcq"
            if q.difficulty not in ["easy", "medium", "hard"]:
                q.difficulty = "medium"
            if q.question_type == "true_false" and not q.options:
                q.options = ["True", "False"]
            valid_questions.append(q)

        result.questions = valid_questions
        return result
