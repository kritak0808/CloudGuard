export interface SpanContext {
  traceId: string;
  spanId: string;
  sampled: boolean;
}

export class CloudGuardTelemetry {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  // Structured Logging with TraceContext
  public logInfo(message: string, context?: Record<string, any>, span?: SpanContext): void {
    const logPayload = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: this.serviceName,
      message,
      traceId: span?.traceId,
      spanId: span?.spanId,
      ...context
    };
    console.log(JSON.stringify(logPayload));
  }

  public logError(message: string, error: Error, context?: Record<string, any>, span?: SpanContext): void {
    const logPayload = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: this.serviceName,
      message,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      traceId: span?.traceId,
      spanId: span?.spanId,
      ...context
    };
    console.error(JSON.stringify(logPayload));
  }

  public logSecurityEvent(eventName: string, payload: Record<string, any>, span?: SpanContext): void {
    const logPayload = {
      timestamp: new Date().toISOString(),
      level: 'SECURITY',
      service: this.serviceName,
      eventName,
      ...payload,
      traceId: span?.traceId,
      spanId: span?.spanId
    };
    console.warn(JSON.stringify(logPayload));
  }

  // Simulated metrics tracking helpers
  public recordMetric(metricName: string, value: number, tags?: Record<string, string>): void {
    const metricPayload = {
      timestamp: new Date().toISOString(),
      type: 'METRIC',
      service: this.serviceName,
      metricName,
      value,
      tags
    };
    console.log(JSON.stringify(metricPayload));
  }

  // Simulated trace wrapping context helper
  public startSpan(spanName: string): SpanContext {
    return {
      traceId: Math.random().toString(36).substring(2, 17) + Math.random().toString(36).substring(2, 17),
      spanId: Math.random().toString(36).substring(2, 10),
      sampled: true
    };
  }
}
