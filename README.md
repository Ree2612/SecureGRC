# SecureGRC — Enterprise Governance, Risk & Compliance Platform

**SecureGRC** is a modern, enterprise-grade Governance, Risk, and Compliance (GRC) management platform designed for CISOs, GRC Leads, Compliance Managers, and Security Engineers. It centralizes cyber risk management, continuous control assessments, framework cross-walk harmonization, gap mitigation workflows, and audit reporting into a clean, minimalist SaaS interface.

---

## Architecture Overview

SecureGRC is architected into two decoupled tiers communicating strictly over REST APIs:

```
GRC/
├── backend/                                 # FastAPI + SQLAlchemy 2.0 + SQLite Backend
│   ├── app/
│   │   ├── api/                             # REST API Routers
│   │   │   ├── deps.py                      # JWT Bearer Token dependency (get_current_user)
│   │   │   └── v1/                          # Versioned Endpoint Routers
│   │   │       ├── auth.py                  # POST /auth/login, GET /auth/me
│   │   │       ├── organizations.py         # GET /organizations/me, GET /organizations
│   │   │       ├── dashboard.py             # Calculated KPIs, NIST breakdown, risk distributions
│   │   │       ├── assets.py                # Asset inventory CRUD & scope tracking
│   │   │       ├── risks.py                 # Risk register CRUD & quantitative severity scoring
│   │   │       ├── controls.py              # Control assessments & evidence attachment
│   │   │       ├── gaps.py                  # Gap analysis, resolve & auto-remediation triggers
│   │   │       ├── remediation.py           # Remediation tasks & progress tracking
│   │   │       ├── frameworks.py            # Framework cross-walk mappings
│   │   │       ├── reports.py               # Compliance report generation
│   │   │       ├── activities.py            # Immutable audit activity log
│   │   │       ├── notifications.py         # Real-time alert notifications
│   │   │       ├── users.py                 # Enterprise user directory
│   │   │       ├── settings.py              # Tenant and security enforcement settings
│   │   │       └── router.py                # Main consolidated API v1 router
│   │   ├── core/
│   │   │   ├── config.py                    # App settings (Pydantic Settings, JWT, CORS)
│   │   │   ├── database.py                  # SQLAlchemy engine & session factory
│   │   │   └── security.py                  # Passlib (Bcrypt) hashing & Python-Jose JWT tokens
│   │   ├── models/                          # SQLAlchemy ORM Database Models
│   │   │   ├── organization.py, user.py, asset.py, risk.py, control.py, evidence.py,
│   │   │   ├── gap.py, remediation.py, framework.py, report.py, activity.py, notification.py
│   │   ├── schemas/                         # Pydantic Request/Response Validation Schemas
│   │   ├── seed.py                          # Enterprise dataset seeder (NIST CSF 2.0, ISO 27001, CIS)
│   │   └── main.py                          # FastAPI application entry with CORS & lifespan DB init
│   ├── securegrc.db                         # SQLite persistent database
│   ├── test_api.py                          # Automated endpoint integration test suite
│   └── requirements.txt
│
├── frontend/                                # React 18 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                        # ProtectedRoute (session guard)
│   │   │   ├── layout/                      # AppLayout, Sidebar, Topbar
│   │   │   ├── ui/                          # Badge, Button, Input, Card, Table, Modal, Skeleton, EmptyState, ErrorState
│   │   │   ├── dashboard/                   # KpiCard, RiskDistribution, ComplianceCoverage, ActivityFeed
│   │   │   ├── risk/                        # RiskTable, RiskHeatmap (5x5 matrix), RiskModal
│   │   │   └── controls/                    # ControlTable, ControlDetailsModal
│   │   ├── pages/
│   │   │   ├── Login.jsx                    # Minimalist enterprise login screen
│   │   │   ├── Dashboard.jsx                # Executive Overview & Live Telemetry
│   │   │   ├── Risks.jsx                    # Enterprise Risk Register
│   │   │   ├── RiskHeatmapPage.jsx          # Interactive 5x5 Likelihood x Impact Matrix
│   │   │   ├── Controls.jsx                 # Control Assessment & Evidence Vault
│   │   │   ├── FrameworkMapping.jsx         # NIST / ISO 27001 / CIS Cross-Walk
│   │   │   ├── Gaps.jsx                     # Gap Analysis & Mitigation Trigger
│   │   │   ├── Remediation.jsx              # Remediation Action Tracker
│   │   │   ├── Assets.jsx                   # Asset Inventory & Scope
│   │   │   ├── Reports.jsx                  # Board & Audit Report Compiler
│   │   │   └── Settings.jsx                 # Organization & Security Settings
│   │   ├── lib/
│   │   │   ├── AuthContext.jsx              # Real JWT AuthContext with reload persistence
│   │   │   ├── ToastContext.jsx             # Non-intrusive notification toasts
│   │   │   └── utils.js                     # Formatting, styling & color helpers
│   │   ├── services/
│   │   │   └── api.js                       # Centralized API service with global 401 interceptor
│   │   ├── App.jsx                          # Route registry
│   │   ├── index.css                        # Tailwind design tokens & font imports
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── start.bat                                # Windows 1-click launcher
├── start.ps1                                # PowerShell 1-click launcher
└── README.md
```

---

## What Has Been Built

