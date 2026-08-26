from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    read: bool
    created_at: datetime
    organization_id: str

    class Config:
        from_attributes = True
