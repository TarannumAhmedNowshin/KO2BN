from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str
    user: dict


class TokenData(BaseModel):
    """Token payload data"""
    user_id: Optional[int] = None
    username: Optional[str] = None
