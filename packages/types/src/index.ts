export type ResourceType =
  | 'AWS_IAM_ROLE'
  | 'AWS_S3_BUCKET'
  | 'AWS_RDS_DB'
  | 'AWS_EKS_CLUSTER'
  | 'AWS_EC2_INSTANCE'
  | 'AWS_LAMBDA'
  | 'AWS_VPC'
  | 'AWS_KMS'
  | 'AWS_CLOUDTRAIL'
  | 'AWS_GUARDDUTY'
  | 'AWS_SECURITY_GROUP'
  | 'AZURE_AKS'
  | 'AZURE_VM'
  | 'AZURE_KEY_VAULT'
  | 'AZURE_STORAGE'
  | 'AZURE_NSG'
  | 'GCP_GKE'
  | 'GCP_COMPUTE'
  | 'GCP_STORAGE'
  | 'GCP_SQL'
  | 'K8S_POD'
  | 'K8S_NAMESPACE'
  | 'K8S_DEPLOYMENT'
  | 'K8S_SECRET'
  | 'K8S_RBAC'
  | 'GITHUB_REPO'
  | 'GITHUB_ACTION'
  | 'GITHUB_SECRET'
  | 'TF_WORKSPACE'
  | 'TF_STATE'
  | 'CF_ZONE'
  | 'DOCKER_IMAGE'
  | 'INTERNET'
  | 'AWS_VPC';

export interface CloudResource {
  id: string;
  name: string;
  type: ResourceType;
  provider: 'aws' | 'azure' | 'gcp' | 'k8s' | 'github' | 'terraform' | 'cloudflare' | 'docker' | 'global';
  status: 'safe' | 'warning' | 'danger';
  riskScore: number;
  connections: string[];
  genome: {
    arn?: string;
    permissions?: string[];
    networkAccess?: string;
    encryption?: string;
    associatedRoles?: string[];
    [key: string]: any;
  };
}

export interface AttackPath {
  id: string;
  name: string;
  hops: string[];
  active: boolean;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'info' | 'safe';
  resourceId: string;
  category: 'iam' | 'network' | 'compliance';
  timestamp: string;
}

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'idle' | 'analyzing' | 'speaking' | 'completed';
  confidence: number;
}

export interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: string;
  phase: 'analysis' | 'collaboration' | 'consensus';
}

export interface FileDiff {
  filepath: string;
  language: string;
  original: string;
  modified: string;
}

export interface RemediationPlan {
  id: string;
  title: string;
  description: string;
  diffs: FileDiff[];
  deployed: boolean;
  deploymentLogs: string[];
}

export type SimulationPhase = 'current' | 'future' | 'remediating' | 'remediated';

// ─── Connector Types (Prompt 07) ───────────────────────────────────────────────

export type CloudProvider =
  | 'aws'
  | 'azure'
  | 'gcp'
  | 'kubernetes'
  | 'github'
  | 'terraform'
  | 'cloudflare'
  | 'docker';

export type ConnectorState =
  | 'idle'
  | 'validating'
  | 'discovering'
  | 'syncing'
  | 'healthy'
  | 'error'
  | 'disconnected';

export type NormalizedResourceType =
  | 'VirtualMachine'
  | 'ContainerCluster'
  | 'ObjectStorage'
  | 'Database'
  | 'Identity'
  | 'NetworkPolicy'
  | 'SecretStore'
  | 'Serverless'
  | 'Registry'
  | 'Repository'
  | 'WorkflowPipeline'
  | 'InfrastructureState'
  | 'DNSZone'
  | 'ContainerImage'
  | 'FirewallRule'
  | 'AuditLog';

export interface DiscoveredResource {
  id: string;
  name: string;
  normalizedType: NormalizedResourceType;
  rawType: string;
  provider: CloudProvider;
  region: string;
  riskScore: number;
  aiSummary: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  complianceStatus: 'pass' | 'fail' | 'warning';
  tags: Record<string, string>;
  discoveredAt: string;
  relationships: string[];
}

export interface ConnectorHealth {
  providerId: string;
  apiLatencyMs: number;
  lastSyncDurationMs: number;
  totalResources: number;
  errorCount: number;
  rateLimitUsage: number;  // 0–100 %
  credentialStatus: 'valid' | 'expiring' | 'expired';
  apiVersion: string;
  webhookConnected: boolean;
  retryCount: number;
  healthScore: number; // 0–100
  lastSyncAt: string;
}

