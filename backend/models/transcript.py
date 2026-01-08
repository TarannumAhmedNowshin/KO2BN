from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Transcript(Base):
    __tablename__ = "transcripts"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("meeting_sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    speaker_name = Column(String(100), nullable=True)
    
    # Original audio/text
    original_text = Column(Text, nullable=False)
    original_language = Column(String(10), nullable=False)
    
    # Translated versions
    translated_text_ko = Column(Text, nullable=True)
    translated_text_bn = Column(Text, nullable=True)
    translated_text_en = Column(Text, nullable=True)
    
    # Timing
    timestamp = Column(DateTime, default=datetime.utcnow)
    audio_duration = Column(Integer, nullable=True)  # Duration in milliseconds
    
    # Relationships
    session = relationship("MeetingSession", back_populates="transcripts")
    user = relationship("User", back_populates="transcripts")
