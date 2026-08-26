import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # Cloud Infrastructure, Database, Compute, Identity, Endpoint, SaaS
    criticality = Column(String(20), default="Medium")  # Critical, High, Medium, Low
    owner = Column(String(255), nullable=False)
    description = Column(String(500), default="")
    status = Column(String(50), default="Active")  # Active, Maintenance, Deprecated
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="assets")
