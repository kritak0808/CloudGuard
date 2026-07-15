import { create } from 'zustand';
import type {
  CloudResource,
  Alert,
  AIAgent,
  ChatMessage,
  RemediationPlan,
  SimulationPhase,
} from '@cloudguard/types';

interface SimulationState {
  phase: SimulationPhase;
  resources: CloudResource[];
  alerts: Alert[];
  agents: AIAgent[];
  chatMessages: ChatMessage[];
  remediationPlan: RemediationPlan;
  overallRisk: number;
  expectedHops: number;
  timers: (ReturnType<typeof setInterval> | ReturnType<typeof setTimeout> | number)[];
  eventSource: EventSource | null;
  activeLayer: 'standard' | 'risk' | 'threat' | 'compliance';
  searchQuery: string;
  whatIfActive: boolean;
  activeScenario: string | null;
  whatIfPlan: RemediationPlan | null;
  autonomousMode: 'observe' | 'recommend' | 'guided' | 'semi-autonomous' | 'autonomous' | 'emergency';
  workflowState: 'idle' | 'running' | 'paused-approval' | 'completed' | 'rolling-back';
  currentStepIndex: number;
  executionLogs: string[];
  setPhase: (phase: SimulationPhase) => void;
  runRemediation: () => void;
  resetSimulation: () => void;
  clearTimers: () => void;
  setActiveLayer: (layer: 'standard' | 'risk' | 'threat' | 'compliance') => void;
  setSearchQuery: (query: string) => void;
  triggerWhatIf: (scenario: string) => void;
  clearWhatIf: () => void;
  setAutonomousMode: (mode: 'observe' | 'recommend' | 'guided' | 'semi-autonomous' | 'autonomous' | 'emergency') => void;
  triggerPlaybook: (scenario: string) => void;
  deployPlaybookHotfix: () => void;
  triggerRollback: () => void;
}

const baseResources: CloudResource[] = [
  {
    id: 'internet',
    name: 'Public Internet',
    type: 'INTERNET',
    provider: 'global',
    status: 'safe',
    riskScore: 0,
    connections: ['alb-ingress'],
    genome: { networkAccess: '0.0.0.0/0 (Standard HTTP/S)', ipRange: 'Any' },
  },
  {
    id: 'alb-ingress',
    name: 'aws-alb-ingress',
    type: 'AWS_VPC',
    provider: 'aws',
    status: 'safe',
    riskScore: 5,
    connections: ['eks-app-pod'],
    genome: {
      arn: 'arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/alb-ingress',
      ports: 'TCP 80, 443',
      securityGroup: 'sg-021ab9 (alb-sg)',
    },
  },
  {
    id: 'eks-app-pod',
    name: 'payment-service-pod',
    type: 'K8S_POD',
    provider: 'k8s',
    status: 'safe',
    riskScore: 10,
    connections: ['eks-iam-role'],
    genome: {
      namespace: 'production',
      image: 'node:18-alpine (verified hash)',
      serviceAccount: 'payment-sa',
      vulnerabilities: '0 Critical, 2 Low (non-exploitable)',
    },
  },
  {
    id: 'eks-iam-role',
    name: 'payment-app-iam-role',
    type: 'AWS_IAM_ROLE',
    provider: 'aws',
    status: 'safe',
    riskScore: 12,
    connections: ['s3-customer-vault', 'rds-payment-db'],
    genome: {
      arn: 'arn:aws:iam::123456789012:role/payment-app-iam-role',
      permissions: ['s3:GetObject (cloudguard-prod-data)', 'rds-db:connect'],
      trustPolicy: 'OIDC Provider (eks.amazonaws.com)',
    },
  },
  {
    id: 's3-customer-vault',
    name: 'cloudguard-prod-data',
    type: 'AWS_S3_BUCKET',
    provider: 'aws',
    status: 'safe',
    riskScore: 8,
    connections: ['kms-s3-key'],
    genome: {
      arn: 'arn:aws:s3:::cloudguard-prod-data',
      encryption: 'AWS-KMS (Customer Managed Key)',
      versioning: 'Enabled',
      publicAccess: 'Blocked (All)',
    },
  },
  {
    id: 'rds-payment-db',
    name: 'payment-ledger-db',
    type: 'AWS_RDS_DB',
    provider: 'aws',
    status: 'safe',
    riskScore: 15,
    connections: ['kms-rds-key'],
    genome: {
      arn: 'arn:aws:rds:us-west-2:123456789012:db:payment-ledger',
      engine: 'PostgreSQL 15.4',
      storageEncrypted: 'True',
      multiAz: 'Enabled',
    },
  },
  {
    id: 'kms-s3-key',
    name: 'kms-s3-data-key',
    type: 'AWS_KMS',
    provider: 'aws',
    status: 'safe',
    riskScore: 2,
    connections: [],
    genome: {
      arn: 'arn:aws:kms:us-west-2:123456789012:key/s3-data-key',
      keyRotation: 'Enabled',
    },
  },
  {
    id: 'kms-rds-key',
    name: 'kms-rds-db-key',
    type: 'AWS_KMS',
    provider: 'aws',
    status: 'safe',
    riskScore: 2,
    connections: [],
    genome: {
      arn: 'arn:aws:kms:us-west-2:123456789012:key/rds-db-key',
      keyRotation: 'Enabled',
    },
  },
];

