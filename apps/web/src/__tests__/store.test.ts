import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConnectorStore } from '../store/useConnectorStore';
import { useIncidentStore } from '../store/useIncidentStore';

describe('Zustand Stores integration tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('useConnectorStore', () => {
    it('should initialize with default seed connectors list', () => {
      const state = useConnectorStore.getState();
      expect(state.connectors).toBeDefined();
      expect(state.connectors.length).toBeGreaterThan(0);
      expect(state.connectors[0].provider).toBe('aws');
    });

    it('should select active connector properly', () => {
      const store = useConnectorStore.getState();
      store.setActiveConnector('aws-prod');
      expect(useConnectorStore.getState().activeConnectorId).toBe('aws-prod');
    });
  });

  describe('useIncidentStore', () => {
    it('should initialize with default incident entries', () => {
      const state = useIncidentStore.getState();
      expect(state.incidents).toBeDefined();
      expect(state.incidents.length).toBeGreaterThan(0);
      expect(state.incidents[0].id).toBe('INC-2026-9021');
    });
  });
});
