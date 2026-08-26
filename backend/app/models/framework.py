import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime
from app.core.database import Base

class Framework(Base):
    __tablename__ = "frameworks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    version = Column(String(50), default="2.0")
    description = Column(Text, default="")
    total_controls = Column(String(20), default="106")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class FrameworkMapping(Base):
    __tablename__ = "framework_mappings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_framework = Column(String(100), nullable=False)
    source_control_code = Column(String(50), nullable=False)
    source_control_name = Column(String(255), default="")
    target_framework = Column(String(100), nullable=False)
    target_control_code = Column(String(50), nullable=False)
    target_control_name = Column(String(255), default="")
    mapping_strength = Column(String(50), default="Direct")  # Direct, Partial, Related
    description = Column(Text, default="")
