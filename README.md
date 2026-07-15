# CloudGuard AI

## Enterprise AI Cloud Security & Compliance Platform

A production-grade AI-powered Cloud Security Posture Management (CSPM) platform built with **FastAPI, Next.js 15, PostgreSQL, Redis, and modern LLM technologies**.

---

# Overview

CloudGuard AI is an enterprise-grade Cloud Security & Compliance Platform designed to help organizations continuously monitor, secure, and optimize their cloud infrastructure through artificial intelligence, automation, and real-time threat intelligence.

The platform combines Cloud Security Posture Management (CSPM), AI Security Copilot, Vulnerability Management, Compliance Monitoring, Asset Discovery, Risk Assessment, Policy Enforcement, Governance, and Enterprise Analytics into a unified security operations platform.

Designed with a scalable modular monorepo architecture, CloudGuard AI emphasizes enterprise security, observability, automation, and production readiness.

---

# Key Features

## Cloud Security Platform

* Cloud Asset Discovery
* Multi-Cloud Inventory Management
* Cloud Security Posture Management (CSPM)
* Vulnerability Detection
* Security Misconfiguration Analysis
* Identity & Access Monitoring
* Resource Risk Assessment
* Security Policy Enforcement
* Infrastructure Drift Detection
* Continuous Security Monitoring
* Automated Remediation Workflows
* Incident Timeline
* Security Operations Dashboard

---

## AI Intelligence

* AI Security Copilot
* AI Threat Analysis
* Security Recommendation Engine
* Risk Prioritization
* Explainable AI Findings
* AI Compliance Advisor
* Infrastructure Summarization
* Natural Language Security Queries
* Security Report Generation
* Multi-LLM Gateway
* Retrieval-Augmented Generation (RAG)

### Supported AI Providers

* OpenAI
* Google Gemini
* Anthropic Claude
* Cohere

---

## Compliance & Governance

* CIS Benchmark Monitoring
* SOC 2 Compliance
* ISO 27001 Controls
* GDPR Readiness
* HIPAA Compliance
* PCI DSS Monitoring
* Compliance Scorecards
* Audit Reports
* Policy Library
* Governance Dashboard

---

## Enterprise Workspace

* Security Operations Center Dashboard
* Team Collaboration
* Alert Management
* Activity Timeline
* Investigation Workspace
* Incident Management
* Notification Center
* Asset Inventory
* Security Notes
* Risk Register

---

## Security & Identity

* JWT Authentication
* Refresh Tokens
* Password Hashing (Argon2)
* RBAC (Role-Based Access Control)
* Organization Isolation
* Multi-Tenant Architecture
* API Key Management
* Secure Sessions
* Audit Logging

---

## SaaS Platform

* Organization Management
* Workspace Administration
* Subscription Management
* Usage Analytics
* Enterprise Billing
* Marketplace Integrations
* Developer APIs
* API Management
* Tenant Provisioning

---

## Analytics

* Security Dashboard
* Risk Heatmaps
* Compliance Analytics
* Vulnerability Trends
* Asset Analytics
* Threat Intelligence Dashboard
* Team Productivity
* AI Usage Metrics
* Executive Reports
* Operational KPIs

---

## Observability & Reliability

* OpenTelemetry
* Structured Logging
* Prometheus Metrics
* Health Monitoring
* Distributed Tracing
* Incident Tracking
* Performance Dashboard
* Load Testing
* Recovery Monitoring

---

# Technology Stack

## Frontend

* Next.js 15
* React 19
* TypeScript
* Tailwind CSS
* Framer Motion
* Zustand
* Lucide React

---

## Backend

* FastAPI
* Python 3.12
* SQLAlchemy
* AsyncPG
* PostgreSQL
* Redis
* Pydantic v2
* Celery
* JWT Authentication

---

## AI & ML

* OpenAI API
* Google Gemini
* Anthropic Claude
* Cohere
* LangGraph
* RAG Pipeline
* Prompt Registry
* Vector Search
* AI Evaluation Framework

---

## Cloud & Security

* AWS
* Microsoft Azure
* Google Cloud Platform
* Terraform
* Docker
* Kubernetes
* Trivy
* Open Policy Agent (OPA)

---

## DevOps & Infrastructure

