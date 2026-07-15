"use client";

import React, { useEffect, useState } from 'react';
import { useConnectorStore } from '../../store/useConnectorStore';
import { CloudConnectorHub } from '../../components/CloudConnectorHub';
import { DiscoveryTerminal } from '../../components/DiscoveryTerminal';
import { ConnectorHealthBoard } from '../../components/ConnectorHealthBoard';
import {
  Shield,
  Database,
  Activity,
  GitBranch,
  TrendingDown,
  ChevronLeft,
  Globe,
  Layers,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function ConnectorsPage() {
  const connectors = useConnectorStore(s => s.connectors);
  const activeConnectorId = useConnectorStore(s => s.activeConnectorId);
  const discoveryLogs = useConnectorStore(s => s.discoveryLogs);
  const resourceCounts = useConnectorStore(s => s.resourceCounts);
  const genomeSummary = useConnectorStore(s => s.genomeSummary);
  const fetchConnectors = useConnectorStore(s => s.fetchConnectors);
  const fetchGenomeSummary = useConnectorStore(s => s.fetchGenomeSummary);

  const activeConnector = connectors.find(c => c.id === activeConnectorId);
  const activeLogs = activeConnectorId ? (discoveryLogs[activeConnectorId] ?? []) : [];
  const activeResourceCount = activeConnectorId ? (resourceCounts[activeConnectorId] ?? 0) : 0;

  const connectedCount = connectors.filter(c => c.state === 'healthy').length;
  const totalResources = genomeSummary?.totalResources ?? connectors.reduce((s, c) => s + c.totalResources, 0);

  useEffect(() => {
    fetchConnectors();
    fetchGenomeSummary();
  }, []);

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
      {/* Header */}
      <header className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(230,10%,55%)', textDecoration: 'none', fontSize: '0.75rem' }}>
            <ChevronLeft size={14} />
            Dashboard
          </Link>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '9px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px var(--accent-primary-glow)',
            }}>
              <Globe size={18} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cloud Connector Hub</h1>
              <p style={{ fontSize: '0.65rem', color: 'hsl(230,10%,50%)' }}>
                Real-time multi-cloud discovery & Infrastructure Genome synchronization
              </p>
            </div>
          </div>
        </div>

        {/* Genome Summary pills */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={14} color="var(--accent-secondary)" />
            <div>
              <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase' }}>Connected Providers</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: connectedCount > 0 ? 'var(--color-safe)' : 'hsl(230,10%,55%)' }}>
                {connectedCount} / {connectors.length}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={14} color="var(--accent-primary)" />
            <div>
              <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase' }}>Total Resources</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                {totalResources > 0 ? totalResources.toLocaleString() : '—'}
              </div>
            </div>
          </div>
          {genomeSummary && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingDown size={14} color="var(--color-danger)" />
              <div>
                <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase' }}>Critical Findings</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                  {genomeSummary.riskDistribution.critical.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Genome Summary Bar */}
      {totalResources > 0 && genomeSummary && (
        <section className="glass-panel" style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <Zap size={14} color="var(--accent-secondary)" />
            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Infrastructure Genome — Risk Distribution</span>
            <span style={{ fontSize: '0.6rem', color: 'hsl(230,10%,45%)', marginLeft: 'auto' }}>
              {totalResources.toLocaleString()} total resources across {connectedCount} providers
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0', borderRadius: '6px', overflow: 'hidden', height: '8px' }}>
            {[
              { key: 'critical', color: 'var(--color-danger)', label: 'Critical' },
              { key: 'high', color: 'var(--color-warning)', label: 'High' },
              { key: 'medium', color: 'var(--accent-secondary)', label: 'Medium' },
              { key: 'low', color: 'var(--color-safe)', label: 'Low' },
            ].map(({ key, color }) => {
              const count = genomeSummary.riskDistribution[key as keyof typeof genomeSummary.riskDistribution];
              const pct = (count / totalResources) * 100;
              return (
                <div key={key} style={{ width: `${pct}%`, background: color, transition: 'width 0.8s ease' }} />
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
            {[
              { key: 'critical', color: 'var(--color-danger)', label: 'Critical' },
              { key: 'high', color: 'var(--color-warning)', label: 'High' },
              { key: 'medium', color: 'var(--accent-secondary)', label: 'Medium' },
              { key: 'low', color: 'var(--color-safe)', label: 'Low' },
            ].map(({ key, color, label }) => {
              const count = genomeSummary.riskDistribution[key as keyof typeof genomeSummary.riskDistribution];
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
                  <span style={{ fontSize: '0.6rem', color: 'hsl(230,10%,55%)' }}>{label}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 600, color }}>{count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Provider Grid */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Activity size={14} color="var(--accent-secondary)" />
          <h2 style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cloud Providers</h2>
          <span style={{ fontSize: '0.6rem', color: 'hsl(230,10%,45%)' }}>
            Click a provider to view its discovery stream
          </span>
        </div>
        <CloudConnectorHub />
      </section>

      {/* Active Connector detail panel */}
      {activeConnector && (
        <section style={{
          display: 'grid',
          gridTemplateColumns: activeConnector.health ? '1fr 1fr' : '1fr',
          gap: '24px',
        }}>
          {/* Discovery Terminal */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={13} color="var(--accent-secondary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Live Discovery Stream</span>
              <span style={{ fontSize: '0.6rem', color: 'hsl(230,10%,45%)' }}>— {activeConnector.displayName}</span>
            </div>
            <div style={{ height: '360px' }}>
              <DiscoveryTerminal
                logs={activeLogs}
                providerId={activeConnector.id}
                resourceCount={activeResourceCount}
                isActive={activeConnector.state !== 'idle'}
              />
            </div>
          </div>

          {/* Health Board */}
          {activeConnector.health && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ConnectorHealthBoard
                health={activeConnector.health}
                displayName={activeConnector.displayName}
              />
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.7rem', color: 'hsl(230,10%,40%)',
        padding: '12px 0 24px', borderTop: '1px solid rgba(255,255,255,0.03)',
      }}>
        <div>© 2026 CloudGuard AI Inc. — Real Cloud Discovery Engine v1.0</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Connector Runtime: localhost:4001</span>
          <span>Genome Sync: Active</span>
        </div>
      </footer>
    </div>
  );
}
