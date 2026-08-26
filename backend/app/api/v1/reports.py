from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.report import Report
from app.models.user import User
from app.models.activity import Activity
from app.schemas.report import ReportResponse, ReportCreate
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[ReportResponse])
def get_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Report).filter(
        Report.organization_id == current_user.organization_id
    ).order_by(Report.created_at.desc()).all()

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = Report(
        name=payload.name,
        framework=payload.framework or "NIST CSF 2.0",
        type=payload.type or "Executive Summary",
        status="Draft",
        organization_id=current_user.organization_id
    )
    db.add(report)
    
    activity = Activity(
        actor=current_user.name,
        action="Created Report Template",
        target=report.name,
        details=f"Framework: {report.framework}, Type: {report.type}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(report)
    return report

@router.post("/{id}/generate", response_model=ReportResponse)
def generate_report(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(
        Report.id == id,
        Report.organization_id == current_user.organization_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.status = "Generated"
    report.generated_at = datetime.now(timezone.utc)
    report.file_url = f"/reports/{report.name.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    activity = Activity(
        actor=current_user.name,
        action="Generated Compliance Report",
        target=report.name,
        details=f"Status: {report.status}, Framework: {report.framework}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(report)
    return report
