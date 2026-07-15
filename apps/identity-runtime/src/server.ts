import express, { Request, Response } from 'express';
import cors from 'cors';
import crypto from 'crypto';

import {
  seedTenants,
  usersDatabase,
  sessionsDatabase,
  policiesDatabase,
  apiKeysDatabase,
  serviceAccountsDatabase,
  directoryDatabase,
  configDatabase,
  signedAuditLogsDatabase,
  complianceEvidenceDatabase,
  signAuditEntry,
  signEvidenceEntry
} from './data/identityData.js';
import type { SignedAuditLog, ABACPolicy, UserAccount, UserSession, ApiKeyProfile, ServiceAccount, ComplianceEvidence } from '@cloudguard/types';

const app = express();
const PORT = 4006;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'HEALTHY', service: 'identity-runtime', port: PORT, timestamp: Date.now() });
});

// ─── Tenants & BYOK ──────────────────────────────────────────────────────────

app.get('/api/v1/identity/tenants', (_req: Request, res: Response) => {
  res.json({ tenants: seedTenants });
});

app.post('/api/v1/identity/tenants/:id/byok', (req: Request, res: Response) => {
  const tenantId = req.params.id;
  const { byokArn } = req.body as { byokArn: string };
  const tenant = seedTenants.find(t => t.tenantId === tenantId);
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }
  tenant.byokArn = byokArn;
  tenant.isolation.byokArn = byokArn;

  const rawLog: Omit<SignedAuditLog, 'signature'> = {
    id: `aud-${Date.now()}`,
    eventType: 'BYOKUpdated',
    actor: 'j.connor@cyberdyne.io',
    tenantId,
    outcome: 'success',
    timestamp: new Date().toISOString(),
    details: `KMS BYOK Key ARN updated: ${byokArn}`
  };
  signedAuditLogsDatabase.push(signAuditEntry(rawLog));

  res.json({ status: 'UPDATED', tenant });
});

// ─── Users & Sessions ─────────────────────────────────────────────────────────

app.get('/api/v1/identity/users', (_req: Request, res: Response) => {
  res.json({
    users: usersDatabase,
    sessions: sessionsDatabase,
    apiKeys: apiKeysDatabase
  });
});

app.post('/api/v1/identity/auth/login', (req: Request, res: Response) => {
  const { email, password, ssoProvider, mfaCode } = req.body;
  const user = usersDatabase.find(u => u.email === email);
  if (!user) {
    res.status(401).json({ error: 'Authentication failed: User not found' });
    return;
  }

  // Create new session
  const newSession: UserSession = {
    sessionId: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    device: {
      deviceFingerprint: `df-mock-${Math.floor(Math.random() * 10000)}`,
      os: 'macOS Sonoma (14.5)',
      browser: 'Chrome 126.0',
      ip: '198.51.100.12',
      location: 'Los Angeles, CA',
      mfaStatus: user.mfaEnabled ? 'unverified' : 'verified',
      riskScore: user.mfaEnabled ? 45 : 10
    },
    lastActive: new Date().toISOString(),
    tokenRotations: 0
  };

  sessionsDatabase.push(newSession);

  // Audit
  const rawLog: Omit<SignedAuditLog, 'signature'> = {
    id: `aud-${Date.now()}`,
    eventType: 'UserLogin',
    actor: user.email,
    tenantId: 't-cyberdyne-sys',
    outcome: 'success',
    timestamp: new Date().toISOString(),
    details: `Session initiated: ${newSession.sessionId} (MFA required: ${user.mfaEnabled})`
  };
  signedAuditLogsDatabase.push(signAuditEntry(rawLog));

  res.json({ session: newSession, user });
});

