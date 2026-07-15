"use client";

import { create } from 'zustand';
import type {
  MemoryEntry,
  MemoryQueryResult,
  IngestedThreatIntel,
  MemoryGraphData,
  MemoryStats,
  MemoryLayer,
} from '@cloudguard/types';

const MEMORY_API = 'http://localhost:4003';

// ─── Seed stats fallback ──────────────────────────────────────────────────────

const SEED_STATS: MemoryStats = {
  totalVectors: 1747,
  graphNodes: 98,
  graphEdges: 386,
  layerCounts: {
    working: 0,
    conversation: 0,
    infrastructure: 2,
    threat: 12,
    incident: 3,
    deployment: 2,
    compliance: 0,
    executive: 2,
  },
  ingestedAdvisories: 348,
};

// ─── Seed memories fallback ───────────────────────────────────────────────────

const SEED_MEMORIES: MemoryEntry[] = [
  { id: 'mem-exec-001', layer: 'executive', title: 'Enterprise Risk Tolerance & Board Reporting Preferences', description: 'The organization has a zero-tolerance policy for internet-exposed databases, credential leaks in repositories, and unpatched CVEs on systems with direct customer database connection. Preferred communication tone is objective, technical, and formatted for weekly SecOps review.', timestamp: new Date().toISOString(), tags: ['compliance', 'audit'], metadata: {} },
  { id: 'mem-inc-001', layer: 'incident', title: 'Incident INC-2024-8843: Analytics Engine Log4Shell Exposure', description: 'A critical alert from Trivy flagged log4j-core 2.14.1 running in production namespace. The AI council initiated immediate verification, identified public ingress via ALB, and auto-generated an incident playbook to rotate credentials and deploy an upgraded jar version (2.17.1). No evidence of compromise found in VPC traffic logs.', timestamp: new Date().toISOString(), tags: ['log4shell', 'rce', 'resolved'], metadata: { cveId: 'CVE-2021-44228' } },
  { id: 'mem-inc-002', layer: 'incident', title: 'Incident INC-2025-1022: AWS Access Key Leakage & Revocation', description: 'A verified Stripe API key and AWS ACCESS KEY ID were pushed to a public test directory in variables.tf. TruffleHog detected the verified credentials immediately. CloudGuard triggered a Lambda routine to deactivate the key in IAM, rolled the Stripe API key, and purged the git history via git-filter-repo.', timestamp: new Date().toISOString(), tags: ['leak', 'secrets', 'resolved'], metadata: {} },
  { id: 'mem-infra-001', layer: 'infrastructure', title: 'IAM Role Modification History: payment-processor-role', description: 'Historical records show this role had wildcard (*) administrator permissions added on Nov 12, 2025, during testing. The permission was flagged by Checkov and subsequently restricted to DynamoDB and KMS-only read/write on Nov 14, 2025, following a security notification.', timestamp: new Date().toISOString(), tags: ['iam', 'permissions'], metadata: {} },
];

const SEED_THREATS: IngestedThreatIntel[] = [
  { id: 'CVE-2021-44228', source: 'CISA-KEV', severity: 'critical', title: 'Log4Shell Apache Log4j JNDI Remote Code Execution', description: 'Log4j2 JNDI parsing allows unauthenticated RCE via LDAP lookups.', cwe: 'CWE-917', epss: 0.9998, mitreTtp: 'T1203' },
  { id: 'CVE-2024-3094', source: 'CISA-KEV', severity: 'critical', title: 'XZ Utils Backdoor (Supply Chain Compromise)', description: 'Backdoor in liblzma intercepts sshd connections allowing unauthenticated RCE.', cwe: 'CWE-506', epss: 0.9412, mitreTtp: 'T1195.001' },
];

