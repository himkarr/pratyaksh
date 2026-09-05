# MPLADS Monitoring & Decision Support System — Backend Documentation
**Smart India Hackathon 2026 | Problem Statement SIH26102**  
**Ministry of Statistics and Programme Implementation (MoSPI) — Data Informatics & Innovation Division (DIID)**

---

## 1. System Overview

The **MPLADS Monitoring & Decision Support System** is a production-grade, explainable, hybrid decision-support backend developed for SIH 2026 Problem Statement **SIH26102**.

Under the Members of Parliament Local Area Development Scheme (MPLADS), Members of Parliament recommend developmental works to create durable community assets. Given the nationwide volume and complexity of fund allocations, this platform leverages **Machine Learning (ML), transparent rule-based compliance engines, and cryptographic audit chaining** to detect:
1. **Statutory Delays**: Predictive and retrospective breaches of the mandatory 1-year completion deadline.
2. **Expenditure Anomalies & Cost Overruns**: Utilization exceeding sanctioned amounts, spend velocity spikes following dormancy.
3. **Disbursement Fraud**: Payments released before ground verification of milestones, or sanctions exceeding ₹50 Lakhs lacking tender references.
4. **Statutory Non-Compliance**: Tracking the statutory **15% Scheduled Caste (SC)** and **7.5% Scheduled Tribe (ST)** annual allocation quotas, and blocking non-permissible works under MPLADS Guidelines Clause 5.1.
5. **Tamper-Evident Auditability**: Every administrative, financial, and inspection action is written to an immutable SHA-256 hash-chained audit ledger.

> **Framing Principle**: The platform is an **explainable decision-support tool for authorized human auditors**—it is *not* an automated accusation engine. Every anomaly flag carries a plain-language justification, severity level, confidence score, and origin tag (`rule`, `isolation_forest`, `deadline_forecaster`).

---

## 2. Technology Stack & Infrastructure

- **Framework**: FastAPI (Python 3.11) with asynchronous request handling.
- **ORM & Database**: SQLAlchemy 2.0 with PostgreSQL connection pooling.
- **Cloud Database**: Supabase PostgreSQL with custom ENUMs and constraints.
- **Cloud Object Storage**: Supabase Storage REST client targeting the `evidence-files` bucket for geo-tagged media.
- **Authentication**: OAuth2 Password Bearer with signed 24-hour JSON Web Tokens (JWT) using `python-jose` and password hashing via `passlib[bcrypt]`.
- **Integrity Layer**: Cryptographic SHA-256 blockchain-style chaining from a fixed `GENESIS_HASH`.
- **Data Validation**: Pydantic v2 schemas for request and response serialization.

---

## 3. Database Architecture (29 Tables)

All models are defined in [`app/models/schema_models.py`](app/models/schema_models.py) and exported via [`app/models/__init__.py`](app/models/__init__.py):

### A. Access Control & Scoping
1. **`roles`**: System roles with UUID primary keys and JSONB permission flags.
2. **`users`**: System users across 8 roles with Aadhaar verification status and scope attributes (`district`, `state`, `constituency_id`).
3. **`mp_constituency_mapping`**: Parliamentary constituencies mapped to MPs, tenure dates, and boundary GeoJSON.
4. **`state_nodal_mapping`**: Jurisdictions mapping State Nodal Authority officers to states.
5. **`implementing_agencies`**: Registry of public and private contractors with masked bank accounts (`bank_account_masked`).
6. **`agency_users`**: Associates contractor staff (Vendor role) with their registered agency.

### B. Project Lifecycle & History
7. **`recommendations`**: Formal MP recommendations with budget, recommendation letter URL, and DA review status (`Pending`, `Accepted`, `Rejected`, `Withdrawn`).
8. **`projects`**: Central work records linked to `recommendation_id`, with sanctioned/released/utilized funds, 365-day statutory deadline, GPS coordinates, tender references, and risk scores.
9. **`project_status_history`**: Immutable status transition log capturing the reason for every halt or delay (e.g., "monsoon", "land dispute", "court stay") and expected resume dates.

