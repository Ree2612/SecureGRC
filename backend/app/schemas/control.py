from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class EvidenceResponse(BaseModel):
    id: str
    control_id: str
    title: str
    file_name: str
    file_type: str
    file_url: str
    uploaded_by: str
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EvidenceCreate(BaseModel):
    title: str
    file_name: str
    file_type: Optional[str] = "PDF"
    file_url: Optional[str] = ""

class ControlAssessmentUpdate(BaseModel):
    implementation_status: Optional[str] = None
    effectiveness: Optional[str] = None
    notes: Optional[str] = None
    owner: Optional[str] = None

class ControlCreate(BaseModel):
    control_code: str
    name: str
    requirement: str
    framework: str
    function: str
    category: str
    owner: Optional[str] = "Unassigned"

class ControlResponse(BaseModel):
    id: str
    control_code: str
    name: str
    requirement: str
    framework: str
    function: str
    category: str
    implementation_status: str
    effectiveness: str
    owner: str
    last_assessed: Optional[datetime] = None
    notes: Optional[str] = ""
    organization_id: str
    evidence: Optional[List[EvidenceResponse]] = []

    class Config:
        from_attributes = True
