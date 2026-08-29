from typing import List, Dict, Optional
from pydantic import BaseModel
from app.ai.openai_service import openai_service
from app.ai.prompts import WEAKNESS_DETECTOR_PROMPT, ADAPTIVE_AGENT_PROMPT, RECOMMENDATION_PROMPT
import logging

logger = logging.getLogger(__name__)


class WeaknessSchema(BaseModel):
    topic_name: str
    weakness_level: str = "needs_attention"
    primary_reason: str = ""
    specific_concepts: List[str] = []
    recommended_action: str = "PRACTICE"
    priority: int = 1


class WeaknessAnalysisResult(BaseModel):
    weaknesses: List[WeaknessSchema]
    overall_analysis: str = ""
    immediate_focus: str = ""


class AdaptiveRecommendation(BaseModel):
    action: str
    topic: str
    reason: str
    difficulty: str = "medium"
    recommended_duration: int = 20
    specific_focus: str = ""


class PersonalizedRecommendation(BaseModel):
    title: str
    description: str
    action_type: str = "learn"
    topic_name: Optional[str] = None
    urgency: str = "medium"
    estimated_minutes: int = 20


class AdaptiveAgent:
    def analyze_weaknesses(self, performance_data: Dict) -> WeaknessAnalysisResult:
        """Analyze student performance data to detect weaknesses."""
        messages = [
            {"role": "system", "content": WEAKNESS_DETECTOR_PROMPT.format(
                performance_data=str(performance_data)[:3000]
            )},
            {"role": "user", "content": "Analyze these performance metrics and identify learning weaknesses."},
        ]

        data = openai_service.chat_completion_json(messages, temperature=0.2)
        result = WeaknessAnalysisResult(**data)

        # Validate weakness levels
        valid_levels = ["critical", "needs_attention", "developing"]
        for w in result.weaknesses:
            if w.weakness_level not in valid_levels:
                w.weakness_level = "needs_attention"

        return result

    def recommend_next_action(
        self,
        topic_name: str,
        mastery_score: float,
        recent_score: float,
        mistake_patterns: str,
        study_history: str,
        student_context: str,
    ) -> AdaptiveRecommendation:
        """Determine the best next learning action."""
        prompt = ADAPTIVE_AGENT_PROMPT.format(
            student_context=student_context[:500],
            topic_name=topic_name,
            mastery_score=mastery_score,
            recent_score=recent_score,
            mistake_patterns=mistake_patterns[:500],
            study_history=study_history[:500],
        )

        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"What should the student do next for '{topic_name}'?"},
        ]

        data = openai_service.chat_completion_json(messages, temperature=0.2)
        result = AdaptiveRecommendation(**data)

        valid_actions = [
            "RETEACH", "PRACTICE", "REVISE", "REVIEW_MISTAKES",
            "INCREASE_DIFFICULTY", "DECREASE_DIFFICULTY",
            "MOVE_TO_NEXT_TOPIC", "TAKE_ASSESSMENT"
        ]
        if result.action not in valid_actions:
            result.action = self._determine_action_from_mastery(mastery_score, recent_score)

        valid_difficulties = ["easy", "medium", "hard"]
        if result.difficulty not in valid_difficulties:
            result.difficulty = "medium"

        return result

    def _determine_action_from_mastery(self, mastery: float, recent_score: float) -> str:
        """Deterministic fallback for action selection."""
        if mastery < 30:
            return "RETEACH"
        elif mastery < 50:
            return "REVIEW_MISTAKES" if recent_score < 40 else "PRACTICE"
        elif mastery < 70:
            return "PRACTICE"
        elif mastery < 85:
            return "INCREASE_DIFFICULTY"
        else:
            return "MOVE_TO_NEXT_TOPIC"

    def get_recommendation(
        self,
        student_name: str,
        stats: Dict,
        recent_activity: str,
    ) -> PersonalizedRecommendation:
        """Generate a personalized dashboard recommendation."""
        messages = [
            {"role": "system", "content": RECOMMENDATION_PROMPT.format(
                student_name=student_name,
                stats=str(stats)[:1000],
                recent_activity=recent_activity[:500],
            )},
            {"role": "user", "content": "Generate a recommendation for this student."},
        ]

        data = openai_service.chat_completion_json(messages, temperature=0.4)
        result = PersonalizedRecommendation(**data)

        valid_actions = ["quiz", "learn", "revise", "practice", "review_mistakes"]
        if result.action_type not in valid_actions:
            result.action_type = "learn"

        return result
