from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.gap import Gap
from app.models.remediation import RemediationTask
from app.models.user import User
from app.models.activity import Activity
from app.models.risk import Risk
from app.models.asset import Asset
from app.models.control import Control
from app.models.evidence import Evidence
from app.schemas.gap import GapResponse, GapCreate, GapResolveResponse
from app.schemas.remediation import RemediationResponse, RemediationCreate
from app.api.deps import get_current_user

router = APIRouter()

def _format_gap_response(gap: Gap, db: Session) -> Dict[str, Any]:
    active_rem = db.query(RemediationTask).filter(RemediationTask.gap_id == gap.id).order_by(RemediationTask.created_at.desc()).first()
    risk = db.query(Risk).filter(Risk.id == gap.risk_id).first() if gap.risk_id else None
    asset = db.query(Asset).filter(Asset.id == gap.asset_id).first() if gap.asset_id else None

    # Fallback heuristic: match risk by title/control if not explicitly linked
    if not risk:
        risk = db.query(Risk).filter(
            Risk.organization_id == gap.organization_id,
            Risk.title.ilike(f"%{gap.control_code}%")
        ).first()

    return {
        "id": gap.id,
        "title": gap.title,
        "framework": gap.framework,
        "control_id": gap.control_id,
        "control_code": gap.control_code,
        "business_impact": gap.business_impact or "",
        "recommendation": gap.recommendation or "",
        "owner": gap.owner,
        "due_date": gap.due_date,
        "status": gap.status,
        "risk_id": gap.risk_id or (risk.id if risk else None),
        "asset_id": gap.asset_id or (asset.id if asset else None),
        "risk_title": risk.title if risk else None,
        "risk_severity": risk.severity if risk else None,
        "asset_name": asset.name if asset else None,
        "remediation_id": active_rem.id if active_rem else None,
        "remediation_status": active_rem.status if active_rem else None,
        "remediation_task_name": active_rem.task_name if active_rem else None,
        "organization_id": gap.organization_id,
        "created_at": gap.created_at
    }

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
    
    gaps = query.order_by(Gap.created_at.desc()).all()
    return [_format_gap_response(g, db) for g in gaps]

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
    return _format_gap_response(gap, db)

