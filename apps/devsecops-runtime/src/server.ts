import express, { Request, Response } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import {
  repositoriesDatabase,
  pullRequestsDatabase,
  pipelinesDatabase,
  deploymentsDatabase,
  artifactValidationsDatabase,
  rollbacksDatabase
} from './data/devsecopsData.js';
import type {
  GitRepository,
  PullRequest,
  DevSecOpsPipeline,
  GitOpsDeployment,
  ArtifactValidation,
  RollbackExecution,
  PipelineStage,
  PipelineGate
} from '@cloudguard/types';

const app = express();
const PORT = 4007;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
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

  // Determine resource type based on action
  let resourceType: 'connectors' | 'scanners' | 'evidence' | 'remediation' | 'executive_reports' | 'memory' | 'api_usage' = 'api_usage';
  
  if (req.path.includes('/rollbacks') || req.path.includes('/promote')) {
    resourceType = 'remediation';
  } else if (req.path.includes('/pipelines') && req.method === 'POST') {
    resourceType = 'scanners';
  } else if (req.path.includes('/validate') && req.method === 'POST') {
    resourceType = 'evidence';
  }

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
      return next(); // Fallback if identity-service is not running yet during development
    }

    const verification = await response.json() as { authorized: boolean; reason?: string; actor?: string };
    if (!verification.authorized) {
      console.warn(`[Zero Trust Block] Access denied to devsecops-runtime: ${verification.reason}`);
      res.status(403).json({
        error: 'Zero Trust Block',
        reason: verification.reason || 'Unauthorized'
      });
      return;
    }

    (req as any).actor = verification.actor;
    next();
  } catch (err) {
    next(); // Fallback on connection errors to allow standard local development run
  }
}

app.use(zeroTrustAuth);

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'HEALTHY', service: 'devsecops-runtime', port: PORT, timestamp: Date.now() });
});

// ─── Repository Registry ─────────────────────────────────────────────────────

app.get('/api/v1/devsecops/repos', (_req: Request, res: Response) => {
  res.json({ repositories: repositoriesDatabase });
});

// ─── Pull Request Intelligence ───────────────────────────────────────────────

app.get('/api/v1/devsecops/prs', (_req: Request, res: Response) => {
  res.json({ pullRequests: pullRequestsDatabase });
});

app.post('/api/v1/devsecops/prs/:id/review', (req: Request, res: Response) => {
  const prId = req.params.id;
  const pr = pullRequestsDatabase.find(p => p.id === prId);
  if (!pr) {
    res.status(404).json({ error: 'Pull Request not found' });
    return;
  }

  // Simulate AI evaluation
  pr.status = 'closed'; // Simulate a mock auto-remediation review flow closing/merging the PR
  pr.riskScore = 12; // Risk goes down from 84 to 12
  pr.aiRecommendation = 'approve';

  // Audit event via identity runtime post logging if possible, but keep local state
  res.json({ status: 'REVIEWED', pr });
});

// ─── Pipeline Stage Monitoring ──────────────────────────────────────────────

app.get('/api/v1/devsecops/pipelines', (_req: Request, res: Response) => {
  res.json({ pipelines: pipelinesDatabase });
});

app.post('/api/v1/devsecops/pipelines/:id/run', (req: Request, res: Response) => {
  const pipeId = req.params.id;
  const pipe = pipelinesDatabase.find(p => p.id === pipeId);
  if (!pipe) {
    res.status(404).json({ error: 'Pipeline not found' });
    return;
  }

  // Rerun simulation
  pipe.status = 'running';
  pipe.stages.forEach((stage: PipelineStage, idx: number) => {
    if (idx < 4) {
      stage.status = 'success';
      stage.durationMs = Math.floor(Math.random() * 5000 + 3000);
    } else if (idx === 4) {
      // Re-evaluate artifact generation
      stage.status = 'success';
      stage.durationMs = 4500;
    } else if (idx > 4) {
      stage.status = 'pending';
    }
  });

  // Re-run security checks to verify hotfix
  pipe.gates.forEach((gate: PipelineGate) => {
    if (gate.name.includes('Secrets') || gate.name.includes('Boundaries')) {
      gate.status = 'pass';
      gate.details = 'Remediation hotfix verified. baseline rules conform.';
    }
  });

  setTimeout(() => {
    pipe.status = 'success';
    pipe.stages[5].status = 'success'; // Approval
    pipe.stages[5].durationMs = 1200;
    pipe.stages[6].status = 'success'; // Deploy
    pipe.stages[6].durationMs = 6000;
    pipe.stages[7].status = 'success'; // Verify
    pipe.stages[7].durationMs = 3200;
    pipe.aiCommentary = 'CI/CD pipeline runs successfully. Dynamic security verification checks have validated the rollback baseline. Zero open drift vulnerabilities.';
  }, 4000);

  res.json({ status: 'PIPELINE_RUNNING', pipeline: pipe });
});

// ─── GitOps Deployment & Verification ───────────────────────────────────────

app.get('/api/v1/devsecops/deployments', (_req: Request, res: Response) => {
  res.json({ deployments: deploymentsDatabase });
});

app.post('/api/v1/devsecops/deployments/:id/promote', (req: Request, res: Response) => {
  const depId = req.params.id;
  const dep = deploymentsDatabase.find(d => d.id === depId);
  if (!dep) {
    res.status(404).json({ error: 'Deployment profile not found' });
    return;
  }

  dep.status = 'syncing';
  dep.verificationLogs.push('[SYNC] ArgoCD auto-reconciliation triggered');
  
  setTimeout(() => {
    dep.status = 'healthy';
    dep.verificationStatus = {
      infrastructure: 'healthy',
      application: 'healthy',
      security: 'secure',
      performance: 'pass',
      compliance: 'pass'
    };
    dep.verificationLogs.push('[VERIFY] Dynamic synthetic validation checking completes successfully.');
    dep.verificationLogs.push('[VERIFY] Digital twin genome representation synchronized.');
  }, 3000);

  res.json({ status: 'PROMOTING', deployment: dep });
});

