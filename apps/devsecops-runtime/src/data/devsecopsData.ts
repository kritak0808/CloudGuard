import type {
  GitRepository,
  PullRequest,
  DevSecOpsPipeline,
  GitOpsDeployment,
  ArtifactValidation,
  RollbackExecution
} from '@cloudguard/types';

export const repositoriesDatabase: GitRepository[] = [
  {
    id: 'repo-skynet',
    name: 'skynet-core-infra',
    owner: 'Cyberdyne Systems',
    url: 'github.com/cyberdyne/skynet-core-infra',
    branches: ['main', 'dev', 'pr-402-patch', 'hotfix-egress-lock'],
    commits: [
      { sha: 'c1a2b3d', author: 's.connor@cyberdyne.io', message: 'Restrict container egress configurations & close SSH access', timestamp: '2026-07-15T01:00:00Z' },
      { sha: 'd4e5f6g', author: 't800@cyberdyne.io', message: 'Open public network port 22 & add wildcard privileges', timestamp: '2026-07-15T01:06:00Z' },
      { sha: 'e7f8g9h', author: 'j.connor@cyberdyne.io', message: 'Fix EKS cluster auth endpoints & verify cert manager', timestamp: '2026-07-14T18:30:00Z' }
    ],
    tags: ['v1.0.0', 'v1.1.0-alpha'],
    releases: [
      { tagName: 'v1.0.0', name: 'Skynet Production Core Baseline', description: 'Standard SOC2-compliant secure network baseline with AWS GuardDuty integrations.', publishedAt: '2026-07-01T00:00:00Z' }
    ],
    contributors: ['s.connor@cyberdyne.io', 'j.connor@cyberdyne.io', 't800@cyberdyne.io', 'm.dyson@cyberdyne.io'],
    codeowners: ['@s.connor', '@j.connor'],
    securityPolicyUrl: 'github.com/cyberdyne/skynet-core-infra/security/policy',
    secrets: ['AWS_ACCESS_KEY_ID', 'DOCKER_REGISTRY_PASSWORD', 'KUBE_CONFIG_PROD_DATA'],
    workflowFiles: ['.github/workflows/security-scan.yml', '.github/workflows/deploy-gitops.yml'],
    dependencyCount: 142
  },
  {
    id: 'repo-rem-service',
    name: 'autonomous-remediation-engine',
    owner: 'Cyberdyne Systems',
    url: 'github.com/cyberdyne/autonomous-remediation-engine',
    branches: ['main', 'staging'],
    commits: [
      { sha: 'a1b2c3d', author: 'j.connor@cyberdyne.io', message: 'Initialize dynamic playbook orchestrator runner', timestamp: '2026-07-10T12:00:00Z' }
    ],
    tags: ['v0.8.0'],
    releases: [],
    contributors: ['j.connor@cyberdyne.io', 'm.dyson@cyberdyne.io'],
    codeowners: ['@j.connor'],
    secrets: ['GITHUB_TOKEN', 'CLOUDGUARD_API_KEY'],
    workflowFiles: ['.github/workflows/ci.yml'],
    dependencyCount: 89
  }
];

export const pullRequestsDatabase: PullRequest[] = [
  {
    id: 'pr-402',
    title: 'Open Public SSH Port & Add Wildcard EKS Node Privileges',
    number: 402,
    repoId: 'repo-skynet',
    branch: 'pr-402-patch',
    author: 't800@cyberdyne.io',
    status: 'open',
    riskScore: 84,
    blastRadius: 'critical',
    diffSummary: [
      { filepath: 'terraform/variables.tf', additions: 18, deletions: 2 },
      { filepath: 'terraform/iam.tf', additions: 12, deletions: 1 }
    ],
    complianceDelta: [
      { standard: 'SOC2 CC6.1', before: 'pass', after: 'fail' },
      { standard: 'PCI-DSS Req 8.3', before: 'pass', after: 'fail' }
    ],
    securityReview: {
      scanner: 'CodeQL / TruffleHog / Checkov',
      criticalCount: 2,
      highCount: 3,
      secretsFound: true
    },
    sbomDelta: [
      { package: 'aws-sdk-client-s3', action: 'updated', version: 'v3.520.0' }
    ],
    analysis: {
      terraformIssues: [
        'Direct route from Public Internet (0.0.0.0/0) to EKS SG on port 22/80',
        'IAM policy statement grants wildcard (*) Actions on (*) Resources'
      ],
      helmIssues: [
        'EKS ingress host exposes insecure HTTP ports without TLS encryption'
      ],
      k8sIssues: [
        'Wildcard RBAC ClusterRoleBinding detected'
      ]
    },
    narrative: 'Proposed changes create a direct route from the Public Internet to EKS node Security Groups on SSH ports. Combined with EKS wildcard account privileges, a single RCE compromises the entire AWS account.',
    guidance: '1. Strip wildcard statements from EKS IAM policies. 2. Close public port 22 and route SSH traffic through VPC ALB jump box.',
    aiRecommendation: 'block'
  }
];

