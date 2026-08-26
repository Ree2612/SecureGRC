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

@router.get("/{id}/download")
def download_report(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from fastapi.responses import Response
    from app.models.organization import Organization
    from app.models.risk import Risk
    from app.models.control import Control
    from app.models.gap import Gap
    
    report = db.query(Report).filter(
        Report.id == id,
        Report.organization_id == current_user.organization_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    risks = db.query(Risk).filter(Risk.organization_id == current_user.organization_id).all()
    controls = db.query(Control).filter(Control.organization_id == current_user.organization_id).all()
    gaps = db.query(Gap).filter(Gap.organization_id == current_user.organization_id).all()
    
    # Calculate telemetry
    total_ctrls = len(controls)
    implemented_ctrls = len([c for c in controls if c.implementation_status == "Implemented"])
    coverage_pct = round((implemented_ctrls / total_ctrls) * 100) if total_ctrls > 0 else 0
    open_risks = len([r for r in risks if r.status != "Mitigated"])
    
    # Generate clean, print-ready HTML/PDF report
    report_date = datetime.now().strftime("%B %d, %Y")
    filename = f"{report.name.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.html"
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{report.name} — SecureGRC Audit Report</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; background: #FFF; line-height: 1.5; padding: 40px; margin: 0 auto; max-width: 900px; }}
        .header {{ border-bottom: 2px solid #0284C7; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }}
        .header h1 {{ margin: 0; font-size: 24px; color: #0369A1; }}
        .header p {{ margin: 5px 0 0 0; color: #64748B; font-size: 13px; }}
        .meta-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }}
        .meta-card {{ background: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; }}
        .meta-label {{ font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 600; margin-bottom: 5px; }}
        .meta-value {{ font-size: 18px; font-weight: bold; color: #0F172A; }}
        h2 {{ font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-top: 35px; color: #1E293B; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }}
        th {{ background: #F1F5F9; text-align: left; padding: 10px; border: 1px solid #CBD5E1; color: #475569; }}
        td {{ padding: 10px; border: 1px solid #E2E8F0; }}
        .badge {{ display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 600; border-radius: 4px; }}
        .badge-critical {{ background: #FEE2E2; color: #991B1B; }}
        .badge-high {{ background: #FFEDD5; color: #9A3412; }}
        .badge-medium {{ background: #FEF3C7; color: #92400E; }}
        .badge-low {{ background: #D1FAE5; color: #065F46; }}
        .badge-pass {{ background: #DCFCE7; color: #166534; }}
        .footer {{ margin-top: 50px; padding-top: 20px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; display: flex; justify-content: space-between; }}
        @media print {{ body {{ padding: 20px; }} .no-print {{ display: none; }} }}
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background: #0284C7; color: #FFF; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
            Print / Save as PDF
        </button>
    </div>

    <div class="header">
        <div>
            <h1>{report.name}</h1>
            <p>Framework Baseline: {report.framework} • Target Entity: {org.name if org else 'Enterprise'}</p>
        </div>
        <div style="text-align: right;">
            <p><strong>Generated:</strong> {report_date}</p>
            <p><strong>Auditor:</strong> {current_user.name} ({current_user.role})</p>
        </div>
    </div>

    <div class="meta-grid">
        <div class="meta-card">
            <div class="meta-label">Control Coverage</div>
            <div class="meta-value">{coverage_pct}%</div>
        </div>
        <div class="meta-card">
            <div class="meta-label">Assessed Controls</div>
            <div class="meta-value">{total_ctrls}</div>
        </div>
        <div class="meta-card">
            <div class="meta-label">Active Risks</div>
            <div class="meta-value">{open_risks}</div>
        </div>
        <div class="meta-card">
            <div class="meta-label">Compliance Gaps</div>
            <div class="meta-value">{len(gaps)}</div>
        </div>
    </div>

    <h2>1. Executive Risk Register Summary</h2>
    <table>
        <thead>
            <tr>
                <th>Risk Title</th>
                <th>Category</th>
                <th>Inherent Risk</th>
                <th>Residual Risk</th>
                <th>Owner</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            {"".join([f"<tr><td><strong>{r.title}</strong></td><td>{r.category}</td><td><span class='badge badge-{r.inherent_risk.lower()}'>{r.inherent_risk}</span></td><td><span class='badge badge-{r.residual_risk.lower()}'>{r.residual_risk}</span></td><td>{r.owner}</td><td>{r.status}</td></tr>" for r in risks])}
        </tbody>
    </table>

    <h2>2. Framework Controls & Assessment Status ({report.framework})</h2>
    <table>
        <thead>
            <tr>
                <th>Code</th>
                <th>Control Name</th>
                <th>Function</th>
                <th>Implementation</th>
                <th>Effectiveness</th>
                <th>Owner</th>
            </tr>
        </thead>
        <tbody>
            {"".join([f"<tr><td><strong>{c.control_code}</strong></td><td>{c.name}</td><td>{c.function}</td><td><span class='badge badge-pass'>{c.implementation_status}</span></td><td>{c.effectiveness}</td><td>{c.owner}</td></tr>" for c in controls])}
        </tbody>
    </table>

    <h2>3. Identified Compliance Gaps & Deficiency Mitigation</h2>
    <table>
        <thead>
            <tr>
                <th>Control</th>
                <th>Deficiency Title</th>
                <th>Business Impact</th>
                <th>Mitigation Recommendation</th>
                <th>Due Date</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            {"".join([f"<tr><td><strong>{g.control_code}</strong></td><td>{g.title}</td><td>{g.business_impact}</td><td>{g.recommendation}</td><td>{g.due_date}</td><td>{g.status}</td></tr>" for g in gaps])}
        </tbody>
    </table>

    <div class="footer">
        <span>SecureGRC Continuous Compliance Platform</span>
        <span>Confidential & Proprietary • Security Audit Artifact</span>
    </div>
</body>
</html>
"""

    # Mark report status as Generated
    report.status = "Generated"
    report.generated_at = datetime.now(timezone.utc)
    db.commit()

    return Response(
        content=html_content,
        media_type="text/html",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

