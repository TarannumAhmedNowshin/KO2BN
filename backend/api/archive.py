from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import datetime
from utils.dependencies import get_current_user
from models.user import User
from models.translation import Translation
from models.transcript import Transcript
from models.project import Project
from database import get_db

router = APIRouter(prefix="/api/archive", tags=["Archive"])


@router.get("/search")
async def search_archive(
    query: str = Query(..., min_length=1, description="Search keyword"),
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    module: Optional[str] = Query(None, description="Filter by module: text, document, meeting"),
    source_lang: Optional[str] = Query(None, description="Filter by source language"),
    target_lang: Optional[str] = Query(None, description="Filter by target language"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    limit: int = Query(100, description="Maximum results to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Global search across all translations, documents, and meeting transcripts
    """
    
    results = []
    
    # Parse dates if provided
    start_datetime = None
    end_datetime = None
    if start_date:
        try:
            start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use ISO format.")
    
    if end_date:
        try:
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use ISO format.")
    
    # Search translations (text and document)
    if not module or module in ["text", "document"]:
        translation_query = db.query(Translation).filter(
            or_(
                Translation.source_text.ilike(f"%{query}%"),
                Translation.translated_text.ilike(f"%{query}%")
            )
        )
        
        # Apply filters
        if project_id:
            translation_query = translation_query.filter(Translation.project_id == project_id)
        if source_lang:
            translation_query = translation_query.filter(Translation.source_lang == source_lang)
        if target_lang:
            translation_query = translation_query.filter(Translation.target_lang == target_lang)
        if start_datetime:
            translation_query = translation_query.filter(Translation.created_at >= start_datetime)
        if end_datetime:
            translation_query = translation_query.filter(Translation.created_at <= end_datetime)
        
        # Only show user's own translations (unless admin)
        if current_user.role != "admin":
            translation_query = translation_query.filter(Translation.user_id == current_user.id)
        
        translations = translation_query.order_by(Translation.created_at.desc()).limit(limit).all()
        
        for trans in translations:
            # Get project name
            project_name = None
            if trans.project_id:
                project = db.query(Project).filter(Project.id == trans.project_id).first()
                if project:
                    project_name = project.name
            
            # Determine if it's a document or text translation
            is_document = len(trans.source_text) > 1000  # Heuristic: documents are usually longer
            
            results.append({
                "id": trans.id,
                "type": "document" if is_document else "text",
                "module": "Document Translation" if is_document else "Text Translation",
                "source_text": trans.source_text,
                "translated_text": trans.translated_text,
                "source_lang": trans.source_lang,
                "target_lang": trans.target_lang,
                "project_id": trans.project_id,
                "project_name": project_name,
                "user_id": trans.user_id,
                "created_at": trans.created_at.isoformat(),
                "matched_in": "source" if query.lower() in trans.source_text.lower() else "translation"
            })
    
    # Search meeting transcripts
    if not module or module == "meeting":
        transcript_query = db.query(Transcript).filter(
            or_(
                Transcript.original_text.ilike(f"%{query}%"),
                Transcript.translated_text_ko.ilike(f"%{query}%"),
                Transcript.translated_text_bn.ilike(f"%{query}%"),
                Transcript.translated_text_en.ilike(f"%{query}%")
            )
        )
        
        # Apply date filters
        if start_datetime:
            transcript_query = transcript_query.filter(Transcript.timestamp >= start_datetime)
        if end_datetime:
            transcript_query = transcript_query.filter(Transcript.timestamp <= end_datetime)
        
        transcripts = transcript_query.order_by(Transcript.timestamp.desc()).limit(limit).all()
        
        for trans in transcripts:
            # Get session and project info
            from models.session import MeetingSession
            session = db.query(MeetingSession).filter(MeetingSession.id == trans.session_id).first()
            
            project_name = None
            session_project_id = None
            if session and session.project_id:
                session_project_id = session.project_id
                if not project_id or project_id == session_project_id:
                    project = db.query(Project).filter(Project.id == session.project_id).first()
                    if project:
                        project_name = project.name
                else:
                    continue  # Skip if project filter doesn't match
            elif project_id:
                continue  # Skip if project filter is set but session has no project
            
            # Determine which language matched
            matched_in = "original"
            if query.lower() in trans.translated_text_ko.lower():
                matched_in = "korean"
            elif query.lower() in trans.translated_text_bn.lower():
                matched_in = "bengali"
            elif query.lower() in trans.translated_text_en.lower():
                matched_in = "english"
            
            results.append({
                "id": trans.id,
                "type": "meeting",
                "module": "Physical Meeting",
                "session_id": trans.session_id,
                "session_code": session.session_code if session else None,
                "speaker_name": trans.speaker_name,
                "original_text": trans.original_text,
                "original_lang": trans.original_lang,
                "translated_text_ko": trans.translated_text_ko,
                "translated_text_bn": trans.translated_text_bn,
                "translated_text_en": trans.translated_text_en,
                "project_id": session_project_id,
                "project_name": project_name,
                "user_id": trans.user_id,
                "created_at": trans.timestamp.isoformat(),
                "matched_in": matched_in
            })
    
    # Sort all results by date (newest first)
    results.sort(key=lambda x: x["created_at"], reverse=True)
    
    # Limit total results
    results = results[:limit]
    
    return {
        "query": query,
        "total_results": len(results),
        "filters": {
            "project_id": project_id,
            "module": module,
            "source_lang": source_lang,
            "target_lang": target_lang,
            "start_date": start_date,
            "end_date": end_date
        },
        "results": results
    }
