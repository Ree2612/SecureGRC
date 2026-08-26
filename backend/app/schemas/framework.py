from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class FrameworkResponse(BaseModel):
    id: str
    name: str
    code: str
    version: str
    description: Optional[str] = ""
    total_controls: str

    class Config:
        from_attributes = True

class FrameworkMappingResponse(BaseModel):
    id: str
    source_framework: str
    source_control_code: str
    source_control_name: Optional[str] = ""
    target_framework: str
    target_control_code: str
    target_control_name: Optional[str] = ""
    mapping_strength: str
    description: Optional[str] = ""

    class Config:
        from_attributes = True
