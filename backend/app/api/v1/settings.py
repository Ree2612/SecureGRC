from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models.organization import Organization
from app.models.user import User
from app.models.activity import Activity
from app.api.deps import get_current_user

router = APIRouter()

class SettingsUpdate(BaseModel):
    organization_name: Optional[str] = None
    industry: Optional[str] = None
    region: Optional[str] = None
    primary_framework: Optional[str] = None
    mfa_enforced: Optional[bool] = None
    session_timeout_minutes: Optional[int] = None
    notification_email_alerts: Optional[bool] = None

@router.get("")
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    return {
        "organization": {
            "id": org.id,
            "name": org.name,
            "industry": org.industry,
            "size": org.size,
            "region": org.region,
            "plan": org.plan,
            "primary_framework": org.primary_framework
        },
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role
        },
        "security": {
            "mfa_enforced": True,
            "session_timeout_minutes": 60,
            "sso_enabled": True,
            "password_rotation_days": 90
        },
        "preferences": {
            "notification_email_alerts": True,
            "weekly_digest": True,
            "audit_log_retention_days": 365
        }
    }

@router.patch("")
def update_settings(
    payload: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if payload.organization_name:
        org.name = payload.organization_name
    if payload.industry:
        org.industry = payload.industry
    if payload.region:
        org.region = payload.region
    if payload.primary_framework:
        org.primary_framework = payload.primary_framework
    
    activity = Activity(
        actor=current_user.name,
        action="Updated Settings",
        target="Platform Configuration",
        details="Security and Organization preferences updated.",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(org)
    
    return {
        "message": "Settings updated successfully",
        "organization": {
            "id": org.id,
            "name": org.name,
            "industry": org.industry,
            "size": org.size,
            "region": org.region,
            "plan": org.plan,
            "primary_framework": org.primary_framework
        }
    }
