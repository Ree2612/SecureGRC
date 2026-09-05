from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.control import Control
from app.models.evidence import Evidence
from app.models.user import User
from app.models.activity import Activity
from app.schemas.control import (
    ControlResponse,
    ControlCreate,
    ControlAssessmentUpdate,
    EvidenceResponse,
    EvidenceCreate
)
from app.api.deps import get_current_user

router = APIRouter()

@router.post("", response_model=ControlResponse, status_code=status.HTTP_201_CREATED)
def create_control(
    payload: ControlCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    control = Control(
        control_code=payload.control_code,
        name=payload.name,
        requirement=payload.requirement,
        framework=payload.framework,
        function=payload.function,
        category=payload.category,
        implementation_status="Not Implemented",
        effectiveness="Untested",
        owner=payload.owner or "Unassigned",
        organization_id=current_user.organization_id
    )
    db.add(control)
    
    activity = Activity(
        actor=current_user.name,
        action="Created Control",
        target=control.control_code,
        details=f"Added custom control for framework {control.framework}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(control)
    return control

@router.get("", response_model=List[ControlResponse])
def get_controls(
    search: Optional[str] = None,
    framework: Optional[str] = None,
    function: Optional[str] = None,
    implementation_status: Optional[str] = None,
    effectiveness: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Control).filter(Control.organization_id == current_user.organization_id)
    if search:
        query = query.filter(
            Control.control_code.ilike(f"%{search}%") | 
            Control.name.ilike(f"%{search}%") | 
            Control.requirement.ilike(f"%{search}%") |
            Control.owner.ilike(f"%{search}%")
        )
    if framework:
        query = query.filter(Control.framework == framework)
    if function:
        query = query.filter(Control.function == function)
    if implementation_status:
        query = query.filter(Control.implementation_status == implementation_status)
    if effectiveness:
        query = query.filter(Control.effectiveness == effectiveness)
        
    return query.order_by(Control.control_code.asc()).all()

@router.get("/{id}", response_model=ControlResponse)
def get_control(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    control = db.query(Control).filter(
        Control.id == id,
        Control.organization_id == current_user.organization_id
    ).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
    return control

@router.get("/{id}/evidence", response_model=List[EvidenceResponse])
def get_control_evidence(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    control = db.query(Control).filter(
        Control.id == id,
        Control.organization_id == current_user.organization_id
    ).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
    return control.evidence

@router.patch("/{id}/assessment", response_model=ControlResponse)
def update_control_assessment(
    id: str,
    payload: ControlAssessmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    control = db.query(Control).filter(
        Control.id == id,
        Control.organization_id == current_user.organization_id
    ).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(control, field, value)
    
    control.last_assessed = datetime.now(timezone.utc)
    
    activity = Activity(
        actor=current_user.name,
        action="Assessed Control",
        target=control.control_code,
        details=f"Status: {control.implementation_status}, Effectiveness: {control.effectiveness}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(control)
    return control

@router.post("/{id}/evidence", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
def add_control_evidence(
    id: str,
    payload: EvidenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    control = db.query(Control).filter(
        Control.id == id,
        Control.organization_id == current_user.organization_id
    ).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
        
    evidence = Evidence(
        control_id=control.id,
        title=payload.title,
        file_name=payload.file_name,
        file_type=payload.file_type or "PDF",
        file_url=payload.file_url or f"/evidence/{payload.file_name}",
        uploaded_by=current_user.name
    )
    db.add(evidence)
    
    activity = Activity(
        actor=current_user.name,
        action="Uploaded Evidence",
        target=f"{control.control_code}: {payload.title}",
        details=f"File: {payload.file_name}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(evidence)
    return evidence

from fastapi import File, UploadFile, Form

@router.post("/{id}/evidence/upload", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
def upload_control_evidence(
    id: str,
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    control = db.query(Control).filter(
        Control.id == id,
        Control.organization_id == current_user.organization_id
    ).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
        
    evidence = Evidence(
        control_id=control.id,
        title=title,
        file_name=file.filename,
        file_type=file.filename.split('.')[-1].upper() if '.' in file.filename else "FILE",
        file_url=f"/evidence/{file.filename}",
        uploaded_by=current_user.name
    )
    db.add(evidence)
    
    activity = Activity(
        actor=current_user.name,
        action="Uploaded Evidence",
        target=f"{control.control_code}: {title}",
        details=f"File: {file.filename}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(evidence)
    return evidence

