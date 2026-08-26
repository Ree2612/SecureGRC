from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class RiskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: str
    likelihood: int = 3
    impact: int = 3
    inherent_risk: Optional[str] = "Medium"
    residual_risk: Optional[str] = "Low"
    status: Optional[str] = "Open"
    owner: str
    threat_source: Optional[str] = "External Threat Actor"
    existing_controls: Optional[str] = ""

class RiskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    likelihood: Optional[int] = None
    impact: Optional[int] = None
    inherent_risk: Optional[str] = None
    residual_risk: Optional[str] = None
    status: Optional[str] = None
    owner: Optional[str] = None
    threat_source: Optional[str] = None
    existing_controls: Optional[str] = None

class RiskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    category: str
    likelihood: int
    impact: int
    inherent_risk: str
    residual_risk: str
    status: str
    owner: str
    threat_source: Optional[str] = ""
    existing_controls: Optional[str] = ""
    organization_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
