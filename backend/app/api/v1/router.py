from fastapi import APIRouter
from app.api.v1 import (
    auth,
    organizations,
    dashboard,
    assets,
    risks,
    controls,
    gaps,
    remediation,
    frameworks,
    reports,
    activities,
    notifications,
    users,
    settings
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(assets.router, prefix="/assets", tags=["Assets"])
api_router.include_router(risks.router, prefix="/risks", tags=["Risks"])
api_router.include_router(controls.router, prefix="/controls", tags=["Controls"])
api_router.include_router(gaps.router, prefix="/gaps", tags=["Gaps"])
api_router.include_router(remediation.router, prefix="/remediation", tags=["Remediation"])
api_router.include_router(frameworks.router, prefix="/frameworks", tags=["Frameworks"])
api_router.include_router(frameworks.router, prefix="/framework-mappings", tags=["Framework Mappings"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(activities.router, prefix="/activities", tags=["Activities"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
