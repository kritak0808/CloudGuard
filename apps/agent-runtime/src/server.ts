import express, { Request, Response } from 'express';
import cors from 'cors';
import { CloudGuardTelemetry } from '@cloudguard/telemetry';
import { agentPromptRegistry } from './prompts/registry.js';
import { EvaluationEngine } from './engine/evaluation.js';

const app = express();
const PORT = 4000;

// Initialize telemetry
const telemetry = new CloudGuardTelemetry('agent-runtime');

app.use(cors({
  origin: '*', // Allow connection from Next.js Experience Layer
  methods: ['GET', 'POST', 'OPTIONS'],
}));

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

  // Agent triggers simulation/playbooks which falls under remediation
  let resourceType: 'connectors' | 'scanners' | 'evidence' | 'remediation' | 'executive_reports' | 'memory' | 'api_usage' = 'remediation';
  const action = 'execute';

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
      console.warn(`[Zero Trust Block] Access denied to agent-runtime: ${verification.reason}`);
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

// API health endpoint
app.get('/api/v1/health', (req: Request, res: Response) => {
  const span = telemetry.startSpan('health-check');
  telemetry.logInfo('Gateway health check triggered', { port: PORT }, span);
  res.json({ status: 'HEALTHY', service: 'agent-runtime', timestamp: Date.now() });
});

// Stream Dialogue data matching the AI Security Council dialogue
const dialogueSequence = [
  {
    agentId: 'agent-network',
    content: '🚨 ANOMALY ALERT: Proposed Terraform plan in PR-402 creates a direct route from the Public Internet (0.0.0.0/0) to the EKS Node Security Group on ports 22 (SSH) and 80. This bypasses the Application Load Balancer.',
    phase: 'analysis',
    delay: 1500,
  },
  {
    agentId: 'agent-iam',
    content: '⚠️ ACCESS ALERT: The EKS node role `payment-app-iam-role` has also been updated with a wildcard statement (Action: "*", Resource: "*"). This grants the node admin rights across the entire AWS account.',
    phase: 'analysis',
    delay: 4000,
  },
  {
    agentId: 'agent-compliance',
    content: '🚫 COMPLIANCE FAILURE: This combination creates a Critical failure. SOC2 CC6.1 requires restricted system boundaries. An open network port combined with account-wide IAM access violates key data protection tenets.',
    phase: 'collaboration',
    delay: 6500,
  },
  {
    agentId: 'agent-network',
    content: '🤝 CORRELATION: If an attacker exploits any container vulnerability in the EKS node (e.g. Remote Code Execution), they immediately compromise the instance. From there, the wildcard IAM role lets them exfiltrate all data from the `cloudguard-prod-data` S3 bucket.',
    phase: 'collaboration',
    delay: 9500,
  },
  {
    agentId: 'agent-iam',
    content: '💡 PROPOSED HOTFIX: We must strip the wildcard block. I will synthesize an IAM policy restricting access to target S3 actions on `cloudguard-prod-data` bucket. Network Pathologist, please close port 22/80 for public access and route through the ALB.',
    phase: 'consensus',
    delay: 12500,
  },
  {
    agentId: 'agent-compliance',
    content: '✅ CONSENSUS MET: Hotfix verified against compliance rules. Implementing this patch returns risk from 84% to 12%. I recommend automatic deployment via the self-healing pipeline.',
    phase: 'consensus',
    delay: 15000,
  },
];

