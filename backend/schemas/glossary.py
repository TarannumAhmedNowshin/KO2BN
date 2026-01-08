from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class GlossaryCreate(BaseModel):
    """Schema for creating a glossary entry"""
    source_term: str
    target_term: str
    source_lang: str
    target_lang: str


class GlossaryUpdate(BaseModel):
    """Schema for updating a glossary entry"""
    source_term: Optional[str] = None
    target_term: Optional[str] = None
    source_lang: Optional[str] = None
    target_lang: Optional[str] = None


class GlossaryResponse(BaseModel):
    """Schema for glossary response"""
    id: int
    project_id: int
    source_term: str
    target_term: str
    source_lang: str
    target_lang: str
    created_at: datetime
    
    class Config:
        from_attributes = True
