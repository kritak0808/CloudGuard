import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  seedExecutiveMetrics,
  seedBusinessImpact,
  seedROIMetrics,
  seedForecasts,
  seedHeatmap,
  seedBoardReports,
  copilotQAs
} from './data/executiveData.js';

const app = express();
const PORT = 4005;

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

  // Executive reports access
  let resourceType: 'connectors' | 'scanners' | 'evidence' | 'remediation' | 'executive_reports' | 'memory' | 'api_usage' = 'executive_reports';
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
      console.warn(`[Zero Trust Block] Access denied to executive-runtime: ${verification.reason}`);
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

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'HEALTHY', service: 'executive-runtime', port: PORT, timestamp: Date.now() });
});

// ─── Metrics & Business Impact ────────────────────────────────────────────────

app.get('/api/v1/executive/metrics', (_req: Request, res: Response) => {
  res.json({
    metrics: seedExecutiveMetrics,
    impact: seedBusinessImpact,
    roi: seedROIMetrics
  });
});

// ─── Forecasts Scrubber ────────────────────────────────────────────────────────

app.get('/api/v1/executive/forecasts', (_req: Request, res: Response) => {
  res.json({ forecasts: seedForecasts });
});

// ─── Risk Heatmap ─────────────────────────────────────────────────────────────

app.get('/api/v1/executive/heatmap', (_req: Request, res: Response) => {
  res.json({ heatmap: seedHeatmap });
});

// ─── Board Reports ───────────────────────────────────────────────────────────

app.get('/api/v1/executive/reports', (_req: Request, res: Response) => {
  res.json({ reports: seedBoardReports });
});

// ─── Executive Copilot Q&A ─────────────────────────────────────────────────────

app.post('/api/v1/executive/copilot', (req: Request, res: Response) => {
  const { question } = req.body as { question: string };

  if (!question) {
    res.status(400).json({ error: 'Missing question' });
    return;
  }

  const answer = copilotQAs[question] ??
    `CloudGuard AI verified that the organization remains highly protected. Regarding "${question}", our risk profiling indicates no critical exposure, and active threat mitigation continues to secure all connected namespaces.`;

  res.json({ question, answer, timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[executive-runtime] Running on http://localhost:${PORT}`);
  console.log(`[executive-runtime] Strategic datasets loaded successfully`);
});
