"use client";

import { create } from 'zustand';
import type {
  TenantIsolationProfile,
  UserAccount,
  UserSession,
  ABACPolicy,
  SignedAuditLog,
  ApiKeyProfile,
  ServiceAccount,
  DirectoryNode,
  ComplianceEvidence,
  EnterpriseConfig,
  DeviceTrustProfile
} from '@cloudguard/types';

const IDENTITY_API = 'http://localhost:4006';

// ─── Seed Fallbacks ──────────────────────────────────────────────────────────

const SEED_TENANTS: TenantIsolationProfile[] = [
  {
    tenantId: 't-cyberdyne-sys',
    name: 'Cyberdyne Systems Research',
    databaseIsolated: true,
    byokArn: 'arn:aws:kms:us-west-2:9988776655:key/7d8f9b0c-9022-4aef-bb88-34200cbef9cf',
    retentionDays: 730,
    isolation: {
      databaseIsolated: true,
      byokArn: 'arn:aws:kms:us-west-2:9988776655:key/7d8f9b0c-9022-4aef-bb88-34200cbef9cf',
      retentionDays: 730,
      backupIntervalHours: 12,
      legalHoldActive: false,
      rightToErasureLogs: ['erasure-usr-881-completed', 'erasure-usr-894-completed']
    }
  },
  {
    tenantId: 't-acme-prod',
    name: 'Acme Corporate Enterprise',
    databaseIsolated: true,
    byokArn: 'arn:aws:kms:us-east-1:1122334455:key/28b8f2cb-8021-4433-aefb-0912ab8f9cb1',
    retentionDays: 365,
    isolation: {
      databaseIsolated: true,
      byokArn: 'arn:aws:kms:us-east-1:1122334455:key/28b8f2cb-8021-4433-aefb-0912ab8f9cb1',
      retentionDays: 365,
      backupIntervalHours: 24,
      legalHoldActive: false,
      rightToErasureLogs: []
    }
  }
];

const SEED_USERS: UserAccount[] = [
  { id: 'usr-901', name: 'Commander Sarah Connor', email: 's.connor@cyberdyne.io', role: 'Incident Commander', department: 'SecOps', businessUnit: 'Defense Systems', status: 'active', mfaEnabled: true, lastLoginAt: new Date().toISOString() },
  { id: 'usr-902', name: 'Arch John Connor', email: 'j.connor@cyberdyne.io', role: 'Cloud Administrator', department: 'Platform Engineering', businessUnit: 'Core Infra', status: 'active', mfaEnabled: true, lastLoginAt: new Date().toISOString() },
  { id: 'usr-903', name: 'Officer Miles Dyson', email: 'm.dyson@cyberdyne.io', role: 'Compliance Officer', department: 'Risk Governance', businessUnit: 'Ethics Systems', status: 'active', mfaEnabled: true, lastLoginAt: new Date().toISOString() },
  { id: 'usr-904', name: 'Developer T-800', email: 't800@cyberdyne.io', role: 'Developer', department: 'Automation Dev', businessUnit: 'Terminator Core', status: 'active', mfaEnabled: false, lastLoginAt: new Date().toISOString() }
];

const SEED_SESSIONS: UserSession[] = [
  {
    sessionId: 'sess-0091',
    userId: 'usr-901',
    device: {
      deviceFingerprint: 'df-mac-safari-9021', os: 'macOS Sonoma (14.5)', browser: 'Safari 17.5',
      ip: '198.51.100.12', location: 'Los Angeles, CA', mfaStatus: 'verified', riskScore: 2
    },
    lastActive: new Date().toISOString(),
    tokenRotations: 4
  }
];

const SEED_POLICIES: ABACPolicy[] = [
  {
    id: 'pol-001',
    name: 'Restrict Remediation to Incident Commanders in Prod',
    resourceType: 'remediation',
    effect: 'allow',
    conditions: { roles: ['Incident Commander', 'Platform Owner'], departments: ['SecOps', 'Platform Engineering'], environments: ['production'], maxRiskLevel: 30 }
  }
];

const SEED_KEYS: ApiKeyProfile[] = [
  { id: 'key-01', name: 'connector-runtime-sync-key', scope: 'connectors:write', keyPrefix: 'cg_live_conn', createdAt: new Date().toISOString(), expiresAt: new Date().toISOString(), lastUsedAt: new Date().toISOString(), status: 'active' }
];