const baseAlerts: Alert[] = [
  {
    id: 'alert-0',
    title: 'Digital Twin Configured',
    description: 'Infrastructure synchronized with AWS provider. Least-privilege IAM and secure ingress verified.',
    severity: 'info',
    resourceId: 'eks-iam-role',
    category: 'compliance',
    timestamp: '10 mins ago',
  },
];

const initialAgents: AIAgent[] = [
  {
    id: 'agent-network',
    name: 'Pathologist',
    role: 'Network Security specialist',
    avatar: '🟢',
    status: 'idle',
    confidence: 100,
  },
  {
    id: 'agent-iam',
    name: 'Sentinel',
    role: 'IAM & Access Governance',
    avatar: '🟣',
    status: 'idle',
    confidence: 100,
  },
  {
    id: 'agent-compliance',
    name: 'Architect',
    role: 'Compliance & Frameworks',
    avatar: '🔵',
    status: 'idle',
    confidence: 100,
  },
];

const mockRemediationPlan: RemediationPlan = {
  id: 'rem-plan-0',
  title: 'Secure PR-402 Infrastructure Exposure',
  description: 'Revert wildcard S3 access, reinstate KMS database key attachment, and close public SSH ingress on EKS security group.',
  deployed: false,
  deploymentLogs: [],
  diffs: [
    {
      filepath: 'terraform/security_groups.tf',
      language: 'hcl',
      original: `resource "aws_security_group" "eks_node_sg" {
  name        = "eks-node-sg"
  description = "Security group for EKS nodes"
  vpc_id      = aws_vpc.main.id

  ingress {
    description      = "Vulnerable Public SSH Ingress (PR-402 Override)"
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  ingress {
    description      = "Public HTTP Ingress (PR-402 Override)"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }
}`,
      modified: `resource "aws_security_group" "eks_node_sg" {
  name        = "eks-node-sg"
  description = "Security group for EKS nodes"
  vpc_id      = aws_vpc.main.id

  ingress {
    description      = "Restricted Administrative SSH"
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = ["10.0.0.0/8"] # Allowed corporate subnet only
  }

  # Ingress block on Port 80 removed. 
  # All traffic must route through the ALB Ingress (aws-alb-ingress)
}`,
    },
    {
      filepath: 'terraform/iam_policies.tf',
      language: 'hcl',
      original: `resource "aws_iam_policy" "payment_app_policy" {
  name        = "payment-app-policy"
  path        = "/"
  description = "Application policy (Temporary full permissions for testing)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "*"
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}`,
      modified: `resource "aws_iam_policy" "payment_app_policy" {
  name        = "payment-app-policy"
  path        = "/"
  description = "Enforce least-privilege for payment application"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "arn:aws:s3:::cloudguard-prod-data/*"
      },
      {
        Effect   = "Allow"
        Action   = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "arn:aws:kms:us-west-2:123456789012:key/s3-data-key"
      }
    ]
  })
}`,
    },
  ],
};