// Preconfigured searches local fallback
const LOCAL_SEARCHES: Record<string, MemoryQueryResult[]> = {
  'Show every incident similar to Log4Shell': [
    {
      entry: SEED_MEMORIES[1],
      similarityScore: 98,
      confidence: 99,
      retrievalReason: 'Found identical CVE-2021-44228 identifier matching the log4j-core library RCE remediation historical log.',
      supportingEvidence: ['Log4Shell Incident log INC-2024-8843', 'Maven package index history'],
      contradictoryEvidence: []
    }
  ],
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface MemoryStore {
  stats: MemoryStats | null;
  searchResults: MemoryQueryResult[];
  threats: IngestedThreatIntel[];
  graph: MemoryGraphData | null;
  searchQuery: string;
  isSearching: boolean;
  activeTab: 'search' | 'threats' | 'graph';
  fetchStats: () => Promise<void>;
  fetchThreats: () => Promise<void>;
  fetchGraph: () => Promise<void>;
  searchMemory: (query: string) => Promise<void>;
  createMemory: (memory: Omit<MemoryEntry, 'id' | 'timestamp'>) => Promise<void>;
  setSearchQuery: (q: string) => void;
  setActiveTab: (t: 'search' | 'threats' | 'graph') => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  stats: null,
  searchResults: [],
  threats: [],
  graph: null,
  searchQuery: '',
  isSearching: false,
  activeTab: 'search',

  fetchStats: async () => {
    try {
      const res = await fetch(`${MEMORY_API}/api/v1/memory/stats`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ stats: data });
    } catch {
      set({ stats: SEED_STATS });
    }
  },

  fetchThreats: async () => {
    try {
      const res = await fetch(`${MEMORY_API}/api/v1/memory/threats`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ threats: data.threats ?? SEED_THREATS });
    } catch {
      set({ threats: SEED_THREATS });
    }
  },

  fetchGraph: async () => {
    try {
      const res = await fetch(`${MEMORY_API}/api/v1/memory/graph`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ graph: data });
    } catch {
      // Build basic graph locally if offline
      const nodes = [
        { id: 'layer-executive', label: 'Executive Layer', group: 'layer' },
        { id: 'layer-incident', label: 'Incident Layer', group: 'layer' },
        ...SEED_MEMORIES.map(m => ({ id: `mem-${m.id}`, label: m.title, group: 'memory' }))
      ];
      const edges = SEED_MEMORIES.map(m => ({
        from: `mem-${m.id}`,
        to: m.layer === 'executive' ? 'layer-executive' : 'layer-incident',
        relation: 'DISCOVERED_IN'
      }));
      set({ graph: { nodes, edges } });
    }
  },

  searchMemory: async (query: string) => {
    set({ isSearching: true, searchQuery: query });
    try {
      const res = await fetch(`${MEMORY_API}/api/v1/memory/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ searchResults: data.results ?? [], isSearching: false });
    } catch {
      // Fallback matching
      setTimeout(() => {
        const local = LOCAL_SEARCHES[query];
        if (local) {
          set({ searchResults: local, isSearching: false });
          return;
        }

        // basic fallback regex check
        const queryLower = query.toLowerCase();
        const results = SEED_MEMORIES.filter(m =>
          m.title.toLowerCase().includes(queryLower) ||
          m.description.toLowerCase().includes(queryLower)
        ).map(m => ({
          entry: m,
          similarityScore: 82,
          confidence: 78,
          retrievalReason: 'Offline keyword lookup match inside seed memories database.',
          supportingEvidence: ['Seed data registry match'],
          contradictoryEvidence: []
        }));
        set({ searchResults: results, isSearching: false });
      }, 400);
    }
  },

  createMemory: async (newMemory) => {
    try {
      const res = await fetch(`${MEMORY_API}/api/v1/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemory),
      });
      if (res.ok) {
        get().fetchStats();
      }
    } catch {
      // Add locally
      const entry: MemoryEntry = {
        ...newMemory,
        id: `mem-local-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      SEED_MEMORIES.push(entry);
      get().fetchStats();
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveTab: (activeTab) => set({ activeTab }),
}));
