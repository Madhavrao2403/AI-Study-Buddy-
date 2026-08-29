from typing import List, Dict, Optional
from pydantic import BaseModel
from app.ai.openai_service import openai_service
from app.ai.prompts import QUIZ_GENERATOR_PROMPT, SHORT_ANSWER_EVALUATOR_PROMPT
import logging

logger = logging.getLogger(__name__)


class QuizQuestionSchema(BaseModel):
    question_text: str
    question_type: str = "mcq"
    difficulty: str = "medium"
    topic_name: str = ""
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str = ""


class QuizGenerationResult(BaseModel):
    questions: List[QuizQuestionSchema]


class ShortAnswerEvalResult(BaseModel):
    score: float
    is_correct: bool
    missing_concepts: List[str] = []
    feedback: str = ""
    improvement_suggestion: str = ""


class QuizAgent:
    def generate_questions(
        self,
        topic_name: str,
        difficulty: str,
        mastery_score: float,
        num_questions: int,
        question_types: List[str],
        course_context: str = "",
    ) -> QuizGenerationResult:
        """Generate quiz questions for a topic."""
        prompt = QUIZ_GENERATOR_PROMPT.format(
            topic_name=topic_name,
            difficulty=difficulty,
            mastery_score=mastery_score,
            question_types=", ".join(question_types),
            num_questions=num_questions,
            course_context=course_context[:2000] if course_context else "No specific context provided",
        )

        messages = [
            {"role": "system", "content": prompt},
            {
                "role": "user",
                "content": f"Generate {num_questions} quiz questions about {topic_name} at {difficulty} difficulty level.",
            },
        ]

        data = openai_service.chat_completion_json(messages, temperature=0.5)
        result = QuizGenerationResult(**data)

        # Validate
        valid_q_types = ["mcq", "true_false", "short_answer"]
        valid_difficulties = ["easy", "medium", "hard"]
        valid_questions = []
        for q in result.questions:
            if q.question_type not in valid_q_types:
                q.question_type = "mcq"
            if q.difficulty not in valid_difficulties:
                q.difficulty = difficulty
            if q.question_type == "true_false" and not q.options:
                q.options = ["True", "False"]
            if q.question_type == "mcq" and q.options and len(q.options) < 2:
                continue
            valid_questions.append(q)

        result.questions = valid_questions[:num_questions]
        return result

    def evaluate_short_answer(
        self,
        question: str,
        expected_answer: str,
        student_answer: str,
        context: str = "",
    ) -> ShortAnswerEvalResult:
        """Evaluate a short answer response using AI."""
        prompt = SHORT_ANSWER_EVALUATOR_PROMPT.format(
            question=question,
            expected_answer=expected_answer,
            student_answer=student_answer,
            context=context[:1000] if context else "No additional context",
        )

        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"Evaluate this student's answer.\nQuestion: {question}\nExpected: {expected_answer}\nStudent: {student_answer}"},
        ]

        data = openai_service.chat_completion_json(messages, temperature=0.1)
        result = ShortAnswerEvalResult(**data)
        result.score = max(0.0, min(1.0, result.score))
        result.is_correct = result.score >= 0.7
        return result