@router.get("/{id}", response_model=GapResponse)
def get_gap(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    gap = db.query(Gap).filter(Gap.id == id, Gap.organization_id == current_user.organization_id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Gap not found")
    return _format_gap_response(gap, db)

@router.get("/{id}/details")
def get_gap_full_details(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    gap = db.query(Gap).filter(Gap.id == id, Gap.organization_id == current_user.organization_id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Gap not found")
    
    risk = db.query(Risk).filter(Risk.id == gap.risk_id).first() if gap.risk_id else None
    if not risk:
        risk = db.query(Risk).filter(Risk.organization_id == current_user.organization_id, Risk.title.ilike(f"%{gap.control_code}%")).first()

    asset = db.query(Asset).filter(Asset.id == gap.asset_id).first() if gap.asset_id else None
    if not asset and risk and hasattr(risk, 'asset_id') and risk.asset_id:
        asset = db.query(Asset).filter(Asset.id == risk.asset_id).first()

    control = db.query(Control).filter(Control.organization_id == current_user.organization_id, Control.control_code == gap.control_code).first()

    active_rem = db.query(RemediationTask).filter(RemediationTask.gap_id == gap.id).order_by(RemediationTask.created_at.desc()).first()

    evidence_items = []
    if control:
        evidence_items.extend(db.query(Evidence).filter(Evidence.control_id == control.id).all())
    if active_rem:
        evidence_items.extend(db.query(Evidence).filter(Evidence.remediation_id == active_rem.id).all())

    activities = db.query(Activity).filter(
        Activity.organization_id == current_user.organization_id,
        (Activity.target.ilike(f"%{gap.control_code}%")) | (Activity.target.ilike(f"%{gap.title}%")) | (Activity.details.ilike(f"%{gap.id}%"))
    ).order_by(Activity.timestamp.desc()).limit(15).all()

    return {
        "gap": _format_gap_response(gap, db),
        "risk": {
            "id": risk.id,
            "title": risk.title,
            "severity": risk.severity,
            "risk_score": risk.risk_score,
            "category": risk.category,
            "status": risk.status
        } if risk else None,
        "asset": {
            "id": asset.id,
            "name": asset.name,
            "type": asset.type,
            "criticality": asset.criticality,
            "owner": asset.owner
        } if asset else None,
        "control": {
            "id": control.id,
            "control_code": control.control_code,
            "name": control.name,
            "framework": control.framework,
            "implementation_status": control.implementation_status,
            "owner": control.owner
        } if control else None,
        "remediation": {
            "id": active_rem.id,
            "task_name": active_rem.task_name,
            "owner": active_rem.owner,
            "priority": active_rem.priority,
            "due_date": active_rem.due_date,
            "status": active_rem.status,
            "remediation_type": active_rem.remediation_type,
            "completion_criteria": active_rem.completion_criteria,
            "rejection_reason": active_rem.rejection_reason,
            "notes": active_rem.notes
        } if active_rem else None,
        "evidence": [
            {
                "id": ev.id,
                "title": ev.title,
                "file_name": ev.file_name,
                "file_type": ev.file_type,
                "file_url": ev.file_url,
                "uploaded_by": ev.uploaded_by,
                "uploaded_at": ev.uploaded_at
            } for ev in evidence_items
        ],
        "activities": [
            {
                "id": act.id,
                "actor": act.actor,
                "action": act.action,
                "target": act.target,
                "details": act.details,
                "timestamp": act.timestamp
            } for act in activities
        ]
    }

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
    
    for task in gap.remediations:
        task.status = "Verified"
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
        "gap": _format_gap_response(gap, db)
    }

@router.post("/{id}/create-remediation", response_model=RemediationResponse, status_code=status.HTTP_201_CREATED)
def create_remediation_from_gap(
    id: str,
    payload: Optional[RemediationCreate] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    gap = db.query(Gap).filter(Gap.id == id, Gap.organization_id == current_user.organization_id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Gap not found")
    
    gap.status = "Remediation In Progress"
    
    task_name = payload.task_name if (payload and payload.task_name) else f"Remediate {gap.control_code}: {gap.title}"
    owner = payload.owner if (payload and payload.owner) else gap.owner
    priority = payload.priority if (payload and payload.priority) else "High"
    due_date = payload.due_date if (payload and payload.due_date) else gap.due_date
    remediation_type = payload.remediation_type if (payload and payload.remediation_type) else "Technical"
    completion_criteria = payload.completion_criteria if (payload and payload.completion_criteria) else f"Satisfy control requirements for {gap.control_code}."
    notes = payload.notes if (payload and payload.notes) else ""

    task = RemediationTask(
        task_name=task_name,
        gap_id=gap.id,
        risk_id=payload.risk_id if (payload and payload.risk_id) else gap.risk_id,
        asset_id=payload.asset_id if (payload and payload.asset_id) else gap.asset_id,
        priority=priority,
        owner=owner,
        progress=25,
        status="In Progress",
        remediation_type=remediation_type,
        completion_criteria=completion_criteria,
        notes=notes,
        due_date=due_date,
        organization_id=current_user.organization_id
    )
    db.add(task)
    
    activity = Activity(
        actor=current_user.name,
        action="Created Remediation Task",
        target=task_name,
        details=f"Assigned to {owner}. Completion Criteria: {completion_criteria}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(task)
    
    return {
        "id": task.id,
        "task_name": task.task_name,
        "gap_id": task.gap_id,
        "risk_id": task.risk_id,
        "asset_id": task.asset_id,
        "priority": task.priority,
        "owner": task.owner,
        "progress": task.progress,
        "status": task.status,
        "remediation_type": task.remediation_type,
        "completion_criteria": task.completion_criteria,
        "rejection_reason": task.rejection_reason or "",
        "notes": task.notes or "",
        "due_date": task.due_date,
        "organization_id": task.organization_id,
        "gap_title": gap.title,
        "control_code": gap.control_code,
        "framework": gap.framework,
        "subtasks": [],
        "created_at": task.created_at,
        "updated_at": task.updated_at
    }