export interface SyncEvent {
  id: string;
  providerId: string;
  type: 'discovered' | 'updated' | 'deleted' | 'drift' | 'security_finding';
  resourceId: string;
  resourceName: string;
  resourceType: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
}

export interface ConnectorDefinition {
  id: string;
  provider: CloudProvider;
  displayName: string;
  description: string;
  accountId?: string;
  regions: string[];
  totalResources: number;
  state: ConnectorState;
  health: ConnectorHealth | null;
  lastConnectedAt: string | null;
  credentialType: 'oauth' | 'api_key' | 'role_arn' | 'service_account' | 'kubeconfig';
}

// ─── Security Scanning Types (Prompt 08) ──────────────────────────────────────

export type FindingCategory =
  | 'container'
  | 'sast'
  | 'iac'
  | 'secrets'
  | 'kubernetes'
  | 'runtime'
  | 'api'
  | 'dependency'
  | 'sbom'
  | 'compliance'
  | 'network'
  | 'identity'
  | 'supply_chain';

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type FindingStatus = 'open' | 'acknowledged' | 'suppressed' | 'fixed';
export type ScannerStatus = 'idle' | 'running' | 'completed' | 'failed' | 'scheduled';

export interface FindingAIEnrichment {
  rootCause: string;
  businessImpact: string;
  attackScenario: string;
  mitreTactic: string;
  mitreTechnique: string;
  terraformPatch?: string;
  yamlPatch?: string;
  developerGuidance: string;
  effort: 'trivial' | 'low' | 'medium' | 'high';
  confidence: number;
  executiveSummary: string;
}

export interface SecurityFinding {
  id: string;
  scanner: string;
  category: FindingCategory;
  title: string;
  description: string;
  severity: FindingSeverity;
  cvss?: number;
  epss?: number;
  cve?: string;
  cwe?: string;
  mitre?: string;
  resource: string;
  resourceType: string;
  provider: string;
  location: string;
  evidence: string;
  recommendation: string;
  fixVersion?: string;
  aiEnrichment: FindingAIEnrichment;
  status: FindingStatus;
  discoveredAt: string;
  correlatedWith: string[];
  tags: string[];
}

export interface ScannerDefinition {
  id: string;
  name: string;
  version: string;
  category: FindingCategory;
  description: string;
  status: ScannerStatus;
  lastRunAt: string | null;
  lastRunDurationMs: number;
  findingsCount: number;
  criticalCount: number;
  healthScore: number;
  supportsRealtime: boolean;
  languages?: string[];
  providers?: string[];
}

export interface ScanJob {
  id: string;
  scannerId: string;
  scannerName: string;
  status: ScannerStatus;
  targetResource: string;
  startedAt: string;
  completedAt: string | null;
  findingsCount: number;
  progress: number;
  logs: string[];
}

export interface SBOMEntry {
  id: string;
  name: string;
  version: string;
  type: 'library' | 'framework' | 'os' | 'application';
  license: string;
  supplier: string;
  cveCount: number;
  criticalCves: string[];
  isDirect: boolean;
  depth: number;
  purl: string;
}

export interface SecuritySummary {
  totalFindings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  securityScore: number;
  scannedResources: number;
  activeScans: number;
  secretsDetected: number;
  complianceScore: number;
  lastScanAt: string;
  trendDirection: 'improving' | 'degrading' | 'stable';
}

// ─── AI Memory Types (Prompt 09) ──────────────────────────────────────────────

export type MemoryLayer =
  | 'working'
  | 'conversation'
  | 'infrastructure'
  | 'threat'
  | 'incident'
  | 'deployment'
  | 'compliance'
  | 'executive';

export interface MemoryEntry {
  id: string;
  layer: MemoryLayer;
  title: string;
  description: string;
  timestamp: string;
  tags: string[];
  metadata: {
    resourceId?: string;
    cveId?: string;
    author?: string;
    correlationScore?: number;
    neo4jRelations?: string[];
  };
}

export interface MemoryQueryResult {
  entry: MemoryEntry;
  similarityScore: number;
  confidence: number;
  retrievalReason: string;
  supportingEvidence: string[];
  contradictoryEvidence: string[];
}

