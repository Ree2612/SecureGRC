from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class SubTaskBase(BaseModel):
    title: str
    status: Optional[str] = "Pending"

class SubTaskCreate(SubTaskBase):
    pass

class SubTaskUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None

class SubTaskResponse(SubTaskBase):
    id: str
    remediation_task_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
class RemediationCreate(BaseModel):
    task_name: str
    gap_id: Optional[str] = None
    risk_id: Optional[str] = None
    asset_id: Optional[str] = None
    priority: Optional[str] = "High"
    owner: str
    progress: Optional[int] = 0
    status: Optional[str] = "Open"
    remediation_type: Optional[str] = "Technical"
    completion_criteria: Optional[str] = ""
    notes: Optional[str] = ""
    due_date: Optional[str] = "2026-10-15"

class RemediationUpdate(BaseModel):
    task_name: Optional[str] = None
    priority: Optional[str] = None
    owner: Optional[str] = None
    progress: Optional[int] = None
    status: Optional[str] = None
    remediation_type: Optional[str] = None
    completion_criteria: Optional[str] = None
    notes: Optional[str] = None
    due_date: Optional[str] = None

class VerifyRemediationRequest(BaseModel):
    update_control: Optional[bool] = False
    notes: Optional[str] = ""

class RejectRemediationRequest(BaseModel):
    rejection_reason: str

class RemediationResponse(BaseModel):
    id: str
    task_name: str
    gap_id: Optional[str] = None
    risk_id: Optional[str] = None
    asset_id: Optional[str] = None
    priority: str
    owner: str
    progress: int
    status: str
    remediation_type: Optional[str] = "Technical"
    completion_criteria: Optional[str] = ""
    rejection_reason: Optional[str] = ""
    notes: Optional[str] = ""
    due_date: str
    organization_id: str
    gap_title: Optional[str] = None
    control_code: Optional[str] = None
    framework: Optional[str] = None
    risk_title: Optional[str] = None
    asset_name: Optional[str] = None
    subtasks: List[SubTaskResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RemediationMetricsResponse(BaseModel):
    active_remediations: int
    overdue: int
    due_this_week: int
    ready_for_review: int
    verified: int

