import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)   # e.g., Updated Assessment, Created Risk, Resolved Gap
    target = Column(String(255), nullable=False)   # e.g., PR.AC-1, Database Encryption Risk
    details = Column(Text, default="")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)

    organization = relationship("Organization", back_populates="activities")
