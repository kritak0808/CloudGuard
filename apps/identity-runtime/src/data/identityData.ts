import crypto from 'crypto';
import type {
  TenantIsolationProfile,
  UserAccount,
  UserSession,
  ABACPolicy,
  SignedAuditLog,
  ApiKeyProfile,
  ServiceAccount,
  DirectoryNode,
  ComplianceEvidence,
  EnterpriseConfig
} from '@cloudguard/types';

export const seedTenants: TenantIsolationProfile[] = [
  {
    tenantId: 't-cyberdyne-sys',
    name: 'Cyberdyne Systems Research',
    databaseIsolated: true,
    byokArn: 'arn:aws:kms:us-west-2:9988776655:key/7d8f9b0c-9022-4aef-bb88-34200cbef9cf',
    retentionDays: 730,
    isolation: {
      databaseIsolated: true,
      byokArn: 'arn:aws:kms:us-west-2:9988776655:key/7d8f9b0c-9022-4aef-bb88-34200cbef9cf',
      retentionDays: 730,
      backupIntervalHours: 12,
      legalHoldActive: false,
      rightToErasureLogs: ['erasure-usr-881-completed', 'erasure-usr-894-completed']
    }
  },
  {
    tenantId: 't-acme-prod',
    name: 'Acme Corporate Enterprise',
    databaseIsolated: true,
    byokArn: 'arn:aws:kms:us-east-1:1122334455:key/28b8f2cb-8021-4433-aefb-0912ab8f9cb1',
    retentionDays: 365,
    isolation: {
      databaseIsolated: true,
      byokArn: 'arn:aws:kms:us-east-1:1122334455:key/28b8f2cb-8021-4433-aefb-0912ab8f9cb1',
      retentionDays: 365,
      backupIntervalHours: 24,
      legalHoldActive: false,
      rightToErasureLogs: []
    }
  },
  {
    tenantId: 't-globex-main',
    name: 'Globex Global Conglomerate',
    databaseIsolated: true,
    byokArn: 'arn:aws:kms:eu-west-1:6655443322:key/0c9022a1-8023-4cde-a950-95000af9cbef',
    retentionDays: 180,
    isolation: {
      databaseIsolated: true,
      byokArn: 'arn:aws:kms:eu-west-1:6655443322:key/0c9022a1-8023-4cde-a950-95000af9cbef',
      retentionDays: 180,
      backupIntervalHours: 24,
      legalHoldActive: true,
      rightToErasureLogs: ['erasure-usr-102-completed']
    }
  }
];

export const seedUsers: UserAccount[] = [
  { id: 'usr-901', name: 'Commander Sarah Connor', email: 's.connor@cyberdyne.io', role: 'Incident Commander', department: 'SecOps', businessUnit: 'Defense Systems', status: 'active', mfaEnabled: true, lastLoginAt: '2026-07-15T01:00:00Z' },
  { id: 'usr-902', name: 'Arch John Connor', email: 'j.connor@cyberdyne.io', role: 'Cloud Administrator', department: 'Platform Engineering', businessUnit: 'Core Infra', status: 'active', mfaEnabled: true, lastLoginAt: '2026-07-15T01:02:00Z' },
  { id: 'usr-903', name: 'Officer Miles Dyson', email: 'm.dyson@cyberdyne.io', role: 'Compliance Officer', department: 'Risk Governance', businessUnit: 'Ethics Systems', status: 'active', mfaEnabled: true, lastLoginAt: '2026-07-15T00:58:00Z' },
  { id: 'usr-904', name: 'Developer T-800', email: 't800@cyberdyne.io', role: 'Developer', department: 'Automation Dev', businessUnit: 'Terminator Core', status: 'active', mfaEnabled: false, lastLoginAt: '2026-07-15T00:55:00Z' }
];

export const seedSessions: UserSession[] = [
  {
    sessionId: 'sess-0091',
    userId: 'usr-901',
    device: {
      deviceFingerprint: 'df-mac-safari-9021',
      os: 'macOS Sonoma (14.5)',
      browser: 'Safari 17.5',
      ip: '198.51.100.12',
      location: 'Los Angeles, CA',
      mfaStatus: 'verified',
      riskScore: 2
    },
    lastActive: '2026-07-15T01:05:00Z',
    tokenRotations: 4
  },
  {
    sessionId: 'sess-0092',
    userId: 'usr-903',
    device: {
      deviceFingerprint: 'df-win-chrome-9022',
      os: 'Windows 11 Enterprise',
      browser: 'Chrome 126.0.2',
      ip: '203.0.113.45',
      location: 'San Jose, CA',
      mfaStatus: 'verified',
      riskScore: 5
    },
    lastActive: '2026-07-15T01:08:00Z',
    tokenRotations: 2
  },
  {
    sessionId: 'sess-0093',
    userId: 'usr-904',
    device: {
      deviceFingerprint: 'df-linux-curl-9023',
      os: 'Ubuntu Desktop 24.04',
      browser: 'Chrome 125.0.1',
      ip: '198.51.100.99',
      location: 'Moscow, RU',
      mfaStatus: 'unverified',
      riskScore: 68 // Elevated risk
    },
    lastActive: '2026-07-15T01:10:00Z',
    tokenRotations: 1
  }
];

