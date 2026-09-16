from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.system_log import SystemLog
from app.models.user import User
from app.schemas.system_log import (
    SystemLogCreate,
    SystemLogResponse,
    LogStatsResponse,
    MySQLMigrationRequest,
    MySQLMigrationResponse
)
from app.api.deps import get_current_user
from app.services.logger_service import log_to_db
from migrate_to_mysql import migrate_sqlite_to_mysql

router = APIRouter()

@router.get("", response_model=List[SystemLogResponse])
def get_logs(
    log_level: Optional[str] = Query(None, description="Filter by level: INFO, WARNING, ERROR, AUDIT, CRITICAL"),
    category: Optional[str] = Query(None, description="Filter by category: API, AUTH, DATABASE, GRC_EVENT, SYSTEM"),
    actor: Optional[str] = Query(None, description="Filter by actor email or system tag"),
    search: Optional[str] = Query(None, description="Free text search in action, target, or details"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve logs saved in the database with optional filtering and pagination.
    """
    query = db.query(SystemLog)

    if log_level:
        query = query.filter(SystemLog.log_level == log_level.upper())
    if category:
        query = query.filter(SystemLog.category == category.upper())
    if actor:
        query = query.filter(SystemLog.actor.ilike(f"%{actor}%"))
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (SystemLog.action.ilike(search_pattern)) |
            (SystemLog.target.ilike(search_pattern)) |
            (SystemLog.details.ilike(search_pattern))
        )

    # Scoped to organization if available
    if current_user.organization_id:
        query = query.filter(
            (SystemLog.organization_id == current_user.organization_id) |
            (SystemLog.organization_id.is_(None))
        )

    logs = query.order_by(SystemLog.timestamp.desc()).offset(offset).limit(limit).all()
    return logs

@router.post("", response_model=SystemLogResponse, status_code=status.HTTP_201_CREATED)
def create_log(
    log_in: SystemLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manually save a structured log record into the database.
    """
    org_id = log_in.organization_id or current_user.organization_id
    log_entry = log_to_db(
        db=db,
        log_level=log_in.log_level,
        category=log_in.category,
        action=log_in.action,
        actor=log_in.actor or current_user.email,
        target=log_in.target or "",
        status_code=log_in.status_code,
        ip_address=log_in.ip_address or "",
        details=log_in.details or "",
        organization_id=org_id
    )

    if not log_entry:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record log into the database"
        )
    return log_entry

@router.get("/stats", response_model=LogStatsResponse)
def get_log_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns summary statistics for database logs.
    """
    query = db.query(SystemLog)
    if current_user.organization_id:
        query = query.filter(
            (SystemLog.organization_id == current_user.organization_id) |
            (SystemLog.organization_id.is_(None))
        )

    total_logs = query.count()

    level_counts = dict(
        db.query(SystemLog.log_level, func.count(SystemLog.id))
        .group_by(SystemLog.log_level)
        .all()
    )

    category_counts = dict(
        db.query(SystemLog.category, func.count(SystemLog.id))
        .group_by(SystemLog.category)
        .all()
    )

    recent_errors = (
        query.filter(SystemLog.log_level.in_(["ERROR", "CRITICAL"]))
        .count()
    )

    return {
        "total_logs": total_logs,
        "by_level": level_counts,
        "by_category": category_counts,
        "recent_errors": recent_errors
    }

@router.get("/export")
def export_logs(
    limit: int = Query(500, le=2000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export database logs in JSON format.
    """
    logs = db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(limit).all()
    output = [
        {
            "id": l.id,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            "log_level": l.log_level,
            "category": l.category,
            "actor": l.actor,
            "action": l.action,
            "target": l.target,
            "status_code": l.status_code,
            "ip_address": l.ip_address,
            "details": l.details
        }
        for l in logs
    ]
    return JSONResponse(content=output)

@router.post("/migrate-to-mysql", response_model=MySQLMigrationResponse)
def trigger_mysql_migration(
    req: MySQLMigrationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Connect SQLite securegrc.db to a MySQL server and copy all database tables and logs.
    """
    res = migrate_sqlite_to_mysql(
        mysql_host=req.mysql_host or "localhost",
        mysql_port=req.mysql_port or 3306,
        mysql_user=req.mysql_user or "root",
        mysql_password=req.mysql_password or "",
        mysql_db=req.mysql_db or "securegrc"
    )
    return res