// ─── Supply Chain Artifact Validation ────────────────────────────────────────

app.get('/api/v1/devsecops/artifacts/validate', (_req: Request, res: Response) => {
  res.json({ validations: artifactValidationsDatabase });
});

app.post('/api/v1/devsecops/artifacts/validate', (req: Request, res: Response) => {
  const { imageName, tag, digest, cosignSignature, slsaProvenance } = req.body;
  if (!imageName || !tag) {
    res.status(400).json({ error: 'ImageName and tag are required' });
    return;
  }

  const isSigned = !!cosignSignature;
  const rawData = `${imageName}|${tag}|${digest || ''}|${isSigned}`;
  const signedAuditHash = crypto.createHash('sha256').update(rawData).digest('hex');

  const newValidation: ArtifactValidation = {
    id: `art-${Date.now()}`,
    imageName,
    tag,
    digest: digest || `sha256:${crypto.createHash('sha256').update(imageName + tag).digest('hex')}`,
    cosignSignatureVerified: isSigned,
    slsaProvenanceVerified: !!slsaProvenance,
    sbomMatches: true,
    cveCount: { critical: 0, high: 1, medium: 8, low: 19 },
    status: isSigned ? 'approved' : 'rejected',
    signedAuditHash
  };

  artifactValidationsDatabase.push(newValidation);
  res.json(newValidation);
});

// ─── Rollback Orchestrator ──────────────────────────────────────────────────

app.get('/api/v1/devsecops/rollbacks', (_req: Request, res: Response) => {
  res.json({ rollbacks: rollbacksDatabase });
});

app.post('/api/v1/devsecops/rollbacks', (req: Request, res: Response) => {
  const { deploymentId, type, reason } = req.body;
  const dep = deploymentsDatabase.find(d => d.id === deploymentId);
  if (!dep) {
    res.status(404).json({ error: 'Deployment context not found' });
    return;
  }

  const newRollback: RollbackExecution = {
    id: `roll-${Date.now()}`,
    deploymentId,
    type: type || 'git_revert',
    status: 'initiated',
    initiatedBy: (req as any).actor || 'Commander Sarah Connor',
    reason: reason || 'Security compromise rollback',
    logs: [
      `[INIT] Automated Rollback triggered for deployment: ${deploymentId}`,
      `[ROLLBACK] Action chosen: ${type || 'git_revert'}`,
      '[SYNC] Generating rollback commit revert'
    ],
    timestamp: new Date().toISOString()
  };

  rollbacksDatabase.push(newRollback);

  // Update deployment state in the background
  dep.status = 'syncing';
  dep.verificationLogs.push(`[ROLLBACK] Reversion executing via ${type || 'git_revert'}`);

  setTimeout(() => {
    newRollback.status = 'completed';
    newRollback.logs.push('[GIT] git revert applied successfully');
    newRollback.logs.push('[ARGO] ArgoCD synced rollback baseline');
    newRollback.logs.push('[VERIFY] Running security verification checks');
    newRollback.logs.push('[VERIFY] Ingress Closed SSH: PASS');
    newRollback.logs.push('[SUCCESS] Rollback verified successfully.');

    dep.status = 'healthy';
    dep.verificationStatus = {
      infrastructure: 'healthy',
      application: 'healthy',
      security: 'secure',
      performance: 'pass',
      compliance: 'pass'
    };
    dep.verificationLogs.push('[SYNC] Reverted state active. Status restored to compliant baseline.');
  }, 4000);

  res.json({ status: 'ROLLBACK_INITIATED', rollback: newRollback });
});

// ─── DevSecOps Knowledge Graph Integration ───────────────────────────────────

app.get('/api/v1/devsecops/graph', (_req: Request, res: Response) => {
  // Knowledge graph nodes linking code pipelines to infra genome
  const nodes = [
    { id: 'repo-skynet', label: 'skynet-core-infra', group: 'repository' },
    { id: 'pr-402', label: 'PR #402: Public SSH Open', group: 'pull_request' },
    { id: 'pipe-skynet-01', label: 'Pipeline #01 (Checkov Fail)', group: 'pipeline' },
    { id: 'art-001', label: 'cyberdyne/skynet-core:v1.0.0', group: 'container' },
    { id: 'dep-skynet-091', label: 'GitOps App: skynet-core-services', group: 'deployment' },
    { id: 'res-aws-prod', label: 'Digital Twin: AWS Prod Account', group: 'twin' }
  ];

  const edges = [
    { from: 'repo-skynet', to: 'pr-402', relation: 'defines_changes' },
    { from: 'pr-402', to: 'pipe-skynet-01', relation: 'triggers' },
    { from: 'pipe-skynet-01', to: 'art-001', relation: 'compiles' },
    { from: 'art-001', to: 'dep-skynet-091', relation: 'releases_to' },
    { from: 'dep-skynet-091', to: 'res-aws-prod', relation: 'synchronizes_state' }
  ];

  res.json({ graph: { nodes, edges } });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[devsecops-runtime] Running on http://localhost:${PORT}`);
  console.log(`[devsecops-runtime] Repository Discovery and Rollback engines ready`);
});
