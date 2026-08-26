from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import UserResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[UserResponse])
def get_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(User).filter(
        User.organization_id == current_user.organization_id
    ).all()
