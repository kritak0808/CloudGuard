export interface EventMetadata {
  eventId: string;
  timestamp: string;
  version: number;
  producer: string;
}

export interface CloudAccountConnectedEvent {
  metadata: EventMetadata;
  type: 'CloudAccountConnected';
  payload: {
    accountId: string;
    provider: 'aws' | 'gcp' | 'azure';
    organizationId: string;
    connectionArn: string;
  };
}

export interface InfrastructureImportedEvent {
  metadata: EventMetadata;
  type: 'InfrastructureImported';
  payload: {
    accountId: string;
    resourceCount: number;
    schemaVersion: string;
    scanDurationMs: number;
  };
}

export interface ThreatDetectedEvent {
  metadata: EventMetadata;
  type: 'ThreatDetected';
  payload: {
    incidentId: string;
    accountId: string;
    resourceId: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    riskScore: number;
    attackVectorHops: string[];
    description: string;
  };
}

export interface SimulationCompletedEvent {
  metadata: EventMetadata;
  type: 'SimulationCompleted';
  payload: {
    simulationId: string;
    pullRequestId: string;
    triggeredBy: string;
    baselineRisk: number;
    predictiveRisk: number;
    newThreatsDetectedCount: number;
  };
}

export interface PolicyGeneratedEvent {
  metadata: EventMetadata;
  type: 'PolicyGenerated';
  payload: {
    policyId: string;
    targetResourceId: string;
    remediationPlanId: string;
    authorAgentId: string;
    rawIaCDiff: string;
  };
}

export type CloudGuardEvent =
  | CloudAccountConnectedEvent
  | InfrastructureImportedEvent
  | ThreatDetectedEvent
  | SimulationCompletedEvent
  | PolicyGeneratedEvent;
