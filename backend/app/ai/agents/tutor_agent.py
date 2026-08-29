from typing import List, Dict, Optional
from pydantic import BaseModel
from app.ai.openai_service import openai_service
from app.ai.prompts import TUTOR_SYSTEM_PROMPT
import logging

logger = logging.getLogger(__name__)


class TutorResponse(BaseModel):
    response: str
    used_rag: bool = False
    follow_up_question: Optional[str] = None
    source_note: Optional[str] = None


class TutorAgent:
    def chat(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        student_context: str,
        course_name: str,
        topic_name: str,
        explanation_mode: str,
        retrieved_chunks: List[str] = None,
    ) -> TutorResponse:
        """Generate a tutor response."""
        used_rag = False
        context_section = ""

        if retrieved_chunks:
            used_rag = True
            context_section = "\n\n--- RELEVANT COURSE MATERIAL ---\n"
            context_section += "\n\n".join(retrieved_chunks[:3])
            context_section += "\n--- END OF COURSE MATERIAL ---\n"
            context_section += "\nIMPORTANT: Prioritize the above course material in your response. If answering from it, mention 'Based on your course material...' If you need to go beyond it, say 'From general knowledge...'"

        system_prompt = TUTOR_SYSTEM_PROMPT.format(
            student_context=student_context,
            course_name=course_name,
            topic_name=topic_name or "General",
            explanation_mode=explanation_mode,
        )

        if context_section:
            system_prompt += context_section

        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history (last 10 messages for context window management)
        messages.extend(conversation_history[-10:])

        # Add current message
        messages.append({"role": "user", "content": user_message})

        response_text = openai_service.chat_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=1500,
        )

        return TutorResponse(
            response=response_text,
            used_rag=used_rag,
            source_note="Based on your uploaded course material" if used_rag else "General AI knowledge",
        )
