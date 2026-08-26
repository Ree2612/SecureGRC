import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    framework = Column(String(100), default="NIST CSF 2.0")
    type = Column(String(50), default="Executive Summary")  # Executive Summary, Gap Analysis, Technical Audit, SOC 2 Readiness
    status = Column(String(50), default="Draft")            # Draft, Generated, Archived
    file_url = Column(String(500), default="")
    generated_at = Column(DateTime, nullable=True)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="reports")
