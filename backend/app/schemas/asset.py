from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AssetCreate(BaseModel):
    name: str
    type: str
    criticality: str = "Medium"
    owner: str
    description: Optional[str] = ""
    status: Optional[str] = "Active"

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    criticality: Optional[str] = None
    owner: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class AssetResponse(BaseModel):
    id: str
    name: str
    type: str
    criticality: str
    owner: str
    description: Optional[str] = ""
    status: str
    organization_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