// Server Sent Events (SSE) stream endpoint
app.get('/api/v1/simulation/council/stream', (req: Request, res: Response) => {
  const span = telemetry.startSpan('stream-council-debate');
  telemetry.logSecurityEvent('AI_COUNCIL_DEBATE_STREAM_STARTED', { traceId: span.traceId });

  // Setup SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Prevent proxy caching
  });

  telemetry.logInfo('SSE Connection opened for client', {}, span);

  // Keep-alive heartbeat interval
  const heartbeat = setInterval(() => {
    res.write('comment: ping\n\n');
  }, 15000);

  const activeTimers: any[] = [];

  // Stream each dialog segment
  dialogueSequence.forEach((dialogue) => {
    const timer = setTimeout(() => {
      // Get Agent prompt context and evaluate confidence score
      const agentConfig = agentPromptRegistry[dialogue.agentId];
      const threshold = agentConfig ? agentConfig.confidenceThreshold : 90;
      
      // Run evaluation checks on the agent report
      const evalReport = EvaluationEngine.evaluateResponse(dialogue.agentId, dialogue.content, threshold);
      
      const streamPayload = {
        agentId: dialogue.agentId,
        agentName: agentConfig ? agentConfig.name : 'Security Specialist',
        content: dialogue.content,
        phase: dialogue.phase,
        confidence: evalReport.score,
        passedEval: evalReport.passed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      res.write(`data: ${JSON.stringify(streamPayload)}\n\n`);
      
      telemetry.logInfo(`Streamed agent message: ${dialogue.agentId}`, {
        confidenceScore: evalReport.score,
        passedThreshold: evalReport.passed
      }, span);
    }, dialogue.delay);

    activeTimers.push(timer);
  });

  // Final validation signal
  const finalTimer = setTimeout(() => {
    res.write(`data: ${JSON.stringify({ type: 'COMPLETE' })}\n\n`);
    telemetry.logSecurityEvent('AI_COUNCIL_CONSENSUS_REACHED', { traceId: span.traceId });
  }, 16000);
  activeTimers.push(finalTimer);

  // Cleanup on connection close
  req.on('close', () => {
    clearInterval(heartbeat);
    activeTimers.forEach(clearTimeout);
    telemetry.logInfo('SSE Connection closed by client', {}, span);
    res.end();
  });
});

const whatIfDialogues: Record<string, any[]> = {
  ransomware: [
    {
      agentId: 'agent-network',
      content: '🚨 ESCAPE ALERT: Container escape compromise simulated on `eks-app-pod`. Pod runtime is executing abnormal process calls attempting to pivot.',
      phase: 'analysis',
      delay: 1500,
    },
    {
      agentId: 'agent-iam',
      content: '⚠️ IDENTITY BREACH: `payment-app-iam-role` holds wildcard read privileges. If container process reads pod metadata, it exfiltrates S3 keys.',
      phase: 'analysis',
      delay: 4000,
    },
    {
      agentId: 'agent-compliance',
      content: '🚫 COMPLIANCE ALERT: SOC2 CC6.6 boundary protection failure. Container isolation is mandatory for compliance.',
      phase: 'collaboration',
      delay: 6500,
    },
    {
      agentId: 'agent-remediation',
      content: '💡 PROPOSED HOTFIX: Strip wildcard read actions from IAM policies. Limit role to target bucket keys and deploy pod egress blocks.',
      phase: 'consensus',
      delay: 9500,
    },
  ],
  credential_theft: [
    {
      agentId: 'agent-iam',
      content: '🚨 THEFT DETECTED: Leaked credential tokens associated with `payment-app-iam-role` detected on darknet threat feed.',
      phase: 'analysis',
      delay: 1500,
    },
    {
      agentId: 'agent-network',
      content: '⚠️ EXPOSURE DETECTED: The compromised token permits API entry from external nodes bypassing security groups.',
      phase: 'analysis',
      delay: 4000,
    },
    {
      agentId: 'agent-compliance',
      content: '🚫 DRIFT ALERT: PCI-DSS CC-8.1 breach. Authentication credentials must be immediately rotated upon compromise.',
      phase: 'collaboration',
      delay: 6500,
    },
    {
      agentId: 'agent-remediation',
      content: '💡 PROPOSED HOTFIX: Revoke credential session tokens, enable mandatory IAM MFA, and run programmatic rotation script.',
      phase: 'consensus',
      delay: 9500,
    },
  ],
  ingress_leak: [
    {
      agentId: 'agent-network',
      content: '🚨 INGRESS WARNING: Payment security group opens port 22 directly to public internet (0.0.0.0/0) exposing node SSH.',
      phase: 'analysis',
      delay: 1500,
    },
    {
      agentId: 'agent-compliance',
      content: '🚫 COMPLIANCE ALERT: CIS AWS Benchmark 4.1 SSH port exposure. All ingress paths must route through secure jump boxes.',
      phase: 'collaboration',
      delay: 4500,
    },
    {
      agentId: 'agent-remediation',
      content: '💡 PROPOSED HOTFIX: Modify Terraform SG block. Close public SSH port and route through target VPC ALB only.',
      phase: 'consensus',
      delay: 8000,
    },
  ],
  s3_exposure: [
    {
      agentId: 'agent-iam',
      content: '🚨 S3 EXPOSURE: S3 bucket `cloudguard-prod-data` has Public Access Block disabled with an anonymous read policy.',
      phase: 'analysis',
      delay: 1500,
    },
    {
      agentId: 'agent-compliance',
      content: '🚫 BREACH EXPOSURE: CC6.1 violation. Data encryption key assets and logs exposed without token verification.',
      phase: 'collaboration',
      delay: 4500,
    },
    {
      agentId: 'agent-remediation',
      content: '💡 PROPOSED HOTFIX: Re-apply S3 BlockPublicAccess and apply strict least-privilege IAM bucket policy declarations.',
      phase: 'consensus',
      delay: 8000,
    },
  ],
};

