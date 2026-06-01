# Product Requirements Document (PRD) - PropFlow AI

## 1. Product Overview & Goals
PropFlow AI is a multi-tenant, premium Property and Rental Management SaaS platform designed to streamline real estate operations for property owners, property managers, tenants, and super administrators. The platform implements an AI-driven, automation-first architecture that eliminates operational friction in lease reviews, property score audits, and reporting.

---

## 2. Target Personas & Core Use Cases

### A. Property Owners
* **Goal**: Monitor financial yield, track asset value, and assess property health.
* **Core Flows**:
  * View portfolio ROI metrics.
  * Access AI-synthesized Property Health Scores.
  * Delegate operational control to Property Managers.

### B. Property Managers
* **Goal**: Handle day-to-day tenancy, lease processing, rent collection, and repairs.
* **Core Flows**:
  * Ingest and analyze leases instantly using AI Lease Intelligence.
  * Dispatch and manage Maintenance Requests.
  * Generate customized performance reports.

### C. Tenants
* **Goal**: View lease details, pay rent securely, and report maintenance requests.
* **Core Flows**:
  * Submit maintenance tickets with image attachment support.
  * Pay monthly rent through standard gateway setups.
  * Query lease policies using the AI Assistant.

---

## 3. Core Modules & Key Features

### 1. Authentication & RBAC
- Strict JSON Web Token (JWT) identity flow with HTTP-only cookies.
- Hierarchical role-based access control protecting cross-tenant leakage.

### 2. AI Lease Intelligence
- Ingests lease contract PDFs, utilizing the Gemini API to extract key fields (rent, start/end dates, late fee terms) into structured JSON.

### 3. AI Property Health Score
- Aggregates age of key appliances, pending repair volumes, safety checks, and cash flow stability into a unified 0-100 score.

### 4. AI Assistant
- Inline assistant helping users query lease details, policy rules, and financial advice.
