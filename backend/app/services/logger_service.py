import json
import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.system_log import SystemLog

logger = logging.getLogger("securegrc.database_logger")

def log_to_db(
    db: Optional[Session] = None,
    log_level: str = "INFO",
    category: str = "SYSTEM",
    action: str = "SYSTEM_EVENT",
    actor: str = "system",
    target: str = "",
    status_code: Optional[int] = None,
    ip_address: str = "",
    details: str = "",
    organization_id: Optional[str] = None
) -> Optional[SystemLog]:
    """
    Saves a structured log record directly into the database (system_logs table).
    Handles session management safely.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        log_entry = SystemLog(
            log_level=log_level.upper(),
            category=category.upper(),
            action=action,
            actor=actor,
            target=target,
            status_code=status_code,
            ip_address=ip_address,
            details=details,
            organization_id=organization_id
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        logger.error(f"Failed to write log record to database: {e}")
        if db:
            db.rollback()
        return None
    finally:
        if close_db and db:
            db.close()