export const seedPolicies: ABACPolicy[] = [
  {
    id: 'pol-001',
    name: 'Restrict Remediation to Incident Commanders in Prod',
    resourceType: 'remediation',
    effect: 'allow',
    conditions: {
      roles: ['Incident Commander', 'Platform Owner'],
      departments: ['SecOps', 'Platform Engineering'],
      environments: ['production'],
      maxRiskLevel: 30
    }
  },
  {
    id: 'pol-002',
    name: 'Compliance Officer Access to Evidence Vault',
    resourceType: 'evidence',
    effect: 'allow',
    conditions: {
      roles: ['Compliance Officer', 'Incident Commander', 'Auditor'],
      departments: ['Risk Governance', 'SecOps'],
      environments: ['production', 'staging'],
      maxRiskLevel: 50
    }
  },
  {
    id: 'pol-003',
    name: 'Developer Scanner Trigger Scopes',
    resourceType: 'scanners',
    effect: 'allow',
    conditions: {
      roles: ['Developer', 'Security Analyst', 'Cloud Administrator', 'Incident Commander'],
      departments: ['Automation Dev', 'Platform Engineering', 'SecOps'],
      environments: ['staging', 'development'],
      maxRiskLevel: 80
    }
  },
  {
    id: 'pol-004',
    name: 'Restrict Executive Report Access to Officers',
    resourceType: 'executive_reports',
    effect: 'allow',
    conditions: {
      roles: ['Organization Owner', 'Compliance Officer', 'Platform Owner', 'Auditor'],
      departments: ['Risk Governance', 'Core Infra', 'Finance'],
      environments: ['production', 'staging', 'development'],
      maxRiskLevel: 40
    }
  }
];

export const seedApiKeys: ApiKeyProfile[] = [
  { id: 'key-01', name: 'connector-runtime-sync-key', scope: 'connectors:write', keyPrefix: 'cg_live_conn', createdAt: '2026-07-01T00:00:00Z', expiresAt: '2026-12-31T23:59:59Z', lastUsedAt: '2026-07-15T01:10:00Z', status: 'active' },
  { id: 'key-02', name: 'scanner-runtime-results-key', scope: 'findings:write', keyPrefix: 'cg_live_scan', createdAt: '2026-07-01T00:00:00Z', expiresAt: '2026-12-31T23:59:59Z', lastUsedAt: '2026-07-15T01:08:00Z', status: 'active' },
  { id: 'key-03', name: 'agent-runtime-remediation-key', scope: 'remediation:execute', keyPrefix: 'cg_live_agent', createdAt: '2026-07-01T00:00:00Z', expiresAt: '2026-12-31T23:59:59Z', lastUsedAt: '2026-07-15T01:09:00Z', status: 'active' }
];

export const seedServiceAccounts: ServiceAccount[] = [
  {
    id: 'sa-01',
    name: 'agent-runtime-sa',
    clientId: 'cg-sa-agent-runtime-id',
    scope: 'remediation:execute findings:read',
    status: 'active',
    createdAt: '2026-07-01T00:00:00Z',
    expiresAt: '2027-07-01T00:00:00Z',
    lastRotatedAt: '2026-07-01T00:00:00Z',
    secretHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' // hashed "password"
  },
  {
    id: 'sa-02',
    name: 'connector-runtime-sa',
    clientId: 'cg-sa-connector-runtime-id',
    scope: 'connectors:write inventory:update',
    status: 'active',
    createdAt: '2026-07-01T00:00:00Z',
    expiresAt: '2027-07-01T00:00:00Z',
    lastRotatedAt: '2026-07-01T00:00:00Z',
    secretHash: 'ef92b778bafe771e89b21f98d9e262bb821034f71a0e101cf1028bfe773f82cb'
  }
];

