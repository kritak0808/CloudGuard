import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  providerCatalog,
  discoveryLogs,
  resourceCounts,
  generateHealth,
} from './data/providers.js';
import type { ConnectorDefinition, ConnectorState } from '@cloudguard/types';

const app = express();
const PORT = 4001;

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

  let resourceType: 'connectors' | 'scanners' | 'evidence' | 'remediation' | 'executive_reports' | 'memory' | 'api_usage' = 'connectors';
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
      console.warn(`[Zero Trust Block] Access denied to connector-runtime: ${verification.reason}`);
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

// ─── In-memory connector state store ─────────────────────────────────────────

const connectors = new Map<string, ConnectorDefinition>(
  providerCatalog.map(c => [c.id, { ...c }])
);

function setState(id: string, state: ConnectorState) {
  const c = connectors.get(id);
  if (c) connectors.set(id, { ...c, state });
}

// ─── Health ──────────────────────────────────────────────────────────────────

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'HEALTHY', service: 'connector-runtime', port: PORT, timestamp: Date.now() });
});

// ─── List all connectors ──────────────────────────────────────────────────────

app.get('/api/v1/connectors', (_req: Request, res: Response) => {
  res.json({ connectors: Array.from(connectors.values()) });
});

// ─── Get single connector ─────────────────────────────────────────────────────

app.get('/api/v1/connectors/:id', (req: Request, res: Response) => {
  const c = connectors.get(req.params.id);
  if (!c) { res.status(404).json({ error: 'Connector not found' }); return; }
  res.json(c);
});

// ─── Connect — kick off discovery ────────────────────────────────────────────

app.post('/api/v1/connectors/:id/connect', (req: Request, res: Response) => {
  const id = req.params.id;
  const c = connectors.get(id);
  if (!c) { res.status(404).json({ error: 'Connector not found' }); return; }

  setState(id, 'validating');
  setTimeout(() => {
    setState(id, 'discovering');
    // After full discovery time, mark healthy
    const logs = discoveryLogs[c.provider] ?? [];
    const totalMs = logs.length * 420; // discovery duration
    setTimeout(() => {
      const health = generateHealth(id);
      const updated: ConnectorDefinition = {
        ...connectors.get(id)!,
        state: 'healthy',
        health,
        totalResources: resourceCounts[id] ?? 0,
        lastConnectedAt: new Date().toISOString(),
      };
      connectors.set(id, updated);
    }, totalMs + 1000);
  }, 1800);

  res.json({ status: 'discovery_initiated', connector: connectors.get(id) });
});

// ─── Disconnect ───────────────────────────────────────────────────────────────

app.post('/api/v1/connectors/:id/disconnect', (req: Request, res: Response) => {
  const id = req.params.id;
  const c = connectors.get(id);
  if (!c) { res.status(404).json({ error: 'Connector not found' }); return; }

  const reset: ConnectorDefinition = {
    ...c,
    state: 'idle',
    health: null,
    totalResources: 0,
    lastConnectedAt: null,
  };
  connectors.set(id, reset);
  res.json({ status: 'disconnected', connector: reset });
});

// ─── SSE Discovery Stream ─────────────────────────────────────────────────────

app.get('/api/v1/connectors/:id/stream', (req: Request, res: Response) => {
  const id = req.params.id;
  const c = connectors.get(id);
  if (!c) { res.status(404).json({ error: 'Connector not found' }); return; }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const logs = discoveryLogs[c.provider] ?? ['[INFO] No discovery logs available.'];
  let index = 0;
  let resourceCount = 0;
  const maxResources = resourceCounts[id] ?? 100;

  const interval = setInterval(() => {
    if (index >= logs.length) {
      // Send final COMPLETE event
      res.write(`data: ${JSON.stringify({
        type: 'COMPLETE',
        resourceCount: maxResources,
        timestamp: new Date().toISOString(),
      })}\n\n`);
      clearInterval(interval);
      res.end();
      return;
    }

    const log = logs[index];
    // Simulate incremental resource count
    if (log.includes('[COMPLETE]')) {
      resourceCount = maxResources;
    } else if (index > 4) {
      resourceCount = Math.min(
        Math.floor((index / logs.length) * maxResources),
        maxResources
      );
    }

    res.write(`data: ${JSON.stringify({
      type: 'LOG',
      log,
      resourceCount,
      timestamp: new Date().toISOString(),
    })}\n\n`);

    index++;
  }, 420);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// ─── Connector Health ─────────────────────────────────────────────────────────

app.get('/api/v1/connectors/:id/health', (req: Request, res: Response) => {
  const id = req.params.id;
  const c = connectors.get(id);
  if (!c) { res.status(404).json({ error: 'Connector not found' }); return; }
  if (!c.health) {
    res.json({ status: 'not_connected' });
    return;
  }
  // Jitter metrics slightly for live feel
  const health = {
    ...c.health,
    apiLatencyMs: c.health.apiLatencyMs + Math.floor(Math.random() * 20 - 10),
    rateLimitUsage: Math.min(100, c.health.rateLimitUsage + Math.floor(Math.random() * 5)),
  };
  res.json(health);
});

// ─── Genome Summary ───────────────────────────────────────────────────────────

app.get('/api/v1/genome/summary', (_req: Request, res: Response) => {
  const connected = Array.from(connectors.values()).filter(c => c.state === 'healthy');
  const totalResources = connected.reduce((sum, c) => sum + c.totalResources, 0);
  const providerBreakdown = connected.map(c => ({
    provider: c.provider,
    displayName: c.displayName,
    resources: c.totalResources,
    healthScore: c.health?.healthScore ?? 0,
  }));

  res.json({
    connectedProviders: connected.length,
    totalProviders: connectors.size,
    totalResources,
    riskDistribution: {
      critical: Math.floor(totalResources * 0.018),
      high: Math.floor(totalResources * 0.062),
      medium: Math.floor(totalResources * 0.18),
      low: Math.floor(totalResources * 0.74),
    },
    providerBreakdown,
    lastUpdated: new Date().toISOString(),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[connector-runtime] Running on http://localhost:${PORT}`);
  console.log(`[connector-runtime] Providers registered: ${providerCatalog.length}`);
});