### C. Financials & GeM Benchmarking
10. **`project_milestones`**: Stage-wise physical milestones (percentage targets, verification flags, inspecting officer sign-off).
11. **`project_financials`**: Multi-installment financial disbursements tracking released vs. utilized amounts and ledger balances.
12. **`payment_transactions`**: Disbursed payments with payment mode (NEFT/RTGS/Cheque/UPI), UTR numbers, milestone links, and automated **`anomaly_flag`** detection.
13. **`project_procurement_records`**: Itemized vendor invoices benchmarked against Government e-Marketplace (GeM) prices.
14. **`fund_transfers`**: Multi-project fund reallocations with request and approval workflow states.

### D. Ground Evidence & Field Inspection
15. **`evidence`**: Multimedia proof (photos/videos/invoices) with mandatory GPS latitude/longitude, server timestamps, device info, and duplicate image detection.
16. **`evidence_moderation_queue`**: Review queue for flagged citizen and vendor uploads.
17. **`verification_requests`**: Formal site inspection visits assigned by District Authorities to Field Officers with priority rankings.
18. **`verification_evidence_link`**: Links inspected evidence directly to completed verification visits.
19. **`supporting_documents_link`**: Polymorphic attachment table linking evidence to any business entity.

### E. AI, Rule Engine & Risk Analytics
20. **`rule_engine_logs`**: Audit trail of every rule evaluation (`Pass`/`Fail`, rule type, rule name, detailed explanation, timestamp).
21. **`risk_scores`**: Composite 0–100 risk ratings, structured JSON anomaly reason arrays, priority levels (`High`/`Medium`/`Low`), and model version stamps.
22. **`ai_analysis_results`**: Computer vision and machine learning inferences (image tampering, duplicate photos, progress estimations).
23. **`model_versions`**: Tracking registry for deployed AI models, version tags, and AUC/precision metrics.

### F. Governance & Scheme Compliance
24. **`sc_st_allocation_tracker`**: Enforces statutory allocation minimums: ≥15% for Scheduled Caste (SC) areas and ≥7.5% for Scheduled Tribe (ST) areas.
25. **`prohibited_categories`**: Master list of non-permissible works under MPLADS Guidelines Clause 5.1.
26. **`citizen_trust_scores`**: Dynamic credibility rating for citizen feedback based on geotag consistency and verified report ratios.
27. **`system_config`**: Dynamic system thresholds (e.g. ₹50L tender limit, 2% overrun tolerance, 25% GeM price variance, 365-day deadline).
28. **`notifications`**: User alert dispatch across in-app, SMS, and email channels.
29. **`audit_logs`**: Append-only cryptographic ledger tracking actor IDs, entity IDs, old/new states, IP addresses, and SHA-256 block hashes.

---

## 4. Role-Based Access Control (RBAC) & Data Scoping

Enforced by [`app/core/rbac.py`](app/core/rbac.py) through FastAPI dependencies:

| Role | Scope of Visibility & Permitted Actions | Query Filter Applied |
| :--- | :--- | :--- |
| **MPUser** | Recommendations and projects within own parliamentary constituency; SC/ST quota progress. | `Project.mp_id == user.user_id` |
| **DistrictAuthority (DA)** | Complete administrative jurisdiction over all projects within their district; can sanction projects, disburse funds, and assign inspections. | `Project.district == user.district` |
| **StateNodalAuthority (SNA)**| State-level oversight across all districts; view district rollups, flagged projects, and approve inter-project fund transfers. | `Project.state == user.state` |
| **MinistryUser** | National oversight across all states; policy compliance, audit trail inspection, and cross-state analytics. | Unrestricted (Full national pass-through) |
| **Admin** | System administration; configuration tuning, agency verification, and AI model registration. | Superuser (Bypasses all scoping checks) |
| **FieldOfficer** | Ground inspections; only projects specifically assigned to them for field verification. | Subquery on `VerificationRequest.assigned_officer_id` |
| **Vendor** | Allotted works; only projects and procurement line items awarded to their implementing agency. | Subquery on `AgencyUser.agency_id` |
| **Citizen** | Public transparency; read-only access to safe community project details. | Blocked from internal API; routed to sanitized `/projects/public` |

