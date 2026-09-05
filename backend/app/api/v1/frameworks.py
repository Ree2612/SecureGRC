from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.framework import Framework, FrameworkMapping
from app.models.user import User
from app.schemas.framework import FrameworkResponse, FrameworkMappingResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[FrameworkResponse])
def get_frameworks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Framework).all()

import uuid
from app.models.control import Control

STANDARD_CONTROLS = {
    "NIST CSF 2.0": [
        {"code": "GV.PO-01", "name": "Organizational Cybersecurity Policy", "desc": "policies documented approved published"},
        {"code": "ID.AM-01", "name": "Physical and Virtual Asset Inventory", "desc": "physical devices virtual cloud instances software inventoried"},
        {"code": "ID.RA-01", "name": "Asset Vulnerability Identification", "desc": "vulnerabilities identified categorized prioritized scanning"},
        {"code": "PR.AC-01", "name": "Identity Credentials & Access Authentication", "desc": "identities credentials managed mfa enforced authentication"},
        {"code": "PR.DS-01", "name": "Data-at-Rest Protection & Encryption", "desc": "data at rest protected cryptography encryption aes"},
        {"code": "DE.CM-01", "name": "Continuous Network & Log Monitoring", "desc": "network host telemetry monitored continuous anomalies"},
        {"code": "RS.MA-01", "name": "Incident Response Plan Execution", "desc": "incident response plan executed triage workflow"},
        {"code": "RC.RP-01", "name": "Disaster Recovery & Backup Restoration", "desc": "recovery processes backups tested resilience"},
    ],
    "ISO/IEC 27001:2022": [
        {"code": "A.5.1", "name": "Policies for information security", "desc": "policies documented approved published"},
        {"code": "A.5.9", "name": "Inventory of information and other associated assets", "desc": "physical devices virtual cloud instances software inventoried"},
        {"code": "A.8.8", "name": "Management of technical vulnerabilities", "desc": "vulnerabilities identified categorized prioritized scanning"},
        {"code": "A.5.15", "name": "Access control", "desc": "identities credentials managed mfa enforced authentication"},
        {"code": "A.8.24", "name": "Use of cryptography", "desc": "data at rest protected cryptography encryption aes"},
        {"code": "A.8.16", "name": "Monitoring activities", "desc": "network host telemetry monitored continuous anomalies"},
        {"code": "A.5.24", "name": "Information security incident management planning and preparation", "desc": "incident response plan executed triage workflow"},
        {"code": "A.8.30", "name": "IT readiness for business continuity", "desc": "recovery processes backups tested resilience"},
    ],
    "CIS Controls v8": [
        {"code": "CIS 1.1", "name": "Establish and Maintain Detailed Enterprise Asset Inventory", "desc": "physical devices virtual cloud instances software inventoried"},
        {"code": "CIS 3.1", "name": "Establish and Maintain a Data Management Process", "desc": "data at rest protected cryptography encryption aes"},
        {"code": "CIS 5.1", "name": "Establish and Maintain an Account Management Process", "desc": "identities credentials managed mfa enforced authentication"},
        {"code": "CIS 7.1", "name": "Establish and Maintain a Vulnerability Management Process", "desc": "vulnerabilities identified categorized prioritized scanning"},
        {"code": "CIS 13.1", "name": "Maintain an Incident Response Process", "desc": "incident response plan executed triage workflow"},
        {"code": "CIS 17.1", "name": "Establish and Maintain a Security Training Program", "desc": "policies documented approved published"},
    ],
    "SOC 2 Trust Services Criteria": [
        {"code": "CC1.1", "name": "COSO Principle 1: Integrity and Ethical Values", "desc": "policies documented approved published"},
        {"code": "CC3.2", "name": "COSO Principle 7: Logical Access Security", "desc": "identities credentials managed mfa enforced authentication"},
        {"code": "CC6.1", "name": "Logical Access", "desc": "identities credentials managed mfa enforced authentication"},
        {"code": "CC6.6", "name": "Logical Access - External Threats", "desc": "vulnerabilities identified categorized prioritized scanning network host telemetry monitored continuous anomalies"},
        {"code": "CC7.3", "name": "Incident Detection and Response", "desc": "incident response plan executed triage workflow"},
        {"code": "CC9.1", "name": "Business Continuity and Disaster Recovery", "desc": "recovery processes backups tested resilience"},
    ]
}

def calculate_similarity(text1, text2):
    set1 = set(text1.lower().split())
    set2 = set(text2.lower().split())
    intersection = set1.intersection(set2)
    return len(intersection) / float(len(set1.union(set2)) or 1)

@router.get("/mappings", response_model=List[FrameworkMappingResponse])
def get_framework_mappings(
    source_framework: Optional[str] = None,
    target_framework: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sources = [source_framework] if source_framework else list(STANDARD_CONTROLS.keys())
    targets = [target_framework] if target_framework else list(STANDARD_CONTROLS.keys())
    
    mappings = []
    
    for s_fw in sources:
        for t_fw in targets:
            if s_fw == t_fw:
                continue

            # Try to get actual controls for the organization
            org_controls = db.query(Control).filter(
                Control.organization_id == current_user.organization_id,
                Control.framework == s_fw
            ).all()

            target_standard = STANDARD_CONTROLS.get(t_fw, [])
            source_standard = STANDARD_CONTROLS.get(s_fw, [])
            
            source_list = []
            if org_controls:
                for c in org_controls:
                    source_list.append({
                        "code": c.control_code,
                        "name": c.name,
                        "desc": c.requirement,
                        "is_org_control": True
                    })
            else:
                for c in source_standard:
                    source_list.append({
                        "code": c["code"],
                        "name": c["name"],
                        "desc": c["desc"],
                        "is_org_control": False
                    })
                    
            for c in source_list:
                best_match = None
                highest_score = 0
                
                c_text = f"{c['name']} {c['desc']}"
                
                for tc in target_standard:
                    t_text = f"{tc['name']} {tc['desc']}"
                    score = calculate_similarity(c_text, t_text)
                    if score > highest_score:
                        highest_score = score
                        best_match = tc
                        
                if best_match and highest_score > 0.05:
                    # Generate explainable text
                    shared_terms = set(c_text.lower().split()).intersection(set(f"{best_match['name']} {best_match['desc']}".lower().split()))
                    shared_terms = {word for word in shared_terms if len(word) > 3}
                    explanation = f"Matched based on shared context: {', '.join(list(shared_terms)[:3])}."
                    
                    mapping_type = "Direct / Full" if highest_score > 0.15 else "Partial"
                    
                    mappings.append({
                        "id": str(uuid.uuid4()),
                        "source_framework": s_fw,
                        "source_control_code": c['code'],
                        "source_control_name": c['name'],
                        "target_framework": t_fw,
                        "target_control_code": best_match["code"],
                        "target_control_name": best_match["name"],
                        "mapping_strength": mapping_type,
                        "mapping_type": mapping_type,
                        "description": explanation
                    })

    return mappings