app.post('/api/v1/identity/auth/mfa', (req: Request, res: Response) => {
  const { sessionId } = req.body;
  const session = sessionsDatabase.find(s => s.sessionId === sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  session.device.mfaStatus = 'verified';
  session.device.riskScore = Math.max(2, session.device.riskScore - 30); // Reduce risk
  session.lastActive = new Date().toISOString();

  const user = usersDatabase.find(u => u.id === session.userId);

  // Audit
  const rawLog: Omit<SignedAuditLog, 'signature'> = {
    id: `aud-${Date.now()}`,
    eventType: 'MFAChallengePassed',
    actor: user?.email || 'unknown',
    tenantId: 't-cyberdyne-sys',
    outcome: 'success',
    timestamp: new Date().toISOString(),
    details: `MFA verified for session: ${sessionId}`
  };
  signedAuditLogsDatabase.push(signAuditEntry(rawLog));

  res.json({ status: 'MFA_VERIFIED', session });
});

app.delete('/api/v1/identity/sessions/:id', (req: Request, res: Response) => {
  const sessId = req.params.id;
  const idx = sessionsDatabase.findIndex(s => s.sessionId === sessId);
  if (idx === -1) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const deleted = sessionsDatabase[idx];
  sessionsDatabase.splice(idx, 1);

  const user = usersDatabase.find(u => u.id === deleted.userId);

  // Append signed audit log
  const rawLog: Omit<SignedAuditLog, 'signature'> = {
    id: `aud-${Date.now()}`,
    eventType: 'SessionRevoked',
    actor: user?.email || 'unknown',
    tenantId: 't-cyberdyne-sys',
    outcome: 'success',
    timestamp: new Date().toISOString(),
    details: `Remote logout triggered for session: ${sessId}`
  };
  signedAuditLogsDatabase.push(signAuditEntry(rawLog));

  res.json({ status: 'TERMINATED', sessionId: sessId });
});

// ─── API Keys & Service Accounts ──────────────────────────────────────────────

app.get('/api/v1/identity/apikeys', (_req: Request, res: Response) => {
  res.json({ apiKeys: apiKeysDatabase });
});

app.post('/api/v1/identity/apikeys', (req: Request, res: Response) => {
  const { name, scope } = req.body;
  if (!name || !scope) {
    res.status(400).json({ error: 'Name and scope are required' });
    return;
  }

  const newKey: ApiKeyProfile = {
    id: `key-${Date.now()}`,
    name,
    scope,
    keyPrefix: `cg_live_${name.substring(0, 4).toLowerCase()}`,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days
    lastUsedAt: new Date().toISOString(),
    status: 'active'
  };

  apiKeysDatabase.push(newKey);

  // Audit
  const rawLog: Omit<SignedAuditLog, 'signature'> = {
    id: `aud-${Date.now()}`,
    eventType: 'ApiKeyCreated',
    actor: 'j.connor@cyberdyne.io',
    tenantId: 't-cyberdyne-sys',
    outcome: 'success',
    timestamp: new Date().toISOString(),
    details: `API Key created: ${newKey.name} with scope: ${scope}`
  };
  signedAuditLogsDatabase.push(signAuditEntry(rawLog));

  res.json(newKey);
});

app.delete('/api/v1/identity/apikeys/:id', (req: Request, res: Response) => {
  const keyId = req.params.id;
  const idx = apiKeysDatabase.findIndex(k => k.id === keyId);
  if (idx === -1) {
    res.status(404).json({ error: 'API Key not found' });
    return;
  }

  const revoked = apiKeysDatabase[idx];
  revoked.status = 'revoked';

  // Audit
  const rawLog: Omit<SignedAuditLog, 'signature'> = {
    id: `aud-${Date.now()}`,
    eventType: 'ApiKeyRevoked',
    actor: 'j.connor@cyberdyne.io',
    tenantId: 't-cyberdyne-sys',
    outcome: 'success',
    timestamp: new Date().toISOString(),
    details: `Revoked API Key: ${revoked.name}`
  };
  signedAuditLogsDatabase.push(signAuditEntry(rawLog));

  res.json({ status: 'REVOKED', keyId });
});

app.get('/api/v1/identity/service-accounts', (_req: Request, res: Response) => {
  res.json({ serviceAccounts: serviceAccountsDatabase });
});

app.post('/api/v1/identity/service-accounts', (req: Request, res: Response) => {
  const { name, scope } = req.body;
  if (!name || !scope) {
    res.status(400).json({ error: 'Name and scope are required' });
    return;
  }

  const newSA: ServiceAccount = {
    id: `sa-${Date.now()}`,
    name,
    clientId: `cg-sa-${name.toLowerCase()}-${Math.floor(Math.random() * 1000)}`,
    scope,
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastRotatedAt: new Date().toISOString(),
    secretHash: crypto.createHash('sha256').update(`secret-${Date.now()}`).digest('hex')
  };

  serviceAccountsDatabase.push(newSA);

  // Audit
  const rawLog: Omit<SignedAuditLog, 'signature'> = {
    id: `aud-${Date.now()}`,
    eventType: 'ServiceAccountCreated',
    actor: 'j.connor@cyberdyne.io',
    tenantId: 't-cyberdyne-sys',
    outcome: 'success',
    timestamp: new Date().toISOString(),
    details: `Service account generated: ${newSA.name} (ClientId: ${newSA.clientId})`
  };
  signedAuditLogsDatabase.push(signAuditEntry(rawLog));

  res.json(newSA);
});

app.post('/api/v1/identity/service-accounts/:id/rotate', (req: Request, res: Response) => {
  const saId = req.params.id;
  const sa = serviceAccountsDatabase.find(s => s.id === saId);
  if (!sa) {
    res.status(404).json({ error: 'Service account not found' });
    return;
  }

  sa.lastRotatedAt = new Date().toISOString();
  sa.secretHash = crypto.createHash('sha256').update(`secret-rotated-${Date.now()}`).digest('hex');

  // Audit
  const rawLog: Omit<SignedAuditLog, 'signature'> = {
    id: `aud-${Date.now()}`,
    eventType: 'ServiceAccountSecretRotated',
    actor: 'j.connor@cyberdyne.io',
    tenantId: 't-cyberdyne-sys',
    outcome: 'success',
    timestamp: new Date().toISOString(),
    details: `Rotated credentials for service account: ${sa.name}`
  };
  signedAuditLogsDatabase.push(signAuditEntry(rawLog));

  res.json({ status: 'ROTATED', serviceAccount: sa });
});

// ─── Directory & Config ────────────────────────────────────────────────────────

app.get('/api/v1/identity/directory', (_req: Request, res: Response) => {
  res.json({ directory: directoryDatabase });
});

app.get('/api/v1/identity/settings', (_req: Request, res: Response) => {
  res.json({ config: configDatabase });
});

app.post('/api/v1/identity/settings', (req: Request, res: Response) => {
  const { branding, customDomain, ssoSettings, approvalPolicies } = req.body;
  if (branding) configDatabase.branding = { ...configDatabase.branding, ...branding };
  if (customDomain) configDatabase.customDomain = customDomain;
  if (ssoSettings) configDatabase.ssoSettings = { ...configDatabase.ssoSettings, ...ssoSettings };
  if (approvalPolicies) configDatabase.approvalPolicies = { ...configDatabase.approvalPolicies, ...approvalPolicies };

  // Audit
  const rawLog: Omit<SignedAuditLog, 'signature'> = {
    id: `aud-${Date.now()}`,
    eventType: 'SettingsUpdated',
    actor: 'm.dyson@cyberdyne.io',
    tenantId: 't-cyberdyne-sys',
    outcome: 'success',
    timestamp: new Date().toISOString(),
    details: 'Enterprise configuration settings modified'
  };
  signedAuditLogsDatabase.push(signAuditEntry(rawLog));

  res.json({ config: configDatabase });
});

// ─── Policy Engine ────────────────────────────────────────────────────────────

app.get('/api/v1/identity/policies', (_req: Request, res: Response) => {
  res.json({ policies: policiesDatabase });
});

app.post('/api/v1/identity/policies', (req: Request, res: Response) => {
  const policy = req.body as ABACPolicy;
  if (!policy.id || !policy.name) {
    res.status(400).json({ error: 'Invalid policy parameters' });
    return;
  }

  const idx = policiesDatabase.findIndex(p => p.id === policy.id);
  if (idx !== -1) {
    policiesDatabase[idx] = policy;
  } else {
    policiesDatabase.push(policy);
  }

  // Append signed audit log
  const rawLog: Omit<SignedAuditLog, 'signature'> = {
    id: `aud-${Date.now()}`,
    eventType: 'PolicyModified',
    actor: 'm.dyson@cyberdyne.io',
    tenantId: 't-cyberdyne-sys',
    outcome: 'success',
    timestamp: new Date().toISOString(),
    details: `Upserted policy rule: ${policy.name} (${policy.id})`
  };
  signedAuditLogsDatabase.push(signAuditEntry(rawLog));

  res.json(policy);
});

app.delete('/api/v1/identity/policies/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const idx = policiesDatabase.findIndex(p => p.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Policy not found' });
    return;
  }

  const deleted = policiesDatabase[idx];
  policiesDatabase.splice(idx, 1);

  // Append signed audit log
  const rawLog: Omit<SignedAuditLog, 'signature'> = {
    id: `aud-${Date.now()}`,
    eventType: 'PolicyDeleted',
    actor: 'm.dyson@cyberdyne.io',
    tenantId: 't-cyberdyne-sys',
    outcome: 'success',
    timestamp: new Date().toISOString(),
    details: `Removed policy rule: ${deleted.name}`
  };
  signedAuditLogsDatabase.push(signAuditEntry(rawLog));

  res.json({ status: 'DELETED', id });
});