### Sensitive Field Sanitization
- `password_hash` & `device_token`: Stripped from all user serialization outputs.
- `bank_account_masked`: Exposes only the last 4 digits (e.g., `SBI-XXXX-XXXX-4912`).
- Citizen Endpoints (`/projects/public`): Financial figures (`sanctioned_amount`, `released_amount`), internal risk scores, and vendor details are strictly redacted.

---

## 5. Core Operational Workflows

```
                                  WORKFLOW PIPELINE
                                  
   [MPUser]                       [DistrictAuthority]                  [Vendor & FieldOfficer]
       │                                   │                                      │
 1. Submits Recommendation                 │                                      │
    (Category checked vs                   │                                      │
     ProhibitedCategory Clause 5.1)        │                                      │
       │                                   │                                      │
       └──────────────────────────────────►│                                      │
                                    2. Reviews Recommendation                     │
                                       • Rejects -> Audit + Notification          │
                                       • Accepts -> Project Created!              │
                                         - 365-day statutory deadline set         │
                                         - ProjectStatusHistory logged            │
                                         - Auto-triggers AI/Rule Engine           │
                                           (AnalysisService)                      │
                                                   │                              │
                                                   ├─────────────────────────────►│
                                                   │                      3. Execution & Evidence
                                                   │                         • Uploads Geotagged Media
                                                   │                         • S3 / Supabase Storage
                                                   │                         • Submits Field Visit GPS
                                                   ◄──────────────────────────────┘
                                    4. Financials & Verification
                                       • Creates Milestones & Signs Off
                                       • Disburses Payments:
                                         - Milestone NOT verified?
                                           -> ANOMALY FLAG RAISED!
                                         - Milestone verified?
                                           -> Clean disbursement
                                       • Checks GeM price deviation (>25%)
                                                   │
                                                   ▼
                                    5. Continuous Integrity
                                       • Every event hashed into SHA-256 Chain
                                       • AuditLog link: this_hash = sha256(payload + prev_hash)
```

### Workflow 1: Recommendation to Sanction
1. **Submission**: MP creates a recommendation via `POST /recommendations`. The endpoint executes a statutory pre-check against `prohibited_categories`. If the category matches a prohibited activity (e.g., places of worship, commercial buildings, memorials), it is rejected with HTTP 400.
2. **Review**: District Authority queries `GET /recommendations` and decides via `POST /recommendations/{id}/action`.
3. **Atomic Creation**: Accepting a recommendation is the **exclusive route** to sanctioning a project:
   - A row in `projects` is created with mandatory `recommendation_id`.
   - The statutory 1-year completion deadline (`start_date + 365 days`) is automatically calculated.
   - An initial entry in `project_status_history` is recorded.
   - Baseline risk scoring is triggered through `analyze_project()`.
   - An in-app notification is sent to the MP.

### Workflow 2: Automated AI & Rule Engine Analysis
The analysis pipeline in [`app/services/analysis_service.py`](app/services/analysis_service.py) evaluates transparent scheme rules:
- **Rule 1: Statutory 1-Year Completion Deadline (Retrospective)**: Flags projects exceeding 365 days from sanction that remain incomplete (`progress < 100%`).
- **Rule 2: Predictive Deadline Breach Risk (Early Warning)**: Flags projects where >50% of the 365-day timeline has elapsed but physical progress is below 40%.
- **Rule 3: Fund Utilization Overrun**: Flags projects where `utilized_amount` exceeds `sanctioned_amount` by more than the configured tolerance (2%).
- **Rule 4: Mandatory Tender Reference Check**: Works sanctioned for ≥₹50 Lakhs lacking a tender reference number are flagged.
- **Rule 5: Payment Before Milestone Verification**: Intercepts disbursements made before ground inspection sign-off.
- **Rule 6: Low Progress With High Utilization Discrepancy**: Identifies projects with ≥75% budget spent but <25% physical progress.

**Outcome**: Failed rules are written to `rule_engine_logs`, composite risk scores (0–100) are persisted to `risk_scores`, and the project's `is_flagged` status is updated. The frontend flags contract (`GET /flags`) dynamically synthesizes these logs.

