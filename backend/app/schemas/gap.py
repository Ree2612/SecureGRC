from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class GapCreate(BaseModel):
    title: str
    framework: Optional[str] = "NIST CSF 2.0"
    control_id: Optional[str] = None
    control_code: str
    business_impact: Optional[str] = ""
    recommendation: Optional[str] = ""
    owner: str
    due_date: Optional[str] = "2026-09-30"
    risk_id: Optional[str] = None
    asset_id: Optional[str] = None

class GapResponse(BaseModel):
    id: str
    title: str
    framework: str
    control_id: Optional[str] = None
    control_code: str
    business_impact: Optional[str] = ""
    recommendation: Optional[str] = ""
    owner: str
    due_date: str
    status: str
    risk_id: Optional[str] = None
    asset_id: Optional[str] = None
    risk_title: Optional[str] = None
    risk_severity: Optional[str] = None
    asset_name: Optional[str] = None
    remediation_id: Optional[str] = None
    remediation_status: Optional[str] = None
    remediation_task_name: Optional[str] = None
    organization_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GapResolveResponse(BaseModel):
    message: str
    gap: GapResponse
