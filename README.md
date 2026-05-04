# Sannidh 

**Autonomous Compliance Infrastructure for Indian Finance**

[![Live Deployment](https://img.shields.io/badge/Production-Live-success.svg)](https://www.sannidh.in)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-green.svg)](https://nodejs.org/)

Sannidh is a distributed compliance engine built for Indian Chartered Accountancy (CA) firms. We systematically replace 2–5 days of manual data extraction, reconciliation, and drafting with 20 minutes of high-speed programmatic execution. 

We are not a SaaS wrapper. We are wired directly into government portals, the accounting stack, and the banking layer.

## ⚙️ Core Architecture & Tech Stack

Sannidh is built like financial infrastructure, prioritizing strict type-safety, absolute data isolation, and statutory grounding.

### Frontend
* **Framework:** React 18 with Vite.
* **Language:** TypeScript (Strict Mode).
* **UI/Styling:** Tailwind CSS + shadcn/ui.
* **Design Philosophy:** Built exclusively for high-density compliance data (audit tables, GSTR grids, notice timelines). No generic SaaS dashboards.

### Backend & Data Layer
* **Runtime:** Node.js, architected for high-concurrency execution.
* **Database:** PostgreSQL.
* **Security:** Strict Row-Level Security (RLS) via `ca_firm_id` to guarantee absolute, cryptographically enforced data isolation between competing firms.
* **Statutory Engine:** `pgvector` RAG pipeline indexing the CGST Act, Companies Act 2013, and Income Tax rules.

### Autonomous AI Routing
We utilize a multi-model orchestration layer where 22 autonomous agents run on a 24/7 heartbeat, managed via Antigravity. Tasks are routed based on specific compute strengths:
* **GPT-4o:** Executes high-fidelity legal notice drafting.
* **Claude 3.5 Sonnet:** Handles statutory rebuttals and paragraph-by-paragraph fact reconciliation.
* **Gemini 1.5 Pro:** Ingests the client's complete audit history and 75 years of Indian case law utilizing its massive context window.

## 🔄 System Workflow

When a regulatory notice is issued, Sannidh executes the following pipeline automatically:

1. **Detection & Ingestion:** Direct mTLS/GSP gateway integrations monitor GSTN, MCA, and Income Tax portals.
2. **ERP Synchronization:** Sannidh connects to Tally Prime, Zoho Books, and QuickBooks to ingest internal company ledgers.
3. **Statutory Retrieval:** The RAG pipeline forces the system to retrieve actual Indian statute before processing. No models are permitted to guess or hallucinate legal precedent.
4. **Reconciliation:** Agents cross-reference the government's claimed numbers against the company's internal ERP data to identify exact mismatch vectors.
5. **Draft Generation:** A filing-ready, legally grounded response draft is generated for the CA's final review.

## 🛠 Local Development Guide

### Prerequisites
* Node.js (v18+)
* npm or pnpm
* PostgreSQL instance

### Quick Start
```sh
# 1. Clone the repository
git clone https://github.com/singhatharav935/regulon-command.git
cd regulon-command

# 2. Install dependencies
npm install

# 3. Configure Environment
# Copy the example env file and populate with your local database and API keys
cp .env.example .env

# 4. Start the development server
npm run dev