# Field Pulse — Intelligent Field Progress & Schedule Linking Platform

[![Node.js](https://img.shields.io/badge/Node.js-v24-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/Database-Node%2024%20Native%20SQLite-003B57?logo=sqlite&logoColor=white)](https://nodejs.org/api/sqlite.html)
[![Tests](https://img.shields.io/badge/Tests-63%2F63%20Passing-10B981)](#-automated-verification)
[![Design](https://img.shields.io/badge/Design%20System-Field Pulse%20Industrial-0EA5E9)](#-design-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Deployment Anchor:** Baghewala Surface Facilities Expansion, Thar Desert, Rajasthan  
> **Target Enterprise:** Enterprise Capital Projects (Heavy Infrastructure, Energy, EPC & Utilities)  
> **Problem Domain:** Real-time actual progress tracking, automated multi-signal schedule linking, out-of-sequence predecessor gating, and Oracle Primavera P6 integration.

---

## 🌟 Platform Highlights

Field Pulse is an enterprise-grade intelligent progress capture and schedule-integration platform engineered for heavy oilfield and infrastructure project control. It automates the journey from unstructured daily field reports (DPRs, tabular spreadsheets, supervisor voice transcripts) to verifiable, audit-attributed schedule updates.

```
[ Field Ingestion ]              [ Intelligent Linking Layer ]             [ Enterprise Control ]
  ├── Daily Progress Reports (DPR)  ├── 6-Signal Mathematical Match (94.8%)   ├── Planner Review Queue
  ├── Excel / CSV Spreadsheets       ├── Level 6 Granularity Prioritization    ├── Out-of-Sequence Gating
  ├── Handwritten Diary OCR          ├── 1:N Field Record Splitter             ├── 6-Point Evidence Trace
  └── Time Agent (Supervisor Voice)  └── Two-Tier Duplicate Detection (70/85%) └── Mock PMIS (P6 REST/SOAP)
```

---

## 🏗️ Core Architecture

```
                      ┌──────────────────────────────────────────────┐
                      │             React 18.3 Frontend              │
                      │            Vite SPA (:3000)                  │
                      │  • Dark Petroleum Navy / Daylight Light Mode │
                      │  • Space Grotesk / Inter / JetBrains Mono    │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTP REST / JSON
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │          Enterprise Relational API           │
                      │         Node.js 24 Server (:3001)            │
                      │  • Native node:sqlite Engine (Zero C++ Deps) │
                      │  • High-Concurrency WAL Mode                 │
                      │  • Indexed Queries (<2ms Response)           │
                      └──────────────────────┬───────────────────────┘
                                             │
                      ┌──────────────────────┴───────────────────────┐
                      │                                              │
                      ▼                                              ▼
       ┌──────────────────────────────┐              ┌──────────────────────────────┐
       │   Local Mock PMIS Adapter    │              │  Append-Only Audit Engine    │
       │ • P6 REST JSON Demonstration │              │ • Non-repudiable Actor Sig   │
       │ • P6 SOAP XML Envelope       │              │ • Before/After JSON Diffs    │
       └──────────────────────────────┘              └──────────────────────────────┘
```

---

## 🔬 Multi-Signal Matching Formula

Field Pulse calculates candidate activity alignment through a weighted 6-signal linear formula:

$$\text{Base Match Score} = \sum_{i=1}^{6} w_i \cdot s_i = 94.8\%$$

| Signal ($i$) | Weight ($w_i$) | Exemplar Value ($s_i$) | Score Contribution |
|---|---|---|---|
| **Text Similarity** | 30% | 92.0% | +27.60% |
| **Discipline Alignment** | 20% | 100.0% | +20.00% |
| **Location Fit** | 15% | 95.0% | +14.25% |
| **WBS Parent Fit** | 15% | 90.0% | +13.50% |
| **Date Consistency** | 10% | 94.0% | +9.40% |
| **Engineering Synonyms** | 10% | 100.0% | +10.00% |
| **Total Base Score** | **100%** | — | **94.75% ($\approx 94.8\%$)** |

- **Tie-Breaker Rule:** When Level 5 (parent work package) and Level 6 (executable activity) scores are within 10%, Level 6 is prioritized as **Fast-Track Review Eligible**.
- **Confidence Decision Boundaries:**
  - $\ge 85\%$: **High Confidence** (Fast-track 1-click approval eligible)
  - $60\% - 84\%$: **Medium Confidence** (Mandatory planner confirmation required)
  - $< 60\%$: **Unmatched** (Candidate for new scope proposal)

---

## 🧪 Automated Verification & Test Coverage

All 63 test cases pass with 100% green execution across unit, acceptance, and backend integration suites:

```bash
# Run the complete unified test runner
npm test
# or: node run-tests.mjs
```

### Test Suite Breakdown:
1. **Service Unit & Boundary Tests (28 / 28 Passed):**
   - `ConfidenceService`: Decision tier boundaries (<55, 55, 60, 85), ambiguity reduction, and fast-track gating.
   - `NormalizationService`: ISO dates, ambiguous dates (DD/MM vs MM/DD), named months, and 7-discipline classification.
   - `ExtractionService`: Physical composite quantities (`18 of 24 joints`), linear measurements (`42m`), and character spans.
   - `ApprovalService`: Out-of-sequence predecessor checks, negative progress flags, >20% overrun detection, and 1:N 100% split validation.
   - `DuplicateService`: 70% candidate similarity flag vs 85% high-confidence duplicate confirmation.
   - `AnalyticsService`: Zero-activity fallbacks, 7-day velocity projection, and 9-point cumulative S-Curves.
   - `MockP6Adapter`: REST JSON payload structure and SOAP XML envelope validation.
2. **BDD Domain Acceptance Tests (25 / 25 Passed):**
   - End-to-end operational scenarios across all 11 specification categories (`AC-ING` through `AC-SYS`).
3. **Backend API & SQLite Persistence Tests (10 / 10 Passed):**
   - Native Node 24 SQLite health checks, indexed single-row mutations, append-only audit trail logging, and atomic database re-seeding.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v24 or later

### Installation & Run
```bash
# 1. Clone the repository
git clone https://github.com/LoopTroop1/Field Pulse.git
cd Field Pulse

# 2. Install dependencies
npm install

# 3. Start the Vite Frontend and Backend API Server
npm run dev
# in a separate terminal:
npm run build:server && node dist/server.mjs

# 4. Open in browser
# Frontend Application: http://localhost:3000
# Backend API Telemetry: http://localhost:3001/api/health
```

---

## 👥 Evaluator Personas

The platform includes a dedicated **One-Click Persona Login Gateway** (`/login`):

| Persona | Role | Primary Operational View |
|---|---|---|
| **Rajiv Sen** | Lead Planning Engineer | Planner Review & Exception Queue (`/review`) |
| **Harish Patel** | Field Piping Supervisor | Time Agent Conversational Logger (`/time-agent`) |
| **Priya Sharma** | Discipline Engineer (Mechanical) | Multi-Attribute Extraction Workspace (`/extraction`) |
| **Vikramaditya Roy** | Project Director (EPPM) | Operations Overview & What-If Simulator (`/overview`) |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