const councilDialogue = [
  {
    agentId: 'agent-network',
    content: '🚨 ANOMALY ALERT: Proposed Terraform plan in PR-402 creates a direct route from the Public Internet (0.0.0.0/0) to the EKS Node Security Group on ports 22 (SSH) and 80. This bypasses the Application Load Balancer.',
    phase: 'analysis' as const,
    delay: 1500,
  },
  {
    agentId: 'agent-iam',
    content: '⚠️ ACCESS ALERT: The EKS node role `payment-app-iam-role` has also been updated with a wildcard statement (Action: "*", Resource: "*"). This grants the node admin rights across the entire AWS account.',
    phase: 'analysis' as const,
    delay: 4000,
  },
  {
    agentId: 'agent-compliance',
    content: '🚫 COMPLIANCE FAILURE: This combination creates a Critical failure. SOC2 CC6.1 requires restricted system boundaries. An open network port combined with account-wide IAM access violates key data protection tenets.',
    phase: 'collaboration' as const,
    delay: 6500,
  },
  {
    agentId: 'agent-network',
    content: '🤝 CORRELATION: If an attacker exploits any container vulnerability in the EKS node (e.g. Remote Code Execution), they immediately compromise the instance. From there, the wildcard IAM role lets them exfiltrate all data from the `cloudguard-prod-data` S3 bucket.',
    phase: 'collaboration' as const,
    delay: 9500,
  },
  {
    agentId: 'agent-iam',
    content: '💡 PROPOSED HOTFIX: We must strip the wildcard block. I will synthesize an IAM policy restricting access to target S3 actions on `cloudguard-prod-data` bucket. Network Pathologist, please close port 22/80 for public access and route through the ALB.',
    phase: 'consensus' as const,
    delay: 12500,
  },
  {
    agentId: 'agent-compliance',
    content: '✅ CONSENSUS MET: Hotfix verified against compliance rules. Implementing this patch returns risk from 84% to 12%. I recommend automatic deployment via the self-healing pipeline.',
    phase: 'consensus' as const,
    delay: 15000,
  },
];

