from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from utils.dependencies import get_current_user
from models.user import User
from models.glossary import Glossary
from models.project import Project, ProjectUser
from schemas.glossary import GlossaryCreate, GlossaryUpdate, GlossaryResponse
from database import get_db

router = APIRouter(prefix="/api/glossary", tags=["Glossary"])


def check_project_access(project_id: int, user: User, db: Session):
    """Check if user has access to the project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user is project owner or member
    is_owner = project.owner_id == user.id
    is_member = db.query(ProjectUser).filter(
        ProjectUser.project_id == project_id,
        ProjectUser.user_id == user.id
    ).first() is not None
    
    if not (is_owner or is_member):
        raise HTTPException(status_code=403, detail="You don't have access to this project")
    
    return project


@router.get("/project/{project_id}", response_model=List[GlossaryResponse])
async def get_project_glossary(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all glossary entries for a project"""
    check_project_access(project_id, current_user, db)
    
    glossary_entries = db.query(Glossary)\
        .filter(Glossary.project_id == project_id)\
        .order_by(Glossary.source_term)\
        .all()
    
    return glossary_entries


@router.post("/project/{project_id}", response_model=GlossaryResponse)
async def create_glossary_entry(
    project_id: int,
    glossary: GlossaryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new glossary entry for a project"""
    check_project_access(project_id, current_user, db)
    
    # Validate language codes
    valid_langs = ["ko", "bn", "en"]
    if glossary.source_lang not in valid_langs or glossary.target_lang not in valid_langs:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid language code. Must be one of: {', '.join(valid_langs)}"
        )
    
    if glossary.source_lang == glossary.target_lang:
        raise HTTPException(
            status_code=400,
            detail="Source and target languages cannot be the same"
        )
    
    # Check for duplicate entry
    existing = db.query(Glossary).filter(
        Glossary.project_id == project_id,
        Glossary.source_term == glossary.source_term,
        Glossary.source_lang == glossary.source_lang,
        Glossary.target_lang == glossary.target_lang
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="This glossary entry already exists"
        )
    
    new_glossary = Glossary(
        project_id=project_id,
        source_term=glossary.source_term,
        target_term=glossary.target_term,
        source_lang=glossary.source_lang,
        target_lang=glossary.target_lang
    )
    
    db.add(new_glossary)
    db.commit()
    db.refresh(new_glossary)
    
    return new_glossary


@router.put("/{glossary_id}", response_model=GlossaryResponse)
async def update_glossary_entry(
    glossary_id: int,
    glossary_update: GlossaryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a glossary entry"""
    glossary = db.query(Glossary).filter(Glossary.id == glossary_id).first()
    if not glossary:
        raise HTTPException(status_code=404, detail="Glossary entry not found")
    
    check_project_access(glossary.project_id, current_user, db)
    
    # Update fields if provided
    if glossary_update.source_term is not None:
        glossary.source_term = glossary_update.source_term
    if glossary_update.target_term is not None:
        glossary.target_term = glossary_update.target_term
    if glossary_update.source_lang is not None:
        valid_langs = ["ko", "bn", "en"]
        if glossary_update.source_lang not in valid_langs:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid language code. Must be one of: {', '.join(valid_langs)}"
            )
        glossary.source_lang = glossary_update.source_lang
    if glossary_update.target_lang is not None:
        valid_langs = ["ko", "bn", "en"]
        if glossary_update.target_lang not in valid_langs:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid language code. Must be one of: {', '.join(valid_langs)}"
            )
        glossary.target_lang = glossary_update.target_lang
    
    db.commit()
    db.refresh(glossary)
    
    return glossary


@router.delete("/{glossary_id}")
async def delete_glossary_entry(
    glossary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a glossary entry"""
    glossary = db.query(Glossary).filter(Glossary.id == glossary_id).first()
    if not glossary:
        raise HTTPException(status_code=404, detail="Glossary entry not found")
    
    check_project_access(glossary.project_id, current_user, db)
    
    db.delete(glossary)
    db.commit()
    
    return {"message": "Glossary entry deleted successfully"}
