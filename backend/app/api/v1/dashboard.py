from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.risk import Risk
from app.models.control import Control
from app.models.gap import Gap
from app.models.remediation import RemediationTask
from app.schemas.dashboard import (
    KpisResponse,
    NistCoverageItem,
    RiskDistributionItem,
    ControlImplementationItem
)
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/kpis", response_model=KpisResponse)
def get_kpis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id
    
    # Risks
    risks = db.query(Risk).filter(Risk.organization_id == org_id).all()
    open_risks = [r for r in risks if r.status in ["Open", "In Progress"]]
    
    # Calculate Overall Risk Score (weighted based on likelihood and impact of open risks)
    total_max_risk_score = max(len(risks) * 25, 1)
    current_risk_sum = sum(r.likelihood * r.impact for r in open_risks)
    overall_risk = min(100, max(15, int((current_risk_sum / total_max_risk_score) * 100))) if risks else 32
    
    if overall_risk >= 75:
        overall_risk_label = "Critical Risk"
    elif overall_risk >= 50:
        overall_risk_label = "High Risk"
    elif overall_risk >= 25:
        overall_risk_label = "Moderate Risk"
    else:
        overall_risk_label = "Low Risk"

    # Controls
    controls = db.query(Control).filter(Control.organization_id == org_id).all()
    implemented_controls = [c for c in controls if c.implementation_status == "Implemented"]
    control_coverage = int((len(implemented_controls) / len(controls)) * 100) if controls else 0

    # Gaps
    gaps = db.query(Gap).filter(Gap.organization_id == org_id).all()
    open_gaps = [g for g in gaps if g.status in ["Open", "In Progress"]]

    # Remediations
    remediations = db.query(RemediationTask).filter(RemediationTask.organization_id == org_id).all()
    if remediations:
        remediation_progress = int(sum(r.progress for r in remediations) / len(remediations))
    else:
        remediation_progress = 0

    # Compliance Score (weighted average of control coverage + effective controls + resolved gaps)
    effective_controls = [c for c in controls if c.effectiveness == "Effective"]
    eff_ratio = (len(effective_controls) / len(controls)) if controls else 0
    resolved_gaps = [g for g in gaps if g.status == "Resolved"]
    gap_ratio = (len(resolved_gaps) / len(gaps)) if gaps else 1.0
    
    compliance_score = int((0.5 * (control_coverage / 100) + 0.3 * eff_ratio + 0.2 * gap_ratio) * 100)
    compliance_score = min(100, max(0, compliance_score))

    return {
        "overall_risk": overall_risk,
        "overall_risk_label": overall_risk_label,
        "open_risks": len(open_risks),
        "control_coverage": control_coverage,
        "open_gaps": len(open_gaps),
        "remediation_progress": remediation_progress,
        "compliance_score": compliance_score
    }

@router.get("/nist-coverage", response_model=List[NistCoverageItem])
def get_nist_coverage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id
    controls = db.query(Control).filter(Control.organization_id == org_id).all()
    
    functions = ["Govern", "Identify", "Protect", "Detect", "Respond", "Recover"]
    result = []
    
    for fn in functions:
        fn_controls = [c for c in controls if c.function == fn]
        total = len(fn_controls)
        implemented = len([c for c in fn_controls if c.implementation_status == "Implemented"])
        pct = int((implemented / total) * 100) if total > 0 else 0
        result.append({
            "category": fn,
            "total": total,
            "implemented": implemented,
            "percentage": pct
        })
        
    return result

@router.get("/risk-distribution", response_model=List[RiskDistributionItem])
def get_risk_distribution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id
    risks = db.query(Risk).filter(Risk.organization_id == org_id).all()
    
    severities = [
        ("Critical", "#EF4444"),
        ("High", "#F97316"),
        ("Medium", "#F59E0B"),
        ("Low", "#10B981")
    ]
    
    result = []
    for sev, color in severities:
        count = len([r for r in risks if r.inherent_risk == sev or (r.likelihood * r.impact >= 16 and sev == "Critical") or (r.likelihood * r.impact >= 12 and r.likelihood * r.impact < 16 and sev == "High") or (r.likelihood * r.impact >= 6 and r.likelihood * r.impact < 12 and sev == "Medium") or (r.likelihood * r.impact < 6 and sev == "Low")])
        result.append({
            "severity": sev,
            "count": count,
            "color": color
        })
    return result

@router.get("/control-implementation", response_model=List[ControlImplementationItem])
def get_control_implementation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id
    controls = db.query(Control).filter(Control.organization_id == org_id).all()
    total = len(controls) or 1
    
    statuses = ["Implemented", "Partially Implemented", "Not Implemented", "Not Applicable"]
    result = []
    for status in statuses:
        count = len([c for c in controls if c.implementation_status == status])
        result.append({
            "status": status,
            "count": count,
            "percentage": int((count / total) * 100)
        })
    return result
