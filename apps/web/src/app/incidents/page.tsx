"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useIncidentStore } from '../../store/useIncidentStore';
import {
  ShieldAlert, ChevronLeft, Calendar, FileText, CheckSquare, Clock, Users,
  Activity, Play, Pause, Award, Key, Copy, Download, User, ArrowRight,
  Loader, CheckCircle2, AlertTriangle, Shield, Check, FileCheck, Circle, Database
} from 'lucide-react';
import type { IncidentStatus, TimelineEvent } from '@cloudguard/types';

// ─── Status Badge Mappings ──────────────────────────────────────────────────

const STATUS_LABELS: Record<IncidentStatus, string> = {
  detected: 'Detected', triaged: 'Triaged', assigned: 'Assigned',
  investigating: 'Investigating', contained: 'Contained', eradicated: 'Eradicated',
  recovered: 'Recovered', verified: 'Verified', closed: 'Closed', archived: 'Archived'
};

const STATUS_COLORS: Record<IncidentStatus, string> = {
  detected: 'var(--color-danger)',
  triaged: 'hsl(24,90%,55%)',
  assigned: 'hsl(24,90%,55%)',
  investigating: 'var(--color-warning)',
  contained: 'var(--accent-secondary)',
  eradicated: 'var(--color-safe)',
  recovered: 'var(--color-safe)',
  verified: 'var(--color-safe)',
  closed: 'hsl(230,10%,45%)',
  archived: 'hsl(230,10%,35%)'
};

// ─── Attack Replay Visualizer Nodes ──────────────────────────────────────────

interface AttackNodeProps {
  label: string;
  status: 'safe' | 'warning' | 'compromised' | 'inactive';
  icon: React.ReactNode;
}

function AttackNode({ label, status, icon }: AttackNodeProps) {
  const statusColors = {
    safe:        { border: 'rgba(82,196,26,0.5)',  bg: 'rgba(82,196,26,0.06)',  glow: 'rgba(82,196,26,0.2)',  color: 'var(--color-safe)' },
    warning:     { border: 'rgba(250,173,20,0.5)', bg: 'rgba(250,173,20,0.06)', glow: 'rgba(250,173,20,0.2)', color: 'var(--color-warning)' },
    compromised: { border: 'rgba(245,34,45,0.6)',  bg: 'rgba(245,34,45,0.08)',  glow: 'rgba(245,34,45,0.4)',  color: 'var(--color-danger)' },
    inactive:    { border: 'rgba(255,255,255,0.05)', bg: 'rgba(255,255,255,0.01)', glow: 'transparent',        color: 'hsl(230,10%,40%)' }
  };

  const current = statusColors[status];

  return (
    <div style={{
      border: `1px solid ${current.border}`,
      background: current.bg,
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      width: '100px',
      textAlign: 'center',
      transition: 'all 0.4s ease',
      boxShadow: status !== 'inactive' ? `0 0 16px ${current.glow}` : 'none',
    }}>
      <div style={{ color: current.color }}>{icon}</div>
      <span style={{ fontSize: '0.58rem', fontWeight: 600, color: status === 'inactive' ? 'hsl(230,10%,45%)' : '#fff' }}>{label}</span>
      <span style={{ fontSize: '0.45rem', textTransform: 'uppercase', color: current.color, fontWeight: 700 }}>{status}</span>
    </div>
  );
}

// ─── Stat Metric block ───────────────────────────────────────────────────────

