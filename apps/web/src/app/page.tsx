"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { LivingInfrastructureGraph } from '../components/LivingInfrastructureGraph';
import { ThreatTimeline } from '../components/ThreatTimeline';
import { AISecurityCouncil } from '../components/AISecurityCouncil';
import { PredictiveSecurityEngine } from '../components/PredictiveSecurityEngine';
import { LiveExecutionCenter } from '../components/LiveExecutionCenter';
import { DigitalTwinSearch } from '../components/DigitalTwinSearch';
import { useConnectorStore } from '../store/useConnectorStore';
import { useSecurityStore } from '../store/useSecurityStore';
import { useMemoryStore } from '../store/useMemoryStore';
import { useIncidentStore } from '../store/useIncidentStore';
import { useExecutiveStore } from '../store/useExecutiveStore';
import { useIdentityStore } from '../store/useIdentityStore';
import { Shield, Cloud, Server, KeyRound, Globe, Database, Activity, Brain, ShieldAlert, Award, Fingerprint, GitPullRequest } from 'lucide-react';

export default function Home() {
  const connectors = useConnectorStore(s => s.connectors);
  const fetchConnectors = useConnectorStore(s => s.fetchConnectors);
  const connectedProviders = connectors.filter(c => c.state === 'healthy');
  const totalResources = connectedProviders.reduce((s, c) => s + c.totalResources, 0);

  const securityFindings = useSecurityStore(s => s.findings);
  const criticalFindings = securityFindings.filter(f => f.severity === 'critical' && f.status === 'open').length;

  const stats = useMemoryStore(s => s.stats);
  const fetchStats = useMemoryStore(s => s.fetchStats);

  const incidents = useIncidentStore(s => s.incidents);
  const fetchIncidents = useIncidentStore(s => s.fetchIncidents);
  const activeIncidentsCount = incidents.filter(i => i.status !== 'closed' && i.status !== 'archived').length;

  const execMetrics = useExecutiveStore(s => s.metrics);
  const fetchExecutiveData = useExecutiveStore(s => s.fetchExecutiveData);

  const activeTenant = useIdentityStore(s => s.activeTenant);
  const fetchIdentityData = useIdentityStore(s => s.fetchIdentityData);

  useEffect(() => {
    fetchConnectors();
    fetchStats();
    fetchIncidents();
    fetchExecutiveData();
    fetchIdentityData();
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      padding: '24px',
      gap: '24px',
      maxWidth: '1600px',
      margin: '0 auto',
    }}>
      {/* Platform Header */}
      <header className="glass-panel" style={{
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand Logo & Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="pulse-violet" style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #822ed1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px var(--accent-primary-glow)'
          }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>CloudGuard AI</h1>
              <span style={{ fontSize: '0.6rem', color: 'var(--accent-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.05em' }}>OS v1.0</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'hsl(230, 10%, 55%)' }}>
              The Autonomous Cloud Security Intelligence Platform
            </p>
          </div>
        </div>

        {/* System Diagnostics Metrics */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* Cloud provider connected */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={14} color="hsl(230, 10%, 55%)" />
            <div>
              <div style={{ fontSize: '0.6rem', color: 'hsl(230, 10%, 50%)', textTransform: 'uppercase' }}>Twin Integration</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>AWS: us-west-2</div>
            </div>
          </div>

          {/* EKS active cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={14} color="hsl(230, 10%, 55%)" />
            <div>
              <div style={{ fontSize: '0.6rem', color: 'hsl(230, 10%, 50%)', textTransform: 'uppercase' }}>Active Cluster</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>eks-prod-main</div>
            </div>
          </div>

          {/* Zero Trust Session */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={14} color="var(--color-safe)" />
            <div>
              <div style={{ fontSize: '0.6rem', color: 'hsl(230, 10%, 50%)', textTransform: 'uppercase' }}>Session Auth</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-safe)' }}>Zero-Trust OIDC</div>
            </div>
          </div>

          {/* Connectors nav pill */}
          <Link href="/connectors" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
            color: 'var(--accent-secondary)', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            <Globe size={13} />
            Cloud Connectors
            {connectedProviders.length > 0 && (
              <span style={{
                background: 'var(--color-safe)', color: '#000',
                borderRadius: '10px', padding: '1px 6px', fontSize: '0.55rem', fontWeight: 700,
              }}>
                {connectedProviders.length}
              </span>
            )}
          </Link>

          {/* Security Scanner nav pill */}
          <Link href="/security" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '6px',
            background: criticalFindings > 0 ? 'rgba(245,34,45,0.08)' : 'rgba(255,255,255,0.04)',
            border: criticalFindings > 0 ? '1px solid rgba(245,34,45,0.3)' : '1px solid var(--border-color)',
            color: criticalFindings > 0 ? 'var(--color-danger)' : 'hsl(230,10%,65%)',
            textDecoration: 'none', fontSize: '0.7rem', fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            <Shield size={13} />
            Security
            {criticalFindings > 0 && (
              <span style={{
                background: 'var(--color-danger)', color: '#fff',
                borderRadius: '10px', padding: '1px 6px', fontSize: '0.55rem', fontWeight: 700,
              }}>
                {criticalFindings}
              </span>
            )}
          </Link>

          {/* Memory Engine nav pill */}
          <Link href="/memory" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
            color: 'var(--accent-secondary)', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            <Brain size={13} />
            Memory Engine
            {stats && (
              <span style={{
                background: 'var(--accent-secondary)', color: '#000',
                borderRadius: '10px', padding: '1px 6px', fontSize: '0.55rem', fontWeight: 700,
              }}>
                {stats.totalVectors}
              </span>
            )}
          </Link>

          {/* Incident Command nav pill */}
          <Link href="/incidents" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '6px',
            background: activeIncidentsCount > 0 ? 'rgba(245,34,45,0.08)' : 'rgba(255,255,255,0.04)',
            border: activeIncidentsCount > 0 ? '1px solid rgba(245,34,45,0.3)' : '1px solid var(--border-color)',
            color: activeIncidentsCount > 0 ? 'var(--color-danger)' : 'hsl(230,10%,65%)',
            textDecoration: 'none', fontSize: '0.7rem', fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            <ShieldAlert size={13} />
            Incident Command
            {activeIncidentsCount > 0 && (
              <span style={{
                background: 'var(--color-danger)', color: '#fff',
                borderRadius: '10px', padding: '1px 6px', fontSize: '0.55rem', fontWeight: 700,
              }}>
                {activeIncidentsCount}
              </span>
            )}
          </Link>

          {/* Executive Suite nav pill */}
          <Link href="/executive" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
            color: 'var(--accent-secondary)', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            <Award size={13} />
            Executive Suite
            {execMetrics && (
              <span style={{
                background: 'var(--accent-secondary)', color: '#000',
                borderRadius: '10px', padding: '1px 6px', fontSize: '0.55rem', fontWeight: 700,
              }}>
                {execMetrics.securityScore}
              </span>
            )}
          </Link>

          {/* Identity & Zero Trust nav pill */}
          <Link href="/identity" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
            color: 'var(--accent-secondary)', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            <Fingerprint size={13} />
            Identity Suite
            {activeTenant && (
              <span style={{
                background: 'var(--accent-secondary)', color: '#000',
                borderRadius: '10px', padding: '1px 6px', fontSize: '0.55rem', fontWeight: 700,
              }}>
                {activeTenant.tenantId.split('-')[1]?.toUpperCase() || 'SYS'}
              </span>
            )}
          </Link>

          {/* GitOps Release nav pill */}
          <Link href="/gitops" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
            color: 'var(--accent-secondary)', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            <GitPullRequest size={13} />
            GitOps Release
          </Link>

          {/* Platform Operations nav pill */}
          <Link href="/operations" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
            color: 'var(--accent-secondary)', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            <Activity size={13} />
            Platform Operations
          </Link>
        </div>
      </header>

      {/* Connected Providers Strip */}
      {connectedProviders.length > 0 && (
        <section style={{
          padding: '10px 16px',
          background: 'rgba(82, 196, 26, 0.04)',
          border: '1px solid rgba(82, 196, 26, 0.15)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-safe)', boxShadow: '0 0 6px var(--color-safe)' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-safe)' }}>Genome Live</span>
          </div>
          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />
          {connectedProviders.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Activity size={10} color="var(--accent-secondary)" />
              <span style={{ fontSize: '0.62rem', color: 'hsl(230,10%,65%)' }}>{c.displayName}</span>
              <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>
                {c.totalResources.toLocaleString()}
              </span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Database size={11} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
              {totalResources.toLocaleString()} resources in Genome
            </span>
          </div>
        </section>
      )}

      {/* Row 1: Timeline Simulator */}
      <section style={{ width: '100%' }}>
        <ThreatTimeline />
      </section>

      {/* Search & Overlay Select controls */}
      <section style={{ width: '100%' }}>
        <DigitalTwinSearch />
      </section>

      {/* Row 2: Graph and Council (Middle Section) */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: '24px',
        width: '100%',
      }}>
        <div style={{ height: '520px' }}>
          <LivingInfrastructureGraph />
        </div>
        <div style={{ height: '520px' }}>
          <AISecurityCouncil />
        </div>
      </section>

       {/* Row 3: Predictive Engine and Alerts (Bottom Section) */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: '24px',
        width: '100%',
      }}>
        <div style={{ height: '520px' }}>
          <PredictiveSecurityEngine />
        </div>
        <div style={{ height: '520px' }}>
          <LiveExecutionCenter />
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.7rem',
        color: 'hsl(230, 10%, 45%)',
        padding: '12px 10px 24px 10px',
        borderTop: '1px solid rgba(255, 255, 255, 0.03)'
      }}>
        <div>© 2026 CloudGuard AI Inc. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Boundary Policy</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Audit Trail Registry</a>
        </div>
      </footer>
    </div>
  );
}
