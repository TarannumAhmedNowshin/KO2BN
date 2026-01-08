from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base


class SessionStatus(enum.Enum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class ModuleType(enum.Enum):
    physical_meeting = "physical_meeting"
    virtual_meeting = "virtual_meeting"


class MeetingSession(Base):
    __tablename__ = "meeting_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String(6), unique=True, index=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    module_type = Column(Enum(ModuleType), default=ModuleType.physical_meeting)
    status = Column(Enum(SessionStatus), default=SessionStatus.active)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="sessions")
    creator = relationship("User", back_populates="created_sessions")
    transcripts = relationship("Transcript", back_populates="session", cascade="all, delete-orphan")
