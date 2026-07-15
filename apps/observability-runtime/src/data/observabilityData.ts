import type {
  DistributedTrace,
  TelemetryMetric,
  SmartAlert,
  SloTracker,
  CapacityForecast,
  AIDiagnosticReplay
} from '@cloudguard/types';

export const tracesDatabase: DistributedTrace[] = [
  {
    traceId: 'trace-101',
    correlationId: 'corr-912',
    tenantId: 't-cyberdyne-sys',
    userId: 'u-sarah',
    incidentId: 'inc-402',
    deploymentId: 'dep-skynet-091',
    workflowId: 'flow-rem-001',
    aiSessionId: 'sess-ai-912',
    spans: [
      {
        spanId: 'span-root',
        name: 'HTTP POST /api/v1/incidents/remediate',
        serviceName: 'incident-runtime',
        startTime: '2026-07-15T01:50:00.000Z',
        endTime: '2026-07-15T01:50:02.250Z',
        durationMs: 2250,
        attributes: { method: 'POST', status: 200, path: '/api/v1/incidents/remediate' }
      },
      {
        spanId: 'span-auth',
        parentSpanId: 'span-root',
        name: 'Zero Trust Auth Validate',
        serviceName: 'identity-runtime',
        startTime: '2026-07-15T01:50:00.020Z',
        endTime: '2026-07-15T01:50:00.090Z',
        durationMs: 70,
        attributes: { role: 'Incident Commander', action: 'write', tenant: 't-cyberdyne-sys' }
      },
      {
        spanId: 'span-memory',
        parentSpanId: 'span-root',
        name: 'Query Vector Genome Context',
        serviceName: 'memory-runtime',
        startTime: '2026-07-15T01:50:00.120Z',
        endTime: '2026-07-15T01:50:00.720Z',
        durationMs: 600,
        attributes: { vector_query: 'EKS Security Groups baseline rules', results_returned: 2 }
      },
      {
        spanId: 'span-agent-exec',
        parentSpanId: 'span-root',
        name: 'Synthesize Remediation Playbook',
        serviceName: 'agent-runtime',
        startTime: '2026-07-15T01:50:00.750Z',
        endTime: '2026-07-15T01:50:02.200Z',
        durationMs: 1450,
        attributes: { model: 'gemini-1.5-pro', input_tokens: 2800, output_tokens: 350 }
      }
    ]
  },
  {
    traceId: 'trace-102',
    correlationId: 'corr-913',
    tenantId: 't-cyberdyne-sys',
    userId: 'u-t800',
    deploymentId: 'dep-skynet-091',
    spans: [
      {
        spanId: 'span-pr-promote',
        name: 'HTTP POST /api/v1/devsecops/deployments/promote',
        serviceName: 'devsecops-runtime',
        startTime: '2026-07-15T01:52:00.000Z',
        endTime: '2026-07-15T01:52:00.150Z',
        durationMs: 150,
        attributes: { method: 'POST', path: '/api/v1/devsecops/deployments/promote' }
      },
      {
        spanId: 'span-pr-auth-validate',
        parentSpanId: 'span-pr-promote',
        name: 'Zero Trust Auth Validate',
        serviceName: 'identity-runtime',
        startTime: '2026-07-15T01:52:00.020Z',
        endTime: '2026-07-15T01:52:00.140Z',
        durationMs: 120,
        attributes: { role: 'Developer', action: 'write', decision: 'deny', reason: 'Role-based permission check failed (Incident Commander scope needed)' }
      }
    ]
  }
];

export const metricsDatabase: TelemetryMetric[] = [
  { name: 'http_request_duration_ms', type: 'histogram', value: 142, labels: { route: '/api/v1/scanners/execute', service: 'scanner-runtime' }, timestamp: '2026-07-15T02:00:00Z' },
  { name: 'active_sessions', type: 'gauge', value: 34, labels: { tenant: 't-cyberdyne-sys' }, timestamp: '2026-07-15T02:00:00Z' },
  { name: 'cpu_usage_percentage', type: 'gauge', value: 48, labels: { service: 'agent-runtime' }, timestamp: '2026-07-15T02:00:00Z' },
  { name: 'memory_usage_bytes', type: 'gauge', value: 1288490188, labels: { service: 'memory-runtime' }, timestamp: '2026-07-15T02:00:00Z' },
  { name: 'gpu_utilization_ratio', type: 'gauge', value: 0.62, labels: { model: 'gemini-1.5-pro-gpu' }, timestamp: '2026-07-15T02:00:00Z' },
  { name: 'ai_token_usage_total', type: 'counter', value: 428050, labels: { service: 'agent-runtime', model: 'gemini-1.5-pro' }, timestamp: '2026-07-15T02:00:00Z' },
  { name: 'scanner_findings_count', type: 'counter', value: 12, labels: { scanner: 'Checkov', severity: 'high' }, timestamp: '2026-07-15T02:00:00Z' },
  { name: 'connector_sync_latency_ms', type: 'histogram', value: 780, labels: { provider: 'aws', sync_type: 'full' }, timestamp: '2026-07-15T02:00:00Z' }
];

