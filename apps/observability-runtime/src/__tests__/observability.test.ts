import { describe, it, expect, vi } from 'vitest';
import { tracesDatabase, metricsDatabase } from '../data/observabilityData.js';

describe('Observability Runtime Data Integrity', () => {
  it('should have seed traces with valid spans and hierarchies', () => {
    expect(tracesDatabase).toBeDefined();
    expect(tracesDatabase.length).toBeGreaterThan(0);

    const firstTrace = tracesDatabase[0];
    expect(firstTrace.traceId).toBeDefined();
    expect(firstTrace.spans).toBeDefined();
    expect(firstTrace.spans.length).toBeGreaterThan(0);
  });

  it('should have telemetry metrics with valid latency and CPU load metrics', () => {
    expect(metricsDatabase).toBeDefined();
    expect(metricsDatabase.length).toBeGreaterThan(0);

    const firstMetric = metricsDatabase[0];
    expect(firstMetric.name).toBeDefined();
    expect(firstMetric.value).toBeGreaterThanOrEqual(0);
  });
});
