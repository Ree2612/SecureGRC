from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.risk import Risk
from app.models.user import User
from app.models.activity import Activity
from app.schemas.risk import RiskResponse, RiskCreate, RiskUpdate
from app.api.deps import get_current_user

router = APIRouter()

def calculate_severity(likelihood: int, impact: int) -> str:
    score = likelihood * impact
    if score >= 16:
        return "Critical"
    elif score >= 10:
        return "High"
    elif score >= 5:
        return "Medium"
    else:
        return "Low"

@router.get("", response_model=List[RiskResponse])
def get_risks(
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Risk).filter(Risk.organization_id == current_user.organization_id)
    if search:
        query = query.filter(Risk.title.ilike(f"%{search}%") | Risk.owner.ilike(f"%{search}%") | Risk.description.ilike(f"%{search}%"))
    if category:
        query = query.filter(Risk.category == category)
    if status:
        query = query.filter(Risk.status == status)
    if severity:
        query = query.filter(Risk.inherent_risk == severity)
    return query.order_by(Risk.created_at.desc()).all()

@router.post("", response_model=RiskResponse, status_code=status.HTTP_201_CREATED)
def create_risk(
    payload: RiskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data = payload.model_dump()
    if not data.get("inherent_risk"):
        data["inherent_risk"] = calculate_severity(data.get("likelihood", 3), data.get("impact", 3))
    
    risk = Risk(
        **data,
        organization_id=current_user.organization_id
    )
    db.add(risk)
    
    activity = Activity(
        actor=current_user.name,
        action="Created Risk",
        target=risk.title,
        details=f"Inherent Risk: {risk.inherent_risk}, Category: {risk.category}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(risk)
    return risk

@router.get("/{id}", response_model=RiskResponse)
def get_risk(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    risk = db.query(Risk).filter(Risk.id == id, Risk.organization_id == current_user.organization_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    return risk

@router.patch("/{id}", response_model=RiskResponse)
def update_risk(
    id: str,
    payload: RiskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    risk = db.query(Risk).filter(Risk.id == id, Risk.organization_id == current_user.organization_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(risk, field, value)
    
    if "likelihood" in update_data or "impact" in update_data:
        risk.inherent_risk = calculate_severity(risk.likelihood, risk.impact)
        
    activity = Activity(
        actor=current_user.name,
        action="Updated Risk",
        target=risk.title,
        details=f"Status: {risk.status}, Inherent: {risk.inherent_risk}, Residual: {risk.residual_risk}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(risk)
    return risk

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_risk(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    risk = db.query(Risk).filter(Risk.id == id, Risk.organization_id == current_user.organization_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    db.delete(risk)
    db.commit()
    return None
