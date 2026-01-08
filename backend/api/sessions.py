from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import random
import string

from database import get_db
from models.session import MeetingSession, SessionStatus
from models.user import User
from schemas.session import SessionCreate, SessionResponse, SessionJoin, TranscriptResponse
from utils.dependencies import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def generate_session_code() -> str:
    """Generate a unique 6-digit session code"""
    return ''.join(random.choices(string.digits, k=6))


@router.post("/create", response_model=SessionResponse)
async def create_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new meeting session with a unique 6-digit code"""
    
    # Generate unique session code
    max_attempts = 10
    for _ in range(max_attempts):
        session_code = generate_session_code()
        existing = db.query(MeetingSession).filter(
            MeetingSession.session_code == session_code
        ).first()
        if not existing:
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate unique session code"
        )
    
    # Create session
    new_session = MeetingSession(
        session_code=session_code,
        project_id=session_data.project_id,
        created_by=current_user.id,
        module_type=session_data.module_type,
        status=SessionStatus.active
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return new_session


@router.get("/{session_code}", response_model=SessionResponse)
async def get_session(
    session_code: str,
    db: Session = Depends(get_db)
):
    """Get session details by code"""
    
    session = db.query(MeetingSession).filter(
        MeetingSession.session_code == session_code
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return session


@router.post("/{session_code}/join")
async def join_session(
    session_code: str,
    join_data: SessionJoin,
    db: Session = Depends(get_db)
):
    """Join an existing session"""
    
    session = db.query(MeetingSession).filter(
        MeetingSession.session_code == session_code
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.status != SessionStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is not active"
        )
    
    return {
        "message": "Successfully joined session",
        "session_id": session.id,
        "session_code": session.session_code
    }


@router.post("/{session_code}/end")
async def end_session(
    session_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """End a meeting session"""
    
    session = db.query(MeetingSession).filter(
        MeetingSession.session_code == session_code
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Only creator can end session
    if session.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only session creator can end the session"
        )
    
    session.status = SessionStatus.completed
    from datetime import datetime
    session.ended_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Session ended successfully"}


@router.get("/{session_code}/transcripts", response_model=List[TranscriptResponse])
async def get_session_transcripts(
    session_code: str,
    db: Session = Depends(get_db)
):
    """Get all transcripts for a session"""
    
    session = db.query(MeetingSession).filter(
        MeetingSession.session_code == session_code
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return session.transcripts


@router.get("/user/my-sessions", response_model=List[SessionResponse])
async def get_my_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sessions created by current user"""
    
    sessions = db.query(MeetingSession).filter(
        MeetingSession.created_by == current_user.id
    ).order_by(MeetingSession.created_at.desc()).all()
    
    return sessions
