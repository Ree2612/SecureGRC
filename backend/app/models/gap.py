import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Gap(Base):
    __tablename__ = "gaps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    framework = Column(String(100), default="NIST CSF 2.0")
    control_id = Column(String(36), nullable=True)
    control_code = Column(String(50), nullable=False)
    business_impact = Column(Text, default="")
    recommendation = Column(Text, default="")
    owner = Column(String(255), nullable=False)
    due_date = Column(String(50), default="2026-09-30")
    status = Column(String(50), default="Open")  # Open, In Progress, Resolved
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="gaps")
    remediations = relationship("RemediationTask", back_populates="gap", cascade="all, delete-orphan")