export interface IngestedThreatIntel {
  id: string; // e.g. CVE-2021-44228
  source: 'NVD' | 'CISA-KEV' | 'MITRE-ATT&CK' | 'GitHub-Advisory';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  cwe?: string;
  epss?: number;
  mitreTtp?: string;
  detectionRule?: string; // Sigma/YARA
}

export interface MemoryGraphData {
  nodes: { id: string; label: string; group: string }[];
  edges: { from: string; to: string; relation: string }[];
}

export interface MemoryStats {
  totalVectors: number;
  graphNodes: number;
  graphEdges: number;
  layerCounts: Record<MemoryLayer, number>;
  ingestedAdvisories: number;
}

// ─── Incident Command Center Types (Prompt 10) ────────────────────────────────

export type IncidentStatus =
  | 'detected'
  | 'triaged'
  | 'assigned'
  | 'investigating'
  | 'contained'
  | 'eradicated'
  | 'recovered'
  | 'verified'
  | 'closed'
  | 'archived';

export type IncidentType =
  | 'credential_theft'
  | 'container_escape'
  | 'public_database'
  | 'ransomware'
  | 'supply_chain'
  | 'data_exfiltration'
  | 'privilege_escalation'
  | 'compromised_iam'
  | 'zero_day';

export interface TimelineEvent {
  timeOffset: string; // e.g. "08:01"
  timestamp: string;
  title: string;
  description: string;
  type: 'deployment' | 'config' | 'threat' | 'containment' | 'recovery';
  status: 'critical' | 'warning' | 'info' | 'safe';
  resourceId?: string;
}

export interface EvidenceVaultItem {
  id: string;
  name: string;
  type: 'log' | 'screenshot' | 'config' | 'network_capture';
  payloadSummary: string;
  hash: string;
  timestamp: string;
}

export interface IncidentTask {
  id: string;
  title: string;
  assignee: 'Security Engineer' | 'Platform Engineer' | 'Compliance Officer' | 'AI Agent';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
}

export interface RootCauseDetails {
  primaryCause: string;
  contributingFactors: string[];
  evidenceReferences: string[];
  mitreMapping: {
    tactic: string;
    technique: string;
    ttpCode: string;
  };
}

export interface IncidentCase {
  id: string;
  title: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  owners: string[];
  timeline: TimelineEvent[];
  evidence: EvidenceVaultItem[];
  tasks: IncidentTask[];
  rootCause: RootCauseDetails;
  postmortemCreated: boolean;
  discoveredAt: string;
}

export interface IncidentMetrics {
  activeCount: number;
  mttrMinutes: number;
  mttdMinutes: number;
  severityCounts: Record<'critical' | 'high' | 'medium' | 'low', number>;
}

// ─── Executive Suite Types (Prompt 11) ────────────────────────────────────────

export interface ExecutiveMetrics {
  securityScore: number;
  executiveRiskIndex: number;
  threatVelocity: 'low' | 'medium' | 'high';
  businessContinuityScore: number;
  autonomousRemediationRate: number;
  criticalAssetsProtected: number;
  cloudCoverage: number;
  meanTimeToDetectSeconds: number;
  meanTimeToRespondSeconds: number;
}

export interface BusinessImpactStats {
  revenueImpactRange: [number, number]; // [min, max] in USD
  operationalCostUSD: number;
  brandExposureScore: number; // 0 - 100
  recoveryHours: number;
  complianceDriftRate: number;
}

export interface SecurityROIMetrics {
  hoursSaved: number;
  incidentsPrevented: number;
  automationValueUSD: number;
  complianceSavingsUSD: number;
  engineeringSavingsUSD: number;
}

export interface RiskForecastPoint {
  horizonDays: number;
  predictedScore: number;
  complianceDrift: number;
  attackSurfacePercentage: number;
}

export interface BoardReport {
  id: string;
  title: string;
  type: 'quarterly' | 'monthly' | 'weekly';
  generatedAt: string;
  narrativeSummary: string;
  markdownContent: string;
}

export interface RiskHeatmapNode {
  businessUnit: string;
  application: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  probability: 'high' | 'medium' | 'low';
  financialExposureUSD: number;
  provider: 'aws' | 'azure' | 'gcp';
  region: string;
}

