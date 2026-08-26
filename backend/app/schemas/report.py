from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ReportCreate(BaseModel):
    name: str
    framework: Optional[str] = "NIST CSF 2.0"
    type: Optional[str] = "Executive Summary"

class ReportResponse(BaseModel):
    id: str
    name: str
    framework: str
    type: str
    status: str
    file_url: Optional[str] = ""
    generated_at: Optional[datetime] = None
    organization_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
