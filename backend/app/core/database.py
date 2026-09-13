from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# SQLite configuration
connect_args = {"check_same_thread": False} if "sqlite" in settings.SQLALCHEMY_DATABASE_URI else {}

engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def safe_migrate_schema():
    """Safely adds missing columns to SQLite database without dropping existing tables."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    with engine.begin() as conn:
        if "gaps" in tables:
            gap_cols = [c["name"] for c in inspector.get_columns("gaps")]
            if "risk_id" not in gap_cols:
                conn.execute(text("ALTER TABLE gaps ADD COLUMN risk_id VARCHAR(36)"))
            if "asset_id" not in gap_cols:
                conn.execute(text("ALTER TABLE gaps ADD COLUMN asset_id VARCHAR(36)"))

        if "remediation_tasks" in tables:
            rem_cols = [c["name"] for c in inspector.get_columns("remediation_tasks")]
            if "risk_id" not in rem_cols:
                conn.execute(text("ALTER TABLE remediation_tasks ADD COLUMN risk_id VARCHAR(36)"))
            if "asset_id" not in rem_cols:
                conn.execute(text("ALTER TABLE remediation_tasks ADD COLUMN asset_id VARCHAR(36)"))
            if "remediation_type" not in rem_cols:
                conn.execute(text("ALTER TABLE remediation_tasks ADD COLUMN remediation_type VARCHAR(50) DEFAULT 'Technical'"))
            if "completion_criteria" not in rem_cols:
                conn.execute(text("ALTER TABLE remediation_tasks ADD COLUMN completion_criteria TEXT DEFAULT ''"))
            if "rejection_reason" not in rem_cols:
                conn.execute(text("ALTER TABLE remediation_tasks ADD COLUMN rejection_reason TEXT DEFAULT ''"))
            if "notes" not in rem_cols:
                conn.execute(text("ALTER TABLE remediation_tasks ADD COLUMN notes TEXT DEFAULT ''"))
            conn.execute(text("UPDATE remediation_tasks SET status='Verified' WHERE status='Completed'"))

        if "evidence" in tables:
            ev_cols = [c["name"] for c in inspector.get_columns("evidence")]
            if "remediation_id" not in ev_cols:
                conn.execute(text("ALTER TABLE evidence ADD COLUMN remediation_id VARCHAR(36)"))

        if "gaps" in tables and "remediation_tasks" in tables:
            reconciliations = [
                ("Implement Vendor SOC 2 Intake Workflow in GRC Portal", "Incomplete Tier-2 Vendor SOC 2 Attestation Reviews"),
                ("Automate Okta & AWS IAM Quarterly User Access Reviews", "Unautomated Quarterly IAM Access Recertification"),
                ("Implement AWS IAM Identity Center Just-In-Time Access Elevation", "Privileged Cloud Role Time-Bound Elevation Policy Deficit"),
                ("Conduct Semi-Annual us-west-2 DR Failover Simulation", "Secondary Region Disaster Recovery Live Failover Drill Missing"),
                ("Publish Approved Cryptographic Key Management SOP", "Database Encryption Key Lifecycle Policy Documentation"),
                ("Deploy Trivy Container Security Admission Controller Gate", "Container Image Vulnerability Build-Time Blocking Enforcement"),
            ]
            for task_name, gap_title in reconciliations:
                conn.execute(text("""
                    UPDATE remediation_tasks 
                    SET gap_id = (SELECT id FROM gaps WHERE title = :gap_title LIMIT 1)
                    WHERE task_name = :task_name
                """), {"gap_title": gap_title, "task_name": task_name})

            conn.execute(text("""
                UPDATE remediation_tasks
                SET gap_id = NULL
                WHERE task_name = 'Configure Honeytokens and Canary Credentials in CI Pipelines'
            """))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