export const alertsDatabase: SmartAlert[] = [
  {
    id: 'alert-101',
    title: 'EKS Worker Node Memory Saturation',
    severity: 'warning',
    source: 'agent-runtime',
    details: 'EKS node cluster cpu/memory capacity limits reached 88% on pod-remediation-worker-4.',
    probableCause: 'AI Analyzer Diagnostic: High execution concurrency in autonomous remediation loops created a CPU spike. Recommendation: scale Kubernetes replicas count.',
    timestamp: '2026-07-15T01:53:00Z',
    status: 'active'
  },
  {
    id: 'alert-102',
    title: 'AWS Sync API Rate Limit Hit',
    severity: 'critical',
    source: 'connector-runtime',
    details: 'AWS EC2 DescribeInstances API throws HTTP 429 Too Many Requests.',
    probableCause: 'AI Analyzer Diagnostic: High discovery frequency (1 min schedules) in connector sync logs triggered AWS throttling. Recommendation: increase sync interval to 15 mins.',
    timestamp: '2026-07-15T01:54:00Z',
    status: 'active'
  }
];

export const slosDatabase: SloTracker[] = [
  { id: 'slo-api-availability', name: '99.9% API Availability', targetPercentage: 99.9, currentPercentage: 99.94, status: 'compliant', timeframe: '30d' },
  { id: 'slo-ai-runtime', name: '99.95% AI Runtime Availability', targetPercentage: 99.95, currentPercentage: 99.98, status: 'compliant', timeframe: '30d' },
  { id: 'slo-api-latency', name: 'Sub-150ms API Latency', targetPercentage: 95.0, currentPercentage: 96.8, status: 'compliant', timeframe: '7d' },
  { id: 'slo-ai-streaming', name: 'Sub-2s AI Streaming Start', targetPercentage: 99.0, currentPercentage: 99.2, status: 'compliant', timeframe: '30d' }
];

export const capacityForecastsDatabase: CapacityForecast[] = [
  {
    metricName: 'Database Growth',
    currentUsage: 72.4,
    growthRate: 1.2,
    projection30d: 76.0,
    projection90d: 83.2,
    limit: 100.0,
    upgradeRecommended: false,
    recommendationDetails: 'Database capacity growth is healthy. No action required.'
  },
  {
    metricName: 'Vector Index Size',
    currentUsage: 84.5,
    growthRate: 4.5,
    projection30d: 98.0,
    projection90d: 125.0,
    limit: 100.0,
    upgradeRecommended: true,
    recommendationDetails: 'Vector index size exceeds safety thresholds (80%) within 15 days. Recommendation: resize Qdrant node node replicas.'
  },
  {
    metricName: 'GPU Core Saturation',
    currentUsage: 78.0,
    growthRate: 8.0,
    projection30d: 90.0,
    projection90d: 114.0,
    limit: 100.0,
    upgradeRecommended: true,
    recommendationDetails: 'High agent scheduling concurrency is saturating GPU resources. Recommendation: spawn additional A10G AWS instances.'
  }
];

export const aiDiagnosticReplaysDatabase: AIDiagnosticReplay[] = [
  {
    sessionId: 'sess-ai-912',
    promptText: 'Analyze incident security group drift on resource security-group-aws-prod-1.',
    reasoningSteps: [
      '1. Match drift variables against CIS AWS benchmark 4.1 rule.',
      '2. Query memory database for past remediations on EKS SSH Security Groups.',
      '3. Identify direct port 22 routes from public internet.',
      '4. Formulate ClosePort SSH command script.'
    ],
    memoryRetrieved: [
      'Mem-091: Resolved EKS SSH public exposure incident by routing through ALB.',
      'Mem-142: CIS benchmark requires restricting administrative ports to class IPs.'
    ],
    toolsInvoked: ['query_digital_twin', 'execute_remediation_command'],
    evaluationScore: 0.98,
    modelUsed: 'gemini-1.5-pro',
    latencyMs: 1820,
    tokenUsage: { prompt: 2400, completion: 310, total: 2710 },
    timestamp: '2026-07-15T01:45:00Z'
  }
];
