from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TranslationRequest(BaseModel):
    """Request schema for translation"""
    text: str
    source_lang: str  # ko, bn, en
    target_lang: str  # ko, bn, en
    context: Optional[str] = None
    project_id: Optional[int] = None


class TranslationResponse(BaseModel):
    """Response schema for translation"""
    id: Optional[int] = None
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    confidence: float
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TranslationHistoryItem(BaseModel):
    """Translation history item"""
    id: int
    source_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    created_at: datetime
    project_id: Optional[int] = None
    
    class Config:
        from_attributes = True
