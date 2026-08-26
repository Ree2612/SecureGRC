from typing import List, Dict, Any
from pydantic import BaseModel

class KpisResponse(BaseModel):
    overall_risk: int              # e.g., 68 (out of 100 or risk index)
    overall_risk_label: str        # e.g., "Medium Risk"
    open_risks: int                # count of open/in progress risks
    control_coverage: int          # percentage e.g., 78
    open_gaps: int                 # count of open/in progress gaps
    remediation_progress: int      # percentage e.g., 64
    compliance_score: int          # percentage e.g., 82

class NistCoverageItem(BaseModel):
    category: str                  # e.g., Identify, Protect, Detect, Respond, Recover, Govern
    total: int
    implemented: int
    percentage: int

class RiskDistributionItem(BaseModel):
    severity: str                  # Critical, High, Medium, Low
    count: int
    color: str

class ControlImplementationItem(BaseModel):
    status: str                    # Implemented, Partially Implemented, Not Implemented
    count: int
    percentage: int
