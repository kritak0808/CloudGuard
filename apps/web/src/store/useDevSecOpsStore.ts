"use client";

import { create } from 'zustand';
import type {
  GitRepository,
  PullRequest,
  DevSecOpsPipeline,
  GitOpsDeployment,
  ArtifactValidation,
  RollbackExecution
} from '@cloudguard/types';

const DEVSECOPS_API = 'http://localhost:4007';

interface DevSecOpsStore {
  repositories: GitRepository[];
  pullRequests: PullRequest[];
  pipelines: DevSecOpsPipeline[];
  deployments: GitOpsDeployment[];
  validations: ArtifactValidation[];
  rollbacks: RollbackExecution[];
  knowledgeGraph: { nodes: { id: string; label: string; group: string }[]; edges: { from: string; to: string; relation: string }[] } | null;
  isLoading: boolean;

  fetchDevSecOpsData: () => Promise<void>;
  triggerPrReview: (prId: string) => Promise<void>;
  triggerPipelineRun: (pipeId: string) => Promise<void>;
  promoteDeployment: (depId: string) => Promise<void>;
  triggerRollback: (deploymentId: string, type: string, reason: string) => Promise<void>;
  validateArtifact: (payload: { imageName: string; tag: string; digest?: string; cosignSignature?: boolean; slsaProvenance?: boolean }) => Promise<void>;
}

export const useDevSecOpsStore = create<DevSecOpsStore>((set, get) => ({
  repositories: [],
  pullRequests: [],
  pipelines: [],
  deployments: [],
  validations: [],
  rollbacks: [],
  knowledgeGraph: null,
  isLoading: false,

  fetchDevSecOpsData: async () => {
    set({ isLoading: true });
    try {
      const resRepos = await fetch(`${DEVSECOPS_API}/api/v1/devsecops/repos`);
      const dataRepos = resRepos.ok ? await resRepos.json() : null;

      const resPrs = await fetch(`${DEVSECOPS_API}/api/v1/devsecops/prs`);
      const dataPrs = resPrs.ok ? await resPrs.json() : null;

      const resPipes = await fetch(`${DEVSECOPS_API}/api/v1/devsecops/pipelines`);
      const dataPipes = resPipes.ok ? await resPipes.json() : null;

      const resDeps = await fetch(`${DEVSECOPS_API}/api/v1/devsecops/deployments`);
      const dataDeps = resDeps.ok ? await resDeps.json() : null;

      const resVal = await fetch(`${DEVSECOPS_API}/api/v1/devsecops/artifacts/validate`);
      const dataVal = resVal.ok ? await resVal.json() : null;

      const resRolls = await fetch(`${DEVSECOPS_API}/api/v1/devsecops/rollbacks`);
      const dataRolls = resRolls.ok ? await resRolls.json() : null;

      const resGraph = await fetch(`${DEVSECOPS_API}/api/v1/devsecops/graph`);
      const dataGraph = resGraph.ok ? await resGraph.json() : null;

      set({
        repositories: dataRepos?.repositories ?? [],
        pullRequests: dataPrs?.pullRequests ?? [],
        pipelines: dataPipes?.pipelines ?? [],
        deployments: dataDeps?.deployments ?? [],
        validations: dataVal?.validations ?? [],
        rollbacks: dataRolls?.rollbacks ?? [],
        knowledgeGraph: dataGraph?.graph ?? null,
        isLoading: false
      });
    } catch (e) {
      console.error('Failed to load DevSecOps data:', e);
      set({ isLoading: false });
    }
  },

  triggerPrReview: async (prId) => {
    try {
      const res = await fetch(`${DEVSECOPS_API}/api/v1/devsecops/prs/${prId}/review`, { method: 'POST' });
      if (res.ok) {
        await get().fetchDevSecOpsData();
      }
    } catch (e) {
      console.error(e);
    }
  },

  triggerPipelineRun: async (pipeId) => {
    try {
      const res = await fetch(`${DEVSECOPS_API}/api/v1/devsecops/pipelines/${pipeId}/run`, { method: 'POST' });
      if (res.ok) {
        await get().fetchDevSecOpsData();
        // Poll for updates to simulate completion
        setTimeout(async () => {
          await get().fetchDevSecOpsData();
        }, 5000);
      }
    } catch (e) {
      console.error(e);
    }
  },

  promoteDeployment: async (depId) => {
    try {
      const res = await fetch(`${DEVSECOPS_API}/api/v1/devsecops/deployments/${depId}/promote`, { method: 'POST' });
      if (res.ok) {
        await get().fetchDevSecOpsData();
        setTimeout(async () => {
          await get().fetchDevSecOpsData();
        }, 4000);
      }
    } catch (e) {
      console.error(e);
    }
  },

  triggerRollback: async (deploymentId, type, reason) => {
    try {
      const res = await fetch(`${DEVSECOPS_API}/api/v1/devsecops/rollbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deploymentId, type, reason })
      });
      if (res.ok) {
        await get().fetchDevSecOpsData();
        setTimeout(async () => {
          await get().fetchDevSecOpsData();
        }, 5000);
      }
    } catch (e) {
      console.error(e);
    }
  },

  validateArtifact: async (payload) => {
    try {
      const res = await fetch(`${DEVSECOPS_API}/api/v1/devsecops/artifacts/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await get().fetchDevSecOpsData();
      }
    } catch (e) {
      console.error(e);
    }
  }
}));
