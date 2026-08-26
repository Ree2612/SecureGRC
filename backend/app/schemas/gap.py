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
    organization_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GapResolveResponse(BaseModel):
    message: str
    gap: GapResponse