// ─── Identity & Zero Trust Types (Prompt 12) ───────────────────────────────

export interface DataIsolationSettings {
  databaseIsolated: boolean;
  byokArn: string;
  retentionDays: number;
  backupIntervalHours: number;
  legalHoldActive: boolean;
  rightToErasureLogs: string[];
}

export interface TenantIsolationProfile {
  tenantId: string;
  name: string;
  isolation: DataIsolationSettings;
  databaseIsolated: boolean; // kept for legacy compatibility
  byokArn: string;            // kept for legacy compatibility
  retentionDays: number;      // kept for legacy compatibility
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  businessUnit: string;
  status: 'active' | 'suspended';
  mfaEnabled: boolean;
  lastLoginAt?: string;
}

export interface DeviceTrustProfile {
  deviceFingerprint: string;
  os: string;
  browser: string;
  ip: string;
  location: string;
  mfaStatus: 'verified' | 'unverified';
  riskScore: number; // 0 - 100
}

export interface UserSession {
  sessionId: string;
  userId: string;
  device: DeviceTrustProfile;
  lastActive: string;
  tokenRotations: number;
}

export interface ABACPolicy {
  id: string;
  name: string;
  resourceType: 'connectors' | 'scanners' | 'evidence' | 'remediation' | 'executive_reports' | 'memory' | 'api_usage';
  effect: 'allow' | 'deny';
  conditions: {
    roles: string[];
    departments: string[];
    environments: string[];
    maxRiskLevel: number;
  };
}

export interface SignedAuditLog {
  id: string;
  eventType: string;
  actor: string;
  tenantId: string;
  outcome: 'success' | 'failure';
  timestamp: string;
  signature: string; // Cryptographic SHA-256 signature
  details?: string;
}

export interface ApiKeyProfile {
  id: string;
  name: string;
  scope: string; // Scopes like: 'connectors:write', 'scanners:execute', etc.
  keyPrefix: string; // e.g. cg_live_...
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string;
  status: 'active' | 'revoked';
}

export interface ServiceAccount {
  id: string;
  name: string;
  clientId: string;
  scope: string;
  status: 'active' | 'expired';
  createdAt: string;
  expiresAt: string;
  lastRotatedAt: string;
  secretHash: string;
}

export interface DirectoryNode {
  id: string;
  name: string;
  type: 'organization' | 'business_unit' | 'project' | 'team' | 'user' | 'resource';
  owner?: string;
  escalationChain?: string[];
  contacts?: string[];
  children?: DirectoryNode[];
}

export interface ComplianceEvidence {
  id: string;
  framework: 'SOC2' | 'ISO27001' | 'HIPAA' | 'PCI-DSS' | 'FedRAMP' | 'NIST' | 'GDPR';
  controlId: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  timestamp: string;
  verifiableHash: string;
}

export interface EnterpriseConfig {
  branding: {
    primaryColor: string;
    logoUrl?: string;
    orgName: string;
  };
  customDomain: string;
  ssoSettings: {
    enabled: boolean;
    provider: 'Okta' | 'Microsoft Entra' | 'Google Workspace' | 'OIDC' | 'SAML';
    metadataUrl?: string;
  };
  approvalPolicies: {
    autonomousRemediationRequiresApproval: boolean;
    scannersExecutionSchedule: string;
  };
}

// ─── DevSecOps & GitOps Types (Prompt 13) ───────────────────────────────────

export interface GitCommit {
  sha: string;
  author: string;
  message: string;
  timestamp: string;
}

export interface GitRelease {
  tagName: string;
  name: string;
  description: string;
  publishedAt: string;
}

export interface GitRepository {
  id: string;
  name: string;
  owner: string;
  url: string;
  branches: string[];
  commits: GitCommit[];
  tags: string[];
  releases: GitRelease[];
  contributors: string[];
  codeowners: string[];
  securityPolicyUrl?: string;
  secrets: string[];
  workflowFiles: string[];
  dependencyCount: number;
}

