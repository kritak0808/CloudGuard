# 🌌 CloudGuard AI
> **The Autonomous Cloud Security & DevSecOps Platform**

[![Version 1.0.0](https://img.shields.io/badge/Release-v1.0.0-blueviolet.svg?style=flat-square)](https://github.com/kritak0808/roadsense-ai/releases/tag/v1.0.0)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg?style=flat-square)](https://github.com/kritak0808/roadsense-ai/actions)
[![Linter Zero--Errors](https://img.shields.io/badge/Lints-Zero_Errors-success.svg?style=flat-square)](https://eslint.org/)

CloudGuard AI is a production-grade, AI-native autonomous cloud security operating system. It operates on a **Living Digital Twin** of your cloud infrastructure, using continuous **Infrastructure Genome** parsing, a **Knowledge Graph**, a multi-agent **AI Security Council Consensus Protocol**, and self-healing **Autonomous Defense** engines to secure the software delivery lifecycle from commit to production runtime.

---

## 🏗 High-Level System Architecture

CloudGuard AI models cloud environments as a reactive entity graph rather than running on-demand API queries. Telemetry traces, security scans, and infrastructure modifications feed into a central state machine.

```mermaid
graph TD
    subgraph Frontend Experience (Next.js)
        A[CloudGuard Web Console] -->|Fetch metrics/payloads| B[Zustand Stores]
    end

    subgraph API Gateway & Authentication
        B -->|Ports 4000 - 4008| C[Zero Trust Interceptor middleware]
        C -->|Validate credentials| D[identity-runtime: Port 4006]
    end

    subgraph Platform Runtime Core Services
        C -->|Orchestrate pipelines| E[devsecops-runtime: Port 4007]
        C -->|Correlate traces/SLOs| F[observability-runtime: Port 4008]
        C -->|Manage AI playbooks| G[agent-runtime: Port 4000]
        C -->|Track cloud resources| H[connector-runtime: Port 4001]
        C -->|Run static scans| I[scanner-runtime: Port 4002]
        C -->|Query digital twins| J[memory-runtime: Port 4003]
        C -->|Remediate security drift| K[incident-runtime: Port 4004]
        C -->|Generate executive reports| L[executive-runtime: Port 4005]
    end

    subgraph Data & Storage Layers
        J -->|pgvector / RAG context| M[(Memory Vector database)]
        H -->|Infrastructure Genome| N[(Neo4j Knowledge Graph)]
    end
```

---

## 🧬 Core Platform Runtimes

The system consists of **nine microservice runtimes** running in parallel, coordinating via type-safe event interfaces and Zero-Trust headers.

### 1. AI Runtime (`agent-runtime` | Port `4000`)
Orchestrates autonomous LLM agent execution, security playbooks compilation, and Terraform IaC remediation synthesis.

### 2. Connector Runtime (`connector-runtime` | Port `4001`)
Continuous synchronization of cloud accounts (AWS, GCP, Kubernetes). Fetches metadata, regions, and resources to feed the Digital Twin.

### 3. Scanner Runtime (`scanner-runtime` | Port `4002`)
Runs automated vulnerability checks (Trivy, Checkov, SAST scanners) across container images, SBOM dependencies, and configuration templates.

### 4. Memory Runtime (`memory-runtime` | Port `4003`)
Supplies long-term memory retrieval using vector embeddings (RAG) and builds the local Neo4j entity relations knowledge graph.

### 5. Incident Runtime (`incident-runtime` | Port `4004`)
Monitors real-time alerts, aggregates logs, and manages incident escalation workflows and containment playbooks.

### 6. Executive Runtime (`executive-runtime` | Port `4005`)
Aggregates risk trends and ROI metrics to compile SOC2 compliance readiness reports and board presentation briefs.

### 7. Identity Runtime (`identity-runtime` | Port `4006`)
Enforces multi-tenant data boundaries, validates Zero-Trust OIDC session signatures, and evaluates ABAC access controls.

### 8. DevSecOps Runtime (`devsecops-runtime` | Port `4007`)
Evaluates branch policy gates on incoming pull requests, validates Helm/Terraform configurations, and triggers automated rollbacks.

### 9. Observability Runtime (`observability-runtime` | Port `4008`)
Ingests OpenTelemetry metrics and traces, maps service dependencies, and tracks service SLO buffers.

---

## ⚡ Port & Interface Registry

| Port | Service Name | Endpoint Base | Key Responsibilities |
|---|---|---|---|
| `3000` | **`web`** | `/` | Next.js 16 Web Dashboard |
| `4000` | **`agent-runtime`** | `/api/v1/agent` | Consensus multi-agent discussions, plan execution |
| `4001` | **`connector-runtime`** | `/api/v1/connectors` | Live cloud sync status and resource registries |
| `4002` | **`scanner-runtime`** | `/api/v1/scanners` | Triggering Checkov/Trivy runs, SBOM list |
| `4003` | **`memory-runtime`** | `/api/v1/memory` | Semantic RAG embeddings vector storage |
| `4004` | **`incident-runtime`** | `/api/v1/incidents` | Case status updates, task assignment, logs |
| `4005` | **`executive-runtime`** | `/api/v1/executive` | Metric score cards, ROI indices, report compiles |
| `4006` | **`identity-runtime`** | `/api/v1/identity` | Zero Trust auth handshakes, tenant config, directory |
| `4007` | **`devsecops-runtime`**| `/api/v1/devsecops` | Pipeline verifications, PR gates, rollback requests |
| `4008` | **`observability-runtime`** | `/api/v1/observability` | Trajectory traces, latency graphs, Smart Alerts |

---

## ⚙ Technology Stack

- **Core Experience**: Next.js 16 (React 19, TS compiler, Zustand state stores, TailwindCSS + custom HSL glass themes).
- **Core Engine**: NodeNext ESModule Express servers with strict TypeScript validation.
- **Testing Engine**: Vitest, `@testing-library/react`, `jsdom` (Zero test configuration required).
- **Orchestration**: Turbo, PNPM monorepo workspaces layout.

---

## 🚀 Quickstart & Setup

### Prerequisites
- Node.js `v20.x` or later
- PNPM `v9.x` or later

### Installation
```bash
# Clone the repository
git clone https://github.com/kritak0808/roadsense-ai.git
cd roadsense-ai

# Install workspaces dependencies
pnpm install
```

### Build & Compilation Gates
To verify compiler integrity across all packages:
```bash
pnpm run build
```

### Execution
Run all runtimes and the experience layer in parallel:
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the console.

### Test Runner
To run all unit, integration, and component tests:
```bash
pnpm run test
```

---

## 🛡 Security & Vulnerability Reporting

Please refer to our [SECURITY.md](./SECURITY.md) guidelines for security incident reporting policies. Do not commit keys, passwords, or credentials.

---

## ⚖ License

CloudGuard AI is licensed under the [MIT License](./LICENSE). See the LICENSE file for details.
