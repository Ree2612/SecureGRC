from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.remediation import RemediationTask, RemediationSubTask
from app.models.user import User
from app.models.activity import Activity
from app.schemas.remediation import (
    RemediationResponse, RemediationCreate, RemediationUpdate,
    SubTaskResponse, SubTaskCreate, SubTaskUpdate
)
from app.api.deps import get_current_user

router = APIRouter()

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
        query = query.filter(RemediationTask.status == status)
    if priority:
        query = query.filter(RemediationTask.priority == priority)
    return query.order_by(RemediationTask.due_date.asc()).all()

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
    
    activity = Activity(
        actor=current_user.name,
        action="Created Remediation",
        target=task.task_name,
        details=f"Owner: {task.owner}, Priority: {task.priority}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(task)
    return task

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
    
    if task.progress == 100 and task.status != "Completed":
        task.status = "Completed"
    elif task.progress < 100 and task.status == "Completed":
        task.status = "In Progress"
        
    activity = Activity(
        actor=current_user.name,
        action="Updated Remediation",
        target=task.task_name,
        details=f"Progress: {task.progress}%, Status: {task.status}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(task)
    return task

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
    if progress == 100:
        task.status = "Completed"
    elif progress > 0 and task.status == "Not Started":
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

