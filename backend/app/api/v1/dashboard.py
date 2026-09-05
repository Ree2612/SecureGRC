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
import uuid
from app.api.v1.frameworks import STANDARD_CONTROLS, calculate_similarity

def get_controls_for_framework(db: Session, org_id: str, framework: str):
    c_query = db.query(Control).filter(Control.organization_id == org_id)
    if not framework or framework == "All Standards":
        return c_query.all()
        
    direct_controls = c_query.filter(Control.framework == framework).all()
    if direct_controls:
        return direct_controls
        
    # If no direct controls, try to cross-map from other frameworks
    target_standard = STANDARD_CONTROLS.get(framework, [])
    
    if not target_standard:
        return []
        
    virtual_controls = []
    for tc in target_standard:
        virtual_controls.append(Control(
            id=str(uuid.uuid4()),
            control_code=tc["code"],
            name=tc["name"],
            category=tc.get("category", "Mapped Domain"),
            function=tc.get("category", "Mapped Function"),
            implementation_status="Not Implemented",
            effectiveness="Untested",
            framework=framework,
            organization_id=org_id
        ))
        
    return virtual_controls

router = APIRouter()

@router.get("/kpis", response_model=KpisResponse)
def get_kpis(
    framework: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id
    
    # Risks
    risks = db.query(Risk).filter(Risk.organization_id == org_id).all()
    open_risks = [r for r in risks if r.status in ["Open", "In Progress"]]
    
    total_max_risk_score = max(len(risks) * 25, 1) if risks else 1
    current_risk_sum = sum(r.likelihood * r.impact for r in open_risks)
    overall_risk = int((current_risk_sum / total_max_risk_score) * 100) if risks else 0
    
    if overall_risk >= 75:
        overall_risk_label = "Critical Risk"
    elif overall_risk >= 50:
        overall_risk_label = "High Risk"
    elif overall_risk >= 25:
        overall_risk_label = "Moderate Risk"
    else:
        overall_risk_label = "Low Risk"

    # Controls
    controls = get_controls_for_framework(db, org_id, framework)
    g_query = db.query(Gap).filter(Gap.organization_id == org_id)
    
    implemented_controls = [c for c in controls if c.implementation_status == "Implemented"]
    control_coverage = int((len(implemented_controls) / len(controls)) * 100) if controls else 0

    # Gaps
    gaps = g_query.all()
    open_gaps = [g for g in gaps if g.status in ["Open", "In Progress"]]

    # Remediations
    # If a gap belongs to the framework, the remediation for it should count.
    remediations = db.query(RemediationTask).filter(RemediationTask.organization_id == org_id).all()
    if not gaps and not open_risks:
        remediation_progress = 100
    elif remediations:
        remediation_progress = int(sum(r.progress for r in remediations) / len(remediations))
    else:
        remediation_progress = 0

    # Compliance Score
    effective_controls = [c for c in controls if c.effectiveness == "Effective"]
    eff_ratio = (len(effective_controls) / len(controls)) if controls else 0
    gap_ratio = (len(gaps) - len(open_gaps)) / len(gaps) if gaps else 1.0
    
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
    framework: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.seed import seed_organization_records
    org_id = current_user.organization_id
    
    # Auto-seed controls if this tenant is new or unpopulated
    existing_count = db.query(Control).filter(Control.organization_id == org_id).count()
    if existing_count == 0:
        seed_organization_records(db, org_id)

    controls = get_controls_for_framework(db, org_id, framework)
    
    result = []
    
    if framework and "NIST" not in framework:
        categories = list(set([c.category for c in controls if c.category]))
        if not categories:
             categories = ["Identity Management and Access Control", "Data Security", "Incident Response"]
        for cat in categories:
            cat_controls = [c for c in controls if c.category == cat]
            total = len(cat_controls)
            if total == 0:
                continue
            implemented = len([c for c in cat_controls if c.implementation_status == "Implemented"])
            pct = int((implemented / total) * 100) if total > 0 else 0
            result.append({
                "category": cat,
                "total": total,
                "implemented": implemented,
                "percentage": pct
            })
    else:
        functions = list(set([c.function for c in controls if c.function]))
        if not functions:
            functions = ["Govern", "Identify", "Protect", "Detect", "Respond", "Recover"]
            
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
        count = len([r for r in risks if r.inherent_risk == sev])
        result.append({
            "severity": sev,
            "count": count,
            "color": color
        })
    return result

@router.get("/control-implementation", response_model=List[ControlImplementationItem])
def get_control_implementation(
    framework: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id
    controls = get_controls_for_framework(db, org_id, framework)
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
