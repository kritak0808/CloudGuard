import type {
  ExecutiveMetrics,
  BusinessImpactStats,
  SecurityROIMetrics,
  RiskForecastPoint,
  BoardReport,
  RiskHeatmapNode
} from '@cloudguard/types';

export const seedExecutiveMetrics: ExecutiveMetrics = {
  securityScore: 91,
  executiveRiskIndex: 12,
  threatVelocity: 'low',
  businessContinuityScore: 98,
  autonomousRemediationRate: 94,
  criticalAssetsProtected: 2434,
  cloudCoverage: 100,
  meanTimeToDetectSeconds: 240, // 4 mins
  meanTimeToRespondSeconds: 1680 // 28 mins
};

export const seedBusinessImpact: BusinessImpactStats = {
  revenueImpactRange: [12000, 185000],
  operationalCostUSD: 42000,
  brandExposureScore: 8, // 0-100 (lower is better)
  recoveryHours: 1.2,
  complianceDriftRate: 2.1
};

export const seedROIMetrics: SecurityROIMetrics = {
  hoursSaved: 382,
  incidentsPrevented: 14,
  automationValueUSD: 184000,
  complianceSavingsUSD: 95000,
  engineeringSavingsUSD: 34200
};

export const seedForecasts: RiskForecastPoint[] = [
  { horizonDays: 7,  predictedScore: 92, complianceDrift: 1.8, attackSurfacePercentage: 42 },
  { horizonDays: 30, predictedScore: 94, complianceDrift: 1.2, attackSurfacePercentage: 35 },
  { horizonDays: 90, predictedScore: 96, complianceDrift: 0.5, attackSurfacePercentage: 24 }
];

export const seedHeatmap: RiskHeatmapNode[] = [
  { businessUnit: 'Payments API', application: 'payment-processor', severity: 'critical', probability: 'low', financialExposureUSD: 185000, provider: 'aws', region: 'us-east-1' },
  { businessUnit: 'Core Auth Services', application: 'oidc-bridge', severity: 'high', probability: 'low', financialExposureUSD: 95000, provider: 'aws', region: 'us-west-2' },
  { businessUnit: 'Marketing Web', application: 'landing-pages', severity: 'medium', probability: 'medium', financialExposureUSD: 12000, provider: 'gcp', region: 'global' },
  { businessUnit: 'BigData Analytics', application: 'spark-ingest', severity: 'high', probability: 'medium', financialExposureUSD: 142000, provider: 'gcp', region: 'europe-west1' },
  { businessUnit: 'Legacy Billing', application: 'billing-db', severity: 'critical', probability: 'low', financialExposureUSD: 160000, provider: 'azure', region: 'eastus2' }
];

export const seedBoardReports: BoardReport[] = [
  {
    id: 'rep-q2-2026',
    title: 'Q2 2026 Security Posture & Risk Review',
    type: 'quarterly',
    generatedAt: '2026-07-15T00:00:00Z',
    narrativeSummary: 'Overall organizational security posture improved by 12% this quarter. Autonomous remediation prevented an estimated 46 hours of direct engineering incident effort. Vulnerability risk was mitigated via automated Kyverno ingress block policies. Compliance readiness score rose to 98%.',
    markdownContent: `# Q2 2026 Board Security Report
## Executive Overview
This report reviews the cyber security posture, financial risk exposure, and efficiency gains of CloudGuard AI for Q2 2026.

---

### Key Performance Indicators (KPIs)
* **Overall Security Score:** 91 / 100 (12% improvement)
* **Business Continuity Rating:** 98%
* **Autonomous Remediation Rate:** 94%
* **Mean Time to Contain (MTTC):** 18 Minutes

---

### Strategic Financial Outcomes (Security ROI)
* **Estimated Automation Savings:** $184,000 USD
* **Engineering Hours Restored:** 382 Hours
* **Audit & Compliance Savings:** $95,000 USD
* **Risk Exposure Reduced:** 74%

---
*Report sealed and approved by CloudGuard AI Auto-Investigator Council.*
`
  }
];

export const copilotQAs: Record<string, string> = {
  'What is our security ROI?': 'Our security ROI for this period totals an estimated $313,200 USD in financial outcomes, comprising $184,000 in automated threat prevention value, $95,000 in compliance audit cost reductions, and $34,200 in direct engineering hours saved (382 development hours restored).',
  'Where should we invest?': 'Strategic data indicates security investments should target Legacy Billing (Azure EastUS2) and BigData Analytics (GCP Europe-West1). These business units carry a combined financial risk exposure of $302,000 USD due to public port profiles and outdated base packages.',
  'Which business unit carries the highest cyber risk?': 'The Payments API business unit carries the highest single-asset risk score of 84/100, representing a potential $185,000 USD revenue exposure. However, the risk status is currently mitigated through admission control segregation policies.',
  'What are our largest compliance gaps?': 'Our primary compliance gap relates to IMDSv1 policy enforcement across old auto-scaling launch templates. Standardizing IMDSv2 and rotating AWS EKS node keys will resolve this, closing the remaining 2% compliance drift.',
  'What changed this month?': 'This month, our overall security score improved from 79 to 91 (+12%) following automated secrets revocation sweeps in git repositories and container escape vector patches in the EKS production namespaces.',
};
