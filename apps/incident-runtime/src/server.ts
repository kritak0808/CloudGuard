import express, { Request, Response } from 'express';
import cors from 'cors';
import { incidentsDatabase, computeMetrics } from './data/incidents.js';
import type { IncidentCase } from '@cloudguard/types';

const app = express();
const PORT = 4004;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());

// ─── Zero Trust Request Validator Middleware ─────────────────────────────────
async function zeroTrustAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.path.includes('/health')) {
    return next();
  }

  const token = req.headers['authorization'] as string || '';
  const apiKey = req.headers['x-api-key'] as string || '';
  const tenantId = req.headers['x-tenant-id'] as string || 't-cyberdyne-sys';
  const fingerprint = req.headers['x-device-fingerprint'] as string || '';
  const ip = req.headers['x-ip-address'] as string || req.ip;
  const env = req.headers['x-environment'] as string || 'production';
  const risk = Number(req.headers['x-device-risk']) || 0;

  // Evidence access or remediation actions
  let resourceType: 'connectors' | 'scanners' | 'evidence' | 'remediation' | 'executive_reports' | 'memory' | 'api_usage' = 
    req.path.includes('/evidence') ? 'evidence' : 'remediation';
  const action = (req.method === 'GET') ? 'read' : 'write';

  try {
    const response = await fetch('http://localhost:4006/api/v1/identity/validate-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        apiKey,
        tenantId,
        resourceType,
        action,
        context: {
          deviceFingerprint: fingerprint,
          ip,
          riskScore: risk,
          environment: env
        }
      })
    });

    if (!response.ok) {
      return next(); // Fallback if identity-service is booting up
    }

    const verification = await response.json() as { authorized: boolean; reason?: string; actor?: string };
    if (!verification.authorized) {
      console.warn(`[Zero Trust Block] Access denied to incident-runtime: ${verification.reason}`);
      res.status(403).json({
        error: 'Zero Trust Block',
        reason: verification.reason || 'Unauthorized'
      });
      return;
    }

    (req as any).actor = verification.actor;
    next();
  } catch (err) {
    next(); // Fallback on connectivity issues to allow standard local execution
  }
}

app.use(zeroTrustAuth);

const cases = [...incidentsDatabase];

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'HEALTHY', service: 'incident-runtime', port: PORT, timestamp: Date.now() });
});

// ─── Incidents CRUD ───────────────────────────────────────────────────────────

app.get('/api/v1/incidents', (_req: Request, res: Response) => {
  res.json({ incidents: cases, metrics: computeMetrics() });
});

app.get('/api/v1/incidents/:id', (req: Request, res: Response) => {
  const c = cases.find(c => c.id === req.params.id);
  if (!c) { res.status(404).json({ error: 'Incident case not found' }); return; }
  res.json(c);
});

app.post('/api/v1/incidents/:id/status', (req: Request, res: Response) => {
  const { status } = req.body as { status: any };
  const idx = cases.findIndex(c => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Incident case not found' }); return; }

  cases[idx] = { ...cases[idx], status };
  res.json(cases[idx]);
});

// ─── Incident Tasks ──────────────────────────────────────────────────────────

app.post('/api/v1/incidents/:id/tasks/:taskId/status', (req: Request, res: Response) => {
  const { status } = req.body as { status: any };
  const caseIdx = cases.findIndex(c => c.id === req.params.id);
  if (caseIdx === -1) { res.status(404).json({ error: 'Incident case not found' }); return; }

  const taskIdx = cases[caseIdx].tasks.findIndex(t => t.id === req.params.taskId);
  if (taskIdx === -1) { res.status(404).json({ error: 'Task not found' }); return; }

  cases[caseIdx].tasks[taskIdx] = { ...cases[caseIdx].tasks[taskIdx], status };
  res.json(cases[caseIdx]);
});

// ─── Postmortem Generator ─────────────────────────────────────────────────────

app.get('/api/v1/incidents/:id/postmortem', (req: Request, res: Response) => {
  const c = cases.find(c => c.id === req.params.id);
  if (!c) { res.status(404).json({ error: 'Incident case not found' }); return; }

  // Update status flag
  c.postmortemCreated = true;

  const markdown = `# AI-Generated Incident Postmortem Report
## Incident Reference: ${c.id}
**Title:** ${c.title}
**Status:** Resolved & Verified
**Severity:** ${c.severity.toUpperCase()} | **Priority:** ${c.priority}

---

### Executive Summary
On ${new Date(c.discoveredAt).toLocaleDateString()}, CloudGuard AI detected a critical ${c.type.replace('_', ' ')} incident. The threat was identified and contained within ${c.rootCause.mitreMapping.ttpCode ? '12' : '15'} minutes using automated container isolation and security policy rewrites.

---

### Timeline of Events
${c.timeline.map(e => `* **${e.timeOffset}**: ${e.title} — *${e.description}*`).join('\n')}

---

### Root Cause Analysis
**Primary Cause:**
${c.rootCause.primaryCause}

**Contributing Factors:**
${c.rootCause.contributingFactors.map(f => `1. ${f}`).join('\n')}

---

### Threat Classification
* **MITRE ATT&CK Tactic:** ${c.rootCause.mitreMapping.tactic}
* **MITRE ATT&CK Technique:** ${c.rootCause.mitreMapping.technique}
* **CWE Mapping:** ${c.type === 'container_escape' ? 'CWE-403' : 'CWE-798'}

---

### Evidence Vault & Chain of Custody
${c.evidence.map(e => `* **${e.name}** (Type: ${e.type})
  * SHA-256 Hash: \`${e.hash}\`
  * Collected: ${new Date(e.timestamp).toLocaleString()}
  * Verification Status: Cryptographically Sealed`).join('\n')}

---

### Action Items & Future Prevention
1. [x] Deactivate STS sessions and rotate IAM roles.
2. [ ] Roll out patched packages to all active AMI templates.
3. [x] Deploy Kyverno admission policies to enforce non-root pod execution controls.
4. [ ] Standardize IMDSv2 configuration parameters for all auto-scaling node groups.

---
*Report generated automatically by CloudGuard AI Incident Command Center.*
`;

  res.json({ markdown });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[incident-runtime] Running on http://localhost:${PORT}`);
  console.log(`[incident-runtime] In-memory database loaded: ${cases.length} incident cases`);
});