### Workflow 3: Financials, Milestone Payments & GeM Procurement
- **Milestone Management**: DAs define milestone percentages via `POST /financials/projects/{id}/milestones`. Once physical work is inspected, DAs sign off via `POST /financials/milestones/{id}/verify`.
- **Payment Interception**: When a payment is recorded via `POST /financials/projects/{id}/payments`:
  - If `linked_milestone_id` is supplied and `milestone.verified == False`, the system automatically marks `anomaly_flag = True`, emits an alert warning in the response, and records an immediate failure log in `rule_engine_logs`.
  - Legitimate payments against verified milestones pass cleanly.
- **GeM Price Verification**: `POST /financials/projects/{id}/procurement` tracks itemized purchases, benchmarking unit prices against standard GeM thresholds.
- **Fund Transfers**: Cross-project fund movements (`POST /financials/fund-transfers`) must be requested by DAs and formally approved by State Nodal Authorities before balances are reallocated.

### Workflow 4: Field Verification & Cloud Evidence
- **Upload**: Vendors or citizens upload progress photos via `POST /evidence/upload` with mandatory latitude and longitude coordinates. The file is uploaded to the Supabase Storage bucket `evidence-files`.
- **Duplicate Detection**: The backend checks for spatial and temporal proximity against previous submissions for the same project, setting `duplicate_flag = True` if potential duplicate media is detected.
- **Inspection Workflow**: DAs assign field visits via `POST /verifications`. Field officers mark arrival via `POST /verifications/{id}/start` and submit site GPS coordinates, inspection reports, and checklist sign-offs via `POST /verifications/{id}/complete`.

### Workflow 5: Statutory SC/ST Compliance Engine
Under MPLADS Guidelines Clause 2.4, an MP must allocate at least **15%** of their annual fund entitlement to Scheduled Caste (SC) areas and **7.5%** to Scheduled Tribe (ST) areas:
- `GET /compliance/sc-st/{mp_id}` aggregates all recommendations for the current financial year.
- Computes SC and ST percentages and evaluates compliance (`Compliant` vs `NonCompliant`).
- If non-compliant, reports the exact deficit amount required to reach the statutory target.
- State Nodal and Ministry officers can audit compliance across all MPs using `GET /compliance/sc-st-summary`.

### Workflow 6: Cryptographic SHA-256 Audit Trail
The system employs a tamper-evident hash chain in [`app/services/audit_service.py`](app/services/audit_service.py):
- Each audit log block computes:
  $$\text{this\_hash} = \text{SHA256}(\text{JSON}(\text{log\_id}, \text{user\_id}, \text{action}, \text{entity}, \text{payload}, \text{timestamp}, \text{prev\_hash}))$$
- The initial entry chains from `GENESIS_HASH` (`0000...0000`).
- **Integrity Verification**: `GET /audit/verify` walks the entire chain from the first block to the latest, recomputing every hash and asserting pointer linkages.
- **Live Demo Endpoint**: `POST /audit/tamper-demo` allows live demonstration of tamper detection for competition judges by maliciously modifying a database action string, proving that `GET /audit/verify` immediately detects the compromised record (`verified: false`). Reverting with `revert=true` restores chain validity (`verified: true`).

---

## 6. Complete API Route Directory