const SEED_AUDIT_LOGS: SignedAuditLog[] = [
  { id: 'aud-001', eventType: 'UserLogin', actor: 's.connor@cyberdyne.io', tenantId: 't-cyberdyne-sys', outcome: 'success', timestamp: new Date().toISOString(), signature: '8f9c1b78297b483fe089cb1f201089201cb298ef9cb02f182cb092cf18cf1b8f' }
];

// ─── Store Interface ──────────────────────────────────────────────────────────

interface IdentityStore {
  tenants: TenantIsolationProfile[];
  activeTenant: TenantIsolationProfile | null;
  users: UserAccount[];
  sessions: UserSession[];
  apiKeys: ApiKeyProfile[];
  serviceAccounts: ServiceAccount[];
  policies: ABACPolicy[];
  auditLogs: SignedAuditLog[];
  complianceEvidence: ComplianceEvidence[];
  directory: DirectoryNode | null;
  config: EnterpriseConfig | null;
  isLoading: boolean;

  // Simulated context settings
  activeSessionId: string | null;
  activeEnvironment: string;
  simulatedDevice: DeviceTrustProfile;

  // Actions
  fetchIdentityData: () => Promise<void>;
  switchTenant: (tenantId: string) => void;
  terminateSession: (sessId: string) => Promise<void>;
  upsertPolicy: (policy: ABACPolicy) => Promise<void>;
  deletePolicy: (policyId: string) => Promise<void>;
  provisionSCIM: (csvContent: string) => Promise<void>;

  // Zero Trust Context simulation controls
  setSimulatedOperator: (userId: string) => void;
  setDeviceRiskScore: (score: number) => void;
  setMfaStatus: (verified: boolean) => void;
  setEnvironment: (env: string) => void;

