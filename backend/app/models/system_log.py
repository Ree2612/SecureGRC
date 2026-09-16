import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    log_level = Column(String(20), default="INFO", index=True)  # INFO, WARNING, ERROR, AUDIT, CRITICAL
    category = Column(String(50), default="SYSTEM", index=True) # API, AUTH, DATABASE, GRC_EVENT, SYSTEM, SECURITY
    actor = Column(String(255), default="system", index=True)   # User email or system identifier
    action = Column(String(100), nullable=False, index=True)  # e.g., API_REQUEST, USER_LOGIN, CREATE_RISK, MIGRATE_DB
    target = Column(String(255), default="")                   # Endpoint path, table name, or entity ID
    status_code = Column(Integer, nullable=True)               # e.g. 200, 401, 500
    ip_address = Column(String(45), default="")
    details = Column(Text, default="")                         # JSON string, message payload, or stack trace
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)

    organization = relationship("Organization")
