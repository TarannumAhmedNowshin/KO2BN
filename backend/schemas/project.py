from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ProjectCreate(BaseModel):
    """Schema for creating a project"""
    name: str
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    """Schema for project response"""
    id: int
    name: str
    description: Optional[str]
    owner_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