export const useSimulationStore = create<SimulationState>((set, get) => ({
  phase: 'current',
  resources: baseResources,
  alerts: baseAlerts,
  agents: initialAgents,
  chatMessages: [],
  remediationPlan: mockRemediationPlan,
  overallRisk: 12,
  expectedHops: 7,
  timers: [],
  eventSource: null,
  activeLayer: 'standard',
  searchQuery: '',
  whatIfActive: false,
  activeScenario: null,
  whatIfPlan: null,
  autonomousMode: 'guided',
  workflowState: 'idle',
  currentStepIndex: 0,
  executionLogs: [],

  clearTimers: () => {
    get().timers.forEach(t => clearTimeout(t));
    get().eventSource?.close();
    set({ timers: [], eventSource: null });
  },

  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  setAutonomousMode: (mode) => set({ autonomousMode: mode }),

  triggerPlaybook: (scenario) => {
    get().clearTimers();
    set({
      workflowState: 'running',
      currentStepIndex: 0,
      executionLogs: []
    });

    const es = new EventSource(`http://localhost:4000/api/v1/simulation/playbook/stream?scenario=${scenario}`);
    set({ eventSource: es });

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'COMPLETE') {
        es.close();
        set({ eventSource: null });
        return;
      }

      const logLine = data.log;
      set(state => ({
        executionLogs: [...state.executionLogs, logLine]
      }));

      // Parse step index indicators from logs
      if (logLine.includes("STEP-1")) {
        set({ currentStepIndex: 1 });
      } else if (logLine.includes("STEP-2")) {
        set({ currentStepIndex: 2 });
      } else if (logLine.includes("STEP-3")) {
        set({ currentStepIndex: 3 });
      } else if (logLine.includes("PAUSE")) {
        // Halt and close connection for CISO governance authorization
        es.close();
        set({
          eventSource: null,
          workflowState: 'paused-approval',
          currentStepIndex: 4 // index of CISO approval step
        });
      }
    };

    es.onerror = (err) => {
      console.error('Playbook stream connection error:', err);
      es.close();
      set({ eventSource: null });
    };
  },

  deployPlaybookHotfix: () => {
    set({
      workflowState: 'running',
      currentStepIndex: 5 // Deploy stage
    });

    const scenario = get().activeScenario || 'ransomware';
    const remainingLogs: Record<string, string[]> = {
      ransomware: [
        "STEP-4: Deploying hotfix patch. Running terraform apply -auto-approve...",
        "STEP-4: aws_iam_role_policy.payment_restricted: Modifying...",
        "STEP-4: aws_iam_role_policy.payment_restricted: Modification complete after 3s",
        "STEP-5: Re-running synthetic container network isolation checks...",
        "STEP-5: Connectivity test: ingress-deny -> PASS",
        "STEP-6: Re-evaluating overall digital twin risk score... Propagated Risk: 12%",
        "SUCCESS: Playbook mitigation complete. Digital Twin synchronized."
      ],
      credential_theft: [
        "STEP-4: Revoking token. Running terraform apply -auto-approve...",
        "STEP-4: aws_iam_access_key.payment_keys: Deactivating...",
        "STEP-4: aws_iam_access_key.payment_keys: Deactivation complete",
        "STEP-5: Validating AWS API call boundary rejections...",
        "STEP-6: Re-evaluating overall digital twin risk score... Propagated Risk: 12%",
        "SUCCESS: Playbook mitigation complete. Digital Twin synchronized."
      ],
      ingress_leak: [
        "STEP-4: Restricting port 22. Running terraform apply -auto-approve...",
        "STEP-4: aws_security_group_rule.ingress_ssh: Modifying...",
        "STEP-4: aws_security_group_rule.ingress_ssh: Modification complete",
        "STEP-5: Pinging EKS node port 22 boundaries from public scanner... REJECT (PASS)",
        "STEP-6: Re-evaluating overall digital twin risk score... Propagated Risk: 12%",
        "SUCCESS: Playbook mitigation complete. Digital Twin synchronized."
      ],
      s3_exposure: [
        "STEP-4: Securing S3 bucket. Running terraform apply -auto-approve...",
        "STEP-4: aws_s3_bucket_public_access_block.private: Modifying...",
        "STEP-4: aws_s3_bucket_public_access_block.private: Modification complete",
        "STEP-5: Testing anonymous bucket GET operations... 403 Forbidden (PASS)",
        "STEP-6: Re-evaluating overall digital twin risk score... Propagated Risk: 12%",
        "SUCCESS: Playbook mitigation complete. Digital Twin synchronized."
      ]
    };

    const lines = remainingLogs[scenario] || remainingLogs.ransomware;
    const scheduledTimers: (ReturnType<typeof setInterval> | ReturnType<typeof setTimeout> | number)[] = [];

    lines.forEach((line, index) => {
      const timer = setTimeout(() => {
        set(state => ({
          executionLogs: [...state.executionLogs, line]
        }));

        if (line.includes("STEP-5")) {
          set({ currentStepIndex: 6 }); // verify stage
        } else if (line.includes("SUCCESS")) {
          // remediate layout values
          get().runRemediation();
          set({ 
            workflowState: 'completed',
            currentStepIndex: 7 // finished stage
          });
        }
      }, index * 800);
      scheduledTimers.push(timer);
    });

    set({ timers: scheduledTimers });
  },

  triggerRollback: () => {
    get().clearTimers();
    set({
      workflowState: 'rolling-back',
      executionLogs: [
        ...get().executionLogs,
        "ROLLBACK: Initializing automated rollback sequence...",
        "ROLLBACK: Running git revert on configuration branches...",
        "ROLLBACK: Re-applying previous baseline state snapshots..."
      ]
    });

    // Revert layout node risk states after short delay simulating compile
    setTimeout(() => {
      const scenario = get().activeScenario || 'ransomware';
      set(state => ({
        executionLogs: [
          ...state.executionLogs,
          "ROLLBACK: Reverting Terraform configurations...",
          "ROLLBACK: Re-scanning network and IAM parameters...",
          "ROLLBACK: Rollback complete. Graph reverted to simulated state."
        ]
      }));

      // Trigger What If to restore vulnerable state
      get().triggerWhatIf(scenario);
      set({ 
        workflowState: 'idle',
        remediationPlan: { ...get().remediationPlan, deployed: false, deploymentLogs: [] }
      });
    }, 4000);
  },

  clearWhatIf: () => {
    get().clearTimers();
    set({
      whatIfActive: false,
      activeScenario: null,
      whatIfPlan: null,
      phase: 'current',
      overallRisk: 12,
      expectedHops: 7,
      chatMessages: [],
      resources: baseResources,
      agents: initialAgents.map(a => ({ ...a, status: 'idle', confidence: 100 })),
      remediationPlan: { ...mockRemediationPlan, deployed: false, deploymentLogs: [] }
    });
  },

  triggerWhatIf: (scenario: string) => {
    get().clearTimers();
    set({ chatMessages: [] });

    // Setup custom simulated resource risk states and diff patches per scenario
    let simulatedResources = [...baseResources];
    let risk = 85;
    let hops = 3;
    let patchCode = '';
    let patchFile = '';

    if (scenario === 'ransomware') {
      risk = 92;
      hops = 3;
      patchFile = 'terraform/iam_policies.tf';
      patchCode = `- resource "aws_iam_role_policy" "payment_wildcard" {
-   actions   = ["*"]
-   resources = ["*"]
- }
+ resource "aws_iam_role_policy" "payment_restricted" {
+   actions   = ["s3:GetObject", "s3:PutObject"]
+   resources = ["arn:aws:s3:::cloudguard-prod-data/*"]
+ }`;

      simulatedResources = baseResources.map(res => {
        if (res.id === 'eks-app-pod') {
          return { ...res, status: 'danger', riskScore: 92, genome: { ...res.genome, status: 'Infected (Ransomware/Escape Simulation)' } };
        }
        if (res.id === 'eks-iam-role') {
          return { ...res, status: 'danger', riskScore: 78 };
        }
        return res;
      });
    } else if (scenario === 'credential_theft') {
      risk = 88;
      hops = 2;
      patchFile = 'terraform/credentials.tf';
      patchCode = `- resource "aws_iam_access_key" "payment_keys" {
-   status = "Active"
- }
+ resource "aws_iam_access_key" "payment_keys" {
+   status = "Inactive" # revoke compromised credential token
+ }`;

      simulatedResources = baseResources.map(res => {
        if (res.id === 'eks-iam-role') {
          return { ...res, status: 'danger', riskScore: 88, genome: { ...res.genome, sessionToken: 'Compromised (Darknet Leak Leak)' } };
        }
        if (res.id === 's3-customer-vault') {
          return { ...res, status: 'warning', riskScore: 68 };
        }
        return res;
      });
    } else if (scenario === 'ingress_leak') {
      risk = 74;
      hops = 4;
      patchFile = 'terraform/security_groups.tf';
      patchCode = `- ingress {
-   from_port   = 22
-   to_port     = 22
-   cidr_blocks = ["0.0.0.0/0"]
- }
+ ingress {
+   from_port   = 22
+   to_port     = 22
+   cidr_blocks = ["10.0.0.0/16"] # Restricted to corporate subnet
+ }`;

      simulatedResources = baseResources.map(res => {
        if (res.id === 'alb-ingress') {
          return { ...res, status: 'danger', riskScore: 74, genome: { ...res.genome, ingressRules: 'Port 22 Open to Public' } };
        }
        return res;
      });
    } else if (scenario === 's3_exposure') {
      risk = 95;
      hops = 2;
      patchFile = 'terraform/s3_storage.tf';
      patchCode = `- resource "aws_s3_bucket_public_access_block" "public" {
-   block_public_acls       = false
-   block_public_policy     = false
- }
+ resource "aws_s3_bucket_public_access_block" "private" {
+   block_public_acls       = true
+   block_public_policy     = true
+ }`;

      simulatedResources = baseResources.map(res => {
        if (res.id === 's3-customer-vault') {
          return { ...res, status: 'danger', riskScore: 95, genome: { ...res.genome, publicAccess: 'Allowed (Exposed Policy)' } };
        }
        return res;
      });
    }

    set({
      whatIfActive: true,
      activeScenario: scenario,
      resources: simulatedResources,
      overallRisk: risk,
      expectedHops: hops,
      phase: 'future', // Map layout triggers simulated state visuals
      whatIfPlan: {
        id: `plan-${scenario}`,
        title: `Mitigate ${scenario.replace('_', ' ').toUpperCase()}`,
        description: `Autonomous hotfix patch prepared for simulated scenario.`,
        diffs: [
          {
            filepath: patchFile,
            language: 'hcl',
            original: '',
            modified: patchCode
          }
        ],
        deployed: false,
        deploymentLogs: []
      }
    });

    // Establish live EventSource connection to backend agent runtime
    const es = new EventSource(`http://localhost:4000/api/v1/simulation/whatif/stream?scenario=${scenario}`);
    set({ eventSource: es });

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'COMPLETE') {
        set(state => ({
          agents: state.agents.map(a => ({ ...a, status: 'completed' }))
        }));
        es.close();
        set({ eventSource: null });
        return;
      }

      set(state => ({
        agents: state.agents.map(a => {
          if (a.id === data.agentId) {
            return { ...a, status: 'speaking', confidence: data.confidence };
          }
          return { ...a, status: 'idle' };
        }),
        chatMessages: [
          ...state.chatMessages,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            agentId: data.agentId,
            agentName: data.agentName,
            content: data.content,
            timestamp: data.timestamp,
            phase: data.phase
          }
        ]
      }));
    };

    es.onerror = (err) => {
      console.error('SSE What-If stream connection error:', err);
      es.close();
      set({ eventSource: null });
    };
  },

  setPhase: (phase: SimulationPhase) => {
    get().clearTimers();

    if (phase === 'current') {
      set({
        phase: 'current',
        resources: baseResources,
        alerts: baseAlerts,
        chatMessages: [],
        overallRisk: 12,
        expectedHops: 7,
        agents: initialAgents.map(a => ({ ...a, status: 'idle', confidence: 100 })),
        remediationPlan: { ...mockRemediationPlan, deployed: false, deploymentLogs: [] }
      });
    } else if (phase === 'future') {
      // Setup vulnerable resources
      const futureResources = baseResources.map(res => {
        if (res.id === 'internet') {
          return {
            ...res,
            status: 'warning' as const,
            connections: ['alb-ingress', 'eks-app-pod'],
          };
        }
        if (res.id === 'eks-app-pod') {
          return {
            ...res,
            status: 'danger' as const,
            riskScore: 78,
            genome: {
              ...res.genome,
              vulnerabilities: '1 Critical (CVE-2026-9812 RCE), 2 Low',
            },
          };
        }
        if (res.id === 'eks-iam-role') {
          return {
            ...res,
            status: 'danger' as const,
            riskScore: 84,
            genome: {
              ...res.genome,
              permissions: ['* (Unrestricted Administrator Access)'],
            },
          };
        }
        if (res.id === 's3-customer-vault') {
          return {
            ...res,
            status: 'danger' as const,
            riskScore: 90,
            genome: {
              ...res.genome,
              publicAccess: 'Exposed via role policies',
            },
          };
        }
        return res;
      });

      const futureAlerts: Alert[] = [
        {
          id: 'alert-1',
          title: 'Direct Ingress to Private Instance',
          description: 'Port 22 & 80 exposed to 0.0.0.0/0 on Payment Service nodes.',
          severity: 'critical',
          resourceId: 'eks-app-pod',
          category: 'network',
          timestamp: 'Just now',
        },
        {
          id: 'alert-2',
          title: 'Wildcard IAM Administrator Role',
          description: 'eks-app-role granted AdministratorAccess (*:*). Violation of Least Privilege.',
          severity: 'critical',
          resourceId: 'eks-iam-role',
          category: 'iam',
          timestamp: 'Just now',
        },
        {
          id: 'alert-3',
          title: 'SOC2 Compliance Breach',
          description: 'System boundary controls (CC6.6) and unauthorized access prevention failed.',
          severity: 'high',
          resourceId: 's3-customer-vault',
          category: 'compliance',
          timestamp: 'Just now',
        },
      ];

      set({
        phase: 'future',
        resources: futureResources,
        alerts: futureAlerts,
        overallRisk: 84,
        expectedHops: 3,
        chatMessages: [],
        eventSource: null
      });

      // Connect to AI Runtime Server for Live SSE Council debate
      const es = new EventSource('http://localhost:4000/api/v1/simulation/council/stream');
      set({ eventSource: es });

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'COMPLETE') {
          set(state => ({
            agents: state.agents.map(a => ({ ...a, status: 'completed' }))
          }));
          es.close();
          set({ eventSource: null });
          return;
        }

        // Append debate messages dynamically
        set(state => ({
          agents: state.agents.map(a => {
            if (a.id === data.agentId) {
              return { ...a, status: 'speaking', confidence: data.confidence };
            }
            return { ...a, status: 'idle' };
          }),
          chatMessages: [
            ...state.chatMessages,
            {
              id: `msg-${Date.now()}-${Math.random()}`,
              agentId: data.agentId,
              agentName: data.agentName,
              content: data.content,
              timestamp: data.timestamp,
              phase: data.phase
            }
          ]
        }));
      };

      es.onerror = (err) => {
        console.error('EventSource connection error:', err);
        es.close();
        set({ eventSource: null });
      };
    }
  },

  runRemediation: () => {
    get().clearTimers();
    set({
      phase: 'remediating',
      remediationPlan: { ...mockRemediationPlan, deployed: true, deploymentLogs: [] }
    });

    const logs = [
      '⚡ Initializing Autonomous Self-Healing Pipeline...',
      '🔍 Authenticating against Zero-Trust Policy Engine...',
      '🧩 Synthesizing remediation plan from AI Council consensus...',
      '📝 Parsing git repository configs: payment-service-sg / payment-iam-role...',
      '📊 Running dry-run validation checks on modified Terraform file...',
      '⚙️ Applying Terraform layout changes (1 resource modified, 1 ingress rule deleted)...',
      '🔒 Regenerating IAM permission tokens with least-privilege attributes...',
      '⏳ Waiting for AWS CloudTrail to synchronize state changes...',
      '🐳 Re-scanning Kubernetes namespace boundaries...',
      '🕵️ Re-evaluating Attack Path Simulation...',
      '✅ Deployment completed. Digital Twin synchronized.',
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        const nextLog = logs[currentLogIndex];
        set(state => ({
          remediationPlan: {
            ...state.remediationPlan,
            deploymentLogs: [...state.remediationPlan.deploymentLogs, nextLog]
          }
        }));
        currentLogIndex++;
      } else {
        clearInterval(interval);
        
        // Return to healed/secure state
        set(state => ({
          phase: 'remediated',
          overallRisk: 12,
          expectedHops: 7,
          resources: baseResources,
          alerts: [
            {
              id: 'alert-remediated',
              title: 'Infrastructure Restored (Self-Healed)',
              description: 'Terraform PR-402 security group closed and IAM wildcard access revoked. Compliance restored.',
              severity: 'safe',
              resourceId: 'eks-app-pod',
              category: 'compliance',
              timestamp: 'Just now',
            }
          ],
          chatMessages: [
            ...state.chatMessages,
            {
              id: 'msg-remediate-complete',
              agentId: 'agent-compliance',
              agentName: 'Architect',
              content: '🚨 SELF-HEALING ACTION SUCCESSFUL: The remediation plan has been applied. Public ingress closed, S3 access restricted. Infrastructure returned to baseline secure state.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              phase: 'consensus'
            }
          ]
        }));
      }
    }, 750);

    set(state => ({
      timers: [...state.timers, interval as unknown as number]
    }));
  },

  resetSimulation: () => {
    get().setPhase('current');
  }
}));
