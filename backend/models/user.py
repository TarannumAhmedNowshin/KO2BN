from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    """User model for authentication and user management"""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="team_member")  # admin, manager, team_member
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    created_sessions = relationship("MeetingSession", back_populates="creator")
    transcripts = relationship("Transcript", back_populates="user")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
