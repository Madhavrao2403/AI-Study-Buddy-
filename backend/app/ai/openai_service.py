from typing import Optional, List, Dict, Any
from openai import OpenAI, APIError, RateLimitError, APITimeoutError
from app.core.config import settings
import json
import time
import logging

logger = logging.getLogger(__name__)


class OpenAIService:
    def __init__(self):
        self.client = OpenAI(
        base_url=settings.OPENAI_BASE_URL,
        api_key=settings.OPENAI_API_KEY,
        )
        self.model = settings.OPENAI_MODEL
        self.embedding_model = settings.OPENAI_EMBEDDING_MODEL

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: Optional[Dict] = None,
        retries: int = 3,
    ) -> str:
        """Send a chat completion request with retry logic."""
        last_error = None
        for attempt in range(retries):
            try:
                kwargs: Dict[str, Any] = {
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
                if response_format:
                    kwargs["response_format"] = response_format
                response = self.client.chat.completions.create(**kwargs)
                return response.choices[0].message.content or ""
            except RateLimitError as e:
                last_error = e
                wait_time = 2 ** attempt
                logger.warning(f"Rate limit hit, waiting {wait_time}s...")
                time.sleep(wait_time)
            except APITimeoutError as e:
                last_error = e
                logger.warning(f"API timeout on attempt {attempt + 1}")
                time.sleep(1)
            except APIError as e:
                last_error = e
                if attempt < retries - 1:
                    time.sleep(1)
        raise Exception(f"OpenAI API failed after {retries} retries: {last_error}")

    def chat_completion_json(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 3000,
    ) -> Dict:
        """Chat completion that returns parsed JSON."""
        content = self.chat_completion(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {content[:500]}")
            raise Exception(f"AI returned invalid JSON: {e}")

    def create_embedding(self, text: str) -> List[float]:
        """Create an embedding for the given text."""
        try:
            text = text.replace("\n", " ")[:8000]
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=text,
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding creation failed: {e}")
            raise

    def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings for multiple texts."""
        # Process in batches of 20
        embeddings = []
        batch_size = 20
        for i in range(0, len(texts), batch_size):
            batch = [t.replace("\n", " ")[:8000] for t in texts[i:i + batch_size]]
            try:
                response = self.client.embeddings.create(
                    model=self.embedding_model,
                    input=batch,
                )
                embeddings.extend([d.embedding for d in response.data])
            except Exception as e:
                logger.error(f"Batch embedding failed: {e}")
                raise
        return embeddings


openai_service = OpenAIService()