export const seedDirectory: DirectoryNode = {
  id: 'org-root',
  name: 'Cyberdyne Systems Corp',
  type: 'organization',
  owner: 'Arch John Connor',
  escalationChain: ['s.connor@cyberdyne.io', 'j.connor@cyberdyne.io'],
  contacts: ['support@cyberdyne.io', 'security@cyberdyne.io'],
  children: [
    {
      id: 'bu-defense',
      name: 'Defense Systems',
      type: 'business_unit',
      owner: 'Sarah Connor',
      escalationChain: ['s.connor@cyberdyne.io'],
      children: [
        {
          id: 'proj-sky',
          name: 'Project Skynet Security',
          type: 'project',
          owner: 'Sarah Connor',
          children: [
            {
              id: 'team-secops',
              name: 'SecOps Team',
              type: 'team',
              owner: 'Sarah Connor',
              children: [
                { id: 'usr-901', name: 'Commander Sarah Connor', type: 'user' },
                { id: 'res-aws-prod', name: 'AWS Production Account', type: 'resource', owner: 'Sarah Connor' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'bu-infra',
      name: 'Core Infrastructure',
      type: 'business_unit',
      owner: 'John Connor',
      escalationChain: ['j.connor@cyberdyne.io'],
      children: [
        {
          id: 'proj-twin',
          name: 'Digital Twin Platform',
          type: 'project',
          owner: 'John Connor',
          children: [
            {
              id: 'team-platform',
              name: 'Platform Engineering Team',
              type: 'team',
              owner: 'John Connor',
              children: [
                { id: 'usr-902', name: 'John Connor', type: 'user' },
                { id: 'res-eks-prod', name: 'EKS Production Cluster', type: 'resource', owner: 'John Connor' }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export const seedComplianceEvidence: ComplianceEvidence[] = [
  { id: 'ev-soc2-cc6.1', framework: 'SOC2', controlId: 'CC6.1', description: 'Access control permissions mapped to authorization rules', status: 'pass', timestamp: '2026-07-15T01:05:00Z', verifiableHash: '' },
  { id: 'ev-soc2-cc6.3', framework: 'SOC2', controlId: 'CC6.3', description: 'MFA enabled on administrator identities', status: 'warning', timestamp: '2026-07-15T01:06:00Z', verifiableHash: '' },
  { id: 'ev-iso27001-a9', framework: 'ISO27001', controlId: 'A.9.1.1', description: 'Access control policies are documented and implemented', status: 'pass', timestamp: '2026-07-15T01:07:00Z', verifiableHash: '' },
  { id: 'ev-pci-req8', framework: 'PCI-DSS', controlId: 'Req 8.3.1', description: 'Multi-factor authentication required for administrative network access', status: 'pass', timestamp: '2026-07-15T01:08:00Z', verifiableHash: '' },
  { id: 'ev-gdpr-art32', framework: 'GDPR', controlId: 'Art 32', description: 'Cryptographic encryption at rest and in transit enforced per-tenant', status: 'pass', timestamp: '2026-07-15T01:09:00Z', verifiableHash: '' }
];

export const seedConfig: EnterpriseConfig = {
  branding: {
    primaryColor: '#7B42BC',
    orgName: 'Cyberdyne Systems Corp'
  },
  customDomain: 'cloudguard.cyberdyne.io',
  ssoSettings: {
    enabled: true,
    provider: 'Okta',
    metadataUrl: 'https://okta.cyberdyne.io/oauth2/default/.well-known/oauth-authorization-server'
  },
  approvalPolicies: {
    autonomousRemediationRequiresApproval: true,
    scannersExecutionSchedule: '0 */4 * * *'
  }
};

export const seedAuditLogs: SignedAuditLog[] = [
  { id: 'aud-001', eventType: 'UserLogin', actor: 's.connor@cyberdyne.io', tenantId: 't-cyberdyne-sys', outcome: 'success', timestamp: '2026-07-15T01:05:00Z', signature: '' },
  { id: 'aud-002', eventType: 'PolicyModified', actor: 'm.dyson@cyberdyne.io', tenantId: 't-cyberdyne-sys', outcome: 'success', timestamp: '2026-07-15T01:08:15Z', signature: '' },
  { id: 'aud-003', eventType: 'ConnectorCreated', actor: 'j.connor@cyberdyne.io', tenantId: 't-cyberdyne-sys', outcome: 'success', timestamp: '2026-07-15T01:09:47Z', signature: '' }
];

// Helper to sign audit log entries cryptographically using SHA-256
export function signAuditEntry(log: Omit<SignedAuditLog, 'signature'>): SignedAuditLog {
  const data = `${log.id}|${log.eventType}|${log.actor}|${log.tenantId}|${log.outcome}|${log.timestamp}|${log.details || ''}`;
  const signature = crypto.createHash('sha256').update(data).digest('hex');
  return { ...log, signature };
}

// Helper to sign compliance evidence entries cryptographically using SHA-256
export function signEvidenceEntry(ev: Omit<ComplianceEvidence, 'verifiableHash'>): ComplianceEvidence {
  const data = `${ev.id}|${ev.framework}|${ev.controlId}|${ev.description}|${ev.status}|${ev.timestamp}`;
  const verifiableHash = crypto.createHash('sha256').update(data).digest('hex');
  return { ...ev, verifiableHash };
}

// Pre-sign databases
export const signedAuditLogsDatabase = seedAuditLogs.map(signAuditEntry);
export const complianceEvidenceDatabase = seedComplianceEvidence.map(signEvidenceEntry);

export const usersDatabase = [...seedUsers];
export const sessionsDatabase = [...seedSessions];
export const policiesDatabase = [...seedPolicies];
export const apiKeysDatabase = [...seedApiKeys];
export const serviceAccountsDatabase = [...seedServiceAccounts];
export const directoryDatabase = seedDirectory;
export const configDatabase = { ...seedConfig };
