from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class RemediationCreate(BaseModel):
    task_name: str
    gap_id: Optional[str] = None
    priority: Optional[str] = "High"
    owner: str
    progress: Optional[int] = 0
    status: Optional[str] = "In Progress"
    due_date: Optional[str] = "2026-10-15"

class RemediationUpdate(BaseModel):
    task_name: Optional[str] = None
    priority: Optional[str] = None
    owner: Optional[str] = None
    progress: Optional[int] = None
    status: Optional[str] = None
    due_date: Optional[str] = None

class RemediationResponse(BaseModel):
    id: str
    task_name: str
    gap_id: Optional[str] = None
    priority: str
    owner: str
    progress: int
    status: str
    due_date: str
    organization_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
