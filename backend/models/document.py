"""
Document model for storing uploaded documents.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Document(Base):
    """Model for uploaded documents"""
    
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    
    # File information
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx
    file_size = Column(Integer, nullable=False)  # in bytes
    
    # Translation information
    source_lang = Column(String(10), nullable=False)
    target_lang = Column(String(10), nullable=False)
    extracted_text = Column(Text, nullable=True)
    translated_text = Column(Text, nullable=True)
    translation_id = Column(Integer, ForeignKey("translations.id", ondelete="SET NULL"), nullable=True)
    
    # Metadata
    upload_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="documents")
    project = relationship("Project", back_populates="documents")
    translation = relationship("Translation", back_populates="document", foreign_keys=[translation_id])
    
    def __repr__(self):
        return f"<Document(id={self.id}, filename='{self.original_filename}', user_id={self.user_id})>"
