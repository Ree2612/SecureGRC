from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import OrganizationResponse, OrganizationUpdate, OrganizationCreate
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/me", response_model=OrganizationResponse)
def get_my_organization(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.get("", response_model=List[OrganizationResponse])
def get_all_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Organization).all()

@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_org = Organization(
        name=payload.name,
        industry=payload.industry or "Technology & Software",
        size=payload.size or "100-500",
        region=payload.region or "US-East (N. Virginia)",
        plan=payload.plan or "Enterprise",
        primary_framework=payload.primary_framework or "NIST CSF 2.0"
    )
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    
    # Seed baseline controls, risks, assets, and templates for the new company
    from app.seed import seed_organization_records
    seed_organization_records(db, new_org.id)

    # Switch user to the newly created company
    current_user.organization_id = new_org.id
    db.commit()
    
    return new_org

@router.post("/switch/{org_id}", response_model=OrganizationResponse)
def switch_organization(
    org_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    current_user.organization_id = org.id
    db.commit()
    return org

@router.patch("/me", response_model=OrganizationResponse)
def update_my_organization(
    payload: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)
    
    db.commit()
    db.refresh(org)
    return org
