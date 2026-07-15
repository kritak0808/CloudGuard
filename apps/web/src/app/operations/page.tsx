"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useObservabilityStore } from '../../store/useObservabilityStore';
import { useIdentityStore } from '../../store/useIdentityStore';
import {
  ChevronLeft, Activity, ShieldAlert, CheckCircle2, AlertTriangle,
  Layers, Fingerprint, Heart, Cpu, Flame,
  TrendingUp, Info, Search
} from 'lucide-react';

export default function OperationsPage() {
  const traces = useObservabilityStore(s => s.traces);
  const metrics = useObservabilityStore(s => s.metrics);
  const alerts = useObservabilityStore(s => s.alerts);
  const slos = useObservabilityStore(s => s.slos);
  const forecasts = useObservabilityStore(s => s.forecasts);
  const replays = useObservabilityStore(s => s.replays);
  const resolveAlert = useObservabilityStore(s => s.resolveAlert);
  const fetchObservabilityData = useObservabilityStore(s => s.fetchObservabilityData);

  // Identity Store state for context
  const activeSessionId = useIdentityStore(s => s.activeSessionId);
  const simulatedDevice = useIdentityStore(s => s.simulatedDevice);
  const users = useIdentityStore(s => s.users);
  const fetchIdentityData = useIdentityStore(s => s.fetchIdentityData);

  // Tab State
  const [activeTab, setActiveTab] = useState<'health' | 'traces' | 'ai' | 'alerts' | 'capacity'>('health');
  
  // Selected trace state
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  // Zero Trust Intercept Alerts
  const [ztBlockedReason, setZtBlockedReason] = useState<string | null>(null);

  useEffect(() => {
    fetchObservabilityData();
    fetchIdentityData();

    // Listen for global custom events from fetch interceptor
    function handleZTBlock(e: Event) {
      const reason = (e as CustomEvent).detail;
      setZtBlockedReason(reason);
      setTimeout(() => {
        setZtBlockedReason(null);
      }, 7000);
    }
    
    window.addEventListener('zero-trust-block', handleZTBlock);
    return () => {
      window.removeEventListener('zero-trust-block', handleZTBlock);
    };
  }, []);

  const activeUser = users.find(u => {
    const activeSess = useIdentityStore.getState().sessions.find(s => s.sessionId === activeSessionId);
    return activeSess ? activeSess.userId === u.id : false;
  });

  function handleResolve(id: string) {
    resolveAlert(id);
    alert('Alert marked as resolved. AI diagnostics trace archived.');
  }

  const selectedTrace = traces.find(t => t.traceId === selectedTraceId);

  return (
    <div style={{
      minHeight: '100vh',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '1600px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* ── Zero Trust Block Toast ────────────────────────────────────── */}
      {ztBlockedReason && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'rgba(255, 34, 45, 0.95)',
          border: '1px solid rgba(255, 34, 45, 0.4)',
          borderRadius: '8px',
          padding: '16px 20px',
          boxShadow: '0 8px 32px rgba(255,34,45,0.4)',
          backdropFilter: 'var(--glass-blur)',
          display: 'flex',
          gap: '12px',
          maxWidth: '450px',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <ShieldAlert size={20} color="#fff" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Zero Trust Policy Violation
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)', marginTop: '4px', lineHeight: 1.4 }}>
              {ztBlockedReason}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
              CloudGuard Gatekeeper verified: Intercepted (403 Forbidden)
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'hsl(230,10%,55%)', textDecoration: 'none', fontSize: '0.75rem' }}>
          <ChevronLeft size={14} /> Back to Dashboard
        </Link>
        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px var(--accent-primary-glow)',
          }}>
            <Activity size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Platform Operations Center
            </h1>
            <p style={{ fontSize: '0.65rem', color: 'hsl(230,10%,50%)', margin: 0 }}>
              Unified observability console. Distributed traces, metrics aggregation, smart alerting, and capacity forecasting.
            </p>
          </div>
        </div>

        {/* Operational Stats */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '4px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'right' }}>
            <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', display: 'block' }}>MTTR</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>14 Mins</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '4px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'right' }}>
            <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', display: 'block' }}>MTTD</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-primary)' }}>1.5 Mins</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '4px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'right' }}>
            <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', display: 'block' }}>Availability</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-safe)' }}>99.98%</span>
          </div>
        </div>
      </header>

      {/* ── Active Operator Session context banner ──────────────────── */}
      {activeUser && simulatedDevice && (
        <section className="glass-panel" style={{
          padding: '12px 20px',
          background: 'rgba(0, 217, 255, 0.02)',
          border: '1px solid rgba(0, 217, 255, 0.12)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap', gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Fingerprint size={15} color="var(--accent-secondary)" />
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                Simulated Operator Session: <strong style={{ color: 'var(--accent-secondary)' }}>{activeUser.name}</strong> ({activeUser.role})
              </div>
              <div style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)' }}>
                Device Risk: {simulatedDevice.riskScore}% | IP Address: {simulatedDevice.ip} | MFA Status: {simulatedDevice.mfaStatus.toUpperCase()}
              </div>
            </div>
          </div>
          <div>
            <Link href="/identity" style={{
              padding: '4px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              borderRadius: '4px', color: '#fff', fontSize: '0.58rem', textDecoration: 'none', fontWeight: 600
            }}>
              Adjust Sandbox Context
            </Link>
          </div>
        </section>
      )}

      {/* ── Main Operations Split ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', flex: 1, alignItems: 'start' }}>
        
        {/* Navigation Sidebar */}
        <aside className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.6rem', color: 'hsl(230,10%,40%)', fontWeight: 700, paddingLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Telemetry Modules
          </span>
          <button onClick={() => setActiveTab('health')} style={getTabStyle(activeTab === 'health')}>
            <Heart size={14} /> Platform Health
          </button>
          <button onClick={() => setActiveTab('traces')} style={getTabStyle(activeTab === 'traces')}>
            <Layers size={14} /> Distributed Traces
          </button>
          <button onClick={() => setActiveTab('ai')} style={getTabStyle(activeTab === 'ai')}>
            <Cpu size={14} /> AI Telemetry & Replays
          </button>
          <button onClick={() => setActiveTab('alerts')} style={getTabStyle(activeTab === 'alerts')}>
            <Flame size={14} /> Alert Center
            {alerts.filter(a => a.status === 'active').length > 0 && (
              <span style={{ marginLeft: 'auto', background: 'var(--color-danger)', color: '#fff', borderRadius: '10px', padding: '1px 5px', fontSize: '0.5rem', fontWeight: 800 }}>
                {alerts.filter(a => a.status === 'active').length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('capacity')} style={getTabStyle(activeTab === 'capacity')}>
            <TrendingUp size={14} /> Capacity Forecast
          </button>
        </aside>

        {/* Details Panel Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TAB 1: Platform Health */}
          {activeTab === 'health' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* SLO Compliance */}
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>SLO Compliance Status</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {slos.map(slo => (
                    <div key={slo.id} style={{
                      background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                      borderRadius: '6px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>{slo.name}</span>
                        <span style={{
                          fontSize: '0.55rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700,
                          background: slo.status === 'compliant' ? 'rgba(82,196,26,0.1)' : 'rgba(255,34,45,0.1)',
                          color: slo.status === 'compliant' ? 'var(--color-safe)' : 'var(--color-danger)'
                        }}>
                          {slo.status.toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Bar fill */}
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${slo.currentPercentage}%`, height: '100%',
                          background: slo.status === 'compliant' ? 'var(--color-safe)' : 'var(--color-danger)'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'hsl(230,10%,50%)' }}>
                        <span>Target: {slo.targetPercentage}%</span>
                        <span>Current: {slo.currentPercentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Health stats metrics grid */}
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Active Node Metrics</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {metrics.map((m, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                      borderRadius: '6px', padding: '12px'
                    }}>
                      <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,50%)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        {m.name}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', display: 'block', marginTop: '6px' }}>
                        {m.name.includes('bytes') ? `${(m.value / 1024 / 1024 / 1024).toFixed(2)} GB` : m.value}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {Object.entries(m.labels).map(([k, v]) => (
                          <span key={k} style={{ fontSize: '0.48rem', background: 'rgba(255,255,255,0.03)', color: 'hsl(230,10%,60%)', padding: '1px 4px', borderRadius: '2px' }}>
                            {k}:{v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: Distributed Tracing */}
          {activeTab === 'traces' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
              
              {/* Traces List */}
              <section className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h2 style={{ fontSize: '0.90rem', fontWeight: 800, margin: 0 }}>Distributed Trace Log</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {traces.map(t => (
                    <button
                      key={t.traceId} onClick={() => setSelectedTraceId(t.traceId)}
                      style={{
                        background: selectedTraceId === t.traceId ? 'rgba(123, 66, 188, 0.08)' : 'rgba(255,255,255,0.01)',
                        border: selectedTraceId === t.traceId ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        borderRadius: '6px', padding: '12px', cursor: 'pointer', textAlign: 'left', width: '100%'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                          ID: {t.traceId}
                        </span>
                        <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,50%)' }}>
                          Spans: {t.spans.length}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.58rem', color: 'hsl(230,10%,45%)', marginTop: '4px' }}>
                        Correlation: {t.correlationId}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Trace details visual span tree */}
              <section className="glass-panel" style={{ padding: '20px' }}>
                {selectedTrace ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Trace Details: {selectedTrace.traceId}
                      </h3>
                      <span style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)' }}>Correlation ID: {selectedTrace.correlationId}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '8px' }}>
                      {selectedTrace.spans.map(span => {
                        const isRoot = !span.parentSpanId;
                        return (
                          <div key={span.spanId} style={{
                            background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                            borderRadius: '6px', padding: '10px 12px', marginLeft: isRoot ? 0 : '16px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                                {span.name}
                              </span>
                              <span style={{ fontSize: '0.58rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                                {span.durationMs}ms
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifySelf: 'space-between', fontSize: '0.52rem', color: 'hsl(230,10%,50%)', marginTop: '4px' }}>
                              <span>Service: {span.serviceName}</span>
                              <span>Span ID: {span.spanId}</span>
                            </div>
                            
                            {/* Attributes */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                              {Object.entries(span.attributes).map(([k, v]) => (
                                <span key={k} style={{ fontSize: '0.48rem', background: '#000', color: 'hsl(230,10%,60%)', padding: '2px 5px', borderRadius: '3px' }}>
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'hsl(230,10%,45%)' }}>
                    <Search size={24} style={{ margin: '0 auto 12px' }} />
                    <span style={{ fontSize: '0.7rem' }}>Select a trace from the index logs list to inspect span trees.</span>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 3: AI Telemetry & Replays */}
          {activeTab === 'ai' && (
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>AI Diagnostics & Reasoning Replay</h2>
                <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                  Full transparency audits detailing models used, reasoning steps, retrieval metrics, and tool calls.
                </p>
              </div>

              {replays.map((rep, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.05)', color: 'hsl(230,10%,55%)', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '4px' }}>
                        Session ID: {rep.sessionId}
                      </span>
                      <div style={{ fontSize: '0.58rem', color: 'hsl(230,10%,45%)', marginTop: '4px' }}>
                        Model: <strong style={{ color: '#fff' }}>{rep.modelUsed}</strong> | Latency: {rep.latencyMs}ms | Score: {rep.evaluationScore}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.5rem', color: 'hsl(230,10%,45%)', display: 'block', textTransform: 'uppercase' }}>Token Usage</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{rep.tokenUsage.total}</span>
                    </div>
                  </div>

                  {/* Prompt Text */}
                  <div style={{ background: '#020406', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,40%)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Prompt Input</div>
                    <div style={{ fontSize: '0.68rem', color: '#fff', fontStyle: 'italic' }}>&quot;{rep.promptText}&quot;</div>
                  </div>

                  {/* Reasoning Steps & Tools */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                    
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                      <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,40%)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                        AI Reasoning Steps Chain
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {rep.reasoningSteps.map((step, sIdx) => (
                          <div key={sIdx} style={{ fontSize: '0.62rem', color: 'hsl(230,10%,75%)', fontFamily: 'var(--font-mono)' }}>{step}</div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                        <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,40%)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                          Tools Invoked
                        </span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {rep.toolsInvoked.map((t, tIdx) => (
                            <span key={tIdx} style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.03)', color: 'var(--accent-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                        <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,40%)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                          Retrieved Memory Keys
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {rep.memoryRetrieved.map((m, mIdx) => (
                            <span key={mIdx} style={{ fontSize: '0.58rem', color: 'hsl(230,10%,60%)' }}>• {m}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </section>
          )}

          {/* TAB 4: Alert Center */}
          {activeTab === 'alerts' && (
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Smart Alert Center</h2>
                <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                  Smart alerts enriched with AI-generated cause diagnostics and troubleshooting suggestions.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alerts.map(a => {
                  const isCrit = a.severity === 'critical';
                  const isResolved = a.status === 'resolved';
                  return (
                    <div key={a.id} style={{
                      background: isResolved ? 'rgba(255,255,255,0.01)' : (isCrit ? 'rgba(255,34,45,0.02)' : 'rgba(250,173,20,0.02)'),
                      border: isResolved ? '1px solid rgba(255,255,255,0.03)' : (isCrit ? '1px solid rgba(255,34,45,0.2)' : '1px solid rgba(250,173,20,0.2)'),
                      borderRadius: '8px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        {isResolved ? <CheckCircle2 size={16} color="var(--color-safe)" style={{ marginTop: '2px' }} /> : <AlertTriangle size={16} color={isCrit ? 'var(--color-danger)' : 'var(--color-warning)'} style={{ marginTop: '2px' }} />}
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isResolved ? 'hsl(230,10%,55%)' : '#fff' }}>{a.title}</span>
                            <span style={{
                              fontSize: '0.48rem', padding: '2px 5px', borderRadius: '3px', fontWeight: 800, textTransform: 'uppercase',
                              background: isCrit ? 'rgba(255,34,45,0.1)' : 'rgba(250,173,20,0.1)',
                              color: isCrit ? 'var(--color-danger)' : 'var(--color-warning)'
                            }}>
                              {a.severity}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.68rem', color: 'hsl(230,10%,70%)', margin: '4px 0 8px 0' }}>{a.details}</p>
                          
                          {/* Probable Cause */}
                          <div style={{ background: '#020406', padding: '10px 12px', borderLeft: '2px solid var(--accent-primary)', borderRadius: '0 4px 4px 0' }}>
                            <div style={{ fontSize: '0.52rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>AI Probable-Cause Diagnostic</div>
                            <p style={{ fontSize: '0.62rem', color: '#fff', margin: '2px 0 0 0', lineHeight: 1.3 }}>{a.probableCause}</p>
                          </div>
                        </div>
                      </div>

                      {!isResolved && (
                        <button
                          onClick={() => handleResolve(a.id)}
                          style={{
                            padding: '6px 14px', background: 'var(--accent-secondary)', border: 'none', borderRadius: '4px',
                            color: '#000', fontWeight: 700, fontSize: '0.62rem', cursor: 'pointer', flexShrink: 0
                          }}
                        >
                          Resolve Alert
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* TAB 5: Capacity Forecast */}
          {activeTab === 'capacity' && (
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Capacity Forecasting & Infrastructure Planning</h2>
                <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                  AI projections tracking CPU/GPU scaling indexes and db sizing triggers, recommending proactive node extensions.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {forecasts.map((f, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                    borderRadius: '8px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>{f.metricName}</span>
                      <span style={{
                        fontSize: '0.55rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700,
                        background: f.upgradeRecommended ? 'rgba(250,173,20,0.1)' : 'rgba(82,196,26,0.1)',
                        color: f.upgradeRecommended ? 'var(--color-warning)' : 'var(--color-safe)'
                      }}>
                        {f.upgradeRecommended ? 'UPGRADE ADVISED' : 'HEALTHY'}
                      </span>
                    </div>

                    {/* Progress projection comparison */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                      <div style={{ background: '#020406', padding: '6px', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.5rem', color: 'hsl(230,10%,50%)', display: 'block' }}>Current Usage</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{f.currentUsage}%</span>
                      </div>
                      <div style={{ background: '#020406', padding: '6px', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.5rem', color: 'hsl(230,10%,50%)', display: 'block' }}>30d Projected</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: f.projection30d > 85 ? 'var(--color-danger)' : '#fff' }}>{f.projection30d}%</span>
                      </div>
                      <div style={{ background: '#020406', padding: '6px', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.5rem', color: 'hsl(230,10%,50%)', display: 'block' }}>90d Projected</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: f.projection90d > 95 ? 'var(--color-danger)' : '#fff' }}>{f.projection90d}%</span>
                      </div>
                    </div>

                    <div style={{ borderLeft: '2px solid var(--accent-secondary)', paddingLeft: '10px', fontSize: '0.62rem', color: 'hsl(230,10%,70%)' }}>
                      <strong>AI Capacity Recommendation:</strong> {f.recommendationDetails}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

      </div>

      {/* Footer */}
      <footer style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.7rem', color: 'hsl(230,10%,40%)',
        padding: '12px 0 24px', borderTop: '1px solid rgba(255,255,255,0.03)'
      }}>
        <div>© 2026 CloudGuard AI — Operations Console v1.0</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Observability Runtime: localhost:4008</span>
          <span>OTLP OpenTelemetry Exporter</span>
        </div>
      </footer>
    </div>
  );
}

// ─── Style Helpers ────────────────────────────────────────────────────────────

function getTabStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 12px',
    background: active ? 'rgba(123, 66, 188, 0.08)' : 'transparent',
    border: 'none',
    borderLeft: active ? '3px solid var(--accent-primary)' : '3px solid transparent',
    borderRadius: '0 6px 6px 0',
    color: active ? '#fff' : 'hsl(230,10%,65%)',
    fontSize: '0.72rem',
    fontWeight: active ? 700 : 500,
    textAlign: 'left',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s'
  };
}
