from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SessionCreate(BaseModel):
    project_id: Optional[int] = None
    module_type: str = "physical_meeting"


class SessionResponse(BaseModel):
    id: int
    session_code: str
    project_id: Optional[int]
    created_by: int
    module_type: str
    status: str
    created_at: datetime
    ended_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class SessionJoin(BaseModel):
    user_name: Optional[str] = None


class TranscriptCreate(BaseModel):
    original_text: str
    original_language: str
    speaker_name: Optional[str] = None


class TranscriptResponse(BaseModel):
    id: int
    session_id: int
    user_id: Optional[int]
    speaker_name: Optional[str]
    original_text: str
    original_language: str
    translated_text_ko: Optional[str]
    translated_text_bn: Optional[str]
    translated_text_en: Optional[str]
    timestamp: datetime
    audio_duration: Optional[int]
    
    class Config:
        from_attributes = True
