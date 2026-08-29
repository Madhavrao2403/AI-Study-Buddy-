from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.document_service import document_service
from app.services.course_service import course_service
from app.schemas.topic import DocumentResponse

router = APIRouter(prefix="/api/courses", tags=["documents"])


@router.post("/{course_id}/documents")
def upload_document(
    course_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    course_service.get_course(db, course_id, current_user.id)
    doc = document_service.upload_document(db, course_id, file)
    return {
        "id": doc.id,
        "filename": doc.original_filename,
        "status": doc.processing_status.value,
        "chunks": doc.total_chunks,
    }


@router.get("/{course_id}/documents")
def get_documents(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    course_service.get_course(db, course_id, current_user.id)
    docs = document_service.get_documents(db, course_id)
    return [
        {
            "id": d.id,
            "original_filename": d.original_filename,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "processing_status": d.processing_status.value if hasattr(d.processing_status, 'value') else d.processing_status,
            "total_chunks": d.total_chunks,
            "created_at": d.created_at,
        }
        for d in docs
    ]


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document_service.delete_document(db, document_id, current_user.id)
    return {"message": "Document deleted"}
