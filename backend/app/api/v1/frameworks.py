from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.framework import Framework, FrameworkMapping
from app.models.user import User
from app.schemas.framework import FrameworkResponse, FrameworkMappingResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[FrameworkResponse])
def get_frameworks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Framework).all()

@router.get("/mappings", response_model=List[FrameworkMappingResponse])
def get_framework_mappings(
    source_framework: Optional[str] = None,
    target_framework: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FrameworkMapping)
    if source_framework:
        query = query.filter(FrameworkMapping.source_framework == source_framework)
    if target_framework:
        query = query.filter(FrameworkMapping.target_framework == target_framework)
    return query.all()
