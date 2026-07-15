"use client";

import { create } from 'zustand';
import type {
  DistributedTrace,
  TelemetryMetric,
  SmartAlert,
  SloTracker,
  CapacityForecast,
  AIDiagnosticReplay
} from '@cloudguard/types';

const OBSERVABILITY_API = 'http://localhost:4008';

interface ObservabilityStore {
  traces: DistributedTrace[];
  metrics: TelemetryMetric[];
  alerts: SmartAlert[];
  slos: SloTracker[];
  forecasts: CapacityForecast[];
  replays: AIDiagnosticReplay[];
  isLoading: boolean;

  fetchObservabilityData: () => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
}

export const useObservabilityStore = create<ObservabilityStore>((set, get) => ({
  traces: [],
  metrics: [],
  alerts: [],
  slos: [],
  forecasts: [],
  replays: [],
  isLoading: false,

  fetchObservabilityData: async () => {
    set({ isLoading: true });
    try {
      const resTraces = await fetch(`${OBSERVABILITY_API}/api/v1/observability/traces`);
      const dataTraces = resTraces.ok ? await resTraces.json() : null;

      const resMetrics = await fetch(`${OBSERVABILITY_API}/api/v1/observability/metrics`);
      const dataMetrics = resMetrics.ok ? await resMetrics.json() : null;

      const resAlerts = await fetch(`${OBSERVABILITY_API}/api/v1/observability/alerts`);
      const dataAlerts = resAlerts.ok ? await resAlerts.json() : null;

      const resSlos = await fetch(`${OBSERVABILITY_API}/api/v1/observability/slos`);
      const dataSlos = resSlos.ok ? await resSlos.json() : null;

      const resCapacity = await fetch(`${OBSERVABILITY_API}/api/v1/observability/capacity`);
      const dataCapacity = resCapacity.ok ? await resCapacity.json() : null;

      const resReplays = await fetch(`${OBSERVABILITY_API}/api/v1/observability/replays`);
      const dataReplays = resReplays.ok ? await resReplays.json() : null;

      set({
        traces: dataTraces?.traces ?? [],
        metrics: dataMetrics?.metrics ?? [],
        alerts: dataAlerts?.alerts ?? [],
        slos: dataSlos?.slos ?? [],
        forecasts: dataCapacity?.forecasts ?? [],
        replays: dataReplays?.replays ?? [],
        isLoading: false
      });
    } catch (e) {
      console.error('Failed to fetch observability telemetry:', e);
      set({ isLoading: false });
    }
  },

  resolveAlert: async (alertId) => {
    try {
      const res = await fetch(`${OBSERVABILITY_API}/api/v1/observability/alerts/${alertId}/resolve`, { method: 'POST' });
      if (res.ok) {
        await get().fetchObservabilityData();
      }
    } catch (e) {
      console.error('Failed to resolve alert:', e);
    }
  }
}));
