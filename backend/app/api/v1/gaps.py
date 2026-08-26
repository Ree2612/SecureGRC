from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.gap import Gap
from app.models.remediation import RemediationTask
from app.models.user import User
from app.models.activity import Activity
from app.schemas.gap import GapResponse, GapCreate, GapResolveResponse
from app.schemas.remediation import RemediationResponse, RemediationCreate
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[GapResponse])
def get_gaps(
    search: Optional[str] = None,
    status: Optional[str] = None,
    framework: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Gap).filter(Gap.organization_id == current_user.organization_id)
    if search:
        query = query.filter(
            Gap.title.ilike(f"%{search}%") |
            Gap.control_code.ilike(f"%{search}%") |
            Gap.owner.ilike(f"%{search}%") |
            Gap.recommendation.ilike(f"%{search}%")
        )
    if status:
        query = query.filter(Gap.status == status)
    if framework:
        query = query.filter(Gap.framework == framework)
    return query.order_by(Gap.created_at.desc()).all()

@router.post("", response_model=GapResponse, status_code=status.HTTP_201_CREATED)
def create_gap(
    payload: GapCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    gap = Gap(
        **payload.model_dump(),
        organization_id=current_user.organization_id
    )
    db.add(gap)
    
    activity = Activity(
        actor=current_user.name,
        action="Identified Gap",
        target=f"{gap.control_code}: {gap.title}",
        details=f"Owner: {gap.owner}, Due: {gap.due_date}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(gap)
    return gap

@router.get("/{id}", response_model=GapResponse)
def get_gap(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    gap = db.query(Gap).filter(Gap.id == id, Gap.organization_id == current_user.organization_id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Gap not found")
    return gap

@router.post("/{id}/resolve", response_model=GapResolveResponse)
def resolve_gap(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    gap = db.query(Gap).filter(Gap.id == id, Gap.organization_id == current_user.organization_id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Gap not found")
    
    gap.status = "Resolved"
    
    # Also complete any linked remediation tasks
    for task in gap.remediations:
        task.status = "Completed"
        task.progress = 100
        
    activity = Activity(
        actor=current_user.name,
        action="Resolved Compliance Gap",
        target=f"{gap.control_code}: {gap.title}",
        details="Gap marked as resolved and verified.",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(gap)
    return {
        "message": "Gap successfully resolved",
        "gap": gap
    }

@router.post("/{id}/create-remediation", response_model=RemediationResponse, status_code=status.HTTP_201_CREATED)
def create_remediation_from_gap(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    gap = db.query(Gap).filter(Gap.id == id, Gap.organization_id == current_user.organization_id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Gap not found")
    
    gap.status = "In Progress"
    
    task_name = f"Remediate {gap.control_code}: {gap.title}"
    task = RemediationTask(
        task_name=task_name,
        gap_id=gap.id,
        priority="High",
        owner=gap.owner,
        progress=15,
        status="In Progress",
        due_date=gap.due_date,
        organization_id=current_user.organization_id
    )
    db.add(task)
    
    activity = Activity(
        actor=current_user.name,
        action="Created Remediation Task",
        target=task_name,
        details=f"Linked to gap {gap.control_code}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(task)
    return task
