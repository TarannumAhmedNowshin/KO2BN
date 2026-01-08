from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Project(Base):
    """Project model for organizing users and translations"""
    
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    sessions = relationship("MeetingSession", back_populates="project")
    documents = relationship("Document", back_populates="project")
    
    def __repr__(self):
        return f"<Project {self.name}>"


class ProjectUser(Base):
    """Many-to-many relationship between projects and users"""
    
    __tablename__ = "project_users"
    
    project_id = Column(Integer, ForeignKey("projects.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
