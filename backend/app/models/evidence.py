import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    control_id = Column(String(36), ForeignKey("controls.id"), nullable=False)
    title = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), default="PDF")
    file_url = Column(String(500), default="")
    uploaded_by = Column(String(255), default="System Security")
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    control = relationship("Control", back_populates="evidence")
