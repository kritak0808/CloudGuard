import type { MemoryEntry, MemoryQueryResult } from '@cloudguard/types';

export const memoryRegistry: MemoryEntry[] = [
  // ─── Executive Memories ──────────────────────────────────────────────────────
  {
    id: 'mem-exec-001',
    layer: 'executive',
    title: 'Enterprise Risk Tolerance & Board Reporting Preferences',
    description: 'The organization has a zero-tolerance policy for internet-exposed databases, credential leaks in repositories, and unpatched CVEs on systems with direct customer database connection. Preferred communication tone is objective, technical, and formatted for weekly SecOps review.',
    timestamp: '2026-01-08T09:00:00Z',
    tags: ['compliance', 'audit', 'governance'],
    metadata: {
      author: 'CISO Office',
      neo4jRelations: ['REFERENCES', 'LINKED_TO']
    }
  },
  {
    id: 'mem-exec-002',
    layer: 'executive',
    title: 'Accepted Risk: Legacy Staging Server Exposure',
    description: 'Executive exception approved for host staging-legacy-01. Allow ingress on port 8080 from trusted partner network CIDR 198.51.100.0/24. Valid until Jan 2027.',
    timestamp: '2026-03-12T14:30:00Z',
    tags: ['accepted-risk', 'exception', 'staging'],
    metadata: {
      author: 'VP Infrastructure',
      neo4jRelations: ['AFFECTS', 'LINKED_TO']
    }
  },

  // ─── Incident Memories ──────────────────────────────────────────────────────
  {
    id: 'mem-inc-001',
    layer: 'incident',
    title: 'Incident INC-2024-8843: Analytics Engine Log4Shell Exposure',
    description: 'A critical alert from Trivy flagged log4j-core 2.14.1 running in production namespace. The AI council initiated immediate verification, identified public ingress via ALB, and auto-generated an incident playbook to rotate credentials and deploy an upgraded jar version (2.17.1). No evidence of compromise found in VPC traffic logs.',
    timestamp: '2024-11-22T08:15:00Z',
    tags: ['log4shell', 'java', 'rce', 'resolved'],
    metadata: {
      resourceId: 'org/cloudguard-enterprise/services/analytics-engine',
      cveId: 'CVE-2021-44228',
      correlationScore: 98,
      neo4jRelations: ['AFFECTS', 'RESOLVED_BY', 'LINKED_TO']
    }
  },
  {
    id: 'mem-inc-002',
    layer: 'incident',
    title: 'Incident INC-2025-1022: AWS Access Key Leakage & Revocation',
    description: 'A verified Stripe API key and AWS ACCESS KEY ID were pushed to a public test directory in variables.tf. TruffleHog detected the verified credentials immediately. CloudGuard triggered a Lambda routine to deactivate the key in IAM, rolled the Stripe API key, and purged the git history via git-filter-repo.',
    timestamp: '2025-05-18T16:45:00Z',
    tags: ['leak', 'secrets', 'aws-iam', 'resolved'],
    metadata: {
      resourceId: 'org/cloudguard-enterprise/repo/infra',
      correlationScore: 94,
      neo4jRelations: ['GENERATED_FROM', 'RESOLVED_BY']
    }
  },
  {
    id: 'mem-inc-003',
    layer: 'incident',
    title: 'Incident INC-2026-0112: Unauthorized Database Connection Attempt',
    description: 'An external IP address attempted a brute-force connection to port 5432 on aws_db_instance.legacy_analytics. The DB was temporarily set to public-access during migration. CloudGuard blocked the external IP via Security Group ingress rewrite and reverted the database configuration to private.',
    timestamp: '2026-01-12T11:22:00Z',
    tags: ['database', 'rds', 'brute-force', 'resolved'],
    metadata: {
      resourceId: 'aws_db_instance.legacy_analytics',
      neo4jRelations: ['AFFECTS', 'RESOLVED_BY', 'OBSERVED_AFTER']
    }
  },

  // ─── Infrastructure Memories ────────────────────────────────────────────────
  {
    id: 'mem-infra-001',
    layer: 'infrastructure',
    title: 'IAM Role Modification History: payment-processor-role',
    description: 'Historical records show this role had wildcard (*) administrator permissions added on Nov 12, 2025, during testing. The permission was flagged by Checkov and subsequently restricted to DynamoDB and KMS-only read/write on Nov 14, 2025, following a security notification.',
    timestamp: '2025-11-14T10:00:00Z',
    tags: ['iam', 'permissions', 'payment-processor'],
    metadata: {
      resourceId: 'aws_iam_role.payment_processor_role',
      neo4jRelations: ['AFFECTS', 'LINKED_TO']
    }
  },
  {
    id: 'mem-infra-002',
    layer: 'infrastructure',
    title: 'Network Traffic Drift: payment-api container egress',
    description: 'Egress traffic anomalies were flagged in the payment-api container when external connection attempts to 185.220.101.47 were captured. Traffic rules updated via Kyverno network policy to drop all non-allowlisted outbound connections.',
    timestamp: '2026-02-28T14:12:00Z',
    tags: ['network', 'egress', 'anomaly'],
    metadata: {
      resourceId: 'registry.cloudguard.io/payment-api:2.1.4',
      neo4jRelations: ['AFFECTS', 'OBSERVED_AFTER']
    }
  },

  // ─── Deployment Memories ───────────────────────────────────────────────────
  {
    id: 'mem-dep-001',
    layer: 'deployment',
    title: 'Commit hash 4df12a7: Introduced xz-utils 5.6.0 dependency',
    description: 'Pull Request #882 in payments-api merged by developer-02. The build integrated the backdoored xz-utils version 5.6.0. The vulnerability was discovered 48 hours later via Trivy static scan.',
    timestamp: '2026-03-24T18:30:00Z',
    tags: ['deployment', 'pr', 'xz-utils'],
    metadata: {
      author: 'dev-02',
      cveId: 'CVE-2024-3094',
      neo4jRelations: ['DEPLOYED_WITH', 'GENERATED_FROM']
    }
  },
  {
    id: 'mem-dep-002',
    layer: 'deployment',
    title: 'Deploy rollback: Payment Service reversion to 2.1.3',
    description: 'Following the detection of shell spawning anomalies, the payment-processor deployment was reverted back to tag 2.1.3 to remove runc vulnerability vector CVE-2024-21626.',
    timestamp: '2026-03-26T22:15:00Z',
    tags: ['deployment', 'rollback', 'kubernetes'],
    metadata: {
      resourceId: 'eks-prod-main / payment-processor-7d8f9b',
      neo4jRelations: ['RESOLVED_BY', 'DEPLOYED_WITH']
    }
  }
];

