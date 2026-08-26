from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class OrganizationResponse(BaseModel):
    id: str
    name: str
    industry: str
    size: str
    region: str
    plan: str
    primary_framework: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    region: Optional[str] = None
    primary_framework: Optional[str] = None