function StatMetric({ label, value, sublabel }: { label: string; value: string | number; sublabel: string }) {
  return (
    <div style={{
      flex: 1, minWidth: '130px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px', padding: '12px 14px',
    }}>
      <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '4px 0' }}>{value}</div>
      <div style={{ fontSize: '0.52rem', color: 'hsl(230,10%,50%)' }}>{sublabel}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IncidentsPage() {
  const incidents = useIncidentStore(s => s.incidents);
  const metrics = useIncidentStore(s => s.metrics);
  const selectedCase = useIncidentStore(s => s.selectedCase);
  const activeTimelineOffset = useIncidentStore(s => s.activeTimelineOffset);
  const postmortemMarkdown = useIncidentStore(s => s.postmortemMarkdown);

  const fetchIncidents = useIncidentStore(s => s.fetchIncidents);
  const selectCase = useIncidentStore(s => s.selectCase);
  const setTimelineOffset = useIncidentStore(s => s.setTimelineOffset);
  const toggleTaskStatus = useIncidentStore(s => s.toggleTaskStatus);
  const updateCaseStatus = useIncidentStore(s => s.updateCaseStatus);
  const generatePostmortem = useIncidentStore(s => s.generatePostmortem);

  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Compute node status based on the selected offset in Case 1
  const timelineEvent = selectedCase?.timeline[activeTimelineOffset];
  const offsetTime = timelineEvent?.timeOffset ?? '08:00';

  let attackerStatus: 'safe' | 'warning' | 'compromised' | 'inactive' = 'inactive';
  let podStatus: 'safe' | 'warning' | 'compromised' | 'inactive' = 'safe';
  let iamStatus: 'safe' | 'warning' | 'compromised' | 'inactive' = 'safe';
  let dbStatus: 'safe' | 'warning' | 'compromised' | 'inactive' = 'safe';
  let containmentStatus: 'safe' | 'warning' | 'compromised' | 'inactive' = 'inactive';

  if (selectedCase?.id === 'INC-2026-9021') {
    // Offset-based states
    if (offsetTime === '08:01' || offsetTime === '08:05') {
      attackerStatus = 'warning';
      podStatus = 'safe';
      iamStatus = 'safe';
      dbStatus = 'safe';
    } else if (offsetTime === '08:06') {
      attackerStatus = 'warning';
      podStatus = 'safe';
      iamStatus = 'warning'; // IAM update
    } else if (offsetTime === '08:09') {
      attackerStatus = 'compromised';
      podStatus = 'warning'; // CVE detected
      iamStatus = 'warning';
    } else if (offsetTime === '08:12') {
      attackerStatus = 'compromised';
      podStatus = 'compromised'; // Shell spawned
      iamStatus = 'compromised'; // STS token request
      dbStatus = 'warning'; // connection attempts
    } else if (offsetTime === '08:13') {
      attackerStatus = 'compromised';
      podStatus = 'compromised';
      iamStatus = 'compromised';
      containmentStatus = 'warning';
    } else if (offsetTime === '08:18') {
      attackerStatus = 'inactive';
      podStatus = 'compromised';
      iamStatus = 'warning';
      containmentStatus = 'safe'; // Isolated!
      dbStatus = 'safe';
    } else if (offsetTime === '08:25') {
      attackerStatus = 'inactive';
      podStatus = 'safe';
      iamStatus = 'safe';
      dbStatus = 'safe';
      containmentStatus = 'inactive';
    }
  } else if (selectedCase?.id === 'INC-2026-9022') {
    // Secret leak case
    if (offsetTime === '09:00') {
      attackerStatus = 'warning';
      iamStatus = 'warning';
    } else if (offsetTime === '09:12') {
      attackerStatus = 'compromised';
      iamStatus = 'compromised';
    } else if (offsetTime === '09:15') {
      attackerStatus = 'inactive';
      iamStatus = 'safe';
      containmentStatus = 'safe';
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 1500);
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '1600px',
      margin: '0 auto',
    }}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'hsl(230,10%,55%)', textDecoration: 'none', fontSize: '0.75rem' }}>
          <ChevronLeft size={14} /> Dashboard
        </Link>
        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px',
            background: 'linear-gradient(135deg, var(--color-danger), #7B42BC)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(245,34,45,0.3)',
          }}>
            <ShieldAlert size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Incident Command Center</h1>
            <p style={{ fontSize: '0.65rem', color: 'hsl(230,10%,50%)', margin: 0 }}>
              Digital Forensics & Attack Replay Orchestrator
            </p>
          </div>
        </div>

        {/* Metrics ribbon */}
        {metrics && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatMetric label="Active Incidents" value={metrics.activeCount} sublabel="Requiring containment" />
            <StatMetric label="MTTD" value={`${metrics.mttdMinutes} Min`} sublabel="Mean Time To Detect" />
            <StatMetric label="MTTR" value={`${metrics.mttrMinutes} Min`} sublabel="Mean Time To Resolve" />
            <StatMetric label="Critical Cases" value={metrics.severityCounts.critical} sublabel="P0 incidents" />
          </div>
        )}
      </header>

      {/* ── Main Panel Grid ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Left Side: Cases list */}
        <aside className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'hsl(230,10%,60%)' }}>
            Active Cases List
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {incidents.map(c => {
              const isSelected = selectedCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => selectCase(c.id)}
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)',
                    border: isSelected ? '1px solid var(--accent-secondary)' : '1px solid var(--border-color)',
                    borderRadius: '8px', padding: '12px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                      {c.id}
                    </span>
                    <span style={{
                      fontSize: '0.52rem', padding: '1px 6px', borderRadius: '3px',
                      background: 'rgba(245,34,45,0.1)', color: 'var(--color-danger)', fontWeight: 700,
                    }}>{c.priority}</span>
                  </div>
                  <h3 style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff', margin: 0, lineHeight: 1.3 }}>
                    {c.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: STATUS_COLORS[c.status],
                    }} />
                    <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)' }}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Side: Selected Case Command */}
        {selectedCase ? (
          <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. Cinematic Replay Center */}
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Play size={14} color="var(--accent-secondary)" /> Attack Replay & Infrastructure Genome
                  </h2>
                  <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', margin: '2px 0 0' }}>
                    Interactive timeline scrubber showing real-time digital twin node transition states
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'hsl(230,10%,60%)' }}>Timeline Offset:</span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)',
                    padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-color)',
                  }}>
                    {offsetTime}
                  </span>
                </div>
              </div>

              {/* Scrubber slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="range"
                  min={0}
                  max={selectedCase.timeline.length - 1}
                  value={activeTimelineOffset}
                  onChange={(e) => setTimelineOffset(parseInt(e.target.value))}
                  style={{
                    width: '100%', height: '5px', borderRadius: '3px',
                    background: 'rgba(255,255,255,0.1)', outline: 'none',
                    cursor: 'pointer', accentColor: 'var(--accent-secondary)',
                  }}
                />

                {/* Timeline tick labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
                  {selectedCase.timeline.map((event, index) => {
                    const isActive = index === activeTimelineOffset;
                    return (
                      <button
                        key={index}
                        onClick={() => setTimelineOffset(index)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                          outline: 'none',
                        }}
                      >
                        <span style={{
                          fontSize: '0.58rem', fontWeight: isActive ? 800 : 500,
                          color: isActive ? 'var(--accent-secondary)' : 'hsl(230,10%,45%)',
                        }}>
                          {event.timeOffset}
                        </span>
                        <div style={{
                          width: '5px', height: '5px', borderRadius: '50%',
                          background: isActive ? 'var(--accent-secondary)' : 'hsl(230,10%,30%)',
                          boxShadow: isActive ? '0 0 6px var(--accent-secondary)' : 'none',
                        }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Offset Log */}
              {timelineEvent && (
                <div style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '12px 14px', display: 'flex', gap: '12px', alignItems: 'flex-start',
                }}>
                  <div style={{
                    fontSize: '0.62rem', padding: '2px 8px', borderRadius: '3px', fontWeight: 700,
                    background: timelineEvent.status === 'critical' ? 'rgba(245,34,45,0.1)' : timelineEvent.status === 'warning' ? 'rgba(250,173,20,0.1)' : 'rgba(255,255,255,0.05)',
                    color: timelineEvent.status === 'critical' ? 'var(--color-danger)' : timelineEvent.status === 'warning' ? 'var(--color-warning)' : 'hsl(230,10%,60%)',
                    border: timelineEvent.status === 'critical' ? '1px solid rgba(245,34,45,0.2)' : timelineEvent.status === 'warning' ? '1px solid rgba(250,173,20,0.2)' : '1px solid var(--border-color)',
                  }}>
                    {timelineEvent.type.toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff', margin: '0 0 4px' }}>
                      {timelineEvent.title}
                    </h4>
                    <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', margin: 0 }}>
                      {timelineEvent.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Cinematic Graph Nodes Visualization */}
              <div style={{
                background: '#04070b', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '20px',
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                minHeight: '120px', position: 'relative',
              }}>
                {/* Horizontal flow connector lines */}
                <div style={{
                  position: 'absolute', height: '1px', left: '10%', right: '10%',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                  zIndex: 0,
                }} />

                <div style={{ zIndex: 1, display: 'flex', gap: '20px', width: '100%', justifyContent: 'space-around' }}>
                  <AttackNode label="External Attacker" status={attackerStatus} icon={<User size={16} />} />
                  <AttackNode label="EKS Container" status={podStatus} icon={<ShieldAlert size={16} />} />
                  <AttackNode label="Host IAM Profile" status={iamStatus} icon={<Key size={16} />} />
                  <AttackNode label="Target DB Vault" status={dbStatus} icon={<Database size={16} />} />
                  <AttackNode label="Containment WAF" status={containmentStatus} icon={<Shield size={16} />} />
                </div>
              </div>
            </section>

            {/* 2. Forensics Evidence Vault & Root Cause */}
            <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              
              {/* Evidence Vault */}
              <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={14} color="var(--accent-secondary)" /> Digital Forensics Evidence Vault
                  </h3>
                  <p style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)', margin: '2px 0 0' }}>
                    Sealed logs and snapshots with SHA-256 integrity verifications
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedCase.evidence.map(e => (
                    <div key={e.id} style={{
                      background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                      borderRadius: '6px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#fff' }}>{e.name}</span>
                        <span style={{
                          fontSize: '0.48rem', padding: '1px 5px', borderRadius: '3px',
                          background: 'rgba(255,255,255,0.04)', color: 'hsl(230,10%,50%)',
                          textTransform: 'uppercase', fontWeight: 600,
                        }}>{e.type}</span>
                      </div>
                      <p style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)', margin: 0, lineHeight: 1.3 }}>
                        {e.payloadSummary}
                      </p>

                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: '#030508', border: '1px solid rgba(255,255,255,0.03)',
                        borderRadius: '4px', padding: '4px 6px', marginTop: '2px',
                      }}>
                        <span style={{ fontSize: '0.48rem', color: 'hsl(230,10%,40%)', textTransform: 'uppercase' }}>SHA256</span>
                        <span style={{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)', color: 'hsl(230,10%,60%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {e.hash}
                        </span>
                        <button
                          onClick={() => handleCopy(e.hash, e.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: copiedHashId === e.id ? 'var(--color-safe)' : 'hsl(230,10%,50%)',
                            outline: 'none', padding: '2px',
                          }}
                        >
                          {copiedHashId === e.id ? <Check size={10} /> : <Copy size={10} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Case Details / AI Investigator */}
              <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={14} color="var(--color-danger)" /> AI Investigator Analysis
                  </h3>
                  <p style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)', margin: '2px 0 0' }}>
                    Auto-identified root causes and playbooks tracking
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* MITRE Mapping */}
                  <div style={{
                    background: 'rgba(245,34,45,0.04)', border: '1px solid rgba(245,34,45,0.15)',
                    borderRadius: '6px', padding: '8px 10px',
                  }}>
                    <div style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', fontWeight: 600 }}>
                      MITRE ATT&CK Mapping
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: '2px' }}>
                      {selectedCase.rootCause.mitreMapping.tactic}
                    </div>
                    <div style={{ fontSize: '0.58rem', color: 'hsl(230,10%,60%)' }}>
                      {selectedCase.rootCause.mitreMapping.technique}
                    </div>
                  </div>

                  {/* Root Cause Text */}
                  <div>
                    <span style={{ fontSize: '0.52rem', textTransform: 'uppercase', color: 'hsl(230,10%,45%)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                      Primary Cause
                    </span>
                    <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,70%)', lineHeight: '1.4', margin: 0 }}>
                      {selectedCase.rootCause.primaryCause}
                    </p>
                  </div>

                  {/* Tasks Orchestration */}
                  <div>
                    <span style={{ fontSize: '0.52rem', textTransform: 'uppercase', color: 'hsl(230,10%,45%)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Task Assignments Checklist
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {selectedCase.tasks.map(t => {
                        const isDone = t.status === 'completed';
                        return (
                          <div
                            key={t.id}
                            onClick={() => toggleTaskStatus(selectedCase.id, t.id, !isDone)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                              borderRadius: '4px', padding: '6px 8px', cursor: 'pointer',
                            }}
                          >
                            {isDone ? <CheckCircle2 size={12} color="var(--color-safe)" /> : <Circle size={12} color="hsl(230,10%,35%)" />}
                            <span style={{
                              fontSize: '0.6rem', color: isDone ? 'hsl(230,10%,45%)' : 'hsl(230,10%,80%)',
                              textDecoration: isDone ? 'line-through' : 'none', flex: 1,
                            }}>
                              {t.title}
                            </span>
                            <span style={{
                              fontSize: '0.5rem', background: 'rgba(255,255,255,0.03)',
                              padding: '1px 5px', borderRadius: '3px', color: 'hsl(230,10%,50%)',
                            }}>
                              {t.assignee}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Postmortem Generator */}
            <section className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} color="var(--accent-secondary)" /> AI-Generated Incident Postmortem
                  </h3>
                  <p style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)', margin: '2px 0 0' }}>
                    Produce comprehensive timeline audits and engineering action recommendations
                  </p>
                </div>

                <button
                  onClick={() => generatePostmortem(selectedCase.id)}
                  style={{
                    padding: '6px 12px', background: 'var(--accent-secondary)', border: 'none',
                    borderRadius: '4px', color: '#000', fontWeight: 700, fontSize: '0.62rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  <FileCheck size={12} />
                  {postmortemMarkdown ? 'Regenerate Draft' : 'Generate Postmortem'}
                </button>
              </div>

              {postmortemMarkdown && (
                <div className="finding-enter" style={{ marginTop: '10px' }}>
                  <pre style={{
                    background: '#030508', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '6px', padding: '16px', margin: 0,
                    fontSize: '0.62rem', fontFamily: 'var(--font-mono)',
                    color: 'hsl(230,10%,80%)', overflowX: 'auto', whiteSpace: 'pre-wrap',
                    maxHeight: '400px',
                  }}>
                    {postmortemMarkdown}
                  </pre>
                  <button style={{
                    marginTop: '10px', padding: '8px 12px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                    borderRadius: '4px', color: '#fff', fontSize: '0.62rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <Download size={12} /> Download Postmortem PDF / MD
                  </button>
                </div>
              )}
            </section>
          </main>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.7rem', color: 'hsl(230,10%,40%)',
        padding: '12px 0 24px', borderTop: '1px solid rgba(255,255,255,0.03)',
      }}>
        <div>© 2026 CloudGuard AI Inc. — Incident Command Center v1.0</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Incident Service: localhost:4004</span>
          <span>Cryptographic Seals: SHA-256</span>
        </div>
      </footer>
    </div>
  );
}