// Predefined semantic queries
export const semanticQueries: Record<string, MemoryQueryResult[]> = {
  'Show every incident similar to Log4Shell': [
    {
      entry: memoryRegistry[2], // INC-2024-8843 Log4Shell Analytics
      similarityScore: 98,
      confidence: 99,
      retrievalReason: 'Matched exact CVE-2021-44228 reference and log4j-core library path. This memory details the previous RCE vulnerability in Java services and the approved remediation method.',
      supportingEvidence: [
        'NVD database entry for CVE-2021-44228',
        'Trivy scan findings from production analytics-engine namespace',
        'VPC traffic logs verifying no malicious JNDI string payload succeeded'
      ],
      contradictoryEvidence: []
    },
    {
      entry: {
        id: 'mem-inc-similar-001',
        layer: 'incident',
        title: 'Incident INC-2025-0447: Spring4Shell Exposure in staging-web-app',
        description: 'A critical vulnerability matching Spring4Shell (CVE-2022-22965) was identified in a staging Tomcat environment. The remediation closely mirrored the Log4Shell playbook, involving updating the JVM args and rebuilding the deployment package using upgraded base libraries.',
        timestamp: '2025-04-12T13:40:00Z',
        tags: ['spring4shell', 'java', 'rce', 'resolved'],
        metadata: {
          cveId: 'CVE-2022-22965',
          correlationScore: 84,
          neo4jRelations: ['SIMILAR_TO']
        }
      },
      similarityScore: 84,
      confidence: 90,
      retrievalReason: 'Retrieved based on shared Java runtime framework, remote code execution (RCE) vector, classloader injection mechanics, and dependency resolution playbooks.',
      supportingEvidence: [
        'MITRE ATT&CK T1190 public exploit classification',
        'Previous playbook memory for classloader mitigations'
      ],
      contradictoryEvidence: [
        'Vulnerability vector uses parameter binding instead of JNDI string search'
      ]
    }
  ],
  'When did this IAM role first become high risk?': [
    {
      entry: memoryRegistry[5], // IAM role modification history
      similarityScore: 92,
      confidence: 95,
      retrievalReason: 'Found matches for aws_iam_role.payment_processor_role showing historical permissions updates and risk scoring history.',
      supportingEvidence: [
        'CloudTrail event IAM_CreatePolicyVersion from user dev-04 on Nov 12, 2025',
        'Checkov static code failure for IAM wildcard permissions'
      ],
      contradictoryEvidence: []
    }
  ],
  'Which deployment introduced this CVE?': [
    {
      entry: memoryRegistry[7], // Commit hash introducing xz-utils
      similarityScore: 96,
      confidence: 98,
      retrievalReason: 'Direct correlation found linking CVE-2024-3094 to Commit 4df12a7 and payment-api build output logs.',
      supportingEvidence: [
        'GitHub webhook pull-request merge notification event',
        'SBOM catalog generated during payment-api build stage'
      ],
      contradictoryEvidence: []
    }
  ],
  'Have we seen this attack before?': [
    {
      entry: memoryRegistry[4], // INC-2026-0112 RDS Port brute force
      similarityScore: 90,
      confidence: 93,
      retrievalReason: 'Retrieved matching database port connection logs, ingress anomalies, and remote IP scanning history.',
      supportingEvidence: [
        'VPC flow log records showing port 5432 ingress from external subnet',
        'Threat database containing known scanning addresses'
      ],
      contradictoryEvidence: []
    }
  ],
  'What was the previous remediation?': [
    {
      entry: memoryRegistry[8], // Rollback payment service
      similarityScore: 95,
      confidence: 97,
      retrievalReason: 'Retrieved matching kubernetes rollback procedures, image registry tag updates, and config recovery playbooks.',
      supportingEvidence: [
        'Kyverno namespace rollback transaction log',
        'Developer approval ticket for pod reversion'
      ],
      contradictoryEvidence: []
    }
  ]
};
