from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.document import DocumentChunk
from app.ai.openai_service import openai_service
import json
import numpy as np
import logging

logger = logging.getLogger(__name__)


class RetrievalService:
    """Vector similarity retrieval using MySQL + numpy cosine similarity."""

    def retrieve_relevant_chunks(
        self,
        db: Session,
        course_id: int,
        query: str,
        top_k: int = 5,
        topic_hint: Optional[str] = None,
    ) -> List[Dict]:
        """Retrieve most relevant document chunks for a query."""
        try:
            # Get query embedding
            query_embedding = openai_service.create_embedding(query)

            # Get all chunks for the course that have embeddings
            query_filter = db.query(DocumentChunk).filter(
                DocumentChunk.course_id == course_id,
                DocumentChunk.embedding.isnot(None),
            )

            if topic_hint:
                # Prefer chunks that match the topic hint
                topic_chunks = query_filter.filter(
                    DocumentChunk.topic_hint.contains(topic_hint)
                ).limit(200).all()

                if len(topic_chunks) < 10:
                    all_chunks = query_filter.limit(300).all()
                else:
                    all_chunks = topic_chunks
            else:
                all_chunks = query_filter.limit(300).all()

            if not all_chunks:
                return []

            # Calculate cosine similarity
            scores = []
            for chunk in all_chunks:
                try:
                    chunk_emb = json.loads(chunk.embedding)
                    similarity = self._cosine_similarity(query_embedding, chunk_emb)
                    scores.append((chunk, similarity))
                except (json.JSONDecodeError, Exception):
                    continue

            # Sort by similarity descending
            scores.sort(key=lambda x: x[1], reverse=True)
            top_chunks = scores[:top_k]

            return [
                {
                    "chunk_id": chunk.id,
                    "text": chunk.chunk_text,
                    "similarity": float(score),
                    "document_id": chunk.document_id,
                    "topic_hint": chunk.topic_hint,
                }
                for chunk, score in top_chunks
                if score > 0.3  # Minimum relevance threshold
            ]

        except Exception as e:
            logger.error(f"Retrieval failed: {e}")
            return []

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        a = np.array(vec1, dtype=np.float32)
        b = np.array(vec2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))


retrieval_service = RetrievalService()