// ─── Zero Trust Authorization Interceptor Gate ───────────────────────────────

app.post('/api/v1/identity/validate-request', (req: Request, res: Response) => {
  const {
    token,
    apiKey,
    tenantId,
    resourceType,
    action,
    context
  } = req.body as {
    token?: string;
    apiKey?: string;
    tenantId?: string;
    resourceType: 'connectors' | 'scanners' | 'evidence' | 'remediation' | 'executive_reports' | 'memory' | 'api_usage';
    action: 'execute' | 'read' | 'write' | 'delete';
    context?: {
      deviceFingerprint?: string;
      ip?: string;
      riskScore?: number;
      environment?: string;
    };
  };

  let actorEmail = 'anonymous';
  let actorRole = 'unknown';
  let actorDept = 'unknown';
  let isMfaVerified = false;
  let devRisk = context?.riskScore ?? 0;

  // 1. Authenticate Identity
  if (token) {
    const cleanToken = token.replace('Bearer ', '').trim();
    const session = sessionsDatabase.find(s => s.sessionId === cleanToken);
    if (!session) {
      res.json({ authorized: false, reason: 'Invalid or expired OIDC/JWT user session' });
      return;
    }
    const user = usersDatabase.find(u => u.id === session.userId);
    if (!user) {
      res.json({ authorized: false, reason: 'Session owner account not found' });
      return;
    }
    if (user.status === 'suspended') {
      res.json({ authorized: false, reason: 'Operator identity has been suspended by Compliance' });
      return;
    }
    actorEmail = user.email;
    actorRole = user.role;
    actorDept = user.department;
    isMfaVerified = session.device.mfaStatus === 'verified';
    devRisk = Math.max(devRisk, session.device.riskScore);
  } else if (apiKey) {
    const key = apiKeysDatabase.find(k => k.id === apiKey || k.keyPrefix === apiKey || apiKey.startsWith(k.keyPrefix));
    if (key) {
      if (key.status === 'revoked') {
        res.json({ authorized: false, reason: 'API Key has been revoked' });
        return;
      }
      actorEmail = `api-key:${key.name}`;
      actorRole = 'Service Key';
      actorDept = 'Integration';
      isMfaVerified = true; // API keys bypass MFA challenge
      // Ensure scoped permissions check
      if (resourceType === 'connectors' && !key.scope.includes('connectors')) {
        res.json({ authorized: false, reason: 'API Key lacks connectors scope' });
        return;
      }
    } else {
      // Check service account
      const sa = serviceAccountsDatabase.find(s => s.clientId === apiKey);
      if (sa) {
        actorEmail = `service-account:${sa.name}`;
        actorRole = 'Machine Account';
        actorDept = 'System Automation';
        isMfaVerified = true;
        if (!sa.scope.split(' ').some(s => s.startsWith(resourceType) || s === '*')) {
          res.json({ authorized: false, reason: `Service Account scope mismatch: require ${resourceType}` });
          return;
        }
      } else {
        res.json({ authorized: false, reason: 'Invalid client credentials or API keys provided' });
        return;
      }
    }
  } else {
    res.json({ authorized: false, reason: 'Authentication required: OIDC token or X-Api-Key missing' });
    return;
  }

  // 2. Tenant Isolation Check
  if (tenantId && tenantId !== 't-cyberdyne-sys' && tenantId !== 't-acme-prod' && tenantId !== 't-globex-main') {
    res.json({ authorized: false, reason: 'Tenant Isolation violation: Cross-tenant scope access is prohibited' });
    return;
  }

  // 3. Adaptive Auth / Device Trust validation
  if (devRisk > 60) {
    // Log denial
    const rawLog: Omit<SignedAuditLog, 'signature'> = {
      id: `aud-${Date.now()}`,
      eventType: 'ZeroTrustAccessDenied',
      actor: actorEmail,
      tenantId: tenantId || 't-cyberdyne-sys',
      outcome: 'failure',
      timestamp: new Date().toISOString(),
      details: `Access denied to ${resourceType}:${action}: Device risk is too high (${devRisk}/100)`
    };
    signedAuditLogsDatabase.push(signAuditEntry(rawLog));

    res.json({
      authorized: false,
      reason: `Adaptive Auth Gate: Device risk index (${devRisk}%) exceeds security baseline (60%). Ingress blocked.`
    });
    return;
  }

  // Sensitive actions require MFA
  if ((action === 'execute' || resourceType === 'evidence' || resourceType === 'remediation') && !isMfaVerified) {
    const rawLog: Omit<SignedAuditLog, 'signature'> = {
      id: `aud-${Date.now()}`,
      eventType: 'ZeroTrustAccessDenied',
      actor: actorEmail,
      tenantId: tenantId || 't-cyberdyne-sys',
      outcome: 'failure',
      timestamp: new Date().toISOString(),
      details: `Access denied to ${resourceType}:${action}: Active session lacks MFA verification`
    };
    signedAuditLogsDatabase.push(signAuditEntry(rawLog));

    res.json({
      authorized: false,
      reason: 'Zero Trust authentication: Multi-Factor Authentication (MFA) step-up challenge required.'
    });
    return;
  }

  // 4. ABAC Policy Rules Traverser
  const targetPolicies = policiesDatabase.filter(p => p.resourceType === resourceType);
  if (targetPolicies.length > 0) {
    let allowed = false;
    let matchingPolicyName = '';

    for (const policy of targetPolicies) {
      if (policy.effect === 'allow') {
        const matchesRole = policy.conditions.roles.includes(actorRole) || policy.conditions.roles.includes('*');
        const matchesDept = policy.conditions.departments.includes(actorDept) || policy.conditions.departments.includes('*');
        const matchesEnv = context?.environment ? policy.conditions.environments.includes(context.environment) : true;
        const matchesRisk = (context?.riskScore ?? 0) <= policy.conditions.maxRiskLevel;

        if (matchesRole && matchesDept && matchesEnv && matchesRisk) {
          allowed = true;
          matchingPolicyName = policy.name;
          break;
        }
      }
    }

    if (!allowed) {
      const reason = `ABAC Policy Gate: Denied access by organizational boundary rules. Target resource type: '${resourceType}' requires specific permissions.`;
      
      const rawLog: Omit<SignedAuditLog, 'signature'> = {
        id: `aud-${Date.now()}`,
        eventType: 'ZeroTrustAccessDenied',
        actor: actorEmail,
        tenantId: tenantId || 't-cyberdyne-sys',
        outcome: 'failure',
        timestamp: new Date().toISOString(),
        details: `Access denied to ${resourceType}:${action}: Policy constraint violation`
      };
      signedAuditLogsDatabase.push(signAuditEntry(rawLog));

      res.json({ authorized: false, reason });
      return;
    }
  }

  // 5. Audit Success
  const successLog: Omit<SignedAuditLog, 'signature'> = {
    id: `aud-${Date.now()}`,
    eventType: 'ZeroTrustAccessApproved',
    actor: actorEmail,
    tenantId: tenantId || 't-cyberdyne-sys',
    outcome: 'success',
    timestamp: new Date().toISOString(),
    details: `Access approved for ${resourceType}:${action}`
  };
  signedAuditLogsDatabase.push(signAuditEntry(successLog));

  res.json({ authorized: true, actor: actorEmail });
});

