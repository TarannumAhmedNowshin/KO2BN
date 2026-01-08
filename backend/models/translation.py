from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class Translation(Base):
    """Translation model to store translation history"""
    
    __tablename__ = "translations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    source_lang = Column(String, nullable=False)  # ko, bn, en
    target_lang = Column(String, nullable=False)  # ko, bn, en
    source_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Translation {self.source_lang}→{self.target_lang} by user {self.user_id}>"
