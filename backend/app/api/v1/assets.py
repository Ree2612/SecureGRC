from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.asset import Asset
from app.models.user import User
from app.models.activity import Activity
from app.schemas.asset import AssetResponse, AssetCreate, AssetUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[AssetResponse])
def get_assets(
    search: Optional[str] = None,
    criticality: Optional[str] = None,
    asset_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Asset).filter(Asset.organization_id == current_user.organization_id)
    if search:
        query = query.filter(Asset.name.ilike(f"%{search}%") | Asset.owner.ilike(f"%{search}%") | Asset.description.ilike(f"%{search}%"))
    if criticality:
        query = query.filter(Asset.criticality == criticality)
    if asset_type:
        query = query.filter(Asset.type == asset_type)
    return query.order_by(Asset.created_at.desc()).all()

@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    payload: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = Asset(
        **payload.model_dump(),
        organization_id=current_user.organization_id
    )
    db.add(asset)
    
    activity = Activity(
        actor=current_user.name,
        action="Registered Asset",
        target=asset.name,
        details=f"Asset type: {asset.type}, Criticality: {asset.criticality}",
        organization_id=current_user.organization_id
    )
    db.add(activity)
    
    db.commit()
    db.refresh(asset)
    return asset

@router.get("/{id}", response_model=AssetResponse)
def get_asset(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == id, Asset.organization_id == current_user.organization_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.patch("/{id}", response_model=AssetResponse)
def update_asset(
    id: str,
    payload: AssetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == id, Asset.organization_id == current_user.organization_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)
        
    db.commit()
    db.refresh(asset)
    return asset

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == id, Asset.organization_id == current_user.organization_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
    return None
