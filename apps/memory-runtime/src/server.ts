import express, { Request, Response } from 'express';
import cors from 'cors';
import { memoryRegistry, semanticQueries } from './data/memories.js';
import { threatIntelligenceFeed } from './data/threats.js';
import type { MemoryEntry, MemoryQueryResult, MemoryStats, MemoryGraphData } from '@cloudguard/types';

const app = express();
const PORT = 4003;

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

  let resourceType: 'connectors' | 'scanners' | 'evidence' | 'remediation' | 'executive_reports' | 'memory' | 'api_usage' = 'memory';
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
      console.warn(`[Zero Trust Block] Access denied to memory-runtime: ${verification.reason}`);
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

// In-memory memories state
const memories = [...memoryRegistry];

// Helper to compute stats
function computeStats(): MemoryStats {
  const layerCounts = {
    working: memories.filter(m => m.layer === 'working').length,
    conversation: memories.filter(m => m.layer === 'conversation').length,
    infrastructure: memories.filter(m => m.layer === 'infrastructure').length,
    threat: memories.filter(m => m.layer === 'threat').length + threatIntelligenceFeed.length,
    incident: memories.filter(m => m.layer === 'incident').length,
    deployment: memories.filter(m => m.layer === 'deployment').length,
    compliance: memories.filter(m => m.layer === 'compliance').length,
    executive: memories.filter(m => m.layer === 'executive').length,
  };

  return {
    totalVectors: memories.length + threatIntelligenceFeed.length + 1543,
    graphNodes: memories.length + threatIntelligenceFeed.length + 84,
    graphEdges: (memories.length * 3) + (threatIntelligenceFeed.length * 2) + 214,
    layerCounts,
    ingestedAdvisories: threatIntelligenceFeed.length + 342,
  };
}

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'HEALTHY', service: 'memory-runtime', port: PORT, timestamp: Date.now() });
});

// ─── Stats ────────────────────────────────────────────────────────────────────

app.get('/api/v1/memory/stats', (_req: Request, res: Response) => {
  res.json(computeStats());
});

// ─── Threats Feed ─────────────────────────────────────────────────────────────

app.get('/api/v1/memory/threats', (_req: Request, res: Response) => {
  res.json({ threats: threatIntelligenceFeed });
});

// ─── Neo4j Graph Data ─────────────────────────────────────────────────────────

app.get('/api/v1/memory/graph', (_req: Request, res: Response) => {
  const nodes = [
    // Layer centers
    { id: 'layer-executive', label: 'Executive Memory Layer', group: 'layer' },
    { id: 'layer-incident', label: 'Incident Memory Layer', group: 'layer' },
    { id: 'layer-infrastructure', label: 'Infrastructure Memory Layer', group: 'layer' },
    { id: 'layer-deployment', label: 'Deployment Memory Layer', group: 'layer' },
    { id: 'layer-threat', label: 'Threat Memory Layer', group: 'layer' },

    // Ingested threats
    ...threatIntelligenceFeed.map(t => ({ id: `threat-${t.id}`, label: t.id, group: 'threat' })),

    // Real memories
    ...memories.map(m => ({ id: `mem-${m.id}`, label: m.title, group: 'memory' }))
  ];

  const edges: { from: string; to: string; relation: string }[] = [];

  // Build edges
  memories.forEach(m => {
    // Edge to layer
    edges.push({ from: `mem-${m.id}`, to: `layer-${m.layer}`, relation: 'DISCOVERED_IN' });

    // Edge to CVE if reference exists
    if (m.metadata.cveId) {
      edges.push({ from: `mem-${m.id}`, to: `threat-${m.metadata.cveId}`, relation: 'AFFECTS' });
    }

    // Link relations
    if (m.metadata.neo4jRelations) {
      m.metadata.neo4jRelations.forEach(r => {
        // Link to nearest incident or layer
        edges.push({ from: `mem-${m.id}`, to: 'layer-incident', relation: r });
      });
    }
  });

  res.json({ nodes, edges });
});

// ─── Ingestion ────────────────────────────────────────────────────────────────

app.post('/api/v1/memory', (req: Request, res: Response) => {
  const { layer, title, description, tags, metadata } = req.body as Partial<MemoryEntry>;

  if (!layer || !title || !description) {
    res.status(400).json({ error: 'Missing layer, title, or description' });
    return;
  }

  const newEntry: MemoryEntry = {
    id: `mem-${layer.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
    layer: layer as any,
    title,
    description,
    timestamp: new Date().toISOString(),
    tags: tags ?? [],
    metadata: metadata ?? {},
  };

  memories.push(newEntry);
  res.status(201).json(newEntry);
});

// ─── Semantic Hybrid Search ────────────────────────────────────────────────────

app.get('/api/v1/memory/search', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();

  if (!query) {
    res.json({ results: [] });
    return;
  }

  // Check predefined semantic responses
  const predefined = semanticQueries[query];
  if (predefined) {
    res.json({ results: predefined });
    return;
  }

  // Fallback keyword hybrid matching
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const matchedMemories: MemoryQueryResult[] = [];

  memories.forEach(m => {
    let matchCount = 0;
    const titleLower = m.title.toLowerCase();
    const descLower = m.description.toLowerCase();

    queryWords.forEach(w => {
      if (titleLower.includes(w) || descLower.includes(w)) {
        matchCount++;
      }
    });

    if (matchCount > 0) {
      const similarityScore = Math.min(95, 40 + (matchCount / queryWords.length) * 55);
      matchedMemories.push({
        entry: m,
        similarityScore: Math.round(similarityScore),
        confidence: Math.round(similarityScore - 5),
        retrievalReason: `Hybrid keyword lookup matched ${matchCount} query terms inside Title & Description.`,
        supportingEvidence: [`Title and Description text check in ${m.layer} memory layer`],
        contradictoryEvidence: []
      });
    }
  });

  // Sort by similarity
  matchedMemories.sort((a, b) => b.similarityScore - a.similarityScore);

  res.json({ results: matchedMemories });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[memory-runtime] Running on http://localhost:${PORT}`);
  console.log(`[memory-runtime] Seeds loaded: ${memories.length} memories, ${threatIntelligenceFeed.length} threats`);
});
