from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List, Optional
from sqlalchemy.orm import Session
from services.translation_service import translation_service
from services.document_service import DocumentService
from utils.dependencies import get_current_user
from models.user import User
from models.translation import Translation
from models.glossary import Glossary
from schemas.translation import TranslationRequest, TranslationResponse, TranslationHistoryItem
from database import get_db

router = APIRouter(prefix="/api/translate", tags=["Translation"])


@router.post("/", response_model=TranslationResponse)
async def translate_text(
    request: TranslationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Translate text from one language to another
    
    Supported languages:
    - ko: Korean
    - bn: Bangla (Bengali)
    - en: English
    """
    
    # Validate language codes
    valid_langs = ["ko", "bn", "en"]
    if request.source_lang not in valid_langs or request.target_lang not in valid_langs:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid language code. Must be one of: {', '.join(valid_langs)}"
        )
    
    if request.source_lang == request.target_lang:
        raise HTTPException(
            status_code=400,
            detail="Source and target languages cannot be the same"
        )
    
    try:
        # Get glossary terms if project_id is provided
        glossary_terms = None
        if request.project_id:
            glossary_entries = db.query(Glossary).filter(
                Glossary.project_id == request.project_id,
                Glossary.source_lang == request.source_lang,
                Glossary.target_lang == request.target_lang
            ).all()
            
            if glossary_entries:
                glossary_terms = [
                    {
                        "source_term": entry.source_term,
                        "target_term": entry.target_term
                    }
                    for entry in glossary_entries
                ]
        
        result = await translation_service.translate(
            text=request.text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            glossary_terms=glossary_terms,
            context=request.context
        )
        
        # Save translation to database
        translation = Translation(
            user_id=current_user.id,
            project_id=request.project_id,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            source_text=request.text,
            translated_text=result["translated_text"]
        )
        db.add(translation)
        db.commit()
        db.refresh(translation)
        
        return {
            "id": translation.id,
            "original_text": request.text,
            "translated_text": result["translated_text"],
            "source_lang": request.source_lang,
            "target_lang": request.target_lang,
            "confidence": result["confidence"],
            "created_at": translation.created_at
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )


@router.get("/history", response_model=List[TranslationHistoryItem])
async def get_translation_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """
    Get translation history for the current user
    
    Returns the most recent translations (default: 50)
    """
    translations = db.query(Translation)\
        .filter(Translation.user_id == current_user.id)\
        .order_by(Translation.created_at.desc())\
        .limit(limit)\
        .all()
    
    return translations


@router.post("/document", response_model=TranslationResponse)
async def translate_document(
    file: UploadFile = File(...),
    source_lang: str = "ko",
    target_lang: str = "en",
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and translate a document (PDF or DOCX)
    
    Supported file types:
    - PDF (.pdf)
    - Microsoft Word (.docx)
    
    Supported languages:
    - ko: Korean
    - bn: Bangla (Bengali)
    - en: English
    """
    
    # Validate language codes
    valid_langs = ["ko", "bn", "en"]
    if source_lang not in valid_langs or target_lang not in valid_langs:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid language code. Must be one of: {', '.join(valid_langs)}"
        )
    
    if source_lang == target_lang:
        raise HTTPException(
            status_code=400,
            detail="Source and target languages cannot be the same"
        )
    
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    filename_lower = file.filename.lower()
    if not (filename_lower.endswith('.pdf') or filename_lower.endswith('.docx')):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only PDF and DOCX files are supported."
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Extract text from document
        document_service = DocumentService()
        extracted_text = document_service.extract_text(file_content, file.filename)
        
        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from the document"
            )
        
        # Get glossary terms if project_id is provided
        glossary_terms = None
        if project_id:
            glossary_entries = db.query(Glossary).filter(
                Glossary.project_id == project_id,
                Glossary.source_lang == source_lang,
                Glossary.target_lang == target_lang
            ).all()
            
            if glossary_entries:
                glossary_terms = [
                    {
                        "source_term": entry.source_term,
                        "target_term": entry.target_term
                    }
                    for entry in glossary_entries
                ]
        
        # Translate the extracted text
        result = await translation_service.translate(
            text=extracted_text,
            source_lang=source_lang,
            target_lang=target_lang,
            glossary_terms=glossary_terms,
            context=f"Document: {file.filename}"
        )
        
        # Save translation to database
        translation = Translation(
            user_id=current_user.id,
            project_id=project_id,
            source_lang=source_lang,
            target_lang=target_lang,
            source_text=extracted_text,
            translated_text=result["translated_text"]
        )
        db.add(translation)
        db.commit()
        db.refresh(translation)
        
        return {
            "id": translation.id,
            "original_text": extracted_text,
            "translated_text": result["translated_text"],
            "source_lang": source_lang,
            "target_lang": target_lang,
            "confidence": result["confidence"],
            "created_at": translation.created_at
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Document translation failed: {str(e)}"
        )
