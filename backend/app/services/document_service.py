from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.document import Document, DocumentChunk, DocumentStatus
from app.ai.openai_service import openai_service
from app.utils.document_processor import extract_text_from_content, chunk_text
from app.core.config import settings
import os
import uuid
import json
import logging

logger = logging.getLogger(__name__)

ALLOWED_TYPES = {
    "application/pdf", "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}
MAX_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


class DocumentService:
    def get_documents(self, db: Session, course_id: int):
        return db.query(Document).filter(Document.course_id == course_id).all()

    def upload_document(self, db: Session, course_id: int, file: UploadFile) -> Document:
        # Validate extension
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(400, f"File type not allowed. Allowed: {ALLOWED_EXTENSIONS}")

        content = file.file.read()
        if len(content) > MAX_SIZE:
            raise HTTPException(400, f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB")
        if len(content) == 0:
            raise HTTPException(400, "File is empty")

        # Store file
        upload_dir = os.path.join(settings.UPLOAD_DIR, str(course_id))
        os.makedirs(upload_dir, exist_ok=True)
        safe_name = f"{uuid.uuid4()}{ext}"
        storage_path = os.path.join(upload_dir, safe_name)
        with open(storage_path, "wb") as f:
            f.write(content)

        doc = Document(
            course_id=course_id,
            filename=safe_name,
            original_filename=file.filename or safe_name,
            file_type=ext.lstrip("."),
            file_size=len(content),
            storage_path=storage_path,
            processing_status=DocumentStatus.UPLOADED,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Process in background (synchronous for now)
        self._process_document(db, doc, content)
        return doc

    def _process_document(self, db: Session, doc: Document, content: bytes):
        """Extract text, chunk it, generate embeddings."""
        try:
            doc.processing_status = DocumentStatus.PROCESSING
            db.commit()

            text = extract_text_from_content(content, doc.file_type, doc.original_filename)
            if not text.strip():
                raise ValueError("No text could be extracted from the document")

            chunks = chunk_text(text, chunk_size=400, overlap=50)
            if not chunks:
                raise ValueError("Document could not be chunked")

            # Generate embeddings in batch
            try:
                embeddings = openai_service.create_embeddings_batch(chunks)
            except Exception as e:
                logger.warning(f"Embedding generation failed, storing without embeddings: {e}")
                embeddings = [None] * len(chunks)

            # Store chunks
            for idx, (chunk_text_val, embedding) in enumerate(zip(chunks, embeddings)):
                chunk = DocumentChunk(
                    document_id=doc.id,
                    course_id=doc.course_id,
                    chunk_text=chunk_text_val,
                    chunk_index=idx,
                    embedding=json.dumps(embedding) if embedding else None,
                    token_count=len(chunk_text_val.split()),
                )
                db.add(chunk)

            doc.processing_status = DocumentStatus.READY
            doc.total_chunks = len(chunks)
            db.commit()
            logger.info(f"Document {doc.id} processed: {len(chunks)} chunks")

        except Exception as e:
            logger.error(f"Document processing error: {e}")
            doc.processing_status = DocumentStatus.ERROR
            doc.error_message = str(e)[:500]
            db.commit()

    def delete_document(self, db: Session, document_id: int, user_id: int):
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(404, "Document not found")
        # Verify ownership via course
        from app.models.course import Course
        course = db.query(Course).filter(Course.id == doc.course_id, Course.user_id == user_id).first()
        if not course:
            raise HTTPException(403, "Not authorized")
        try:
            if os.path.exists(doc.storage_path):
                os.remove(doc.storage_path)
        except Exception:
            pass
        db.delete(doc)
        db.commit()


document_service = DocumentService()
