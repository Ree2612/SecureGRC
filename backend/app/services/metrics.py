import math
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, case

# Import models (adjust import paths according to your project structure)
from app.models.risk import Risk
from app.models.control import Control
from app.models.gap import Gap
from app.models.remediation import RemediationTask


def calc_overall_risk(session: Session, org_id: int) -> Dict[str, Any]:
    """Calculate overall risk score as a weighted average of (likelihood * impact).
    Returns a dict with 'score' (0‑100) and a human‑readable 'label'.
    """
    total = session.query(
        func.sum(Risk.likelihood * Risk.impact).label('total_score'),
        func.count(Risk.id).label('count')
    ).filter(Risk.organization_id == org_id).one()
    if total.count == 0:
        return {"score": 0, "label": "No Risks"}
    max_possible = total.count * 25  # 5 (max likelihood) * 5 (max impact)
    percent = (total.total_score / max_possible) * 100 if max_possible else 0
    if percent >= 75:
        label = "Critical"
    elif percent >= 50:
        label = "High"
    elif percent >= 25:
        label = "Medium"
    else:
        label = "Low"
    return {"score": round(percent, 2), "label": label}


def calc_risk_distribution(session: Session, org_id: int) -> Dict[str, int]:
    """Return counts of risks per severity bucket.
    Keys: 'critical', 'high', 'medium', 'low'.
    """
    subq = session.query(
        (Risk.likelihood * Risk.impact).label('risk_score')
    ).filter(Risk.organization_id == org_id).subquery()
    counts = session.query(
        func.sum(case([(subq.c.risk_score >= 20, 1)], else_=0)).label('critical'),
        func.sum(case([(subq.c.risk_score >= 12, 1)], else_=0)).label('high'),
        func.sum(case([(subq.c.risk_score >= 6, 1)], else_=0)).label('medium'),
        func.sum(case([(subq.c.risk_score < 6, 1)], else_=0)).label('low'),
    ).one()
    critical = int(counts.critical or 0)
    high = int(counts.high or 0) - critical
    medium = int(counts.medium or 0) - (critical + high)
    low = int(counts.low or 0) - (critical + high + medium)
    return {"critical": critical, "high": high, "medium": medium, "low": low}


def calc_control_coverage(session: Session, org_id: int) -> Dict[str, Any]:
    """Percentage of controls marked as implemented.
    Returns 'percentage', 'implemented', and 'total'.
    """
    total = session.query(func.count(Control.id)).filter(Control.organization_id == org_id).scalar()
    if not total:
        return {"percentage": 0, "implemented": 0, "total": 0}
    implemented = session.query(func.count(Control.id)).filter(
        Control.organization_id == org_id,
        Control.is_implemented == True
    ).scalar()
    return {
        "percentage": round((implemented / total) * 100, 2),
        "implemented": implemented,
        "total": total,
    }


def calc_gap_stats(session: Session, org_id: int) -> Dict[str, Any]:
    """Open gaps and severity breakdown.
    Returns 'open', 'high', 'medium', 'low', 'total'.
    """
    total = session.query(func.count(Gap.id)).filter(Gap.organization_id == org_id).scalar()
    open_gaps = session.query(func.count(Gap.id)).filter(
        Gap.organization_id == org_id,
        Gap.status == 'open'
    ).scalar()
    severity_counts = session.query(
        Gap.severity,
        func.count(Gap.id)
    ).filter(
        Gap.organization_id == org_id,
        Gap.status == 'open'
    ).group_by(Gap.severity).all()
    severity = {"high": 0, "medium": 0, "low": 0}
    for sev, cnt in severity_counts:
        severity[sev] = cnt
    return {
        "open": open_gaps,
        "high": severity.get('high', 0),
        "medium": severity.get('medium', 0),
        "low": severity.get('low', 0),
        "total": total,
    }


def calc_remediation_progress(session: Session, org_id: int) -> Dict[str, Any]:
    """Percentage of remediation tasks completed.
    Returns 'percentage', 'completed', 'total'.
    """
    total = session.query(func.count(RemediationTask.id)).filter(RemediationTask.organization_id == org_id).scalar()
    if not total:
        return {"percentage": 0, "completed": 0, "total": 0}
    completed = session.query(func.count(RemediationTask.id)).filter(
        RemediationTask.organization_id == org_id,
        RemediationTask.status == 'completed'
    ).scalar()
    return {
        "percentage": round((completed / total) * 100, 2),
        "completed": completed,
        "total": total,
    }


def calc_compliance_score(session: Session, org_id: int) -> Dict[str, Any]:
    """Compliance score derived from control coverage.
    Returns the same fields as control coverage for simplicity.
    """
    coverage = calc_control_coverage(session, org_id)
    return {
        "score": coverage["percentage"],
        "percentage": coverage["percentage"],
        "implemented": coverage["implemented"],
        "total": coverage["total"],
    }


def calc_heatmap_matrix(session: Session, org_id: int) -> List[List[int]]:
    """5×5 matrix of risk counts (likelihood rows, impact columns).
    Cell [likelihood‑1][impact‑1] = count.
    """
    matrix = [[0 for _ in range(5)] for _ in range(5)]
    rows = session.query(Risk.likelihood, Risk.impact, func.count(Risk.id)).filter(
        Risk.organization_id == org_id
    ).group_by(Risk.likelihood, Risk.impact).all()
    for likelihood, impact, cnt in rows:
        if 1 <= likelihood <= 5 and 1 <= impact <= 5:
            matrix[likelihood - 1][impact - 1] = cnt
    return matrix
