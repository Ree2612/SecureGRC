from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ActivityResponse(BaseModel):
    id: str
    actor: str
    action: str
    target: str
    details: Optional[str] = ""
    timestamp: datetime
    organization_id: str

    class Config:
        from_attributes = True
