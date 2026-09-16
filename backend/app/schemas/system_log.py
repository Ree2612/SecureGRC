from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class SystemLogBase(BaseModel):
    log_level: str = Field(default="INFO", description="Log severity level: INFO, WARNING, ERROR, AUDIT, CRITICAL")
    category: str = Field(default="SYSTEM", description="Category: API, AUTH, DATABASE, GRC_EVENT, SYSTEM, SECURITY")
    actor: str = Field(default="system", description="Actor who performed the operation or system tag")
    action: str = Field(..., description="Action tag e.g., USER_LOGIN, CREATE_RISK, MIGRATE_DB")
    target: Optional[str] = Field(default="", description="Endpoint URL, table name, or target ID")
    status_code: Optional[int] = Field(default=None, description="HTTP status code or execution code")
    ip_address: Optional[str] = Field(default="", description="Client IP address")
    details: Optional[str] = Field(default="", description="Message details, JSON string, or error traceback")
    organization_id: Optional[str] = Field(default=None, description="Organization ID")

class SystemLogCreate(SystemLogBase):
    pass

class SystemLogResponse(SystemLogBase):
    id: str
    timestamp: datetime

    class Config:
        from_attributes = True

class LogStatsResponse(BaseModel):
    total_logs: int
    by_level: Dict[str, int]
    by_category: Dict[str, int]
    recent_errors: int

class MySQLMigrationRequest(BaseModel):
    mysql_host: Optional[str] = "localhost"
    mysql_port: Optional[int] = 3306
    mysql_user: Optional[str] = "root"
    mysql_password: Optional[str] = ""
    mysql_db: Optional[str] = "securegrc"

class MySQLMigrationResponse(BaseModel):
    success: bool
    message: str
    transferred_tables: Dict[str, int]
    details: List[str]
