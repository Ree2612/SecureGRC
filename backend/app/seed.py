import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.organization import Organization
from app.models.user import User
from app.models.asset import Asset
from app.models.risk import Risk
from app.models.control import Control
from app.models.evidence import Evidence
from app.models.gap import Gap
from app.models.remediation import RemediationTask
from app.models.framework import Framework, FrameworkMapping
from app.models.report import Report
from app.models.activity import Activity
from app.models.notification import Notification

def seed_database(db: Session = None):
    close_db = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_db = True

    try:
        # Check if already seeded
        existing_org = db.query(Organization).first()
        if existing_org:
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding database with realistic enterprise GRC data...")

        # 1. Organization
        org = Organization(
            id=str(uuid.uuid4()),
            name="Apex CyberShield Technologies",
            industry="Financial Technology & Cloud Security",
            size="2,500 - 5,000 employees",
            region="North America (US-East)",
            plan="Enterprise Compliance Suite",
            primary_framework="NIST CSF 2.0"
        )
        db.add(org)
        db.flush()

        # 2. Users
        users = [
            User(
                id=str(uuid.uuid4()),
                name="Sarah Jenkins",
                email="ciso@cybercorp.com",
                hashed_password=get_password_hash("SecurePass2026!"),
                role="Chief Information Security Officer (CISO)",
                organization_id=org.id
            ),
            User(
                id=str(uuid.uuid4()),
                name="Alexander Vance",
                email="admin@securegrc.io",
                hashed_password=get_password_hash("AdminPass2026!"),
                role="GRC Lead & Lead Auditor",
                organization_id=org.id
            ),
            User(
                id=str(uuid.uuid4()),
                name="Elena Rostova",
                email="elena.rostova@cybercorp.com",
                hashed_password=get_password_hash("SecurePass2026!"),
                role="Senior Security Engineer",
                organization_id=org.id
            ),
            User(
                id=str(uuid.uuid4()),
                name="Marcus Thorne",
                email="marcus.thorne@cybercorp.com",
                hashed_password=get_password_hash("SecurePass2026!"),
                role="Compliance Manager",
                organization_id=org.id
            )
        ]
        db.add_all(users)
        db.flush()

        # 3. Assets
        assets = [
            Asset(
                name="AWS Production Kubernetes Cluster (EKS)",
                type="Cloud Infrastructure",
                criticality="Critical",
                owner="DevOps & Platform Engineering",
                description="Core container orchestration runtime hosting customer-facing SaaS microservices in us-east-1 and us-west-2.",
                status="Active",
                organization_id=org.id
            ),
            Asset(
                name="PostgreSQL Primary Customer DB (Aurora Multi-AZ)",
                type="Database",
                criticality="Critical",
                owner="Data Engineering Team",
                description="Contains encrypted PII, customer tenancy records, and transaction logs.",
                status="Active",
                organization_id=org.id
            ),
            Asset(
                name="Okta Identity Cloud & Directory Service",
                type="Identity",
                criticality="Critical",
                owner="Enterprise IAM Team",
                description="Central Single Sign-On (SSO) and adaptive MFA identity provider for internal staff and service principals.",
                status="Active",
                organization_id=org.id
            ),
            Asset(
                name="Cloudflare Enterprise Edge & WAF",
                type="Cloud Infrastructure",
                criticality="High",
                owner="Network Security Operations",
                description="DDoS mitigation, TLS termination, and Web Application Firewall rules for public domains.",
                status="Active",
                organization_id=org.id
            ),
            Asset(
                name="GitHub Enterprise Cloud Code Repositories",
                type="SaaS",
                criticality="High",
                owner="AppSec & Engineering Leadership",
                description="Source code management for core proprietary algorithms, infrastructure-as-code, and CI/CD pipelines.",
                status="Active",
                organization_id=org.id
            ),
            Asset(
                name="CrowdStrike Falcon Sensor Fleet",
                type="Endpoint",
                criticality="High",
                owner="SecOps SOC Team",
                description="Next-Gen Antivirus (NGAV) and EDR telemetry across 2,800 macOS and Windows corporate workstations.",
                status="Active",
                organization_id=org.id
            ),
            Asset(
                name="Snowflake Analytics Data Warehouse",
                type="Database",
                criticality="Medium",
                owner="Business Intelligence Team",
                description="Anonymized business metrics, GRC compliance reporting datamart, and event analytics.",
                status="Active",
                organization_id=org.id
            ),
            Asset(
                name="HashiCorp Vault Secrets Cluster",
                type="Compute",
                criticality="Critical",
                owner="Platform Security Team",
                description="Dynamic database credentials, PKI certificate authority, and encryption key lifecycle management.",
                status="Active",
                organization_id=org.id
            ),
            Asset(
                name="Stripe Billing & Payment Gateway Integration",
                type="SaaS",
                criticality="High",
                owner="Finance & Billing Systems",
                description="PCI-DSS compliant payment processing tokenization interface.",
                status="Active",
                organization_id=org.id
            ),
            Asset(
                name="Corporate VPN & Zero Trust Network Access (ZTNA)",
                type="Cloud Infrastructure",
                criticality="High",
                owner="IT Operations",
                description="Remote access tunnels for engineering on-call and infrastructure administration.",
                status="Active",
                organization_id=org.id
            )
        ]
        db.add_all(assets)
        db.flush()

        # 4. Controls (NIST CSF 2.0 & ISO 27001 representative set)
        controls_data = [
            # GOVERN / IDENTIFY
            {
                "control_code": "GV.PO-01",
                "name": "Organizational Cybersecurity Policy",
                "requirement": "Organizational cybersecurity policies are documented, approved by executive leadership, published, and communicated to all personnel.",
                "framework": "NIST CSF 2.0",
                "function": "Govern",
                "category": "Policy & Governance",
                "implementation_status": "Implemented",
                "effectiveness": "Effective",
                "owner": "Alexander Vance",
                "notes": "Reviewed annually. Latest CISO sign-off completed January 2026."
            },
            {
                "control_code": "ID.AM-01",
                "name": "Physical and Virtual Asset Inventory",
                "requirement": "Physical devices, virtual cloud instances, and software platforms within the organization are inventoried and tracked dynamically.",
                "framework": "NIST CSF 2.0",
                "function": "Identify",
                "category": "Asset Management",
                "implementation_status": "Implemented",
                "effectiveness": "Effective",
                "owner": "Elena Rostova",
                "notes": "Automated AWS Config + Wiz asset discovery running every 6 hours."
            },
            {
                "control_code": "ID.RA-01",
                "name": "Asset Vulnerability Identification",
                "requirement": "Asset vulnerabilities are identified, categorized, prioritized, and recorded continuously using automated scanning.",
                "framework": "NIST CSF 2.0",
                "function": "Identify",
                "category": "Risk Assessment",
                "implementation_status": "Implemented",
                "effectiveness": "Effective",
                "owner": "Elena Rostova",
                "notes": "Tenable.io external & internal vulnerability scanner integrated with Jira."
            },
            {
                "control_code": "ID.SC-01",
                "name": "Cyber Supply Chain Risk Management",
                "requirement": "Cyber supply chain risk management processes are established and third-party vendors are formally evaluated.",
                "framework": "NIST CSF 2.0",
                "function": "Identify",
                "category": "Supply Chain",
                "implementation_status": "Partially Implemented",
                "effectiveness": "Partially Effective",
                "owner": "Marcus Thorne",
                "notes": "Tier 1 vendors evaluated; Tier 2 and SaaS sub-processors review pending."
            },
            # PROTECT
            {
                "control_code": "PR.AC-01",
                "name": "Identity Credentials & Access Authentication",
                "requirement": "Identities and credentials for authorized devices and users are managed, with Multi-Factor Authentication (MFA) enforced everywhere.",
                "framework": "NIST CSF 2.0",
                "function": "Protect",
                "category": "Identity & Access",
                "implementation_status": "Implemented",
                "effectiveness": "Effective",
                "owner": "Alexander Vance",
                "notes": "Okta FastPass with FIDO2 hardware tokens enforced for 100% of staff."
            },
            {
                "control_code": "PR.AC-04",
                "name": "Least Privilege Access Enforcement",
                "requirement": "Access permissions and authorizations are managed incorporating the principles of least privilege and separation of duties.",
                "framework": "NIST CSF 2.0",
                "function": "Protect",
                "category": "Identity & Access",
                "implementation_status": "Partially Implemented",
                "effectiveness": "Partially Effective",
                "owner": "Alexander Vance",
                "notes": "Quarterly user access reviews (UAR) conducted; AWS IAM role consolidation ongoing."
            },
            {
                "control_code": "PR.DS-01",
                "name": "Data-at-Rest Protection & Encryption",
                "requirement": "Data-at-rest is protected using industry standard cryptographic suites (AES-256) across all storage volumes and databases.",
                "framework": "NIST CSF 2.0",
                "function": "Protect",
                "category": "Data Security",
                "implementation_status": "Implemented",
                "effectiveness": "Effective",
                "owner": "Elena Rostova",
                "notes": "AWS KMS customer managed keys (CMK) configured with 90-day automatic key rotation."
            },
            {
                "control_code": "PR.DS-02",
                "name": "Data-in-Transit Cryptographic Protection",
                "requirement": "Data-in-transit across public and untrusted networks is protected using TLS 1.3 or equivalent strong encryption protocols.",
                "framework": "NIST CSF 2.0",
                "function": "Protect",
                "category": "Data Security",
                "implementation_status": "Implemented",
                "effectiveness": "Effective",
                "owner": "Elena Rostova",
                "notes": "HSTS enforced with max-age=31536000 across all ingress domains."
            },
            {
                "control_code": "PR.PS-01",
                "name": "Configuration Management & Baseline Hardening",
                "requirement": "Hardware and software configurations are established and maintained against CIS benchmarks.",
                "framework": "NIST CSF 2.0",
                "function": "Protect",
                "category": "Platform Security",
                "implementation_status": "Implemented",
                "effectiveness": "Effective",
                "owner": "Elena Rostova",
                "notes": "CIS Level 2 benchmarks applied via Terraform and Ansible gold images."
            },
            # DETECT
            {
                "control_code": "DE.CM-01",
                "name": "Continuous Network & Log Monitoring",
                "requirement": "The network and host telemetry are monitored continuously to identify cybersecurity anomalies and suspicious behaviors.",
                "framework": "NIST CSF 2.0",
                "function": "Detect",
                "category": "Continuous Monitoring",
                "implementation_status": "Implemented",
                "effectiveness": "Effective",
                "owner": "Sarah Jenkins",
                "notes": "Datadog Cloud SIEM ingesting VPC flow logs, CloudTrail, and EDR streams."
            },
            {
                "control_code": "DE.AE-02",
                "name": "Security Event Correlation & Alerting",
                "requirement": "Detected cybersecurity events are analyzed and correlated with threat intelligence to determine impact and severity.",
                "framework": "NIST CSF 2.0",
                "function": "Detect",
                "category": "Adverse Event Analysis",
                "implementation_status": "Implemented",
                "effectiveness": "Effective",
                "owner": "Sarah Jenkins",
                "notes": "24/7 Managed Detection and Response (MDR) SLA under 15 minutes."
            },
            # RESPOND
            {
                "control_code": "RS.MA-01",
                "name": "Incident Response Plan Execution",
                "requirement": "Incident response plan is executed during or after an incident according to established triage workflows and communication trees.",
                "framework": "NIST CSF 2.0",
                "function": "Respond",
                "category": "Incident Management",
                "implementation_status": "Implemented",
                "effectiveness": "Effective",
                "owner": "Sarah Jenkins",
                "notes": "Tabletop simulation completed Q4 2025; runbooks updated for ransomware."
            },
            {
                "control_code": "RS.CO-02",
                "name": "Stakeholder & Regulatory Breach Notification",
                "requirement": "Incidents are reported to stakeholders, law enforcement, and regulatory bodies within mandated timeframes (e.g. 72h).",
                "framework": "NIST CSF 2.0",
                "function": "Respond",
                "category": "Incident Communication",
                "implementation_status": "Implemented",
                "effectiveness": "Effective",
                "owner": "Marcus Thorne",
                "notes": "Legal counsel and insurance escalation matrix documented."
            },
            # RECOVER
            {
                "control_code": "RC.RP-01",
                "name": "Disaster Recovery & Backup Restoration",
                "requirement": "Recovery processes and automated backups are maintained and tested regularly to ensure operational resilience.",
                "framework": "NIST CSF 2.0",
                "function": "Recover",
                "category": "Recovery Planning",
                "implementation_status": "Partially Implemented",
                "effectiveness": "Partially Effective",
                "owner": "Alexander Vance",
                "notes": "DB backups tested daily; full cold-site disaster recovery drill scheduled."
            },
            {
                "control_code": "RC.CO-03",
                "name": "Post-Incident Lessons Learned & Remediation",
                "requirement": "Recovery activities incorporate lessons learned from prior cybersecurity events and continuous improvement reviews.",
                "framework": "NIST CSF 2.0",
                "function": "Recover",
                "category": "Continuous Improvement",
                "implementation_status": "Implemented",
                "effectiveness": "Effective",
                "owner": "Marcus Thorne",
                "notes": "Post-mortem templates required for all Severity 1 & 2 operational incidents."
            }
        ]

        created_controls = []
        for cdata in controls_data:
            ctrl = Control(
                control_code=cdata["control_code"],
                name=cdata["name"],
                requirement=cdata["requirement"],
                framework=cdata["framework"],
                function=cdata["function"],
                category=cdata["category"],
                implementation_status=cdata["implementation_status"],
                effectiveness=cdata["effectiveness"],
                owner=cdata["owner"],
                notes=cdata["notes"],
                organization_id=org.id,
                last_assessed=datetime.now(timezone.utc) - timedelta(days=5)
            )
            db.add(ctrl)
            created_controls.append(ctrl)
        db.flush()

        # 5. Evidence Attachments
        evidence_items = [
            Evidence(
                control_id=created_controls[0].id,
                title="Annual Executive Approved Cybersecurity Policy Charter",
                file_name="Apex_Cyber_Policy_v4.2_Signed.pdf",
                file_type="PDF",
                file_url="/evidence/Apex_Cyber_Policy_v4.2_Signed.pdf",
                uploaded_by="Alexander Vance"
            ),
            Evidence(
                control_id=created_controls[1].id,
                title="Wiz & AWS Config Automated Inventory Audit Export",
                file_name="Cloud_Asset_Inventory_Q1_2026.json",
                file_type="JSON",
                file_url="/evidence/Cloud_Asset_Inventory_Q1_2026.json",
                uploaded_by="Elena Rostova"
            ),
            Evidence(
                control_id=created_controls[4].id,
                title="Okta MFA Policy Enforcement Telemetry & Audit Logs",
                file_name="Okta_MFA_Enforcement_Report.pdf",
                file_type="PDF",
                file_url="/evidence/Okta_MFA_Enforcement_Report.pdf",
                uploaded_by="Alexander Vance"
            ),
            Evidence(
                control_id=created_controls[6].id,
                title="KMS Envelope Encryption Key Rotation Config Dump",
                file_name="AWS_KMS_Key_Rotation_Config.pdf",
                file_type="PDF",
                file_url="/evidence/AWS_KMS_Key_Rotation_Config.pdf",
                uploaded_by="Elena Rostova"
            ),
            Evidence(
                control_id=created_controls[9].id,
                title="Datadog Cloud SIEM 30-Day Alerting & Ingestion Log Proof",
                file_name="SIEM_Monitoring_Validation_2026.pdf",
                file_type="PDF",
                file_url="/evidence/SIEM_Monitoring_Validation_2026.pdf",
                uploaded_by="Sarah Jenkins"
            )
        ]
        db.add_all(evidence_items)
        db.flush()

        # 6. Risks
        risks = [
            Risk(
                title="Third-Party SaaS Vendor Data Exposure",
                description="Sub-processors and third-party SaaS integrations may experience unauthorized access or credential leak impacting customer data.",
                category="Third-Party",
                likelihood=4,
                impact=4,
                inherent_risk="Critical",
                residual_risk="Medium",
                status="In Progress",
                owner="Marcus Thorne",
                threat_source="Compromised Vendor Credential / Supply Chain Attack",
                existing_controls="Vendor risk reviews, DPA contractual safeguards, API token restriction.",
                organization_id=org.id
            ),
            Risk(
                title="Ransomware & Lateral Network Movement",
                description="Phishing payload executed on staff workstation leading to privileged credential harvesting and attempts to encrypt file servers.",
                category="Infrastructure",
                likelihood=3,
                impact=5,
                inherent_risk="Critical",
                residual_risk="Low",
                status="In Progress",
                owner="Sarah Jenkins",
                threat_source="Organized Cybercrime Group",
                existing_controls="CrowdStrike EDR isolation, Immutable S3 backups, Network microsegmentation.",
                organization_id=org.id
            ),
            Risk(
                title="Cloud Infrastructure Misconfiguration & S3 Exposure",
                description="Inadvertent public bucket permission or permissive security group opening compute nodes to the internet.",
                category="Infrastructure",
                likelihood=3,
                impact=4,
                inherent_risk="High",
                residual_risk="Low",
                status="Mitigated",
                owner="Elena Rostova",
                threat_source="Human Error / CI/CD Deployment Drift",
                existing_controls="Terraform OPA policy checks, AWS GuardDuty alerts, Wiz CSPM.",
                organization_id=org.id
            ),
            Risk(
                title="Privileged IAM Credential Sprawl & Stale Access",
                description="Contractor or ex-employee IAM tokens retained without timely de-provisioning, leading to unauthorized resource inspection.",
                category="Identity",
                likelihood=3,
                impact=4,
                inherent_risk="High",
                residual_risk="Medium",
                status="Open",
                owner="Alexander Vance",
                threat_source="Insider Threat / Orphaned Account",
                existing_controls="Automated HRIS SCIM deprovisioning, 90-day inactivity revocation.",
                organization_id=org.id
            ),
            Risk(
                title="API Rate-Limiting Bypass & Data Scraping",
                description="Unauthenticated endpoint brute forcing causing denial of service or systematic scraping of public customer catalogs.",
                category="Application Security",
                likelihood=4,
                impact=2,
                inherent_risk="Medium",
                residual_risk="Low",
                status="Mitigated",
                owner="Elena Rostova",
                threat_source="Automated Botnets",
                existing_controls="Cloudflare Advanced Rate Limiting, Bot Management heuristics.",
                organization_id=org.id
            ),
            Risk(
                title="Unpatched Zero-Day Vulnerability in Web Runtime",
                description="High severity zero-day vulnerability in open-source framework libraries before vendor patch availability.",
                category="Application Security",
                likelihood=3,
                impact=4,
                inherent_risk="High",
                residual_risk="Medium",
                status="Open",
                owner="Sarah Jenkins",
                threat_source="Nation-State / Exploit Brokers",
                existing_controls="Snyk SCA scanning, WAF virtual patching rules.",
                organization_id=org.id
            ),
            Risk(
                title="Cross-Border Data Transfer Regulatory Non-Compliance",
                description="Transfer of EU citizen telemetry without Standard Contractual Clauses (SCC) causing GDPR scrutiny.",
                category="Compliance",
                likelihood=2,
                impact=4,
                inherent_risk="Medium",
                residual_risk="Low",
                status="Mitigated",
                owner="Marcus Thorne",
                threat_source="Regulatory Audits",
                existing_controls="Data residency pinning in Frankfurt region, SCC agreements.",
                organization_id=org.id
            ),
            Risk(
                title="Disaster Recovery Cold Site RTO Exceeded",
                description="Regional AWS outage requiring failover exceeds the 4-hour Recovery Time Objective (RTO).",
                category="Operational",
                likelihood=2,
                impact=4,
                inherent_risk="Medium",
                residual_risk="Medium",
                status="Open",
                owner="Elena Rostova",
                threat_source="Cloud Provider Availability Zone Failure",
                existing_controls="Multi-region Aurora replication, Route53 health checks.",
                organization_id=org.id
            )
        ]
        db.add_all(risks)
        db.flush()

        # 7. Gaps
        gaps = [
            Gap(
                title="Incomplete Tier-2 Vendor SOC 2 Attestation Reviews",
                framework="NIST CSF 2.0",
                control_id=created_controls[3].id,
                control_code="ID.SC-01",
                business_impact="Unassessed sub-processor security postures could expose customer data to unmonitored breach vectors.",
                recommendation="Deploy automated vendor risk management portal to intake and review SOC 2 Type II reports from all active SaaS vendors.",
                owner="Marcus Thorne",
                due_date="2026-09-15",
                status="In Progress",
                organization_id=org.id
            ),
            Gap(
                title="Unautomated Quarterly IAM Access Recertification",
                framework="NIST CSF 2.0",
                control_id=created_controls[5].id,
                control_code="PR.AC-04",
                business_impact="Privilege creep and prolonged access for transferred engineers violates SOC 2 CC6.3.",
                recommendation="Integrate identity governance workflow into Slack for automated manager sign-off on role permissions.",
                owner="Alexander Vance",
                due_date="2026-10-01",
                status="Open",
                organization_id=org.id
            ),
            Gap(
                title="Secondary Region Disaster Recovery Live Failover Drill Missing",
                framework="NIST CSF 2.0",
                control_id=created_controls[13].id,
                control_code="RC.RP-01",
                business_impact="Lack of proven live failover may cause unexpected downtime during multi-AZ or region cloud incidents.",
                recommendation="Execute scheduled tabletop and non-production live failover test to AWS us-west-2.",
                owner="Elena Rostova",
                due_date="2026-11-15",
                status="In Progress",
                organization_id=org.id
            ),
            Gap(
                title="Database Encryption Key Lifecycle Policy Documentation",
                framework="ISO/IEC 27001",
                control_id=created_controls[6].id,
                control_code="PR.DS-01",
                business_impact="Auditors require formally approved cryptographic key lifecycle Standard Operating Procedure.",
                recommendation="Document key generation, rotation, revocation, and escrow procedures in Confluence and sign off.",
                owner="Elena Rostova",
                due_date="2026-08-30",
                status="Resolved",
                organization_id=org.id
            ),
            Gap(
                title="Container Image Vulnerability Build-Time Blocking Enforcement",
                framework="CIS Controls v8",
                control_id=created_controls[2].id,
                control_code="ID.RA-01",
                business_impact="Vulnerable container images could be deployed to staging and production clusters.",
                recommendation="Configure GitHub Actions CI/CD to block PR merges if Critical or High CVEs are detected by Trivy.",
                owner="Elena Rostova",
                due_date="2026-09-30",
                status="In Progress",
                organization_id=org.id
            )
        ]
        db.add_all(gaps)
        db.flush()

        # 8. Remediation Tasks
        remediations = [
            RemediationTask(
                task_name="Implement Vendor SOC 2 Intake Workflow in GRC Portal",
                gap_id=gaps[0].id,
                priority="High",
                owner="Marcus Thorne",
                progress=65,
                status="In Progress",
                due_date="2026-09-15",
                organization_id=org.id
            ),
            RemediationTask(
                task_name="Automate Okta & AWS IAM Quarterly User Access Reviews",
                gap_id=gaps[1].id,
                priority="High",
                owner="Alexander Vance",
                progress=30,
                status="In Progress",
                due_date="2026-10-01",
                organization_id=org.id
            ),
            RemediationTask(
                task_name="Conduct Semi-Annual us-west-2 DR Failover Simulation",
                gap_id=gaps[2].id,
                priority="Medium",
                owner="Elena Rostova",
                progress=45,
                status="In Progress",
                due_date="2026-11-15",
                organization_id=org.id
            ),
            RemediationTask(
                task_name="Publish Approved Cryptographic Key Management SOP",
                gap_id=gaps[3].id,
                priority="Low",
                owner="Elena Rostova",
                progress=100,
                status="Completed",
                due_date="2026-08-30",
                organization_id=org.id
            ),
            RemediationTask(
                task_name="Deploy Trivy Container Security Admission Controller Gate",
                gap_id=gaps[4].id,
                priority="High",
                owner="Elena Rostova",
                progress=80,
                status="In Progress",
                due_date="2026-09-30",
                organization_id=org.id
            ),
            RemediationTask(
                task_name="Configure Honeytokens and Canary Credentials in CI Pipelines",
                gap_id=None,
                priority="Medium",
                owner="Sarah Jenkins",
                progress=90,
                status="In Progress",
                due_date="2026-10-10",
                organization_id=org.id
            )
        ]
        db.add_all(remediations)
        db.flush()

        # 9. Frameworks & Mappings
        frameworks = [
            Framework(
                name="NIST Cybersecurity Framework 2.0",
                code="NIST-CSF-2.0",
                version="2.0",
                description="National Institute of Standards and Technology Framework for Improving Critical Infrastructure Cybersecurity.",
                total_controls="106 Controls"
            ),
            Framework(
                name="ISO/IEC 27001:2022 Information Security Management",
                code="ISO-27001-2022",
                version="2022",
                description="International standard on how to manage information security risks with Annex A control sets.",
                total_controls="93 Controls"
            ),
            Framework(
                name="CIS Critical Security Controls v8",
                code="CIS-CONTROLS-v8",
                version="8.0",
                description="Prioritized set of actions that collectively form a defense-in-depth set of best practices.",
                total_controls="153 Safeguards"
            ),
            Framework(
                name="SOC 2 Trust Services Criteria (AICPA)",
                code="SOC-2-TSC",
                version="2024",
                description="Security, Availability, Processing Integrity, Confidentiality, and Privacy criteria.",
                total_controls="64 Criteria"
            )
        ]
        db.add_all(frameworks)
        db.flush()

        mappings = [
            FrameworkMapping(
                source_framework="NIST CSF 2.0",
                source_control_code="PR.AC-01",
                source_control_name="Identity Credentials & Access Authentication",
                target_framework="ISO/IEC 27001:2022",
                target_control_code="A.5.15 & A.5.17",
                target_control_name="Access control & Authentication information",
                mapping_strength="Direct",
                description="Both require MFA enforcement, unique credential issuance, and lifecycle tracking."
            ),
            FrameworkMapping(
                source_framework="NIST CSF 2.0",
                source_control_code="PR.DS-01",
                source_control_name="Data-at-Rest Protection & Encryption",
                target_framework="ISO/IEC 27001:2022",
                target_control_code="A.8.24",
                target_control_name="Use of cryptography",
                mapping_strength="Direct",
                description="Requires AES-256 baseline encryption and managed key rotation."
            ),
            FrameworkMapping(
                source_framework="NIST CSF 2.0",
                source_control_code="DE.CM-01",
                source_control_name="Continuous Network & Log Monitoring",
                target_framework="ISO/IEC 27001:2022",
                target_control_code="A.8.16",
                target_control_name="Monitoring activities",
                mapping_strength="Direct",
                description="Centralized SIEM ingestion and event alerting."
            ),
            FrameworkMapping(
                source_framework="NIST CSF 2.0",
                source_control_code="ID.AM-01",
                source_control_name="Physical and Virtual Asset Inventory",
                target_framework="CIS Controls v8",
                target_control_code="CIS 1.1 & CIS 2.1",
                target_control_name="Inventory of Enterprise & Software Assets",
                mapping_strength="Direct",
                description="Continuous automated discovery of hardware and cloud assets."
            ),
            FrameworkMapping(
                source_framework="NIST CSF 2.0",
                source_control_code="RS.MA-01",
                source_control_name="Incident Response Plan Execution",
                target_framework="SOC 2 Trust Services Criteria",
                target_control_code="CC7.3 & CC7.4",
                target_control_name="Incident Detection & Containment",
                mapping_strength="Direct",
                description="Formal response protocols and triage escalation procedures."
            )
        ]
        db.add_all(mappings)
        db.flush()

        # 10. Reports
        reports = [
            Report(
                name="Q1 2026 Board Cybersecurity & Risk Executive Summary",
                framework="NIST CSF 2.0",
                type="Executive Summary",
                status="Generated",
                file_url="/reports/board_cyber_summary_q1_2026.pdf",
                generated_at=datetime.now(timezone.utc) - timedelta(days=2),
                organization_id=org.id
            ),
            Report(
                name="Annual SOC 2 Type II Readiness Assessment",
                framework="SOC 2 Trust Services Criteria",
                type="SOC 2 Readiness",
                status="Generated",
                file_url="/reports/soc2_type2_readiness_audit.pdf",
                generated_at=datetime.now(timezone.utc) - timedelta(days=7),
                organization_id=org.id
            ),
            Report(
                name="ISO/IEC 27001:2022 Stage 1 Gap Analysis Report",
                framework="ISO/IEC 27001:2022",
                type="Gap Analysis",
                status="Draft",
                file_url="",
                generated_at=None,
                organization_id=org.id
            ),
            Report(
                name="NIST CSF 2.0 Category-by-Category Technical Audit",
                framework="NIST CSF 2.0",
                type="Technical Audit",
                status="Generated",
                file_url="/reports/nist_csf_technical_audit.pdf",
                generated_at=datetime.now(timezone.utc) - timedelta(days=1),
                organization_id=org.id
            )
        ]
        db.add_all(reports)
        db.flush()

        # 11. Activities
        activities = [
            Activity(
                actor="Sarah Jenkins",
                action="Generated Compliance Report",
                target="Q1 2026 Board Cybersecurity & Risk Executive Summary",
                details="PDF report compiled with 82% compliance posture score.",
                timestamp=datetime.now(timezone.utc) - timedelta(minutes=45),
                organization_id=org.id
            ),
            Activity(
                actor="Alexander Vance",
                action="Assessed Control",
                target="PR.AC-01: Identity Credentials & Access Authentication",
                details="Marked as Implemented and Effective with Okta FastPass evidence.",
                timestamp=datetime.now(timezone.utc) - timedelta(hours=3),
                organization_id=org.id
            ),
            Activity(
                actor="Elena Rostova",
                action="Updated Remediation",
                target="Deploy Trivy Container Security Admission Controller Gate",
                details="Progress updated to 80%. Test cluster passed gate verification.",
                timestamp=datetime.now(timezone.utc) - timedelta(hours=5),
                organization_id=org.id
            ),
            Activity(
                actor="Marcus Thorne",
                action="Resolved Compliance Gap",
                target="PR.DS-01: Database Encryption Key Lifecycle Policy",
                details="Formal Key Management SOP reviewed and signed by CISO.",
                timestamp=datetime.now(timezone.utc) - timedelta(hours=8),
                organization_id=org.id
            ),
            Activity(
                actor="Sarah Jenkins",
                action="Updated Risk",
                target="Third-Party SaaS Vendor Data Exposure",
                details="Adjusted residual risk to Medium following Tier-1 vendor review.",
                timestamp=datetime.now(timezone.utc) - timedelta(days=1),
                organization_id=org.id
            ),
            Activity(
                actor="Alexander Vance",
                action="Uploaded Evidence",
                target="PR.AC-01: Okta MFA Policy Enforcement Telemetry",
                details="Attached PDF verification artifact.",
                timestamp=datetime.now(timezone.utc) - timedelta(days=1, hours=4),
                organization_id=org.id
            )
        ]
        db.add_all(activities)
        db.flush()

        # 12. Notifications
        notifications = [
            Notification(
                title="Q1 Compliance Audit Due in 14 Days",
                message="Finalize evidence collection for PR.AC-04 and RC.RP-01 prior to external auditor review.",
                type="warning",
                read=False,
                created_at=datetime.now(timezone.utc) - timedelta(hours=2),
                organization_id=org.id
            ),
            Notification(
                title="New Critical Threat Advisory: OpenSSH Vulnerability",
                message="SecOps team is verifying all EC2 host patch levels against CVE-2024-6387.",
                type="critical",
                read=False,
                created_at=datetime.now(timezone.utc) - timedelta(hours=6),
                organization_id=org.id
            ),
            Notification(
                title="Report Ready: Q1 Executive Summary",
                message="The Q1 2026 Board Cybersecurity & Risk Executive Summary has been compiled successfully.",
                type="success",
                read=False,
                created_at=datetime.now(timezone.utc) - timedelta(hours=12),
                organization_id=org.id
            ),
            Notification(
                title="Quarterly Access Review Reminder",
                message="Department leads must certify employee access lists before month-end.",
                type="info",
                read=True,
                created_at=datetime.now(timezone.utc) - timedelta(days=1),
                organization_id=org.id
            )
        ]
        db.add_all(notifications)
        db.commit()
        print("Database seeded successfully with enterprise GRC dataset!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        if close_db:
            db.close()

def seed_organization_records(db: Session, target_org_id: str):
    """
    Populates full baseline controls, risks, assets, gaps, and remediation tasks
    for a newly created or unseeded organization tenant.
    """
    # 1. Find a reference organization to clone controls and standard records from
    ref_org = db.query(Organization).filter(Organization.id != target_org_id).first()
    if not ref_org:
        return

    # Clone Controls
    ref_controls = db.query(Control).filter(Control.organization_id == ref_org.id).all()
    new_controls = []
    for c in ref_controls:
        new_controls.append(Control(
            control_code=c.control_code,
            name=c.name,
            requirement=c.requirement,
            framework=c.framework,
            function=c.function,
            category=c.category,
            implementation_status=c.implementation_status,
            effectiveness=c.effectiveness,
            owner=c.owner,
            notes=c.notes,
            organization_id=target_org_id
        ))
    db.add_all(new_controls)

    # Clone Risks
    ref_risks = db.query(Risk).filter(Risk.organization_id == ref_org.id).all()
    new_risks = []
    for r in ref_risks:
        new_risks.append(Risk(
            title=r.title,
            description=r.description,
            category=r.category,
            likelihood=r.likelihood,
            impact=r.impact,
            inherent_risk=r.inherent_risk,
            residual_risk=r.residual_risk,
            status=r.status,
            owner=r.owner,
            threat_source=r.threat_source,
            existing_controls=r.existing_controls,
            organization_id=target_org_id
        ))
    db.add_all(new_risks)

    # Clone Assets
    ref_assets = db.query(Asset).filter(Asset.organization_id == ref_org.id).all()
    new_assets = []
    for a in ref_assets:
        new_assets.append(Asset(
            name=a.name,
            type=a.type,
            criticality=a.criticality,
            owner=a.owner,
            description=a.description,
            status=a.status,
            organization_id=target_org_id
        ))
    db.add_all(new_assets)

    # Clone Gaps
    ref_gaps = db.query(Gap).filter(Gap.organization_id == ref_org.id).all()
    new_gaps = []
    for g in ref_gaps:
        new_gaps.append(Gap(
            title=g.title,
            framework=g.framework,
            control_code=g.control_code,
            business_impact=g.business_impact,
            recommendation=g.recommendation,
            owner=g.owner,
            due_date=g.due_date,
            status=g.status,
            organization_id=target_org_id
        ))
    db.add_all(new_gaps)

    # Clone Reports
    ref_reports = db.query(Report).filter(Report.organization_id == ref_org.id).all()
    new_reports = []
    for rep in ref_reports:
        new_reports.append(Report(
            name=rep.name,
            framework=rep.framework,
            type=rep.type,
            status=rep.status,
            organization_id=target_org_id
        ))
    db.add_all(new_reports)

    db.commit()

if __name__ == "__main__":
    seed_database()

