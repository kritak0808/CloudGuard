import type { IncidentCase, IncidentMetrics } from '@cloudguard/types';

export const incidentsDatabase: IncidentCase[] = [
  {
    id: 'INC-2026-9021',
    title: 'Container Escape & EKS Node Role Privilege Escalation',
    type: 'container_escape',
    status: 'investigating',
    severity: 'critical',
    priority: 'P0',
    owners: ['SecOps-Incident-Commander', 'AI-Lead-Investigator'],
    discoveredAt: '2026-07-14T06:23:11Z',
    timeline: [
      {
        timeOffset: '08:01',
        timestamp: '2026-07-14T06:01:00Z',
        title: 'Developer merged PR #1142',
        description: 'Pull Request merged adding dependencies into payments service.',
        type: 'deployment',
        status: 'info',
        resourceId: 'org/cloudguard-enterprise/apps/payments'
      },
      {
        timeOffset: '08:05',
        timestamp: '2026-07-14T06:05:00Z',
        title: 'CI/CD pipeline: Terraform Apply',
        description: 'Auto-deployed payment-processor pod upgrade to EKS production cluster.',
        type: 'deployment',
        status: 'info',
        resourceId: 'eks-prod-main / payment-processor'
      },
      {
        timeOffset: '08:06',
        timestamp: '2026-07-14T06:06:00Z',
        title: 'EKS Node IAM Policy Updated',
        description: 'EKS cluster node IAM policy updated to expand credentials scope.',
        type: 'config',
        status: 'warning',
        resourceId: 'aws_iam_role.eks_node_role'
      },
      {
        timeOffset: '08:09',
        timestamp: '2026-07-14T06:09:00Z',
        title: 'Vulnerability Detected: runc Escape vector',
        description: 'Trivy container scan flagged critical runc vulnerability (CVE-2024-21626) in the active pod layer.',
        type: 'threat',
        status: 'critical',
        resourceId: 'eks-prod-main / payment-processor-7d8f9b'
      },
      {
        timeOffset: '08:12',
        timestamp: '2026-07-14T06:12:00Z',
        title: 'Runtime Threat: Interactive Shell Spawned',
        description: 'Falco eBPF probe caught a bash shell spawned inside payment-processor pod with root (uid=0) privileges.',
        type: 'threat',
        status: 'critical',
        resourceId: 'eks-prod-main / payment-processor-7d8f9b'
      },
      {
        timeOffset: '08:13',
        timestamp: '2026-07-14T06:13:00Z',
        title: 'AI Investigation Triggered',
        description: 'CloudGuard AI Council spun up an investigation workspace, matching findings with Threat Memory T1611.',
        type: 'containment',
        status: 'warning',
        resourceId: 'AI-Lead-Investigator'
      },
      {
        timeOffset: '08:18',
        timestamp: '2026-07-14T06:18:00Z',
        title: 'Containment Action Executed',
        description: 'EKS admission controller immediately isolated payment-processor pod via network policy blocks and cordoned EKS node.',
        type: 'containment',
        status: 'safe',
        resourceId: 'eks-prod-main'
      },
      {
        timeOffset: '08:25',
        timestamp: '2026-07-14T06:25:00Z',
        title: 'Recovery Completed: Reverted Task Deployment',
        description: 'EKS cluster configuration rolled back to previous payments service deployment tag 2.1.3.',
        type: 'recovery',
        status: 'safe',
        resourceId: 'eks-prod-main / payment-processor'
      }
    ],
    evidence: [
      {
        id: 'ev-9021-001',
        name: 'falco-ebpf-alert.json',
        type: 'log',
        payloadSummary: 'Falco runtime check payload showing shell process spawn execution stack (sh -> bash -> uid=0).',
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        timestamp: '2026-07-14T06:12:15Z'
      },
      {
        id: 'ev-9021-002',
        name: 'eks-node-metadata-token.log',
        type: 'log',
        payloadSummary: 'AWS CloudTrail credentials access logs showing unauthorized IAM STS token generation request from EKS Pod IP.',
        hash: '8f9c1b78297b483fe089cb1f201089201cb298ef9cb02f182cb092cf18cf1b8f',
        timestamp: '2026-07-14T06:12:33Z'
      },
      {
        id: 'ev-9021-003',
        name: 'network-egress-capture.pcap',
        type: 'network_capture',
        payloadSummary: 'Raw PCAP file containing TLS logs of payment-processor outbound connection to suspicious C2 IP address 185.220.101.47.',
        hash: 'b1e01cb2e0f1bc8f0c29d012cb28ebf9cb1f238cb201b2cb8ebf9cbef982cbe8',
        timestamp: '2026-07-14T06:12:47Z'
      }
    ],
    tasks: [
      {
        id: 'task-9021-001',
        title: 'Deactivate stolen IAM STS node sessions',
        assignee: 'Security Engineer',
        status: 'completed',
        dueDate: '2026-07-14T08:00:00Z'
      },
      {
        id: 'task-9021-002',
        title: 'Deploy patched runc package to all node AMI templates',
        assignee: 'Platform Engineer',
        status: 'in_progress',
        dueDate: '2026-07-15T12:00:00Z'
      },
      {
        id: 'task-9021-003',
        title: 'Audit EKS Node security group egress limitations',
        assignee: 'AI Agent',
        status: 'completed',
        dueDate: '2026-07-14T07:30:00Z'
      },
      {
        id: 'task-9021-004',
        title: 'Draft incident postmortem report for compliance review',
        assignee: 'Compliance Officer',
        status: 'pending',
        dueDate: '2026-07-16T17:00:00Z'
      }
    ],
    rootCause: {
      primaryCause: 'The payment-processor pod was running a container image vulnerable to runc escape (CVE-2024-21626). The container process successfully escalated privileges to root, accessed the host file system namespace, and compromised the local node session token.',
      contributingFactors: [
        'EKS Node IAM Role was over-permissioned (missing IMDSv2 hop limit restrictions).',
        'Outbound egress security rules allowed direct internet traffic to non-allowlisted IP segments.',
        'Kubernetes pod spec failed to enforce runAsNonRoot execution constraints.'
      ],
      evidenceReferences: [
        'Trivy vulnerabilities report (f-trivy-002)',
        'Falco runtime threat alerts (f-falco-001)',
        'CloudTrail Node STS API credential dump logs'
      ],
      mitreMapping: {
        tactic: 'Privilege Escalation',
        technique: 'T1611 — Escape to Host',
        ttpCode: 'T1611'
      }
    },
    postmortemCreated: false
  },
  {
    id: 'INC-2026-9022',
    title: 'Verified AWS IAM Access Key Leaked in Git History',
    type: 'credential_theft',
    status: 'contained',
    severity: 'critical',
    priority: 'P0',
    owners: ['SecOps-Incident-Commander', 'AI-Lead-Investigator'],
    discoveredAt: '2026-07-14T08:12:00Z',
    timeline: [
      {
        timeOffset: '09:00',
        timestamp: '2026-07-14T08:00:00Z',
        title: 'Commit Pushed to Repository',
        description: 'Developer committed variables.tf containing hardcoded secret strings.',
        type: 'deployment',
        status: 'warning',
        resourceId: 'org/cloudguard-enterprise/repo/infra'
      },
      {
        timeOffset: '09:12',
        timestamp: '2026-07-14T08:12:00Z',
        title: 'Secrets Scanner Alert: Live AWS Key Found',
        description: 'TruffleHog scanner caught a live AWS ACCESS KEY ID and validated its API authorization status.',
        type: 'threat',
        status: 'critical',
        resourceId: 'org/cloudguard-enterprise/repo/infra'
      },
      {
        timeOffset: '09:15',
        timestamp: '2026-07-14T08:15:00Z',
        title: 'Automated Secrets Revocation Ingestion',
        description: 'CloudGuard auto-triggered AWS IAM policy deactivate routine, disabling AWS key session immediately.',
        type: 'containment',
        status: 'safe',
        resourceId: 'aws_iam_access_key'
      }
    ],
    evidence: [
      {
        id: 'ev-9022-001',
        name: 'trufflehog-verified-key-findings.json',
        type: 'log',
        payloadSummary: 'TruffleHog detection output verifying AWS Access Key session is active and has access to production buckets.',
        hash: 'f0c29b7a12cb28ebf9cb1f238cb201b2cb8ebf9cbef982cbe8a3f82b1c8f9c1b78',
        timestamp: '2026-07-14T08:12:05Z'
      }
    ],
    tasks: [
      {
        id: 'task-9022-001',
        title: 'Revoke and rotate credentials in Stripe dashboard',
        assignee: 'Security Engineer',
        status: 'completed',
        dueDate: '2026-07-14T10:00:00Z'
      },
      {
        id: 'task-9022-002',
        title: 'Purge Git commit history using git-filter-repo',
        assignee: 'Platform Engineer',
        status: 'completed',
        dueDate: '2026-07-14T12:00:00Z'
      }
    ],
    rootCause: {
      primaryCause: 'A developer hardcoded live production credentials directly into IaC parameters during debug tests, and committed the changes directly to the primary git branch.',
      contributingFactors: [
        'Pre-commit git secret scans were not enforced on developer local workspaces.',
        'CI pipeline secrets policy checker was missing.'
      ],
      evidenceReferences: [
        'TruffleHog secrets findings (f-trufflehog-001)'
      ],
      mitreMapping: {
        tactic: 'Credential Access',
        technique: 'T1552.001 — Unsecured Credentials: In Files',
        ttpCode: 'T1552.001'
      }
    },
    postmortemCreated: false
  }
];

export function computeMetrics(): IncidentMetrics {
  const active = incidentsDatabase.filter(i => i.status !== 'closed' && i.status !== 'archived').length;
  return {
    activeCount: active,
    mttrMinutes: 28,
    mttdMinutes: 4,
    severityCounts: {
      critical: incidentsDatabase.filter(i => i.severity === 'critical').length,
      high: incidentsDatabase.filter(i => i.severity === 'high').length,
      medium: incidentsDatabase.filter(i => i.severity === 'medium').length,
      low: incidentsDatabase.filter(i => i.severity === 'low').length
    }
  };
}
