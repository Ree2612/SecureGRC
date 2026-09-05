import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class RemediationTask(Base):
    __tablename__ = "remediation_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_name = Column(String(255), nullable=False)
    gap_id = Column(String(36), ForeignKey("gaps.id"), nullable=True)
    priority = Column(String(20), default="High")  # Critical, High, Medium, Low
    owner = Column(String(255), nullable=False)
    progress = Column(Integer, default=0)          # 0 - 100
    status = Column(String(50), default="In Progress")  # Not Started, In Progress, Completed, Blocked
    due_date = Column(String(50), default="2026-10-15")
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="remediations")
    gap = relationship("Gap", back_populates="remediations")
    subtasks = relationship("RemediationSubTask", back_populates="remediation_task", cascade="all, delete-orphan")

class RemediationSubTask(Base):
    __tablename__ = "remediation_subtasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="Pending") # Pending, Completed
    remediation_task_id = Column(String(36), ForeignKey("remediation_tasks.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    remediation_task = relationship("RemediationTask", back_populates="subtasks")

