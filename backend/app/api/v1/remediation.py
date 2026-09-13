from typing import List, Optional, Any, Dict
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.remediation import RemediationTask, RemediationSubTask
from app.models.gap import Gap
from app.models.risk import Risk
from app.models.asset import Asset
from app.models.control import Control
from app.models.evidence import Evidence
from app.models.user import User
from app.models.activity import Activity
from app.schemas.remediation import (
    RemediationResponse, RemediationCreate, RemediationUpdate,
    SubTaskResponse, SubTaskCreate, SubTaskUpdate,
    VerifyRemediationRequest, RejectRemediationRequest, RemediationMetricsResponse
)
from app.api.deps import get_current_user

router = APIRouter()

def _format_remediation(task: RemediationTask, db: Session) -> Dict[str, Any]:
    gap = db.query(Gap).filter(Gap.id == task.gap_id).first() if task.gap_id else None
    risk = db.query(Risk).filter(Risk.id == (task.risk_id or (gap.risk_id if gap else None))).first()
    asset = db.query(Asset).filter(Asset.id == (task.asset_id or (gap.asset_id if gap else None))).first()

    return {
        "id": task.id,
        "task_name": task.task_name,
        "gap_id": task.gap_id,
        "risk_id": task.risk_id or (risk.id if risk else None),
        "asset_id": task.asset_id or (asset.id if asset else None),
        "priority": task.priority,
        "owner": task.owner,
        "progress": task.progress,
        "status": task.status,
        "remediation_type": task.remediation_type or "Technical",
        "completion_criteria": task.completion_criteria or "",
        "rejection_reason": task.rejection_reason or "",
        "notes": task.notes or "",
        "due_date": task.due_date,
        "organization_id": task.organization_id,
        "gap_title": gap.title if gap else None,
        "control_code": gap.control_code if gap else None,
        "framework": gap.framework if gap else None,
        "risk_title": risk.title if risk else None,
        "asset_name": asset.name if asset else None,
        "subtasks": [
            {
                "id": st.id,
                "title": st.title,
                "status": st.status,
                "remediation_task_id": st.remediation_task_id,
                "created_at": st.created_at
            } for st in task.subtasks
        ],
        "created_at": task.created_at,
        "updated_at": task.updated_at
    }

@router.get("/metrics", response_model=RemediationMetricsResponse)
def get_remediation_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks = db.query(RemediationTask).filter(RemediationTask.organization_id == current_user.organization_id).all()
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    week_later_str = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")

    active = sum(1 for t in tasks if t.status in ["Open", "In Progress"])
    ready_for_review = sum(1 for t in tasks if t.status == "Ready for Review")
    verified = sum(1 for t in tasks if t.status == "Verified")
    overdue = sum(1 for t in tasks if t.status != "Verified" and t.due_date and t.due_date < today_str)
    due_this_week = sum(1 for t in tasks if t.status != "Verified" and t.due_date and today_str <= t.due_date <= week_later_str)

    return {
        "active_remediations": active,
        "overdue": overdue,
        "due_this_week": due_this_week,
        "ready_for_review": ready_for_review,
        "verified": verified
    }

