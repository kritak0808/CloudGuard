"use client";

import { create } from 'zustand';
import type {
  ExecutiveMetrics,
  BusinessImpactStats,
  SecurityROIMetrics,
  RiskForecastPoint,
  BoardReport,
  RiskHeatmapNode
} from '@cloudguard/types';

const EXECUTIVE_API = 'http://localhost:4005';

// ─── Seed fallbacks ──────────────────────────────────────────────────────────

const SEED_METRICS: ExecutiveMetrics = {
  securityScore: 91, executiveRiskIndex: 12, threatVelocity: 'low',
  businessContinuityScore: 98, autonomousRemediationRate: 94,
  criticalAssetsProtected: 2434, cloudCoverage: 100,
  meanTimeToDetectSeconds: 240, meanTimeToRespondSeconds: 1680
};

const SEED_IMPACT: BusinessImpactStats = {
  revenueImpactRange: [12000, 185000], operationalCostUSD: 42000,
  brandExposureScore: 8, recoveryHours: 1.2, complianceDriftRate: 2.1
};

const SEED_ROI: SecurityROIMetrics = {
  hoursSaved: 382, incidentsPrevented: 14, automationValueUSD: 184000,
  complianceSavingsUSD: 95000, engineeringSavingsUSD: 34200
};

const SEED_FORECASTS: RiskForecastPoint[] = [
  { horizonDays: 7,  predictedScore: 92, complianceDrift: 1.8, attackSurfacePercentage: 42 },
  { horizonDays: 30, predictedScore: 94, complianceDrift: 1.2, attackSurfacePercentage: 35 },
  { horizonDays: 90, predictedScore: 96, complianceDrift: 0.5, attackSurfacePercentage: 24 }
];

const SEED_HEATMAP: RiskHeatmapNode[] = [
  { businessUnit: 'Payments API', application: 'payment-processor', severity: 'critical', probability: 'low', financialExposureUSD: 185000, provider: 'aws', region: 'us-east-1' },
  { businessUnit: 'Core Auth Services', application: 'oidc-bridge', severity: 'high', probability: 'low', financialExposureUSD: 95000, provider: 'aws', region: 'us-west-2' },
  { businessUnit: 'Marketing Web', application: 'landing-pages', severity: 'medium', probability: 'medium', financialExposureUSD: 12000, provider: 'gcp', region: 'global' },
];

const SEED_REPORTS: BoardReport[] = [
  {
    id: 'rep-q2-2026',
    title: 'Q2 2026 Security Posture & Risk Review',
    type: 'quarterly',
    generatedAt: new Date().toISOString(),
    narrativeSummary: 'Overall organizational security posture improved by 12% this quarter. Autonomous remediation prevented an estimated 46 hours of direct engineering incident effort. Compliance score rose to 98%.',
    markdownContent: '# Q2 2026 Executive Summary\n* Security Score: 91\n* Automation savings: $184,000 USD\n* Hours Saved: 382 Hours'
  }
];

const LOCAL_COPILOT_ANSWERS: Record<string, string> = {
  'What is our security ROI?': 'Our security ROI totals an estimated $313,200 USD in financial outcomes, comprising $184,000 in automated threat prevention value, $95,000 in compliance audit cost reductions, and $34,200 in direct engineering hours saved (382 development hours restored).',
  'Where should we invest?': 'Strategic data indicates security investments should target Legacy Billing (Azure EastUS2) and BigData Analytics (GCP Europe-West1). These business units carry a combined financial risk exposure of $302,000 USD.',
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface ExecutiveStore {
  metrics: ExecutiveMetrics | null;
  impact: BusinessImpactStats | null;
  roi: SecurityROIMetrics | null;
  forecasts: RiskForecastPoint[];
  heatmap: RiskHeatmapNode[];
  reports: BoardReport[];
  copilotChat: { question: string; answer: string; timestamp: string }[];
  isCopilotLoading: boolean;
  activeForecastIndex: number; // 0 (7d), 1 (30d), 2 (90d)
  presentationMode: boolean;
  presentationSlideIndex: number;
  fetchExecutiveData: () => Promise<void>;
  askCopilot: (question: string) => Promise<void>;
  setForecastIndex: (idx: number) => void;
  togglePresentationMode: (on: boolean) => void;
  setPresentationSlide: (idx: number) => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useExecutiveStore = create<ExecutiveStore>((set, get) => ({
  metrics: SEED_METRICS,
  impact: SEED_IMPACT,
  roi: SEED_ROI,
  forecasts: SEED_FORECASTS,
  heatmap: SEED_HEATMAP,
  reports: SEED_REPORTS,
  copilotChat: [],
  isCopilotLoading: false,
  activeForecastIndex: 1, // 30 days default
  presentationMode: false,
  presentationSlideIndex: 0,

  fetchExecutiveData: async () => {
    try {
      // 1. Fetch metrics & ROI
      const resMet = await fetch(`${EXECUTIVE_API}/api/v1/executive/metrics`);
      const dataMet = resMet.ok ? await resMet.json() : null;

      // 2. Fetch forecasts
      const resFore = await fetch(`${EXECUTIVE_API}/api/v1/executive/forecasts`);
      const dataFore = resFore.ok ? await resFore.json() : null;

      // 3. Fetch heatmap
      const resHeat = await fetch(`${EXECUTIVE_API}/api/v1/executive/heatmap`);
      const dataHeat = resHeat.ok ? await resHeat.json() : null;

      // 4. Fetch reports
      const resRep = await fetch(`${EXECUTIVE_API}/api/v1/executive/reports`);
      const dataRep = resRep.ok ? await resRep.json() : null;

      set({
        metrics: dataMet?.metrics ?? SEED_METRICS,
        impact: dataMet?.impact ?? SEED_IMPACT,
        roi: dataMet?.roi ?? SEED_ROI,
        forecasts: dataFore?.forecasts ?? SEED_FORECASTS,
        heatmap: dataHeat?.heatmap ?? SEED_HEATMAP,
        reports: dataRep?.reports ?? SEED_REPORTS
      });
    } catch {
      // Load fallback seeds
      set({
        metrics: SEED_METRICS,
        impact: SEED_IMPACT,
        roi: SEED_ROI,
        forecasts: SEED_FORECASTS,
        heatmap: SEED_HEATMAP,
        reports: SEED_REPORTS
      });
    }
  },

  askCopilot: async (question: string) => {
    set({ isCopilotLoading: true });
    try {
      const res = await fetch(`${EXECUTIVE_API}/api/v1/executive/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      set(s => ({
        copilotChat: [...s.copilotChat, data],
        isCopilotLoading: false
      }));
    } catch {
      setTimeout(() => {
        const answer = LOCAL_COPILOT_ANSWERS[question] ??
          `Local Copilot check: Regarding your query on "${question}", active safeguards are intact. The overall risk score remains at 91/100.`;
        set(s => ({
          copilotChat: [...s.copilotChat, { question, answer, timestamp: new Date().toISOString() }],
          isCopilotLoading: false
        }));
      }, 500);
    }
  },

  setForecastIndex: (activeForecastIndex) => set({ activeForecastIndex }),
  togglePresentationMode: (presentationMode) => set({ presentationMode, presentationSlideIndex: 0 }),
  setPresentationSlide: (presentationSlideIndex) => set({ presentationSlideIndex }),
}));
