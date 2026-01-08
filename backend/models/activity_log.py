from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class ActivityLog(Base):
    """Activity log model for tracking user actions"""
    
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # login, logout, translate, upload_document, etc.
    details = Column(Text, nullable=True)  # JSON string with additional info
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<ActivityLog {self.action} by user {self.user_id} at {self.timestamp}>"
