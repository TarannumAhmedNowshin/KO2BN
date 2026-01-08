from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from utils.dependencies import get_current_user
from models.user import User
from models.project import Project, ProjectUser
from schemas.project import ProjectCreate, ProjectResponse
from database import get_db

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all projects accessible to the current user"""
    # Get projects created by user
    created_projects = db.query(Project).filter(
        Project.owner_id == current_user.id
    ).all()
    
    # Get projects where user is a member
    member_project_ids = db.query(ProjectUser.project_id).filter(
        ProjectUser.user_id == current_user.id
    ).all()
    member_project_ids = [pid[0] for pid in member_project_ids]
    
    member_projects = db.query(Project).filter(
        Project.id.in_(member_project_ids)
    ).all() if member_project_ids else []
    
    # Combine and deduplicate
    all_projects = {p.id: p for p in created_projects}
    for p in member_projects:
        if p.id not in all_projects:
            all_projects[p.id] = p
    
    return list(all_projects.values())


@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new project"""
    new_project = Project(
        name=project.name,
        description=project.description,
        owner_id=current_user.id
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    return new_project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check access
    is_owner = project.owner_id == current_user.id
    is_member = db.query(ProjectUser).filter(
        ProjectUser.project_id == project_id,
        ProjectUser.user_id == current_user.id
    ).first() is not None
    
    if not (is_owner or is_member):
        raise HTTPException(status_code=403, detail="You don't have access to this project")
    
    return project


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a project (owner only)"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project owner can delete it")
    
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}


@router.get("/{project_id}/members")
async def get_project_members(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all members of a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check access
    is_owner = project.owner_id == current_user.id
    is_member = db.query(ProjectUser).filter(
        ProjectUser.project_id == project_id,
        ProjectUser.user_id == current_user.id
    ).first() is not None
    
    if not (is_owner or is_member):
        raise HTTPException(status_code=403, detail="You don't have access to this project")
    
    # Get owner
    owner = db.query(User).filter(User.id == project.owner_id).first()
    
    # Get members
    member_ids = db.query(ProjectUser.user_id).filter(
        ProjectUser.project_id == project_id
    ).all()
    member_ids = [mid[0] for mid in member_ids]
    
    members = db.query(User).filter(User.id.in_(member_ids)).all() if member_ids else []
    
    return {
        "owner": {
            "id": owner.id,
            "username": owner.username,
            "email": owner.email,
            "role": owner.role
        },
        "members": [
            {
                "id": m.id,
                "username": m.username,
                "email": m.email,
                "role": m.role
            } for m in members
        ]
    }


@router.post("/{project_id}/members/{user_id}")
async def add_project_member(
    project_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a member to a project (owner only)"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project owner can add members")
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already a member
    existing = db.query(ProjectUser).filter(
        ProjectUser.project_id == project_id,
        ProjectUser.user_id == user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this project")
    
    # Add member
    project_user = ProjectUser(project_id=project_id, user_id=user_id)
    db.add(project_user)
    db.commit()
    
    return {"message": f"User {user.username} added to project successfully"}


@router.delete("/{project_id}/members/{user_id}")
async def remove_project_member(
    project_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a member from a project (owner only)"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project owner can remove members")
    
    # Cannot remove owner
    if user_id == project.owner_id:
        raise HTTPException(status_code=400, detail="Cannot remove the project owner")
    
    # Find and delete
    project_user = db.query(ProjectUser).filter(
        ProjectUser.project_id == project_id,
        ProjectUser.user_id == user_id
    ).first()
    
    if not project_user:
        raise HTTPException(status_code=404, detail="User is not a member of this project")
    
    db.delete(project_user)
    db.commit()
    
    return {"message": "Member removed from project successfully"}