export interface PullRequest {
  id: string;
  title: string;
  number: number;
  repoId: string;
  branch: string;
  author: string;
  status: 'open' | 'merged' | 'closed';
  riskScore: number;
  blastRadius: 'low' | 'medium' | 'high' | 'critical';
  diffSummary: { filepath: string; additions: number; deletions: number }[];
  complianceDelta: { standard: string; before: 'pass' | 'fail' | 'warning'; after: 'pass' | 'fail' | 'warning' }[];
  securityReview: { scanner: string; criticalCount: number; highCount: number; secretsFound: boolean };
  sbomDelta: { package: string; action: 'added' | 'removed' | 'updated'; version: string }[];
  analysis: { terraformIssues: string[]; helmIssues: string[]; k8sIssues: string[] };
  narrative: string;
  guidance: string;
  aiRecommendation: 'approve' | 'block' | 'hold';
}

export interface PipelineStage {
  name: string;
  status: 'running' | 'success' | 'failed' | 'pending' | 'skipped';
  durationMs: number;
  logSnippet?: string;
}

export interface PipelineGate {
  name: string;
  type: 'security' | 'compliance' | 'license';
  status: 'pass' | 'fail' | 'warn';
  details: string;
}

export interface DevSecOpsPipeline {
  id: string;
  repoId: string;
  commitSha: string;
  branch: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  stages: PipelineStage[];
  gates: PipelineGate[];
  aiCommentary: string;
  timestamp: string;
}

export interface DeploymentVerificationStatus {
  infrastructure: 'healthy' | 'unhealthy';
  application: 'healthy' | 'unhealthy';
  security: 'secure' | 'vulnerable';
  performance: 'pass' | 'fail';
  compliance: 'pass' | 'fail';
}

export interface GitOpsDeployment {
  id: string;
  pipelineId: string;
  env: 'production' | 'staging' | 'development';
  status: 'syncing' | 'healthy' | 'degraded' | 'failed';
  argoAppName?: string;
  verificationStatus: DeploymentVerificationStatus;
  verificationLogs: string[];
  rollbackId?: string;
  releaseNotes: string;
  timestamp: string;
}

export interface ArtifactValidation {
  id: string;
  imageName: string;
  tag: string;
  digest: string;
  cosignSignatureVerified: boolean;
  slsaProvenanceVerified: boolean;
  sbomMatches: boolean;
  cveCount: { critical: number; high: number; medium: number; low: number };
  status: 'approved' | 'rejected';
  signedAuditHash: string;
}

export interface RollbackExecution {
  id: string;
  deploymentId: string;
  type: 'git_revert' | 'terraform_rollback' | 'helm_rollback' | 'k8s_rollout_undo' | 'feature_flag_disable' | 'db_restore' | 'secret_restore';
  status: 'initiated' | 'verifying' | 'completed' | 'failed';
  initiatedBy: string;
  reason: string;
  logs: string[];
  timestamp: string;
}

// ─── Observability & AI Telemetry Types (Prompt 14) ─────────────────────────

export interface TraceSpan {
  spanId: string;
  parentSpanId?: string;
  name: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  attributes: Record<string, string | number>;
}

export interface DistributedTrace {
  traceId: string;
  correlationId: string;
  tenantId?: string;
  userId?: string;
  incidentId?: string;
  deploymentId?: string;
  workflowId?: string;
  aiSessionId?: string;
  spans: TraceSpan[];
}

export interface TelemetryMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels: Record<string, string>;
  timestamp: string;
}

export interface SmartAlert {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  source: string;
  details: string;
  probableCause: string; // AI generated probable cause
  timestamp: string;
  status: 'active' | 'resolved';
}

export interface SloTracker {
  id: string;
  name: string;
  targetPercentage: number;
  currentPercentage: number;
  status: 'compliant' | 'violating';
  timeframe: '7d' | '30d';
}

export interface CapacityForecast {
  metricName: string;
  currentUsage: number;
  growthRate: number;
  projection30d: number;
  projection90d: number;
  limit: number;
  upgradeRecommended: boolean;
  recommendationDetails: string;
}

export interface AIDiagnosticReplay {
  sessionId: string;
  promptText: string;
  reasoningSteps: string[];
  memoryRetrieved: string[];
  toolsInvoked: string[];
  evaluationScore: number;
  modelUsed: string;
  latencyMs: number;
  tokenUsage: { prompt: number; completion: number; total: number };
  timestamp: string;
}






