"use client";

import { create } from 'zustand';
import type { ConnectorDefinition, ConnectorHealth, ConnectorState } from '@cloudguard/types';

const CONNECTOR_API = 'http://localhost:4001';

// ─── Provider seed data (fallback when connector-runtime isn't running) ───────

const SEED_CONNECTORS: ConnectorDefinition[] = [
  { id: 'aws-prod', provider: 'aws', displayName: 'Amazon Web Services', description: 'Discover IAM, EC2, EKS, S3, RDS, Lambda, VPC, GuardDuty and 200+ services', accountId: '123456789012', regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'], totalResources: 0, state: 'idle', health: null, lastConnectedAt: null, credentialType: 'role_arn' },
  { id: 'azure-prod', provider: 'azure', displayName: 'Microsoft Azure', description: 'Discover AKS, VMs, Storage, Key Vault, Entra ID and Azure Defender findings', accountId: 'sub-f84a3b12-4c9d', regions: ['eastus', 'westeurope', 'southeastasia'], totalResources: 0, state: 'idle', health: null, lastConnectedAt: null, credentialType: 'service_account' },
  { id: 'gcp-prod', provider: 'gcp', displayName: 'Google Cloud Platform', description: 'Discover GKE, Compute, Cloud SQL, Cloud Storage, IAM and Cloud Armor rules', accountId: 'proj-cloudguard-42b9', regions: ['us-central1', 'europe-west1', 'asia-east1'], totalResources: 0, state: 'idle', health: null, lastConnectedAt: null, credentialType: 'service_account' },
  { id: 'k8s-eks-prod', provider: 'kubernetes', displayName: 'Kubernetes (EKS)', description: 'Continuous sync of namespaces, pods, RBAC, network policies, secrets and Helm releases', accountId: 'eks-prod-main', regions: ['us-west-2'], totalResources: 0, state: 'idle', health: null, lastConnectedAt: null, credentialType: 'kubeconfig' },
  { id: 'github-org', provider: 'github', displayName: 'GitHub', description: 'Scan repositories, Actions, secrets, Dependabot alerts and CodeQL SAST findings', accountId: 'org/cloudguard-enterprise', regions: ['global'], totalResources: 0, state: 'idle', health: null, lastConnectedAt: null, credentialType: 'oauth' },
  { id: 'terraform-cloud', provider: 'terraform', displayName: 'Terraform Cloud', description: 'Map workspaces, state files, drift detection, Sentinel policy results and run history', accountId: 'tfc-org-cloudguard', regions: ['global'], totalResources: 0, state: 'idle', health: null, lastConnectedAt: null, credentialType: 'api_key' },
  { id: 'cloudflare-main', provider: 'cloudflare', displayName: 'Cloudflare', description: 'Discover zones, DNS records, WAF rulesets, Workers and Access policies', accountId: 'cf-acc-8d3f2a', regions: ['global'], totalResources: 0, state: 'idle', health: null, lastConnectedAt: null, credentialType: 'api_key' },
  { id: 'docker-registry', provider: 'docker', displayName: 'Docker / Container Registry', description: 'Scan images, SBOMs, base layer CVEs, runtime containers and registry push events', accountId: 'registry.cloudguard.io', regions: ['global'], totalResources: 0, state: 'idle', health: null, lastConnectedAt: null, credentialType: 'api_key' },
];

const PROVIDER_LOGS: Record<string, string[]> = {
  'aws-prod': ['[INIT] Validating IAM Role ARN...','[AUTH] STS AssumeRole successful.','[SCAN] Starting multi-region discovery across 4 regions...','[IAM] Found 47 users, 189 roles, 312 policies','[EC2] Found 234 instances across 4 regions','[SECURITY] 12 security groups with 0.0.0.0/0 ingress — critical','[EKS] Found 3 clusters, 47 nodes, 1,247 pods','[S3] Found 67 buckets — 6 have public access block DISABLED','[RDS] Found 18 RDS instances — all encrypted','[LAMBDA] Found 312 Lambda functions','[GUARDDUTY] Findings: 2 HIGH, 7 MEDIUM, 14 LOW','[NORMALIZE] Normalizing 1,247 resources...','[AI] Running AI enrichment and risk scoring...','[GENOME] Building knowledge graph — 4,823 edges mapped','[COMPLETE] AWS discovery complete. 1,247 resources synchronized.'],
  'azure-prod': ['[INIT] Authenticating to Azure via Service Principal...','[AUTH] Entra ID token acquired','[ENTRA] Found 312 users, 47 groups, 23 managed identities','[AKS] Found 2 clusters — aks-prod-eu, aks-dev','[VMS] Found 156 VMs across 3 regions','[KEYVAULT] Found 12 Key Vaults, 847 secrets','[NSG] 6 NSGs with inbound ANY rules — critical','[DEFENDER] Azure Defender score: 72/100','[NORMALIZE] Normalizing 654 Azure resources...','[COMPLETE] Azure discovery complete. 654 resources synchronized.'],
  'gcp-prod': ['[INIT] Authenticating to GCP via Service Account...','[GKE] Found 2 clusters with Binary Authorization enabled','[COMPUTE] Found 89 Compute Engine instances','[STORAGE] Found 34 buckets — 6 with uniform bucket-level access DISABLED','[IAM] Found 1,247 IAM bindings — 3 primitive roles flagged','[ARMOR] 4 Cloud Armor policies protecting 12 services','[NORMALIZE] Normalizing 412 GCP resources...','[COMPLETE] GCP discovery complete. 412 resources synchronized.'],
  'k8s-eks-prod': ['[INIT] Loading kubeconfig: eks-prod-main...','[SCAN] k8s v1.29.3 — 47 nodes, 23 namespaces','[RBAC] 4 ClusterRoleBindings with wildcard verbs — critical','[PODS] 1,247 running, 12 pending, 3 failed','[SECRETS] 234 secrets — 12 stale (unreferenced)','[NETPOL] 23% of pods have no NetworkPolicy','[HELM] 47 Helm releases — 12 outdated charts','[NORMALIZE] Normalizing 2,103 Kubernetes objects...','[COMPLETE] Kubernetes discovery complete. 2,103 resources synchronized.'],
  'github-org': ['[INIT] Authenticating via GitHub OAuth App...','[REPOS] Found 147 repositories (82 private, 65 public)','[ACTIONS] 312 workflow files — 23 using deprecated actions','[SECRETS] 34 org secrets, 187 repo secrets — 3 contain raw tokens','[DEPENDABOT] 47 open alerts: 12 critical, 23 high, 12 medium','[CODEQL] 8 high severity SAST findings','[BRANCHES] 15 repos missing branch protection — flagged','[NORMALIZE] Normalizing 892 GitHub objects...','[COMPLETE] GitHub discovery complete. 892 resources synchronized.'],
  'terraform-cloud': ['[INIT] Authenticating to Terraform Cloud...','[WORKSPACES] Found 34 workspaces','[DRIFT] Drift detected in 4 workspaces: aws-prod-vpc, aws-iam-roles, azure-aks, gcp-compute','[POLICIES] 312 Sentinel checks passed, 8 failed','[MODULES] 47 modules in private registry','[NORMALIZE] Normalizing 247 Terraform objects...','[COMPLETE] Terraform Cloud discovery complete. 247 resources synchronized.'],
  'cloudflare-main': ['[INIT] Authenticating to Cloudflare API...','[ZONES] Found 12 zones','[DNS] 1,847 DNS records across all zones','[WAF] 8 WAF rulesets, 234 custom rules','[WORKERS] 47 Workers deployed','[ACCESS] 23 Access policies protecting 89 applications','[NORMALIZE] Normalizing 312 Cloudflare objects...','[COMPLETE] Cloudflare discovery complete. 312 resources synchronized.'],
  'docker-registry': ['[INIT] Connecting to registry.cloudguard.io...','[IMAGES] Found 234 images, 1,247 tags','[SBOM] 87,432 packages catalogued across all images','[CVE] Critical: 12 | High: 47 | Medium: 234','[BASE] 89 images use outdated base images — flagged','[RUNTIME] 312 running containers across all hosts','[NORMALIZE] Normalizing 892 container objects...','[COMPLETE] Docker discovery complete. 892 resources synchronized.'],
};

const MAX_RESOURCES: Record<string, number> = {
  'aws-prod': 1247, 'azure-prod': 654, 'gcp-prod': 412,
  'k8s-eks-prod': 2103, 'github-org': 892, 'terraform-cloud': 247,
  'cloudflare-main': 312, 'docker-registry': 892,
};

const HEALTH_SCORES: Record<string, number> = {
  'aws-prod': 97, 'azure-prod': 91, 'gcp-prod': 94,
  'k8s-eks-prod': 99, 'github-org': 88, 'terraform-cloud': 82,
  'cloudflare-main': 96, 'docker-registry': 93,
};

const LATENCY: Record<string, number> = {
  'aws-prod': 42, 'azure-prod': 67, 'gcp-prod': 55,
  'k8s-eks-prod': 18, 'github-org': 87, 'terraform-cloud': 123,
  'cloudflare-main': 31, 'docker-registry': 24,
};

// ─── Store interface ──────────────────────────────────────────────────────────

interface GenomeSummary {
  connectedProviders: number;
  totalProviders: number;
  totalResources: number;
  riskDistribution: { critical: number; high: number; medium: number; low: number };
  providerBreakdown: { provider: string; displayName: string; resources: number; healthScore: number }[];
}

interface ConnectorStore {
  connectors: ConnectorDefinition[];
  discoveryLogs: Record<string, string[]>;
  resourceCounts: Record<string, number>;
  activeConnectorId: string | null;
  genomeSummary: GenomeSummary | null;
  eventSources: Record<string, EventSource>;
  fetchConnectors: () => Promise<void>;
  connectProvider: (id: string) => Promise<void>;
  disconnectProvider: (id: string) => Promise<void>;
  startStream: (id: string) => void;
  stopStream: (id: string) => void;
  setActiveConnector: (id: string | null) => void;
  fetchGenomeSummary: () => Promise<void>;
  appendLog: (id: string, log: string) => void;
  updateConnectorState: (id: string, newState: ConnectorState, extra?: Partial<ConnectorDefinition>) => void;
  simulateLocalDiscovery: (id: string) => void;
  recomputeGenome: () => void;
}

// ─── Store implementation ─────────────────────────────────────────────────────

export const useConnectorStore = create<ConnectorStore>((set, get) => ({
  connectors: SEED_CONNECTORS,
  discoveryLogs: {},
  resourceCounts: {},
  activeConnectorId: null,
  genomeSummary: null,
  eventSources: {},

  fetchConnectors: async () => {
    try {
      const res = await fetch(`${CONNECTOR_API}/api/v1/connectors`);
      if (!res.ok) return;
      const data = await res.json();
      set({ connectors: data.connectors ?? SEED_CONNECTORS });
    } catch {
      // connector-runtime not running — keep seed data
    }
  },

  connectProvider: async (id: string) => {
    get().updateConnectorState(id, 'validating');
    try {
      await fetch(`${CONNECTOR_API}/api/v1/connectors/${id}/connect`, { method: 'POST' });
    } catch {
      // Fall through to local simulation
    }
    get().startStream(id);
  },

  disconnectProvider: async (id: string) => {
    get().stopStream(id);
    get().updateConnectorState(id, 'idle', {
      health: null,
      totalResources: 0,
      lastConnectedAt: null,
    });
    try {
      await fetch(`${CONNECTOR_API}/api/v1/connectors/${id}/disconnect`, { method: 'POST' });
    } catch {
      // connector-runtime not running
    }
    set(state => ({
      discoveryLogs: { ...state.discoveryLogs, [id]: [] },
      resourceCounts: { ...state.resourceCounts, [id]: 0 },
    }));
  },

  startStream: (id: string) => {
    get().stopStream(id);
    set(state => ({ discoveryLogs: { ...state.discoveryLogs, [id]: [] } }));
    get().updateConnectorState(id, 'discovering');

    const es = new EventSource(`${CONNECTOR_API}/api/v1/connectors/${id}/stream`);

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'COMPLETE') {
        es.close();
        set(state => {
          const s = { ...state.eventSources };
          delete s[id];
          return { eventSources: s };
        });
        get().updateConnectorState(id, 'healthy', {
          totalResources: data.resourceCount,
          lastConnectedAt: new Date().toISOString(),
        });
        get().recomputeGenome();
        return;
      }
      if (data.type === 'LOG') {
        get().appendLog(id, data.log);
        if (data.resourceCount > 0) {
          set(state => ({ resourceCounts: { ...state.resourceCounts, [id]: data.resourceCount } }));
        }
      }
    };

    es.onerror = () => {
      es.close();
      set(state => {
        const s = { ...state.eventSources };
        delete s[id];
        return { eventSources: s };
      });
      get().simulateLocalDiscovery(id);
    };

    set(state => ({ eventSources: { ...state.eventSources, [id]: es } }));
  },

  stopStream: (id: string) => {
    const es = get().eventSources[id];
    if (es) {
      es.close();
      set(state => {
        const s = { ...state.eventSources };
        delete s[id];
        return { eventSources: s };
      });
    }
  },

  setActiveConnector: (id) => set({ activeConnectorId: id }),

  fetchGenomeSummary: async () => {
    try {
      const res = await fetch(`${CONNECTOR_API}/api/v1/genome/summary`);
      if (!res.ok) { get().recomputeGenome(); return; }
      const data = await res.json();
      set({ genomeSummary: data });
    } catch {
      get().recomputeGenome();
    }
  },

  recomputeGenome: () => {
    const connected = get().connectors.filter(c => c.state === 'healthy');
    const totalResources = connected.reduce((s, c) => s + c.totalResources, 0);
    set({
      genomeSummary: {
        connectedProviders: connected.length,
        totalProviders: get().connectors.length,
        totalResources,
        riskDistribution: {
          critical: Math.floor(totalResources * 0.018),
          high: Math.floor(totalResources * 0.062),
          medium: Math.floor(totalResources * 0.18),
          low: Math.floor(totalResources * 0.74),
        },
        providerBreakdown: connected.map(c => ({
          provider: c.provider,
          displayName: c.displayName,
          resources: c.totalResources,
          healthScore: c.health?.healthScore ?? 90,
        })),
      },
    });
  },

  appendLog: (id, log) => {
    set(state => ({
      discoveryLogs: {
        ...state.discoveryLogs,
        [id]: [...(state.discoveryLogs[id] ?? []), log],
      },
    }));
  },

  updateConnectorState: (id, newState, extra = {}) => {
    set(state => ({
      connectors: state.connectors.map(c =>
        c.id === id ? { ...c, state: newState, ...extra } : c
      ),
    }));
  },

  simulateLocalDiscovery: (id: string) => {
    const logs = PROVIDER_LOGS[id] ?? ['[COMPLETE] Discovery complete.'];
    const maxResources = MAX_RESOURCES[id] ?? 100;
    let index = 0;

    const tick = () => {
      if (index >= logs.length) {
        const latency = LATENCY[id] ?? 50;
        const health: ConnectorHealth = {
          providerId: id,
          apiLatencyMs: latency,
          lastSyncDurationMs: logs.length * 500,
          totalResources: maxResources,
          errorCount: 0,
          rateLimitUsage: Math.floor(Math.random() * 30),
          credentialStatus: 'valid',
          apiVersion: 'v1',
          webhookConnected: true,
          retryCount: 0,
          healthScore: HEALTH_SCORES[id] ?? 90,
          lastSyncAt: new Date().toISOString(),
        };
        get().updateConnectorState(id, 'healthy', {
          totalResources: maxResources,
          lastConnectedAt: new Date().toISOString(),
          health,
        });
        get().recomputeGenome();
        return;
      }
      get().appendLog(id, logs[index]);
      set(state => ({
        resourceCounts: {
          ...state.resourceCounts,
          [id]: Math.floor(((index + 1) / logs.length) * maxResources),
        },
      }));
      index++;
      setTimeout(tick, 500);
    };

    setTimeout(tick, 200);
  },
}));
