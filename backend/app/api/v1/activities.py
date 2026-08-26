from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.activity import Activity
from app.models.user import User
from app.schemas.activity import ActivityResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[ActivityResponse])
def get_activities(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Activity).filter(
        Activity.organization_id == current_user.organization_id
    ).order_by(Activity.timestamp.desc()).limit(limit).all()
