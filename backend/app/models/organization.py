import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    industry = Column(String(100), default="Technology")
    size = Column(String(50), default="1,000 - 5,000 employees")
    region = Column(String(50), default="North America")
    plan = Column(String(50), default="Enterprise Tier")
    primary_framework = Column(String(100), default="NIST CSF 2.0")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="organization", cascade="all, delete-orphan")
    risks = relationship("Risk", back_populates="organization", cascade="all, delete-orphan")
    controls = relationship("Control", back_populates="organization", cascade="all, delete-orphan")
    gaps = relationship("Gap", back_populates="organization", cascade="all, delete-orphan")
    remediations = relationship("RemediationTask", back_populates="organization", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="organization", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="organization", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="organization", cascade="all, delete-orphan")
