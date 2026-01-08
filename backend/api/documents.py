"""
Document API endpoints for managing uploaded documents.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import time
from pathlib import Path

from models import User, Document, Translation
from utils.dependencies import get_db, get_current_user
from schemas.translation import TranslationResponse

router = APIRouter(prefix="/api/documents", tags=["documents"])

# Configure upload directory
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@router.get("/", response_model=List[dict])
async def get_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    project_id: Optional[int] = None
):
    """
    Get all documents uploaded by the current user.
    
    Query Parameters:
    - skip: Number of documents to skip (for pagination)
    - limit: Maximum number of documents to return
    - project_id: Filter by project ID (optional)
    """
    query = db.query(Document).filter(Document.user_id == current_user.id)
    
    if project_id:
        query = query.filter(Document.project_id == project_id)
    
    documents = query.order_by(Document.upload_date.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": doc.id,
            "original_filename": doc.original_filename,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "source_lang": doc.source_lang,
            "target_lang": doc.target_lang,
            "upload_date": doc.upload_date.isoformat(),
            "project_id": doc.project_id,
            "translation_id": doc.translation_id,
            "has_translation": doc.translated_text is not None
        }
        for doc in documents
    ]


@router.get("/{document_id}")
async def get_document_details(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific document.
    """
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": document.id,
        "original_filename": document.original_filename,
        "file_type": document.file_type,
        "file_size": document.file_size,
        "source_lang": document.source_lang,
        "target_lang": document.target_lang,
        "upload_date": document.upload_date.isoformat(),
        "project_id": document.project_id,
        "translation_id": document.translation_id,
        "extracted_text": document.extracted_text,
        "translated_text": document.translated_text
    }


@router.get("/{document_id}/download")
async def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download the original uploaded document file.
    """
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = UPLOAD_DIR / document.file_path
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        path=str(file_path),
        filename=document.original_filename,
        media_type="application/octet-stream"
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a document and its associated file.
    """
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete the physical file
    file_path = UPLOAD_DIR / document.file_path
    if file_path.exists():
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Error deleting file: {e}")
    
    # Delete the database record
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}


@router.get("/stats/summary")
async def get_document_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics about user's documents.
    """
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()
    
    total_documents = len(documents)
    total_size = sum(doc.file_size for doc in documents)
    
    # Count by file type
    file_type_counts = {}
    for doc in documents:
        file_type_counts[doc.file_type] = file_type_counts.get(doc.file_type, 0) + 1
    
    # Count translated vs untranslated
    translated_count = sum(1 for doc in documents if doc.translated_text)
    
    return {
        "total_documents": total_documents,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "file_types": file_type_counts,
        "translated_documents": translated_count,
        "untranslated_documents": total_documents - translated_count
    }