| Router | Method | Endpoint | Allowed Roles | Description |
| :--- | :---: | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/login` | Public | Authenticates credentials; returns JWT access token and user profile. |
| | `POST` | `/auth/register` | Public | Self-registration for citizens and staff. |
| | `GET` | `/auth/me` | Authenticated | Returns current user profile and role details. |
| | `GET` | `/auth/demo-users` | Public | Returns the 8 pre-seeded demo accounts with passwords for live testing. |
| **Recommendations** | `POST` | `/recommendations` | MPUser, Admin | Submits project recommendation; validates against prohibited categories. |
| | `GET` | `/recommendations` | Authenticated | Role-scoped list of recommendations. |
| | `POST` | `/recommendations/{id}/action` | DistrictAuthority, Admin | Accepts or rejects recommendation; acceptance sanctions project and sets 365-day deadline. |
| **Projects** | `GET` | `/projects` | Authenticated (excl. Citizen) | Role-scoped list of projects with financial and risk figures. |
| | `GET` | `/projects/public` | Public / Citizen | Sanitized project view with zero financial or risk score leakage. |
| | `GET` | `/projects/{id}` | Authenticated | Project details with milestone and status transition history. |
| | `POST` | `/projects/{id}/status` | DA, SNA, Admin | Updates status; atomically logs reason to `project_status_history`. |
| | `POST` | `/projects/{id}/assign-agency`| DA, Admin | Allots project to registered implementing agency. |
| **Financials** | `POST` | `/financials/projects/{id}/milestones` | DA, SNA, Admin | Defines project milestone and expected percentage. |
| | `GET` | `/financials/projects/{id}/milestones` | Authenticated | Lists milestones and verification statuses. |
| | `POST` | `/financials/milestones/{id}/verify` | DA, FieldOfficer, Admin | Formally verifies milestone completion. |
| | `POST` | `/financials/projects/{id}/installments`| DA, SNA, Admin | Records fund release/utilization installments. |
| | `GET` | `/financials/projects/{id}/installments`| Authenticated | Lists multi-installment history and balance. |
| | `POST` | `/financials/projects/{id}/payments` | DA, SNA, Admin | Records payment; **flags unverified milestone payments as fraud**. |
| | `GET` | `/financials/projects/{id}/payments` | Authenticated | Lists disbursements and anomaly flags. |
| | `POST` | `/financials/projects/{id}/procurement` | Vendor, DA, Admin | Logs itemized vendor purchases against GeM price benchmarks. |
| | `GET` | `/financials/projects/{id}/procurement` | Authenticated | Lists procurement line items. |
| | `POST` | `/financials/fund-transfers` | DA, SNA, Admin | Requests fund reallocation between two projects. |
| | `GET` | `/financials/fund-transfers` | Authenticated | Lists fund transfer requests. |
| | `POST` | `/financials/fund-transfers/{id}/action`| SNA, Ministry, Admin | Approves or rejects inter-project fund transfer. |
| **Analysis** | `POST` | `/analysis/project/{id}` | Authenticated | Triggers rule evaluation and risk score computation for a project. |
| | `POST` | `/analysis/run-all` | DA, SNA, Ministry, Admin | Batch evaluates all projects in user's jurisdiction. |
| **Compliance**| `GET` | `/compliance/sc-st/{mp_id}` | Authenticated | Evaluates statutory 15% SC / 7.5% ST annual allocation quota. |
| | `GET` | `/compliance/sc-st-summary` | SNA, Ministry, Admin | Overview of SC/ST quota compliance across all MPs. |
| | `GET` | `/compliance/prohibited-categories`| Public | Master list of prohibited works under Clause 5.1. |
| **Evidence** | `POST` | `/evidence/upload` | Authenticated | Multipart upload with mandatory GPS coordinates to Supabase Storage. |
| | `GET` | `/evidence` | Authenticated | Lists uploaded evidence. |
| | `POST` | `/evidence/{id}/verify` | DA, FieldOfficer, Admin | Verifies or rejects ground evidence. |
| **Verifications**| `POST` | `/verifications` | DA, SNA, Admin | Assigns field inspection visit to a Field Officer. |
| | `GET` | `/verifications` | Authenticated | Lists verification requests. |
| | `POST` | `/verifications/{id}/start` | FieldOfficer, Admin | Marks site inspection visit in progress. |
| | `POST` | `/verifications/{id}/complete` | FieldOfficer, Admin | Submits field report, site GPS coordinates, and evidence links. |
| **Notifications**| `GET` | `/notifications` | Authenticated | Lists in-app alerts for logged-in user. |
| | `GET` | `/notifications/unread-count` | Authenticated | Returns unread badge counter. |
| | `PUT` | `/notifications/{id}/read` | Authenticated | Marks specific notification as read. |
| | `PUT` | `/notifications/read-all` | Authenticated | Marks all notifications as read. |
| **Views** | `GET` | `/views/mp/recommendation-summary` | MPUser, Admin | Funnel summary of recommendations (Pending/Accepted/Rejected). |
| | `GET` | `/views/mp/status-summary` | MPUser, Admin | Breakdown of projects by status and fund utilization rate. |
| | `GET` | `/views/mp/project-detail` | MPUser, Admin | Row-level audit view of MP projects. |
| | `GET` | `/views/state/district-summary` | DA, SNA, Ministry, Admin | District-level rollups within state (sanctions, utilization, flags). |
| | `GET` | `/views/state/flagged-projects` | SNA, Ministry, Admin | High-risk flagged projects within state jurisdiction. |
| | `GET` | `/views/district/project-detail`| DA, Admin | District project list with milestone and verification completion rates. |
| | `GET` | `/views/public/projects` | Public | Citizen public projects view. |
| | `GET` | `/views/vendor/project-summary` | Vendor, Admin | Summary of projects allotted to vendor's agency. |
| | `GET` | `/views/vendor/procurement-detail`| Vendor, Admin | Itemized vendor procurement line items. |
| **Admin** | `GET` | `/admin/config` | MinistryUser, Admin | Lists dynamic thresholds (tender limits, overrun tolerances). |
| | `PUT` | `/admin/config/{key}` | Admin | Updates system configuration thresholds with audit logging. |
| | `GET` | `/admin/agencies` | Authenticated | Lists registered implementing agencies. |
| | `POST` | `/admin/agencies` | DA, Admin | Registers new implementing agency. |
| | `POST` | `/admin/agencies/{id}/verify` | Admin | Verifies implementing agency credentials. |
| | `GET` | `/admin/model-versions` | Public | Registry of active AI models and accuracy metrics. |
| | `POST` | `/admin/model-versions` | Admin | Registers new model deployment. |
| **Audit** | `GET` | `/audit/logs` | Authenticated | Chronological audit log query. |
| | `GET` | `/audit/verify` | Authenticated | Cryptographically verifies SHA-256 hash chain from Genesis. |
| | `POST` | `/audit/tamper-demo` | Authenticated | Maliciously alters database record to demonstrate live tamper detection. |
| **Flags** | `GET` | `/flags` | Authenticated | Synthesizes explainable review flags from RuleEngineLog and RiskScore. |
| **Dashboard** | `GET` | `/dashboard/{role}` | Authenticated | Backward-compatible role dashboard endpoint. |

---

## 7. Pre-Seeded Demo Accounts

All demo accounts share the password **`demo1234`**:

| Role Name | Seeded Demo Email | Department / Designation |
| :--- | :--- | :--- |
| **MPUser** | `mp@sapphire.gov.in` | Dr. Rajesh Sharma, Hon'ble Member of Parliament (Varanasi) |
| **DistrictAuthority** | `district@sapphire.gov.in` | Shri Amit Verma, District Magistrate / Collector (Varanasi) |
| **StateNodalAuthority** | `statenodal@sapphire.gov.in` | Smt. Sunita Rao, State Nodal Officer (Uttar Pradesh) |
| **MinistryUser** | `ministry@sapphire.gov.in` | MoSPI Joint Secretary, Data Informatics & Innovation Division |
| **FieldOfficer** | `fieldofficer@sapphire.gov.in` | Vikram Singh, Ground Inspection & Verification Officer |
| **Vendor** | `vendor@sapphire.gov.in` | Pawan Gupta, National Infrastructure & Works Corp (NIWC) |
| **Citizen** | `citizen@sapphire.gov.in` | Aarav Patel, Resident Citizen of Varanasi |
| **Admin** | `admin@sapphire.gov.in` | Lead System Administrator |

---

## 8. How to Run and Test

### 1. Launch the Backend Server
```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **Root URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000) (automatically redirects to `/docs`).
- **Interactive Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).
- **Health Check Endpoint**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health).

### 2. Execute Automated Test Suites
```powershell
cd backend
$env:PYTHONIOENCODING="utf-8"
python -m pytest tests/ -v
```

**Expected Result:**
```text
tests/test_all_gaps_complete.py::test_complete_backend_refinement PASSED  [ 33%]
tests/test_deadline_rule.py::test_completion_deadline_is_contractual PASSED [ 66%]
tests/test_step1_core_workflow.py::test_full_core_workflow PASSED         [100%]

============================= 3 passed in 26.82s ==============================
```