### 1. Backend Service Layer (`backend/`)
- **FastAPI Framework**: High performance asynchronous API engine.
- **JWT Authentication**: Secure Bearer tokens generated via `python-jose` and passwords salted/hashed with `bcrypt` via `passlib`.
- **Database Engine**: SQLAlchemy 2.0 with SQLite database (`securegrc.db`).
- **Comprehensive API Routers**: Full CRUD for Assets, Risks, Controls, Evidence, Gaps, Remediation Tasks, Reports, Framework Mappings, Notifications, and Activities.
- **Dynamic KPI Telemetry Engine**: Computes Overall Risk Score (weighted by likelihood and impact), Control Coverage %, Remediation %, and Compliance Score from database records in real time.
- **Enterprise Seed Dataset**: Pre-populates real-world NIST CSF 2.0 controls across all functions (*Govern, Identify, Protect, Detect, Respond, Recover*), mapped ISO 27001 Annex A clauses, CIS Safeguards, critical cloud/database/identity assets, realistic risks with 1–5 coordinates, open audit gaps, and remediation actions.

### 2. Frontend Application (`frontend/`)
- **Modern Minimalist Cybersecurity Aesthetic**: Clean typography hierarchy (Inter), subtle borders (`#E2E8F0`), restrained semantic badges (Critical: red, High: orange, Medium: amber, Low: green), and zero excessive shadows or flashy AI cards.
- **Unified API Client (`services/api.js`)**: All HTTP calls flow through a single centralized API layer that automatically injects JWT access tokens and globally intercepts `401 Unauthorized` responses to clear invalid sessions and redirect to login.
- **Zero Mock / Base44 Dependencies**: 100% of data displayed in the UI is fetched dynamically from the FastAPI backend.
- **Core Modules & Pages**:
  1. **Login (`/login`)**: Minimalist split screen with quick-fill demo buttons for testing.
  2. **Executive Dashboard (`/dashboard`)**: 6 KPI metric cards, Recharts Risk Distribution donut chart, NIST CSF 2.0 category coverage bars, and live audit activity timeline.
  3. **Risk Register (`/risks`)**: Searchable, filterable table by category, severity, and status. Full modal to register or adjust risk scenarios.
  4. **Risk Heatmap (`/heatmap`)**: Interactive **5×5 Likelihood × Impact Matrix** with color gradients and a live coordinate risk inspector.
  5. **Control Assessment (`/controls`)**: Search and filter controls across frameworks and functions. Control detail drawer for updating implementation status, effectiveness ratings, assessment notes, and attaching compliance evidence artifacts.
  6. **Framework Cross-Walk (`/frameworks`)**: Visual cross-mapping matrix harmonizing NIST CSF 2.0 with ISO/IEC 27001:2022, CIS Controls v8, and SOC 2.
  7. **Gap Analysis (`/gaps`)**: Direct **"Remediate"** (automatically creates linked task in tracker) and **"Resolve"** actions.
  8. **Remediation Tracker (`/remediation`)**: Priority tasks with interactive progress slider and due date tracking.
  9. **Asset Inventory (`/assets`)**: Scope tracking for cloud compute, databases, identity providers, and endpoints with criticality tiers.
  10. **Reports (`/reports`)**: Template creator and real `POST /generate` report compiler.
  11. **Platform Settings (`/settings`)**: Organization legal profile, primary framework alignment, and security policy management.

---

## Quick Start Guide

### Option 1: 1-Click Launch (Recommended for Windows)
Double-click [`start.bat`](file:///c:/Users/Reesa%20Khatwani/OneDrive/Desktop/GRC/start.bat) from Windows File Explorer or execute in terminal:
```cmd
.\start.bat
```
*(PowerShell users can run `.\start.ps1`)*

This script will automatically:
1. Start the FastAPI backend on `http://127.0.0.1:8000`.
2. Start the Vite React frontend on `http://127.0.0.1:5173`.
3. Open your default web browser to the application login screen.

---

### Option 2: Manual Start

#### 1. Start Backend:
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API Base*: `http://127.0.0.1:8000/api/v1`  
*Interactive Swagger Docs*: `http://127.0.0.1:8000/api/v1/docs`

#### 2. Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
*Frontend URL*: `http://127.0.0.1:5173/`

---

## Demo Accounts & Credentials

The database is pre-seeded with realistic enterprise user profiles:

| Account Role | Email | Password | Scope / Permissions |
|---|---|---|---|
| **CISO (Executive)** | `ciso@cybercorp.com` | `SecurePass2026!` | Full executive oversight, risk management, policy approval |
| **Lead Auditor / GRC Lead** | `admin@securegrc.io` | `AdminPass2026!` | Control assessment, gap resolution, remediation tracking |
| **Senior Security Engineer** | `elena.rostova@cybercorp.com` | `SecurePass2026!` | Technical asset management, evidence uploading |
| **Compliance Manager** | `marcus.thorne@cybercorp.com` | `SecurePass2026!` | Vendor risk management, framework mapping |

---

## Running Automated Verification Tests

To verify all backend endpoints against the SQLite database:
```bash
cd backend
python test_api.py
```

To build and validate the frontend production bundle:
```bash
cd frontend
npm run build
```

---

## Technologies Used

- **Backend**: Python 3.14, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn, Passlib (Bcrypt), Python-Jose (JWT), SQLite.
- **Frontend**: React 18, Vite 5, React Router v6, Tailwind CSS v3, Lucide React, Recharts.