export const pipelinesDatabase: DevSecOpsPipeline[] = [
  {
    id: 'pipe-skynet-01',
    repoId: 'repo-skynet',
    commitSha: 'd4e5f6g',
    branch: 'pr-402-patch',
    status: 'failed',
    stages: [
      { name: 'Source Ingestion', status: 'success', durationMs: 4500 },
      { name: 'CI Build & Compile', status: 'success', durationMs: 12000 },
      { name: 'Unit Testing', status: 'success', durationMs: 18000 },
      { name: 'Security Vulnerability Scan', status: 'failed', durationMs: 8200, logSnippet: '[ERROR] Secrets Scanner: live AWS key detected on terraform/variables.tf:L8. \n[ERROR] Checkov: direct public routes to SSH Security Group is restricted. \n[FAIL] Pipeline Security Stage Failed.' },
      { name: 'Artifact Generation', status: 'skipped', durationMs: 0 },
      { name: 'Compliance Gate Approval', status: 'pending', durationMs: 0 },
      { name: 'GitOps Deployment', status: 'pending', durationMs: 0 },
      { name: 'Deployment Verification', status: 'pending', durationMs: 0 }
    ],
    gates: [
      { name: 'Critical CVE Check', type: 'security', status: 'pass', details: '0 vulnerabilities found' },
      { name: 'Secrets Detection Scan', type: 'security', status: 'fail', details: 'Live credential tokens leaked in variables.tf' },
      { name: 'Infrastructure Boundaries Audit', type: 'compliance', status: 'fail', details: 'Public network port open (CIS AWS Benchmark 4.1)' },
      { name: 'License Validation', type: 'license', status: 'pass', details: 'All dependencies GPL-compliant' }
    ],
    aiCommentary: 'Release Pipeline blocked. Static scan checks flagged live credentials leaked and unsafe Security Group configurations. Auto-remediation synthesis initiated.',
    timestamp: '2026-07-15T01:10:00Z'
  }
];

export const deploymentsDatabase: GitOpsDeployment[] = [
  {
    id: 'dep-skynet-091',
    pipelineId: 'pipe-skynet-01',
    env: 'production',
    status: 'degraded',
    argoAppName: 'skynet-core-services',
    verificationStatus: {
      infrastructure: 'unhealthy',
      application: 'healthy',
      security: 'vulnerable',
      performance: 'pass',
      compliance: 'fail'
    },
    verificationLogs: [
      '[SYNC] ArgoCD sync initiated',
      '[HEALTH] Pods running: 12/12',
      '[SECURITY] Ingress network group contains wildcard entries - HIGH RISK',
      '[COMPLIANCE] Drift check: CIS AWS SG audit fails - degraded'
    ],
    rollbackId: undefined,
    releaseNotes: 'Automated release deployment containing EKS workload optimizations. Warning: compliance drift identified in VPC boundary rules.',
    timestamp: '2026-07-15T01:12:00Z'
  }
];

export const artifactValidationsDatabase: ArtifactValidation[] = [
  {
    id: 'art-001',
    imageName: 'cyberdyne/skynet-core',
    tag: 'v1.0.0',
    digest: 'sha256:7f9b0c229988776655cbaef9cbef9cbef9cbef9cbef9cbef9cbef9cbef9cbef9',
    cosignSignatureVerified: true,
    slsaProvenanceVerified: true,
    sbomMatches: true,
    cveCount: { critical: 0, high: 2, medium: 14, low: 31 },
    status: 'approved',
    signedAuditHash: '8f9c1b78297b483fe089cb1f201089201cb298ef9cb02f182cb092cf18cf1b8f'
  },
  {
    id: 'art-002',
    imageName: 'cyberdyne/skynet-agent',
    tag: 'v1.1.0-alpha',
    digest: 'sha256:8f9cbef9cbef9cbef9cbef9cbef9cbef9cbef9cbef9cbef9cbef9cbef9cbef9c',
    cosignSignatureVerified: false,
    slsaProvenanceVerified: false,
    sbomMatches: false,
    cveCount: { critical: 4, high: 12, medium: 28, low: 50 },
    status: 'rejected',
    signedAuditHash: '9a8b7c6d5e4f3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c'
  }
];

export const rollbacksDatabase: RollbackExecution[] = [
  {
    id: 'roll-001',
    deploymentId: 'dep-skynet-091',
    type: 'git_revert',
    status: 'completed',
    initiatedBy: 'Sarah Connor',
    reason: 'VPC network boundary drift detected. Reverting PR-402 modifications to secure state.',
    logs: [
      '[INIT] Git rollback initiated. Target commit: c1a2b3d',
      '[GIT] git revert d4e5f6g --no-edit completed',
      '[PUSH] Pushing revert commit to origin/main',
      '[ARGO] ArgoCD auto-sync triggered',
      '[VERIFY] Running synthetic health checks',
      '[VERIFY] Port 22: REJECT (PASS)',
      '[VERIFY] Digital Twin status: healthy',
      '[SUCCESS] Rollback executed and verified. Baseline restored.'
    ],
    timestamp: '2026-07-15T01:15:00Z'
  }
];
