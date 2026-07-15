# CloudGuard AI System Architecture

This document describes the high-level design, operational models, sequence flows, and cryptographic verification processes of CloudGuard AI, the Autonomous Cloud Security Operating System.

---

## 🏗 Real-Time Digital Twin Ingestion Flow

Rather than querying cloud provider APIs on demand and displaying static tables, CloudGuard AI constructs a real-time reactive graph representation of all resources, identities, routes, and relationships.

```mermaid
graph TD
    A[Cloud Environments: AWS/GCP/K8s] -->|Real-time Ingestion & Webhooks| B[Infrastructure Genome Engine]
    B -->|Entity Normalization| C[Digital Twin Graph database]
    C -->|Graph Boundaries & Permissions| D[Predictive Risk & Simulation Engine]
    D -->|Simulated Scenarios| E[AI Security Council Multi-Agent Reasoning]
    E -->|Consensus Decision & IaC Synthesis| F[Security Copilot Canvas]
    F -->|Approve & Apply| G[Self-Healing Deployment Service]
    G -->|Update IaC / Apply Policies| A
```

---

## 🤖 AI Security Council Consensus Sequence

When a threat vector is identified (or simulated through a dry-run deployment), it is routed to the **AI Security Council**. This sequence maps how the specialized security personas collaborate to reach consensus on remediation plans.

```mermaid
sequenceDiagram
    autonumber
    participant Engine as Simulation Engine
    participant Sentinel as IAM Sentinel (Agent)
    participant Pathologist as Network Pathologist (Agent)
    participant Compliance as Compliance Architect (Agent)
    participant Core as agent-runtime (Consensus Coordinator)
    participant Canvas as Security Copilot Canvas (UI)

    Engine->>Core: Ingest threat event / network topology change
    Note over Core: Parse resource genomes & spin up agent personas
    
    par Assess IAM Boundaries
        Core->>Sentinel: Request IAM vulnerability check
        Sentinel-->>Core: Emit IAM boundary risk rating (0-100%)
    and Assess Network Paths
        Core->>Pathologist: Request VPC reachability check
        Pathologist-->>Core: Emit network exposure vector
    and Assess Compliance Drafts
        Core->>Compliance: Check framework alignment (SOC2/HIPAA)
        Compliance-->>Core: Emit configuration compliance status
    end

    Note over Core: Start Round 2: Peer Review & Collaboration
    Core->>Sentinel: Share Pathologist & Compliance findings
    Sentinel-->>Core: Update IAM risk profile (lateral movement check)
    
    Core->>Pathologist: Share Sentinel & Compliance findings
    Pathologist-->>Core: Confirm exposure path to customer DB

    Note over Core: Synthesize Self-Healing Remediation Plan
    Core->>Core: Reconcile consensus rating & generate Terraform patch
    Core->>Canvas: Stream collaborative dialogue & remediation diffs
```

---

## 🔐 Inbound Request Zero-Trust Authorization Handshake

CloudGuard AI operates on a Zero-Trust verification boundary. Every frontend fetch request is intercepted to inject security context metadata headers, which backend microservices validate before responding.

```mermaid
sequenceDiagram
    autonumber
    participant UI as Zustand Store / Fetch Interceptor
    participant Gate as Zero Trust Middleware (API Gateway)
    participant ID as identity-runtime (Auth Node)
    participant API as Target Microservice (e.g. incident-runtime)

    UI->>UI: Retrieve session ID & compute device risk score
    UI->>Gate: Send Request + Auth Headers (X-Tenant-Id, X-Device-Risk, X-Device-Fingerprint)
    
    Gate->>ID: Validate credentials & evaluate ABAC policies
    Note over ID: Compare requester role, IP, and risk bounds
    
    alt Authorized
        ID-->>Gate: Return validation success (Authorized: true, Actor: Connor)
        Gate->>API: Forward request with validated actor context
        API-->>UI: Return resource data payload (HTTP 200 OK)
    else Risk Score / Permission Breach
        ID-->>Gate: Return verification block (Authorized: false, Reason: High Device Risk)
        Gate-->>UI: Return HTTP 403 Forbidden
        Note over UI: Dispatch 'zero-trust-block' custom UI event to trigger alert strip
    end
```

---

## 💾 Cryptographic Verification & Verification Trails

To prevent database tampering and maintain strict compliance trails, Audit Log entries and Compliance Evidence records are cryptographically signed using SHA-256 digests.

```mermaid
graph LR
    subgraph Audit Log Record
        ID[Log UUID] --> Hash[SHA-256 Cryptographic Engine]
        Type[Event Type] --> Hash
        Actor[Requester Actor] --> Hash
        Tenant[Tenant Context] --> Hash
        Outcome[Execution Status] --> Hash
        Time[Timestamp] --> Hash
        Hash --> Sig[Signature Digest]
    end
```

Any modification to these fields invalidates the signature, triggering high-severity alerts inside the Platform Operations Center.