app.get('/api/v1/simulation/whatif/stream', (req: Request, res: Response) => {
  const scenario = (req.query.scenario as string) || 'ransomware';
  const dialogue = whatIfDialogues[scenario] || whatIfDialogues.ransomware;
  
  const span = telemetry.startSpan(`whatif-${scenario}`);
  telemetry.logSecurityEvent('AI_COUNCIL_WHATIF_STREAM_STARTED', { scenario, traceId: span.traceId });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const heartbeat = setInterval(() => {
    res.write('comment: ping\n\n');
  }, 15000);

  const activeTimers: any[] = [];

  dialogue.forEach((msg) => {
    const timer = setTimeout(() => {
      const agentConfig = agentPromptRegistry[msg.agentId];
      const threshold = agentConfig ? agentConfig.confidenceThreshold : 90;
      const evalReport = EvaluationEngine.evaluateResponse(msg.agentId, msg.content, threshold);
      
      const streamPayload = {
        agentId: msg.agentId,
        agentName: agentConfig ? agentConfig.name : 'Security Specialist',
        content: msg.content,
        phase: msg.phase,
        confidence: evalReport.score,
        passedEval: evalReport.passed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      res.write(`data: ${JSON.stringify(streamPayload)}\n\n`);
    }, msg.delay);
    activeTimers.push(timer);
  });

  const finalTimer = setTimeout(() => {
    res.write(`data: ${JSON.stringify({ type: 'COMPLETE' })}\n\n`);
  }, 11000);
  activeTimers.push(finalTimer);

  req.on('close', () => {
    clearInterval(heartbeat);
    activeTimers.forEach(clearTimeout);
    res.end();
  });
});

const playbookLogs: Record<string, string[]> = {
  ransomware: [
    "INIT: Starting Autonomous Ransomware Mitigation Playbook",
    "STEP-1: Tracing attack path. Source: Internet -> Destination: eks-app-pod",
    "STEP-1: Executing runtime container container-escape security analysis...",
    "STEP-2: Generating restricted least-privilege IAM policy patch in payment-service-sg...",
    "STEP-3: Running OPA gatekeeper compliance validation checks...",
    "STEP-3: OPA Check: deny_wildcard_iam_policies -> PASS",
    "STEP-3: OPA Check: deny_public_egress_ssh_access -> PASS",
    "PAUSE: Halt for CISO Governance Approval",
    "STEP-4: Deploying hotfix patch. Running terraform apply -auto-approve...",
    "STEP-4: aws_iam_role_policy.payment_restricted: Modifying...",
    "STEP-4: aws_iam_role_policy.payment_restricted: Modification complete after 3s",
    "STEP-5: Re-running synthetic container network isolation checks...",
    "STEP-5: Connectivity test: ingress-deny -> PASS",
    "STEP-6: Re-evaluating overall digital twin risk score... Propagated Risk: 12%",
    "SUCCESS: Playbook execution complete. Digital Twin synchronized."
  ],
  credential_theft: [
    "INIT: Starting Autonomous Leaked Credentials Playbook",
    "STEP-1: Searching AWS CloudTrail logs for compromised token assume-role signatures...",
    "STEP-2: Compiling IAM credential revocation Terraform patch...",
    "STEP-3: Running OPA gatekeeper validation checks... PASS",
    "PAUSE: Halt for CISO Governance Approval",
    "STEP-4: Revoking token. Running terraform apply -auto-approve...",
    "STEP-4: aws_iam_access_key.payment_keys: Deactivating...",
    "STEP-4: aws_iam_access_key.payment_keys: Deactivation complete",
    "STEP-5: Validating AWS API call boundary rejections...",
    "STEP-6: Re-evaluating overall digital twin risk score... Propagated Risk: 12%",
    "SUCCESS: Playbook execution complete. Digital Twin synchronized."
  ],
  ingress_leak: [
    "INIT: Starting Security Group Drift Playbook",
    "STEP-1: Checking SG rule drift. Found port 22 open to 0.0.0.0/0",
    "STEP-2: Compiling Terraform Security Group hotfix patch...",
    "STEP-3: Running compliance OPA audit checks... PASS",
    "PAUSE: Halt for CISO Governance Approval",
    "STEP-4: Restricting port 22. Running terraform apply -auto-approve...",
    "STEP-4: aws_security_group_rule.ingress_ssh: Modifying...",
    "STEP-4: aws_security_group_rule.ingress_ssh: Modification complete",
    "STEP-5: Pinging EKS node port 22 boundaries from public scanner... REJECT (PASS)",
    "STEP-6: Re-evaluating overall digital twin risk score... Propagated Risk: 12%",
    "SUCCESS: Playbook execution complete. Digital Twin synchronized."
  ],
  s3_exposure: [
    "INIT: Starting Leaked S3 Bucket Playbook",
    "STEP-1: Scanning bucket public policies for anonymous read access...",
    "STEP-2: Compiling S3 BlockPublicAccess Terraform patch...",
    "STEP-3: Running OPA gatekeeper validation checks... PASS",
    "PAUSE: Halt for CISO Governance Approval",
    "STEP-4: Securing S3 bucket. Running terraform apply -auto-approve...",
    "STEP-4: aws_s3_bucket_public_access_block.private: Modifying...",
    "STEP-4: aws_s3_bucket_public_access_block.private: Modification complete",
    "STEP-5: Testing anonymous bucket GET operations... 403 Forbidden (PASS)",
    "STEP-6: Re-evaluating overall digital twin risk score... Propagated Risk: 12%",
    "SUCCESS: Playbook execution complete. Digital Twin synchronized."
  ]
};

app.get('/api/v1/simulation/playbook/stream', (req: Request, res: Response) => {
  const scenario = (req.query.scenario as string) || 'ransomware';
  const logs = playbookLogs[scenario] || playbookLogs.ransomware;

  const span = telemetry.startSpan(`playbook-${scenario}`);
  telemetry.logSecurityEvent('AI_COUNCIL_PLAYBOOK_STREAM_STARTED', { scenario, traceId: span.traceId });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const heartbeat = setInterval(() => {
    res.write('comment: ping\n\n');
  }, 15000);

  const activeTimers: any[] = [];

  logs.forEach((logLine, index) => {
    const timer = setTimeout(() => {
      res.write(`data: ${JSON.stringify({ log: logLine, index })}\n\n`);
    }, index * 600); // stream logs steadily
    activeTimers.push(timer);
  });

  const finalTimer = setTimeout(() => {
    res.write(`data: ${JSON.stringify({ type: 'COMPLETE' })}\n\n`);
  }, logs.length * 600 + 50);
  activeTimers.push(finalTimer);

  req.on('close', () => {
    clearInterval(heartbeat);
    activeTimers.forEach(clearTimeout);
    res.end();
  });
});

app.listen(PORT, () => {
  telemetry.logInfo(`CloudGuard AI Runtime running on port ${PORT}`);
});