  // Advanced settings
  updateBYOK: (byokArn: string) => Promise<void>;
  setLegalHold: (active: boolean) => void;
  triggerRightToErasure: (userEmail: string) => Promise<void>;
  createApiKey: (name: string, scope: string) => Promise<void>;
  revokeApiKey: (keyId: string) => Promise<void>;
  createServiceAccount: (name: string, scope: string) => Promise<void>;
  rotateServiceAccount: (saId: string) => Promise<void>;
  updateConfig: (cfg: Partial<EnterpriseConfig>) => Promise<void>;
  exportComplianceEvidence: () => Promise<void>;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useIdentityStore = create<IdentityStore>((set, get) => ({
  tenants: SEED_TENANTS,
  activeTenant: SEED_TENANTS[0],
  users: SEED_USERS,
  sessions: SEED_SESSIONS,
  apiKeys: SEED_KEYS,
  serviceAccounts: [],
  policies: SEED_POLICIES,
  auditLogs: SEED_AUDIT_LOGS,
  complianceEvidence: [],
  directory: null,
  config: null,
  isLoading: false,

  // Default simulated context
  activeSessionId: 'sess-0091',
  activeEnvironment: 'production',
  simulatedDevice: {
    deviceFingerprint: 'df-mac-safari-9021',
    os: 'macOS Sonoma (14.5)',
    browser: 'Safari 17.5',
    ip: '198.51.100.12',
    location: 'Los Angeles, CA',
    mfaStatus: 'verified',
    riskScore: 2
  },

  fetchIdentityData: async () => {
    set({ isLoading: true });
    try {
      const resTen = await fetch(`${IDENTITY_API}/api/v1/identity/tenants`);
      const dataTen = resTen.ok ? await resTen.json() : null;

      const resUsr = await fetch(`${IDENTITY_API}/api/v1/identity/users`);
      const dataUsr = resUsr.ok ? await resUsr.json() : null;

      const resPol = await fetch(`${IDENTITY_API}/api/v1/identity/policies`);
      const dataPol = resPol.ok ? await resPol.json() : null;

      const resAud = await fetch(`${IDENTITY_API}/api/v1/identity/audit`);
      const dataAud = resAud.ok ? await resAud.json() : null;

      const resSA = await fetch(`${IDENTITY_API}/api/v1/identity/service-accounts`);
      const dataSA = resSA.ok ? await resSA.json() : null;

      const resDir = await fetch(`${IDENTITY_API}/api/v1/identity/directory`);
      const dataDir = resDir.ok ? await resDir.json() : null;

      const resCfg = await fetch(`${IDENTITY_API}/api/v1/identity/settings`);
      const dataCfg = resCfg.ok ? await resCfg.json() : null;

      const resEv = await fetch(`${IDENTITY_API}/api/v1/identity/compliance/evidence`);
      const dataEv = resEv.ok ? await resEv.json() : null;

      const tenantsList = dataTen?.tenants ?? SEED_TENANTS;
      const active = get().activeTenant
        ? (tenantsList.find((t: TenantIsolationProfile) => t.tenantId === get().activeTenant?.tenantId) || tenantsList[0])
        : tenantsList[0];

      // Sync active session details if user changes simulatedOperator
      const curSessions = dataUsr?.sessions ?? SEED_SESSIONS;
      const activeSess = curSessions.find((s: UserSession) => s.sessionId === get().activeSessionId) || curSessions[0];

      set({
        tenants: tenantsList,
        activeTenant: active,
        users: dataUsr?.users ?? SEED_USERS,
        sessions: curSessions,
        apiKeys: dataUsr?.apiKeys ?? SEED_KEYS,
        serviceAccounts: dataSA?.serviceAccounts ?? [],
        policies: dataPol?.policies ?? SEED_POLICIES,
        auditLogs: dataAud?.auditLogs ?? SEED_AUDIT_LOGS,
        directory: dataDir?.directory ?? null,
        config: dataCfg?.config ?? null,
        complianceEvidence: dataEv?.evidence ?? [],
        activeSessionId: activeSess ? activeSess.sessionId : null,
        simulatedDevice: activeSess ? activeSess.device : get().simulatedDevice,
        isLoading: false
      });
    } catch {
      set({ isLoading: false });
    }
  },

  switchTenant: (tenantId) => {
    const t = get().tenants.find(ten => ten.tenantId === tenantId) || null;
    set({ activeTenant: t });
  },

  terminateSession: async (sessId) => {
    try {
      const res = await fetch(`${IDENTITY_API}/api/v1/identity/sessions/${sessId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await get().fetchIdentityData();
    } catch {
      // Local fallback
      set(s => ({
        sessions: s.sessions.filter(se => se.sessionId !== sessId),
        activeSessionId: s.activeSessionId === sessId ? null : s.activeSessionId
      }));
    }
  },

  upsertPolicy: async (policy) => {
    try {
      const res = await fetch(`${IDENTITY_API}/api/v1/identity/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      });
      if (!res.ok) throw new Error();
      await get().fetchIdentityData();
    } catch {
      set(s => {
        const idx = s.policies.findIndex(p => p.id === policy.id);
        const updated = [...s.policies];
        if (idx !== -1) updated[idx] = policy;
        else updated.push(policy);
        return { policies: updated };
      });
    }
  },

  deletePolicy: async (policyId) => {
    try {
      const res = await fetch(`${IDENTITY_API}/api/v1/identity/policies/${policyId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await get().fetchIdentityData();
    } catch {
      set(s => ({ policies: s.policies.filter(p => p.id !== policyId) }));
    }
  },

  provisionSCIM: async (csvContent) => {
    try {
      const res = await fetch(`${IDENTITY_API}/api/v1/identity/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvString: csvContent }),
      });
      if (!res.ok) throw new Error();
      await get().fetchIdentityData();
    } catch {
      // Local CSV parsing fallback
      const lines = csvContent.split('\n').filter(l => l.trim() !== '');
      const newUsers: UserAccount[] = [];
      for (const line of lines) {
        if (line.startsWith('name,email')) continue;
        const parts = line.split(',');
        if (parts.length >= 3) {
          newUsers.push({
            id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: parts[0].trim(),
            email: parts[1].trim(),
            role: parts[2].trim(),
            department: parts[3]?.trim() || 'Development',
            businessUnit: parts[4]?.trim() || 'Core Product',
            status: 'active',
            mfaEnabled: true
          });
        }
      }
      set(s => ({ users: [...s.users, ...newUsers] }));
    }
  },

  // Zero Trust Context Simulation Controls
  setSimulatedOperator: (userId) => {
    const user = get().users.find(u => u.id === userId);
    const existingSession = get().sessions.find(s => s.userId === userId);

    if (existingSession) {
      set({
        activeSessionId: existingSession.sessionId,
        simulatedDevice: existingSession.device
      });
    } else if (user) {
      // Generate a mock session locally if none is running
      const newSess: UserSession = {
        sessionId: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: user.id,
        device: {
          deviceFingerprint: `df-mock-${Math.floor(Math.random() * 1000)}`,
          os: 'macOS Sonoma (14.5)',
          browser: 'Safari 17.5',
          ip: '198.51.100.12',
          location: 'Los Angeles, CA',
          mfaStatus: user.mfaEnabled ? 'verified' : 'unverified',
          riskScore: user.mfaEnabled ? 2 : 45
        },
        lastActive: new Date().toISOString(),
        tokenRotations: 1
      };
      set(s => ({
        sessions: [newSess, ...s.sessions],
        activeSessionId: newSess.sessionId,
        simulatedDevice: newSess.device
      }));
    }
  },

  setDeviceRiskScore: (score) => {
    set(s => {
      if (!s.simulatedDevice) return {};
      const updatedDevice = { ...s.simulatedDevice, riskScore: score };
      const updatedSessions = s.sessions.map(se =>
        se.sessionId === s.activeSessionId ? { ...se, device: updatedDevice } : se
      );
      return {
        simulatedDevice: updatedDevice,
        sessions: updatedSessions
      };
    });
  },

  setMfaStatus: (verified) => {
    set(s => {
      if (!s.simulatedDevice) return {};
      const updatedDevice = { ...s.simulatedDevice, mfaStatus: verified ? 'verified' as const : 'unverified' as const };
      const updatedSessions = s.sessions.map(se =>
        se.sessionId === s.activeSessionId ? { ...se, device: updatedDevice } : se
      );
      return {
        simulatedDevice: updatedDevice,
        sessions: updatedSessions
      };
    });
  },

  setEnvironment: (env) => {
    set({ activeEnvironment: env });
  },

  // Advanced controls
  updateBYOK: async (byokArn) => {
    try {
      const activeId = get().activeTenant?.tenantId;
      if (!activeId) return;
      const res = await fetch(`${IDENTITY_API}/api/v1/identity/tenants/${activeId}/byok`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ byokArn })
      });
      if (res.ok) {
        await get().fetchIdentityData();
      }
    } catch {
      set(s => {
        if (!s.activeTenant) return {};
        const updated = {
          ...s.activeTenant,
          byokArn,
          isolation: { ...s.activeTenant.isolation, byokArn }
        };
        return {
          activeTenant: updated,
          tenants: s.tenants.map(t => t.tenantId === s.activeTenant?.tenantId ? updated : t)
        };
      });
    }
  },

  setLegalHold: (active) => {
    set(s => {
      if (!s.activeTenant) return {};
      const updated = {
        ...s.activeTenant,
        isolation: { ...s.activeTenant.isolation, legalHoldActive: active }
      };
      return {
        activeTenant: updated,
        tenants: s.tenants.map(t => t.tenantId === s.activeTenant?.tenantId ? updated : t)
      };
    });
  },

  triggerRightToErasure: async (userEmail) => {
    set(s => {
      if (!s.activeTenant) return {};
      const currentLogs = s.activeTenant.isolation.rightToErasureLogs || [];
      const updated = {
        ...s.activeTenant,
        isolation: {
          ...s.activeTenant.isolation,
          rightToErasureLogs: [...currentLogs, `erasure-request-for-${userEmail}-completed-${new Date().toISOString()}`]
        }
      };
      return {
        activeTenant: updated,
        tenants: s.tenants.map(t => t.tenantId === s.activeTenant?.tenantId ? updated : t)
      };
    });
  },

  createApiKey: async (name, scope) => {
    try {
      const res = await fetch(`${IDENTITY_API}/api/v1/identity/apikeys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, scope })
      });
      if (res.ok) {
        await get().fetchIdentityData();
      }
    } catch {
      const newKey: ApiKeyProfile = {
        id: `key-${Date.now()}`,
        name,
        scope,
        keyPrefix: `cg_live_${name.substring(0, 4).toLowerCase()}`,
        createdAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        status: 'active'
      };
      set(s => ({ apiKeys: [...s.apiKeys, newKey] }));
    }
  },

  revokeApiKey: async (keyId) => {
    try {
      const res = await fetch(`${IDENTITY_API}/api/v1/identity/apikeys/${keyId}`, { method: 'DELETE' });
      if (res.ok) {
        await get().fetchIdentityData();
      }
    } catch {
      set(s => ({
        apiKeys: s.apiKeys.map(k => k.id === keyId ? { ...k, status: 'revoked' as const } : k)
      }));
    }
  },

  createServiceAccount: async (name, scope) => {
    try {
      const res = await fetch(`${IDENTITY_API}/api/v1/identity/service-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, scope })
      });
      if (res.ok) {
        await get().fetchIdentityData();
      }
    } catch {
      const newSA: ServiceAccount = {
        id: `sa-${Date.now()}`,
        name,
        clientId: `cg-sa-${name.toLowerCase()}`,
        scope,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        lastRotatedAt: new Date().toISOString(),
        secretHash: 'local-fallback-hash'
      };
      set(s => ({ serviceAccounts: [...s.serviceAccounts, newSA] }));
    }
  },

  rotateServiceAccount: async (saId) => {
    try {
      const res = await fetch(`${IDENTITY_API}/api/v1/identity/service-accounts/${saId}/rotate`, { method: 'POST' });
      if (res.ok) {
        await get().fetchIdentityData();
      }
    } catch {
      set(s => ({
        serviceAccounts: s.serviceAccounts.map(sa =>
          sa.id === saId ? { ...sa, lastRotatedAt: new Date().toISOString() } : sa
        )
      }));
    }
  },

  updateConfig: async (cfg) => {
    try {
      const res = await fetch(`${IDENTITY_API}/api/v1/identity/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      });
      if (res.ok) {
        await get().fetchIdentityData();
      }
    } catch {
      set(s => ({
        config: s.config ? { ...s.config, ...cfg } as EnterpriseConfig : null
      }));
    }
  },

  exportComplianceEvidence: async () => {
    const rawData = JSON.stringify(get().complianceEvidence, null, 2);
    const blob = new Blob([rawData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cloudguard_compliance_evidence_${get().activeTenant?.tenantId}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}));

// ─── Fetch Interception wrapping for Zero Trust ──────────────────────────────

if (typeof window !== 'undefined' && !(window as unknown as { __fetchPatched?: boolean }).__fetchPatched) {
  (window as unknown as { __fetchPatched?: boolean }).__fetchPatched = true;
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const state = useIdentityStore.getState();
    const token = state.activeSessionId ? `Bearer ${state.activeSessionId}` : '';
    const tenantId = state.activeTenant?.tenantId || 't-cyberdyne-sys';
    const device = state.simulatedDevice;
    const environment = state.activeEnvironment;

    const modifiedInit = { ...(init || {}) };
    const headers = new Headers(modifiedInit.headers || {});

    const urlString = typeof input === 'string' ? input : (input as Request).url;
    if (
      urlString.includes('localhost:4000') ||
      urlString.includes('localhost:4001') ||
      urlString.includes('localhost:4002') ||
      urlString.includes('localhost:4003') ||
      urlString.includes('localhost:4004') ||
      urlString.includes('localhost:4005') ||
      urlString.includes('localhost:4006')
    ) {
      if (!headers.has('Authorization') && token) {
        headers.set('Authorization', token);
      }
      if (!headers.has('X-Tenant-Id')) {
        headers.set('X-Tenant-Id', tenantId);
      }
      if (device) {
        if (!headers.has('X-Device-Fingerprint')) headers.set('X-Device-Fingerprint', device.deviceFingerprint);
        if (!headers.has('X-IP-Address')) headers.set('X-IP-Address', device.ip);
        if (!headers.has('X-Device-Risk')) headers.set('X-Device-Risk', String(device.riskScore));
      }
      if (!headers.has('X-Environment')) {
        headers.set('X-Environment', environment);
      }
    }

    modifiedInit.headers = headers;

    try {
      const response = await originalFetch(input, modifiedInit);
      if (response.status === 403) {
        const clone = response.clone();
        clone.json().then(data => {
          if (data && data.error === 'Zero Trust Block') {
            window.dispatchEvent(new CustomEvent('zero-trust-block', { detail: data.reason }));
          }
        }).catch(() => {});
      }
      return response;
    } catch {
      return originalFetch(input, modifiedInit);
    }
  };
}
