from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: str


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str
    role: Optional[str] = "team_member"


class UserUpdate(BaseModel):
    """Schema for updating user"""
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str


class UserResponse(UserBase):
    """Schema for user response (no password)"""
    id: int
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True