@router.get("", response_model=List[RemediationResponse])
def get_remediations(
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(RemediationTask).filter(RemediationTask.organization_id == current_user.organization_id)
    if search:
        query = query.filter(
            RemediationTask.task_name.ilike(f"%{search}%") |
            RemediationTask.owner.ilike(f"%{search}%")
        )
    if status:
        if status == "Rejected":
            query = query.filter(RemediationTask.rejection_reason != "", RemediationTask.rejection_reason != None, RemediationTask.status == "In Progress")
        else:
            query = query.filter(RemediationTask.status == status)
    if priority:
        query = query.filter(RemediationTask.priority == priority)
    
    tasks = query.order_by(RemediationTask.due_date.asc()).all()
    return [_format_remediation(t, db) for t in tasks]

@router.post("", response_model=RemediationResponse, status_code=status.HTTP_201_CREATED)
def create_remediation(
    payload: RemediationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = RemediationTask(
        **payload.model_dump(),
        organization_id=current_user.organization_id
    )
    db.add(task)

    if task.gap_id:
        gap = db.query(Gap).filter(Gap.id == task.gap_id).first()
        if gap and gap.status == "Open":
            gap.status = "Remediation In Progress"

    activity = Activity(
        actor=current_user.name,
        action="Created Remediation Task",
        target=task.task_name,
        details=f"Owner: {task.owner}, Priority: {task.priority}. Completion Criteria: {task.completion_criteria or 'None'}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(task)
    return _format_remediation(task, db)

@router.get("/{id}", response_model=RemediationResponse)
def get_remediation(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RemediationTask).filter(
        RemediationTask.id == id,
        RemediationTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Remediation task not found")
    return _format_remediation(task, db)

@router.get("/{id}/details")
def get_remediation_details(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RemediationTask).filter(
        RemediationTask.id == id,
        RemediationTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Remediation task not found")

    gap = db.query(Gap).filter(Gap.id == task.gap_id).first() if task.gap_id else None
    risk = db.query(Risk).filter(Risk.id == (task.risk_id or (gap.risk_id if gap else None))).first()
    asset = db.query(Asset).filter(Asset.id == (task.asset_id or (gap.asset_id if gap else None))).first()
    
    control = None
    if gap and gap.control_code:
        control = db.query(Control).filter(Control.organization_id == current_user.organization_id, Control.control_code == gap.control_code).first()

    evidence_items = db.query(Evidence).filter(Evidence.remediation_id == task.id).all()
    if control:
        evidence_items.extend(db.query(Evidence).filter(Evidence.control_id == control.id, Evidence.remediation_id == None).all())

    activities = db.query(Activity).filter(
        Activity.organization_id == current_user.organization_id,
        (Activity.target.ilike(f"%{task.task_name}%")) | (Activity.details.ilike(f"%{task.id}%")) | (Activity.target.ilike(f"%{gap.control_code if gap else '###'}%"))
    ).order_by(Activity.timestamp.desc()).limit(15).all()

    return {
        "remediation": _format_remediation(task, db),
        "gap": {
            "id": gap.id,
            "title": gap.title,
            "control_code": gap.control_code,
            "framework": gap.framework,
            "status": gap.status,
            "business_impact": gap.business_impact
        } if gap else None,
        "risk": {
            "id": risk.id,
            "title": risk.title,
            "severity": risk.severity
        } if risk else None,
        "asset": {
            "id": asset.id,
            "name": asset.name,
            "type": asset.type
        } if asset else None,
        "control": {
            "id": control.id,
            "control_code": control.control_code,
            "name": control.name,
            "implementation_status": control.implementation_status
        } if control else None,
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

@router.post("/{id}/evidence/upload")
def upload_remediation_evidence(
    id: str,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RemediationTask).filter(
        RemediationTask.id == id,
        RemediationTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Remediation task not found")

    # Resolve carried control_id if available to link evidence to control & satisfy legacy DB constraints
    control_id = None
    if task.gap_id:
        gap = db.query(Gap).filter(Gap.id == task.gap_id).first()
        if gap and gap.control_code:
            ctrl = db.query(Control).filter(Control.organization_id == current_user.organization_id, Control.control_code == gap.control_code).first()
            if ctrl:
                control_id = ctrl.id

    if not control_id:
        any_ctrl = db.query(Control).filter(Control.organization_id == current_user.organization_id).first()
        if any_ctrl:
            control_id = any_ctrl.id

    ext = file.filename.split('.')[-1].upper() if '.' in file.filename else 'FILE'
    evidence = Evidence(
        control_id=control_id,
        remediation_id=task.id,
        title=title or file.filename,
        file_name=file.filename,
        file_type=ext,
        file_url=f"/uploads/{file.filename}",
        uploaded_by=current_user.name
    )
    db.add(evidence)

    activity = Activity(
        actor=current_user.name,
        action="Uploaded Evidence",
        target=task.task_name,
        details=f"Attached evidence document: '{file.filename}'",
        organization_id=current_user.organization_id
    )
    db.add(activity)

    db.commit()
    db.refresh(evidence)

    return {
        "id": evidence.id,
        "title": evidence.title,
        "file_name": evidence.file_name,
        "file_type": evidence.file_type,
        "file_url": evidence.file_url,
        "uploaded_by": evidence.uploaded_by,
        "uploaded_at": evidence.uploaded_at
    }

@router.delete("/{id}/evidence/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_remediation_evidence(
    id: str,
    evidence_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RemediationTask).filter(
        RemediationTask.id == id,
        RemediationTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Remediation task not found")

    evidence = db.query(Evidence).filter(
        Evidence.id == evidence_id,
        Evidence.remediation_id == task.id
    ).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    file_name = evidence.file_name
    db.delete(evidence)

    activity = Activity(
        actor=current_user.name,
        action="Deleted Evidence",
        target=task.task_name,
        details=f"Removed evidence document: '{file_name}'",
        organization_id=current_user.organization_id
    )
    db.add(activity)

    db.commit()
    return None

@router.post("/{id}/submit-review", response_model=RemediationResponse)
def submit_remediation_for_review(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RemediationTask).filter(
        RemediationTask.id == id,
        RemediationTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Remediation task not found")

    # REQUIRE EVIDENCE BEFORE SUBMISSION
    evidence_count = db.query(Evidence).filter(Evidence.remediation_id == task.id).count()
    if evidence_count == 0 and task.gap_id:
        gap = db.query(Gap).filter(Gap.id == task.gap_id).first()
        if gap and gap.control_code:
            ctrl = db.query(Control).filter(Control.organization_id == current_user.organization_id, Control.control_code == gap.control_code).first()
            if ctrl:
                evidence_count += db.query(Evidence).filter(Evidence.control_id == ctrl.id).count()

    if evidence_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Evidence is required before submitting for verification. Please upload at least one evidence document first."
        )

    task.status = "Ready for Review"
    task.progress = max(task.progress, 90)

    if task.gap_id:
        gap = db.query(Gap).filter(Gap.id == task.gap_id).first()
        if gap:
            gap.status = "Pending Verification"

    activity = Activity(
        actor=current_user.name,
        action="Submitted for Verification",
        target=task.task_name,
        details=f"Remediation submitted for GRC verification review by {current_user.name}.",
        organization_id=current_user.organization_id
    )
    db.add(activity)

    db.commit()
    db.refresh(task)
    return _format_remediation(task, db)

@router.post("/{id}/verify", response_model=RemediationResponse)
def verify_remediation(
    id: str,
    payload: Optional[VerifyRemediationRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RemediationTask).filter(
        RemediationTask.id == id,
        RemediationTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Remediation task not found")

    # REQUIRE COMPLETION CRITERIA DEFINED BEFORE VERIFYING
    if not task.completion_criteria or not task.completion_criteria.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completion criteria must be defined before verifying remediation."
        )

    task.status = "Verified"
    task.progress = 100

    reviewer_notes = payload.notes.strip() if (payload and payload.notes) else "Remediation criteria & evidence verified."

    if task.gap_id:
        gap = db.query(Gap).filter(Gap.id == task.gap_id).first()
        if gap:
            gap.status = "Resolved"
            # NOTE: Control implementation status is NOT automatically mutated!
            # Control implementation status remains independently assessed.

    activity = Activity(
        actor=current_user.name,
        action="Verified Remediation",
        target=task.task_name,
        details=f"Verified by GRC Reviewer: {current_user.name}. Decision: Verified. Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}. Notes: {reviewer_notes}. Gap marked as Resolved.",
        organization_id=current_user.organization_id
    )
    db.add(activity)

    db.commit()
    db.refresh(task)
    return _format_remediation(task, db)

@router.post("/{id}/reject", response_model=RemediationResponse)
def reject_remediation(
    id: str,
    payload: RejectRemediationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RemediationTask).filter(
        RemediationTask.id == id,
        RemediationTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Remediation task not found")

    if not payload.rejection_reason or not payload.rejection_reason.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is required.")

    task.status = "In Progress"
    task.rejection_reason = payload.rejection_reason.strip()
    task.progress = min(task.progress, 50)

    if task.gap_id:
        gap = db.query(Gap).filter(Gap.id == task.gap_id).first()
        if gap:
            gap.status = "Remediation In Progress"

    activity = Activity(
        actor=current_user.name,
        action="Rejected Remediation / Requested Changes",
        target=task.task_name,
        details=f"Rejected by GRC Reviewer: {current_user.name}. Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}. Reason: {payload.rejection_reason.strip()}",
        organization_id=current_user.organization_id
    )
    db.add(activity)

    db.commit()
    db.refresh(task)
    return _format_remediation(task, db)

@router.patch("/{id}", response_model=RemediationResponse)
def update_remediation(
    id: str,
    payload: RemediationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RemediationTask).filter(
        RemediationTask.id == id,
        RemediationTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Remediation task not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    if task.status == "Verified" and task.progress < 100:
        task.progress = 100
        
    activity = Activity(
        actor=current_user.name,
        action="Updated Remediation",
        target=task.task_name,
        details=f"Status: {task.status}, Priority: {task.priority}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(task)
    return _format_remediation(task, db)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_remediation(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RemediationTask).filter(
        RemediationTask.id == id,
        RemediationTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Remediation task not found")
    db.delete(task)
    db.commit()
    return None

def _recalculate_task_progress(task: RemediationTask, db: Session):
    if not task.subtasks:
        return
    total = len(task.subtasks)
    completed = sum(1 for st in task.subtasks if st.status == "Completed")
    progress = int((completed / total) * 100)
    task.progress = progress
    if progress == 100 and task.status not in ["Verified", "Ready for Review"]:
        task.status = "Ready for Review"
    elif progress > 0 and task.status == "Open":
        task.status = "In Progress"
    db.commit()

@router.post("/{id}/subtasks", response_model=SubTaskResponse, status_code=status.HTTP_201_CREATED)
def create_subtask(
    id: str,
    payload: SubTaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RemediationTask).filter(
        RemediationTask.id == id,
        RemediationTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    subtask = RemediationSubTask(
        title=payload.title,
        status=payload.status,
        remediation_task_id=task.id
    )
    db.add(subtask)
    db.commit()
    db.refresh(subtask)
    _recalculate_task_progress(task, db)
    return subtask

@router.patch("/{id}/subtasks/{subtask_id}", response_model=SubTaskResponse)
def update_subtask(
    id: str,
    subtask_id: str,
    payload: SubTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RemediationTask).filter(
        RemediationTask.id == id,
        RemediationTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    subtask = db.query(RemediationSubTask).filter(
        RemediationSubTask.id == subtask_id,
        RemediationSubTask.remediation_task_id == task.id
    ).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="SubTask not found")
        
    if payload.title is not None:
        subtask.title = payload.title
    if payload.status is not None:
        subtask.status = payload.status
        
    db.commit()
    db.refresh(subtask)
    _recalculate_task_progress(task, db)
    return subtask


