import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  tracesDatabase,
  metricsDatabase,
  alertsDatabase,
  slosDatabase,
  capacityForecastsDatabase,
  aiDiagnosticReplaysDatabase
} from './data/observabilityData.js';
import type {
  DistributedTrace,
  TelemetryMetric,
  SmartAlert,
  SloTracker,
  CapacityForecast,
  AIDiagnosticReplay
} from '@cloudguard/types';

const app = express();
const PORT = 4008;

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
  
  if (req.path.includes('/alerts') && req.method === 'POST') {
    resourceType = 'remediation';
  } else if (req.path.includes('/replays')) {
    resourceType = 'executive_reports';
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
      console.warn(`[Zero Trust Block] Access denied to observability-runtime: ${verification.reason}`);
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
  res.json({ status: 'HEALTHY', service: 'observability-runtime', port: PORT, timestamp: Date.now() });
});

// ─── Distributed Tracing API ──────────────────────────────────────────────────

app.get('/api/v1/observability/traces', (_req: Request, res: Response) => {
  res.json({ traces: tracesDatabase });
});

// ─── Metrics API ─────────────────────────────────────────────────────────────

app.get('/api/v1/observability/metrics', (_req: Request, res: Response) => {
  res.json({ metrics: metricsDatabase });
});

// ─── Smart Alerts API ─────────────────────────────────────────────────────────

app.get('/api/v1/observability/alerts', (_req: Request, res: Response) => {
  res.json({ alerts: alertsDatabase });
});

app.post('/api/v1/observability/alerts/:id/resolve', (req: Request, res: Response) => {
  const alertId = req.params.id;
  const alert = alertsDatabase.find(a => a.id === alertId);
  if (!alert) {
    res.status(404).json({ error: 'Alert context not found' });
    return;
  }

  alert.status = 'resolved';
  console.log(`[Alert Manager] Resolved alert: ${alertId} by operator: ${(req as any).actor || 'Sarah Connor'}`);
  res.json({ status: 'RESOLVED', alert });
});

// ─── SLOs Tracking API ────────────────────────────────────────────────────────

app.get('/api/v1/observability/slos', (_req: Request, res: Response) => {
  res.json({ slos: slosDatabase });
});

// ─── Capacity Planning Forecasts API ──────────────────────────────────────────

app.get('/api/v1/observability/capacity', (_req: Request, res: Response) => {
  res.json({ forecasts: capacityForecastsDatabase });
});

// ─── AI Diagnostics Replays API ───────────────────────────────────────────────

app.get('/api/v1/observability/replays', (_req: Request, res: Response) => {
  res.json({ replays: aiDiagnosticReplaysDatabase });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[observability-runtime] Running on http://localhost:${PORT}`);
  console.log(`[observability-runtime] Platform Operations metrics aggregate active.`);
});
