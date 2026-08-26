import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Risk(Base):
    __tablename__ = "risks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    category = Column(String(100), nullable=False)  # Infrastructure, Data Privacy, Third-Party, Identity, Compliance, Operational
    likelihood = Column(Integer, default=3)  # 1 to 5
    impact = Column(Integer, default=3)      # 1 to 5
    inherent_risk = Column(String(20), default="Medium")  # Critical, High, Medium, Low
    residual_risk = Column(String(20), default="Low")     # Critical, High, Medium, Low
    status = Column(String(50), default="Open")           # Open, In Progress, Mitigated, Accepted
    owner = Column(String(255), nullable=False)
    threat_source = Column(String(255), default="External Threat Actor")
    existing_controls = Column(Text, default="")
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="risks")
