import express, { Request, Response } from 'express';
import cors from 'cors';
import { scannerRegistry, scanLogs } from './data/scanners.js';
import { findingsDatabase, sbomData } from './data/findings.js';
import type { ScannerDefinition, ScannerStatus, SecuritySummary } from '@cloudguard/types';

const app = express();
const PORT = 4002;

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

  // Scanner run triggers or findings retrieval falls under scanners
  let resourceType: 'connectors' | 'scanners' | 'evidence' | 'remediation' | 'executive_reports' | 'memory' | 'api_usage' = 'scanners';
  const action = (req.method === 'GET') ? 'read' : 'execute';

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
      console.warn(`[Zero Trust Block] Access denied to scanner-runtime: ${verification.reason}`);
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

// ─── In-memory scanner state ──────────────────────────────────────────────────

const scanners = new Map<string, ScannerDefinition>(
  scannerRegistry.map(s => [s.id, { ...s }])
);

const allFindings = [...findingsDatabase];

function computeSummary(): SecuritySummary {
  const critical = allFindings.filter(f => f.severity === 'critical' && f.status === 'open').length;
  const high     = allFindings.filter(f => f.severity === 'high'     && f.status === 'open').length;
  const medium   = allFindings.filter(f => f.severity === 'medium'   && f.status === 'open').length;
  const low      = allFindings.filter(f => f.severity === 'low'      && f.status === 'open').length;
  const info     = allFindings.filter(f => f.severity === 'info'     && f.status === 'open').length;
  const secrets  = allFindings.filter(f => f.category === 'secrets'  && f.status === 'open').length;
  const total    = allFindings.filter(f => f.status === 'open').length;

  // Score: starts at 100, deducted by severity weight
  const score = Math.max(0, 100 - (critical * 12) - (high * 5) - (medium * 2) - (low * 0.5));

  return {
    totalFindings: total,
    critical,
    high,
    medium,
    low,
    info,
    securityScore: Math.round(score),
    scannedResources: 4762,
    activeScans: Array.from(scanners.values()).filter(s => s.status === 'running').length,
    secretsDetected: secrets,
    complianceScore: 71,
    lastScanAt: new Date().toISOString(),
    trendDirection: critical > 3 ? 'degrading' : 'stable',
  };
}

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'HEALTHY', service: 'scanner-runtime', port: PORT, timestamp: Date.now() });
});

// ─── Scanners ─────────────────────────────────────────────────────────────────

app.get('/api/v1/scanners', (_req: Request, res: Response) => {
  res.json({ scanners: Array.from(scanners.values()) });
});

app.get('/api/v1/scanners/:id', (req: Request, res: Response) => {
  const s = scanners.get(req.params.id);
  if (!s) { res.status(404).json({ error: 'Scanner not found' }); return; }
  res.json(s);
});

// ─── Trigger Scan ─────────────────────────────────────────────────────────────

app.post('/api/v1/scans/trigger', (req: Request, res: Response) => {
  const { scannerId } = req.body as { scannerId: string };
  const s = scanners.get(scannerId);
  if (!s) { res.status(404).json({ error: 'Scanner not found' }); return; }

  const logs = scanLogs[scannerId] ?? [];
  const duration = logs.length * 420;

  scanners.set(scannerId, { ...s, status: 'running' });

  setTimeout(() => {
    const relatedFindings = allFindings.filter(f => f.scanner === scannerId);
    scanners.set(scannerId, {
      ...scanners.get(scannerId)!,
      status: 'completed',
      lastRunAt: new Date().toISOString(),
      lastRunDurationMs: duration,
      findingsCount: relatedFindings.length,
      criticalCount: relatedFindings.filter(f => f.severity === 'critical').length,
    });
  }, duration + 500);

  const jobId = `job-${scannerId}-${Date.now()}`;
  res.json({ jobId, scannerId, status: 'started', streamUrl: `/api/v1/scans/${jobId}/stream` });
});

// ─── SSE Scan Stream ──────────────────────────────────────────────────────────

app.get('/api/v1/scans/:jobId/stream', (req: Request, res: Response) => {
  // Extract scanner id from job id
  const parts = req.params.jobId.split('-');
  const scannerId = parts.length >= 3 ? parts.slice(1, -1).join('-') : parts[1];
  const logs = scanLogs[scannerId] ?? ['[INFO] Scan complete.'];
  const relatedFindings = allFindings.filter(f => f.scanner === scannerId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let index = 0;

  const interval = setInterval(() => {
    if (index >= logs.length) {
      // Emit all findings then complete
      relatedFindings.forEach((finding, i) => {
        setTimeout(() => {
          res.write(`data: ${JSON.stringify({ type: 'FINDING', finding })}\n\n`);
        }, i * 150);
      });

      setTimeout(() => {
        res.write(`data: ${JSON.stringify({ type: 'COMPLETE', findingsCount: relatedFindings.length })}\n\n`);
        clearInterval(interval);
        res.end();
      }, relatedFindings.length * 150 + 200);
      return;
    }

    res.write(`data: ${JSON.stringify({
      type: 'LOG',
      log: logs[index],
      progress: Math.round((index / logs.length) * 100),
      timestamp: new Date().toISOString(),
    })}\n\n`);
    index++;
  }, 420);

  req.on('close', () => clearInterval(interval));
});

// ─── Findings ─────────────────────────────────────────────────────────────────

app.get('/api/v1/findings', (req: Request, res: Response) => {
  const { severity, category, scanner, status } = req.query;
  let results = [...allFindings];
  if (severity) results = results.filter(f => f.severity === severity);
  if (category) results = results.filter(f => f.category === category);
  if (scanner)  results = results.filter(f => f.scanner === scanner);
  if (status)   results = results.filter(f => f.status === status);
  res.json({ findings: results, total: results.length });
});

app.get('/api/v1/findings/:id', (req: Request, res: Response) => {
  const f = allFindings.find(f => f.id === req.params.id);
  if (!f) { res.status(404).json({ error: 'Finding not found' }); return; }
  res.json(f);
});

app.patch('/api/v1/findings/:id/status', (req: Request, res: Response) => {
  const idx = allFindings.findIndex(f => f.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Finding not found' }); return; }
  allFindings[idx] = { ...allFindings[idx], status: req.body.status };
  res.json(allFindings[idx]);
});

// ─── SBOM ─────────────────────────────────────────────────────────────────────

app.get('/api/v1/sbom/:resourceId', (_req: Request, res: Response) => {
  res.json({ sbom: sbomData, totalPackages: sbomData.length, vulnerablePackages: sbomData.filter(s => s.cveCount > 0).length });
});

// ─── Intelligence Summary ─────────────────────────────────────────────────────

app.get('/api/v1/intelligence/summary', (_req: Request, res: Response) => {
  res.json(computeSummary());
});

// ─── Intelligence Live Stream ──────────────────────────────────────────────────

app.get('/api/v1/intelligence/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Stream all findings one by one with delay for visual effect
  allFindings.forEach((finding, i) => {
    setTimeout(() => {
      res.write(`data: ${JSON.stringify({ type: 'FINDING', finding })}\n\n`);
    }, i * 350);
  });

  // Keep-alive pings
  const keepAlive = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => clearInterval(keepAlive));
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[scanner-runtime] Running on http://localhost:${PORT}`);
  console.log(`[scanner-runtime] Scanners registered: ${scannerRegistry.length}`);
  console.log(`[scanner-runtime] Findings database: ${allFindings.length} findings`);
});