// ─── Audit trail ──────────────────────────────────────────────────────────────

app.get('/api/v1/identity/audit', (_req: Request, res: Response) => {
  res.json({ auditLogs: signedAuditLogsDatabase });
});

// ─── Compliance Evidence ──────────────────────────────────────────────────────

app.get('/api/v1/identity/compliance/evidence', (_req: Request, res: Response) => {
  res.json({ evidence: complianceEvidenceDatabase });
});

app.post('/api/v1/identity/compliance/evidence', (req: Request, res: Response) => {
  const { framework, controlId, description, status } = req.body as {
    framework: any;
    controlId: string;
    description: string;
    status: 'pass' | 'fail' | 'warning';
  };

  const newEv = signEvidenceEntry({
    id: `ev-${framework.toLowerCase()}-${controlId.toLowerCase()}-${Date.now()}`,
    framework,
    controlId,
    description,
    status,
    timestamp: new Date().toISOString()
  });

  complianceEvidenceDatabase.push(newEv);
  res.json(newEv);
});

// ─── Provisioning (SCIM CSV) ─────────────────────────────────────────────────

app.post('/api/v1/identity/provision', (req: Request, res: Response) => {
  const { csvString } = req.body as { csvString: string };
  if (!csvString) {
    res.status(400).json({ error: 'Missing CSV body' });
    return;
  }

  // CSV parser: name,email,role,department,businessUnit
  const lines = csvString.split('\n').filter(l => l.trim() !== '');
  let provisionedCount = 0;

  for (const line of lines) {
    if (line.startsWith('name,email')) continue; // Skip header
    const parts = line.split(',');
    if (parts.length >= 3) {
      const newUser: UserAccount = {
        id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: parts[0].trim(),
        email: parts[1].trim(),
        role: parts[2].trim(),
        department: parts[3]?.trim() || 'Development',
        businessUnit: parts[4]?.trim() || 'Core Product',
        status: 'active',
        mfaEnabled: true
      };
      usersDatabase.push(newUser);
      provisionedCount++;
    }
  }

  // Append signed audit log
  const rawLog: Omit<SignedAuditLog, 'signature'> = {
    id: `aud-${Date.now()}`,
    eventType: 'UserProvisioned',
    actor: 'm.dyson@cyberdyne.io',
    tenantId: 't-cyberdyne-sys',
    outcome: 'success',
    timestamp: new Date().toISOString(),
    details: `CSV SCIM import provisioned ${provisionedCount} users.`
  };
  signedAuditLogsDatabase.push(signAuditEntry(rawLog));

  res.json({ status: 'PROVISIONED', count: provisionedCount, totalUsers: usersDatabase.length });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[identity-runtime] Running on http://localhost:${PORT}`);
  console.log(`[identity-runtime] Audit Engine cryptographic validator online`);
});
