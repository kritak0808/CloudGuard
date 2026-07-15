"use client";

import { create } from 'zustand';
import type { IncidentCase, IncidentMetrics, IncidentTask, IncidentStatus } from '@cloudguard/types';

const INCIDENT_API = 'http://localhost:4004';

// ─── Seed Fallback Data ──────────────────────────────────────────────────────

const SEED_INCIDENTS: IncidentCase[] = [
  {
    id: 'INC-2026-9021',
    title: 'Container Escape & EKS Node Role Privilege Escalation',
    type: 'container_escape',
    status: 'investigating',
    severity: 'critical',
    priority: 'P0',
    owners: ['SecOps-Incident-Commander', 'AI-Lead-Investigator'],
    discoveredAt: new Date().toISOString(),
    timeline: [
      { timeOffset: '08:01', timestamp: new Date().toISOString(), title: 'Developer merged PR #1142', description: 'PR merged introducing third-party package dependencies.', type: 'deployment', status: 'info' },
      { timeOffset: '08:05', timestamp: new Date().toISOString(), title: 'CI/CD: Terraform Apply', description: 'Auto-deployed EKS pod configurations.', type: 'deployment', status: 'info' },
      { timeOffset: '08:06', timestamp: new Date().toISOString(), title: 'EKS Node IAM Policy Updated', description: 'EKS cluster node IAM policy configuration changed.', type: 'config', status: 'warning' },
      { timeOffset: '08:09', timestamp: new Date().toISOString(), title: 'Vulnerability Detected: runc Escape', description: 'Trivy scanner flagged critical runc vulnerability CVE-2024-21626.', type: 'threat', status: 'critical' },
      { timeOffset: '08:12', timestamp: new Date().toISOString(), title: 'Runtime Threat: Shell Spawned', description: 'Falco eBPF caught sh/bash spawned inside payment-processor container with uid=0.', type: 'threat', status: 'critical' },
      { timeOffset: '08:13', timestamp: new Date().toISOString(), title: 'AI Investigation Triggered', description: 'CloudGuard AI Council spun up an incident command space.', type: 'containment', status: 'warning' },
      { timeOffset: '08:18', timestamp: new Date().toISOString(), title: 'Containment Action Executed', description: 'Auto-isolated pod via Kyverno network policy and cordoned node.', type: 'containment', status: 'safe' },
      { timeOffset: '08:25', timestamp: new Date().toISOString(), title: 'Recovery Completed: Rollback', description: 'Payments service deployment rolled back to tag 2.1.3.', type: 'recovery', status: 'safe' }
    ],
    evidence: [
      { id: 'ev-9021-001', name: 'falco-ebpf-alert.json', type: 'log', payloadSummary: 'Falco runtime alert details.', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', timestamp: new Date().toISOString() },
      { id: 'ev-9021-002', name: 'eks-node-metadata-token.log', type: 'log', payloadSummary: 'CloudTrail credentials generation log.', hash: '8f9c1b78297b483fe089cb1f201089201cb298ef9cb02f182cb092cf18cf1b8f', timestamp: new Date().toISOString() }
    ],
    tasks: [
      { id: 'task-9021-001', title: 'Deactivate stolen IAM STS node sessions', assignee: 'Security Engineer', status: 'completed', dueDate: new Date().toISOString() },
      { id: 'task-9021-002', title: 'Deploy patched runc package to all node AMI templates', assignee: 'Platform Engineer', status: 'in_progress', dueDate: new Date().toISOString() },
      { id: 'task-9021-003', title: 'Audit EKS Node security group egress limitations', assignee: 'AI Agent', status: 'completed', dueDate: new Date().toISOString() }
    ],
    rootCause: {
      primaryCause: 'The payment-processor pod was running a container image vulnerable to runc escape (CVE-2024-21626), allowing root host breakouts.',
      contributingFactors: ['Missing IMDSv2 restrictions on AWS node groups.', 'Egress firewall rules allowed egress to C2 subnets.'],
      evidenceReferences: ['Trivy report', 'Falco audit alert'],
      mitreMapping: { tactic: 'Privilege Escalation', technique: 'T1611 — Escape to Host', ttpCode: 'T1611' }
    },
    postmortemCreated: false
  }
];

const SEED_METRICS: IncidentMetrics = {
  activeCount: 1,
  mttrMinutes: 28,
  mttdMinutes: 4,
  severityCounts: { critical: 1, high: 0, medium: 0, low: 0 }
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface IncidentStore {
  incidents: IncidentCase[];
  metrics: IncidentMetrics | null;
  selectedCase: IncidentCase | null;
  activeTimelineOffset: number; // 0 to timeline.length - 1
  postmortemMarkdown: string;
  isLoading: boolean;
  fetchIncidents: () => Promise<void>;
  selectCase: (id: string) => void;
  setTimelineOffset: (offset: number) => void;
  toggleTaskStatus: (caseId: string, taskId: string, completed: boolean) => Promise<void>;
  updateCaseStatus: (caseId: string, status: IncidentStatus) => Promise<void>;
  generatePostmortem: (caseId: string) => Promise<void>;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useIncidentStore = create<IncidentStore>((set, get) => ({
  incidents: SEED_INCIDENTS,
  metrics: SEED_METRICS,
  selectedCase: SEED_INCIDENTS[0],
  activeTimelineOffset: SEED_INCIDENTS[0].timeline.length - 1,
  postmortemMarkdown: '',
  isLoading: false,

  fetchIncidents: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${INCIDENT_API}/api/v1/incidents`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const selected = data.incidents?.find((c: IncidentCase) => c.id === get().selectedCase?.id) || data.incidents?.[0] || null;
      set({
        incidents: data.incidents ?? SEED_INCIDENTS,
        metrics: data.metrics ?? SEED_METRICS,
        selectedCase: selected,
        activeTimelineOffset: selected ? selected.timeline.length - 1 : 0,
        isLoading: false
      });
    } catch {
      set({ incidents: SEED_INCIDENTS, metrics: SEED_METRICS, selectedCase: SEED_INCIDENTS[0], isLoading: false });
    }
  },

  selectCase: (id) => {
    const c = get().incidents.find(i => i.id === id) || null;
    set({
      selectedCase: c,
      activeTimelineOffset: c ? c.timeline.length - 1 : 0,
      postmortemMarkdown: ''
    });
  },

  setTimelineOffset: (offset) => set({ activeTimelineOffset: offset }),

  toggleTaskStatus: async (caseId, taskId, completed) => {
    const newStatus: IncidentTask['status'] = completed ? 'completed' : 'in_progress';
    try {
      const res = await fetch(`${INCIDENT_API}/api/v1/incidents/${caseId}/tasks/${taskId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      get().fetchIncidents();
    } catch {
      // Local fallback updates
      set(s => {
        const updated = s.incidents.map(c => {
          if (c.id !== caseId) return c;
          return {
            ...c,
            tasks: c.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
          };
        });
        const active = updated.find(c => c.id === caseId) || null;
        return { incidents: updated, selectedCase: active };
      });
    }
  },

  updateCaseStatus: async (caseId, status) => {
    try {
      const res = await fetch(`${INCIDENT_API}/api/v1/incidents/${caseId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      get().fetchIncidents();
    } catch {
      // Local fallback updates
      set(s => {
        const updated = s.incidents.map(c => c.id === caseId ? { ...c, status } : c);
        const active = updated.find(c => c.id === caseId) || null;
        return { incidents: updated, selectedCase: active };
      });
    }
  },

  generatePostmortem: async (caseId) => {
    try {
      const res = await fetch(`${INCIDENT_API}/api/v1/incidents/${caseId}/postmortem`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ postmortemMarkdown: data.markdown });
      get().fetchIncidents();
    } catch {
      // Offline fallback postmortem generator
      const c = get().selectedCase;
      if (!c) return;
      const fallbackMarkdown = `# Postmortem Report: ${c.id}
## Title: ${c.title}
**Discovered At:** ${c.discoveredAt}
**Lifecycle Status:** contained & investigated

---

### Root Cause
${c.rootCause.primaryCause}

---
*Generated Offline Fallback Postmortem.*`;
      set({ postmortemMarkdown: fallbackMarkdown });
    }
  }
}));
