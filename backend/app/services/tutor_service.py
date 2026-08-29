from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional
from app.models.conversation import AIConversation, AIMessage, MessageRole
from app.models.topic import Topic
from app.models.course import Course
from app.models.student_profile import StudentProfile
from app.ai.agents.tutor_agent import TutorAgent
from app.ai.rag.retrieval import retrieval_service
import logging

logger = logging.getLogger(__name__)


class TutorService:
    def get_or_create_conversation(
        self,
        db: Session,
        user_id: int,
        course_id: int,
        topic_id: Optional[int],
        explanation_mode: str,
        conversation_id: Optional[int] = None,
    ) -> AIConversation:
        if conversation_id:
            conv = db.query(AIConversation).filter(
                AIConversation.id == conversation_id,
                AIConversation.user_id == user_id,
            ).first()
            if conv:
                return conv

        conv = AIConversation(
            user_id=user_id,
            course_id=course_id,
            topic_id=topic_id,
            explanation_mode=explanation_mode,
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    def chat(
        self,
        db: Session,
        user_id: int,
        course_id: int,
        message: str,
        topic_id: Optional[int],
        explanation_mode: str,
        conversation_id: Optional[int] = None,
    ) -> dict:
        # Get or create conversation
        conv = self.get_or_create_conversation(
            db, user_id, course_id, topic_id, explanation_mode, conversation_id
        )

        # Retrieve relevant chunks
        topic_name = "General"
        if topic_id:
            topic = db.query(Topic).filter(Topic.id == topic_id).first()
            if topic:
                topic_name = topic.name

        course = db.query(Course).filter(Course.id == course_id).first()
        course_name = course.name if course else "Course"

        # RAG retrieval
        retrieved_chunks = []
        try:
            chunks = retrieval_service.retrieve_relevant_chunks(
                db=db,
                course_id=course_id,
                query=message,
                top_k=4,
                topic_hint=topic_name if topic_id else None,
            )
            retrieved_chunks = [c["text"] for c in chunks]
        except Exception as e:
            logger.warning(f"RAG retrieval failed in tutor: {e}")

        # Build student context
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
        student_context = ""
        if profile:
            student_context = f"Skill Level: {profile.current_skill_level}, Learning Style: {profile.preferred_explanation_style}"

        # Get conversation history (last 10)
        history_messages = db.query(AIMessage).filter(
            AIMessage.conversation_id == conv.id
        ).order_by(AIMessage.created_at.desc()).limit(10).all()
        history_messages.reverse()

        history = [
            {"role": m.role.value, "content": m.content}
            for m in history_messages
        ]

        # Save user message
        user_msg = AIMessage(
            conversation_id=conv.id,
            role=MessageRole.USER,
            content=message,
        )
        db.add(user_msg)
        db.flush()

        # Get AI response
        agent = TutorAgent()
        result = agent.chat(
            user_message=message,
            conversation_history=history,
            student_context=student_context,
            course_name=course_name,
            topic_name=topic_name,
            explanation_mode=explanation_mode,
            retrieved_chunks=retrieved_chunks,
        )

        # Save assistant message
        ai_msg = AIMessage(
            conversation_id=conv.id,
            role=MessageRole.ASSISTANT,
            content=result.response,
            used_rag=result.used_rag,
            source_chunks=[c[:100] for c in retrieved_chunks[:3]] if retrieved_chunks else None,
        )
        db.add(ai_msg)
        db.commit()

        # Update conversation title if first message
        if not conv.title:
            conv.title = message[:80]
            db.commit()

        return {
            "message_id": ai_msg.id,
            "response": result.response,
            "used_rag": result.used_rag,
            "source_note": result.source_note,
            "conversation_id": conv.id,
        }

    def get_conversations(self, db: Session, user_id: int, course_id: int):
        convs = db.query(AIConversation).filter(
            AIConversation.user_id == user_id,
            AIConversation.course_id == course_id,
        ).order_by(AIConversation.updated_at.desc()).all()

        result = []
        for c in convs:
            count = db.query(AIMessage).filter(AIMessage.conversation_id == c.id).count()
            result.append({
                "id": c.id,
                "title": c.title,
                "explanation_mode": c.explanation_mode,
                "topic_id": c.topic_id,
                "message_count": count,
                "created_at": c.created_at,
            })
        return result

    def get_messages(self, db: Session, conversation_id: int, user_id: int):
        conv = db.query(AIConversation).filter(
            AIConversation.id == conversation_id,
            AIConversation.user_id == user_id,
        ).first()
        if not conv:
            raise HTTPException(404, "Conversation not found")
        return db.query(AIMessage).filter(
            AIMessage.conversation_id == conversation_id
        ).order_by(AIMessage.created_at).all()


tutor_service = TutorService()
