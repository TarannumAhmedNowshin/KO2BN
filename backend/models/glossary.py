from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base


class Glossary(Base):
    """Glossary model for custom terminology per project"""
    
    __tablename__ = "glossary"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    source_term = Column(String, nullable=False)
    target_term = Column(String, nullable=False)
    source_lang = Column(String, nullable=False)  # ko, bn, en
    target_lang = Column(String, nullable=False)  # ko, bn, en
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Glossary {self.source_term}→{self.target_term} (project {self.project_id})>"
