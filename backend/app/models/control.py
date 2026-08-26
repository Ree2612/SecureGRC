import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Control(Base):
    __tablename__ = "controls"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    control_code = Column(String(50), nullable=False, index=True)  # e.g., PR.AC-1, ID.AM-1, ISO A.9.1
    name = Column(String(255), nullable=False)
    requirement = Column(Text, nullable=False)
    framework = Column(String(100), default="NIST CSF 2.0")        # NIST CSF 2.0, ISO/IEC 27001, CIS Controls v8
    function = Column(String(50), default="Protect")               # Identify, Protect, Detect, Respond, Recover, Govern
    category = Column(String(100), default="Identity Management and Access Control")
    implementation_status = Column(String(50), default="Implemented")  # Implemented, Partially Implemented, Not Implemented, Not Applicable
    effectiveness = Column(String(50), default="Effective")            # Effective, Partially Effective, Ineffective, Untested
    owner = Column(String(255), nullable=False)
    last_assessed = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(Text, default="")
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)

    organization = relationship("Organization", back_populates="controls")
    evidence = relationship("Evidence", back_populates="control", cascade="all, delete-orphan")
