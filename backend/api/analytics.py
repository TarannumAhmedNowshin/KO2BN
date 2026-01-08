from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from database import get_db
from models.user import User
from models.project import Project
from models.translation import Translation
from models.glossary import Glossary
from models.activity_log import ActivityLog
from utils.dependencies import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
async def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get analytics overview with counts and statistics
    """
    # Total counts
    total_users = db.query(User).count()
    total_projects = db.query(Project).count()
    total_translations = db.query(Translation).count()
    total_glossary_terms = db.query(Glossary).count()
    
    # User's personal stats
    user_translations = db.query(Translation).filter(
        Translation.user_id == current_user.id
    ).count()
    
    user_projects = db.query(Project).filter(
        Project.owner_id == current_user.id
    ).count()
    
    # Recent activity (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    recent_translations = db.query(Translation).filter(
        Translation.created_at >= thirty_days_ago
    ).count()
    
    # Translations by language (last 30 days)
    translations_by_lang = db.query(
        Translation.source_lang,
        Translation.target_lang,
        func.count(Translation.id).label('count')
    ).filter(
        Translation.created_at >= thirty_days_ago
    ).group_by(
        Translation.source_lang,
        Translation.target_lang
    ).all()
    
    language_pairs = [
        {
            "source": lang[0],
            "target": lang[1],
            "count": lang[2]
        }
        for lang in translations_by_lang
    ]
    
    # Daily translation counts (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    daily_translations = db.query(
        func.date(Translation.created_at).label('date'),
        func.count(Translation.id).label('count')
    ).filter(
        Translation.created_at >= seven_days_ago
    ).group_by(
        func.date(Translation.created_at)
    ).order_by(
        func.date(Translation.created_at)
    ).all()
    
    daily_stats = [
        {
            "date": str(day[0]),
            "count": day[1]
        }
        for day in daily_translations
    ]
    
    # Top active users (by translation count in last 30 days)
    top_users = db.query(
        User.username,
        func.count(Translation.id).label('translation_count')
    ).join(
        Translation, Translation.user_id == User.id
    ).filter(
        Translation.created_at >= thirty_days_ago
    ).group_by(
        User.id, User.username
    ).order_by(
        desc('translation_count')
    ).limit(5).all()
    
    top_users_list = [
        {
            "username": user[0],
            "count": user[1]
        }
        for user in top_users
    ]
    
    return {
        "overview": {
            "total_users": total_users,
            "total_projects": total_projects,
            "total_translations": total_translations,
            "total_glossary_terms": total_glossary_terms,
            "recent_translations_30d": recent_translations
        },
        "user_stats": {
            "translations": user_translations,
            "projects": user_projects
        },
        "language_pairs": language_pairs,
        "daily_translations": daily_stats,
        "top_users": top_users_list
    }


@router.get("/project/{project_id}")
async def get_project_analytics(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get analytics for a specific project
    """
    # Check access (owner or member)
    from models.project import ProjectUser
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return {"error": "Project not found"}
    
    is_owner = project.owner_id == current_user.id
    is_member = db.query(ProjectUser).filter(
        ProjectUser.project_id == project_id,
        ProjectUser.user_id == current_user.id
    ).first() is not None
    
    if not (is_owner or is_member):
        return {"error": "Access denied"}
    
    # Project translations
    project_translations = db.query(Translation).filter(
        Translation.project_id == project_id
    ).count()
    
    # Project glossary terms
    project_glossary = db.query(Glossary).filter(
        Glossary.project_id == project_id
    ).count()
    
    # Recent translations (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_translations = db.query(Translation).filter(
        Translation.project_id == project_id,
        Translation.created_at >= thirty_days_ago
    ).count()
    
    return {
        "project_id": project_id,
        "project_name": project.name,
        "total_translations": project_translations,
        "glossary_terms": project_glossary,
        "recent_translations_30d": recent_translations
    }