* Docker
* Railway
* Vercel
* GitHub Actions
* OpenTelemetry
* Prometheus
* Grafana

---

# System Architecture

```
                         CloudGuard AI

                 ┌──────────────────────────┐
                 │     Next.js Client       │
                 └─────────────┬────────────┘
                               │
                               ▼
                 ┌──────────────────────────┐
                 │   FastAPI API Gateway    │
                 └─────────────┬────────────┘
                               │
     ┌─────────────────────────┼─────────────────────────┐
     │                         │                         │
     ▼                         ▼                         ▼
 Authentication         Security Engine          AI Services
     │                         │                         │
     ▼                         ▼                         ▼
 PostgreSQL              Redis Cache             LLM Gateway
                                                      │
                 ┌──────────────┬──────────────┬──────────────┐
                 ▼              ▼              ▼              ▼
              OpenAI         Gemini         Claude         Cohere
```

---

# Project Structure

```
CloudGuard
│
├── apps
│   ├── api-gateway
│   └── web
│
├── libs
│   ├── auth
│   ├── config
│   ├── db-core
│   ├── events
│   ├── sdk
│   ├── security
│   ├── shared-schemas
│   ├── telemetry
│   └── ui
│
├── packages
│   ├── constants
│   ├── types
│   └── utilities
│
├── docs
├── infrastructure
├── docker-compose.yml
├── railway.toml
├── vercel.json
├── pnpm-workspace.yaml
└── README.md
```

---

# Getting Started

## Clone the Repository

```bash
git clone https://github.com/kritak0808/CloudGuard.git

cd CloudGuard
```

---

## Install Dependencies

```bash
pnpm install
```

---

## Start Backend

```bash
cd apps/api-gateway/src

python -m uvicorn main:app --reload
```

---

## Start Frontend

```bash
cd apps/web

pnpm dev
```

---

# Environment Variables

## Backend

```env
DATABASE_URL=

REDIS_URL=

JWT_SECRET_KEY=

OPENAI_API_KEY=

GEMINI_API_KEY=

COHERE_API_KEY=

SMTP_HOST=

SMTP_PORT=

SMTP_USER=

SMTP_PASSWORD=

AWS_ACCESS_KEY_ID=

AWS_SECRET_ACCESS_KEY=

AZURE_CLIENT_ID=

AZURE_CLIENT_SECRET=

GCP_PROJECT_ID=

CORS_ORIGINS=
```

---

## Frontend

```env
NEXT_PUBLIC_API_URL=
```

---

# API Documentation

FastAPI automatically generates interactive API documentation.

```
http://localhost:8000/docs
```

OpenAPI Schema

```
http://localhost:8000/openapi.json
```

---

# Testing

Run the backend test suite

```bash
pytest
```

Run linting

```bash
python -m ruff check
```

Build the frontend

```bash
pnpm build
```

---

# Project Highlights

* Enterprise Cloud Security Platform
* AI-Powered Security Copilot
* Cloud Security Posture Management (CSPM)
* Multi-Cloud Infrastructure Monitoring
* AI Threat Intelligence Engine
* Compliance Automation
* Infrastructure Risk Assessment
* Policy-as-Code Enforcement
* Vulnerability Management
* Enterprise SaaS Architecture
* Multi-Tenant Workspace
* JWT Authentication & RBAC
* Security Collaboration Suite
* Executive Analytics Dashboards
* OpenTelemetry Observability
* Production-Ready FastAPI Backend
* Modern Next.js 15 Frontend
* Scalable PostgreSQL Data Layer
* Redis-backed Background Processing

---

# Roadmap

* Kubernetes Security Monitoring
* Container Runtime Protection
* Cloud Attack Path Analysis
* AI Incident Response Assistant
* Automated Security Remediation
* Threat Hunting Workbench
* SIEM Integrations
* Identity Risk Analytics
* Security Knowledge Graph
* Advanced Executive BI Dashboard

---

# Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

Please ensure that all tests pass before submitting changes.

---

# License

This project is licensed under the MIT License.

---

# Author

**Kritak Prasad**

B.Tech Computer Science & Engineering

SRM Institute of Science and Technology

GitHub: https://github.com/kritak0808

---

# CloudGuard AI

### Enterprise AI Cloud Security & Compliance Platform
