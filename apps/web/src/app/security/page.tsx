"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSecurityStore } from '../../store/useSecurityStore';
import { ScannerOrchestrator } from '../../components/ScannerOrchestrator';
import { FindingCard } from '../../components/FindingCard';
import { SBOMViewer } from '../../components/SBOMViewer';
import {
  Shield, ChevronLeft, AlertTriangle, Lock, Activity,
  Database, TrendingUp, TrendingDown, Minus, Filter,
  Package, ChevronDown, ChevronUp, Zap, Eye
} from 'lucide-react';
import type { FindingCategory, FindingSeverity } from '@cloudguard/types';

// ─── Security Score Ring ─────────────────────────────────────────────────────

function SecurityScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? 'var(--color-safe)' : score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';
  const label = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Critical';

  return (
    <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
      <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle cx={65} cy={65} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease, stroke 0.5s ease' }}
          filter={`drop-shadow(0 0 8px ${color})`}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: '0.6rem', color, fontWeight: 600, marginTop: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.5rem', color: 'hsl(230,10%,45%)', marginTop: '1px' }}>/ 100</div>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon, sublabel }: {
  label: string; value: number | string; color: string;
  icon: React.ReactNode; sublabel?: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px', padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(230,10%,50%)' }}>
        {icon}
        <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sublabel && <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)' }}>{sublabel}</div>}
    </div>
  );
}

// ─── Filter Pill ─────────────────────────────────────────────────────────────

function FilterPill({ label, active, color, onClick }: {
  label: string; active: boolean; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: '20px', fontSize: '0.6rem', fontWeight: 600,
        background: active ? `${color}20` : 'rgba(255,255,255,0.03)',
        border: active ? `1px solid ${color}55` : '1px solid var(--border-color)',
        color: active ? color : 'hsl(230,10%,50%)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const scanners = useSecurityStore(s => s.scanners);
  const findings = useSecurityStore(s => s.findings);
  const summary = useSecurityStore(s => s.summary);
  const sbom = useSecurityStore(s => s.sbom);
  const filters = useSecurityStore(s => s.filters);
  const selectedFindingId = useSecurityStore(s => s.selectedFindingId);
  const fetchScanners = useSecurityStore(s => s.fetchScanners);
  const fetchFindings = useSecurityStore(s => s.fetchFindings);
  const fetchSummary = useSecurityStore(s => s.fetchSummary);
  const fetchSBOM = useSecurityStore(s => s.fetchSBOM);
  const selectFinding = useSecurityStore(s => s.selectFinding);
  const setFilters = useSecurityStore(s => s.setFilters);
  const computeLocalSummary = useSecurityStore(s => s.computeLocalSummary);

  const [activeTab, setActiveTab] = useState<'findings' | 'sbom'>('findings');
  const [orchestratorOpen, setOrchestratorOpen] = useState(true);

  useEffect(() => {
    fetchScanners();
    fetchFindings();
    fetchSummary();
    fetchSBOM('all');
  }, []);

  // Compute a live summary if none loaded
  useEffect(() => {
    if (!summary && findings.length > 0) computeLocalSummary();
  }, [findings]);

  // Filtered findings
  const filtered = findings.filter(f => {
    if (filters.severity !== 'all' && f.severity !== filters.severity) return false;
    if (filters.category !== 'all' && f.category !== filters.category) return false;
    if (filters.scanner !== 'all' && f.scanner !== filters.scanner) return false;
    return true;
  });

  const score = summary?.securityScore ?? 100;
  const trendIcon = summary?.trendDirection === 'improving'
    ? <TrendingUp size={12} color="var(--color-safe)" />
    : summary?.trendDirection === 'degrading'
      ? <TrendingDown size={12} color="var(--color-danger)" />
      : <Minus size={12} color="hsl(230,10%,50%)" />;

  const SEVERITY_FILTERS: { value: FindingSeverity | 'all'; label: string; color: string }[] = [
    { value: 'all',      label: 'All',      color: 'hsl(230,10%,55%)' },
    { value: 'critical', label: 'Critical', color: 'var(--color-danger)' },
    { value: 'high',     label: 'High',     color: 'hsl(24,90%,55%)' },
    { value: 'medium',   label: 'Medium',   color: 'var(--color-warning)' },
    { value: 'low',      label: 'Low',      color: 'var(--color-safe)' },
  ];

  const CATEGORY_FILTERS: { value: FindingCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'container', label: 'Container' },
    { value: 'sast', label: 'SAST' },
    { value: 'iac', label: 'IaC' },
    { value: 'secrets', label: 'Secrets' },
    { value: 'kubernetes', label: 'Kubernetes' },
    { value: 'runtime', label: 'Runtime' },
    { value: 'api', label: 'API' },
    { value: 'dependency', label: 'Dependency' },
    { value: 'compliance', label: 'Compliance' },
  ];

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
            width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--color-danger), hsl(24,90%,55%))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(245,34,45,0.4)',
          }}>
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Security Intelligence Center</h1>
            <p style={{ fontSize: '0.65rem', color: 'hsl(230,10%,50%)', margin: 0 }}>
              Continuous vulnerability intelligence powered by 15 industry-standard scanners
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-danger)' }}>
              {summary?.critical ?? 0}
            </div>
            <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)' }}>Critical</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(24,90%,55%)' }}>
              {summary?.high ?? 0}
            </div>
            <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)' }}>High</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-warning)' }}>
              {summary?.medium ?? 0}
            </div>
            <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)' }}>Medium</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(230,10%,70%)' }}>
                {summary?.securityScore ?? 100}
              </span>
              {trendIcon}
            </div>
            <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)' }}>Score</div>
          </div>
        </div>
      </header>

      {/* ── Security Score Section ─────────────────────────────────────── */}
      <section className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
        <SecurityScoreRing score={score} />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', minWidth: '300px' }}>
          <StatCard label="Total Findings" value={summary?.totalFindings ?? 0} color="hsl(230,10%,80%)" icon={<AlertTriangle size={12} />} sublabel="open findings" />
          <StatCard label="Secrets Detected" value={summary?.secretsDetected ?? 0} color="var(--color-danger)" icon={<Lock size={12} />} sublabel="verified credentials" />
          <StatCard label="Resources Scanned" value={summary?.scannedResources?.toLocaleString() ?? '0'} color="var(--accent-secondary)" icon={<Database size={12} />} sublabel="across all providers" />
          <StatCard label="Compliance Score" value={`${summary?.complianceScore ?? 0}%`} color="var(--color-warning)" icon={<Shield size={12} />} sublabel="CIS / OPA policies" />
          <StatCard label="Active Scans" value={summary?.activeScans ?? 0} color="var(--accent-primary)" icon={<Activity size={12} />} sublabel="running now" />
          <StatCard label="SBOM Packages" value={sbom.length > 0 ? sbom.length : '87,432'} color="hsl(230,10%,70%)" icon={<Package size={12} />} sublabel="catalogued" />
        </div>
      </section>

      {/* ── Scanner Orchestrator (collapsible) ────────────────────────── */}
      <section className="glass-panel" style={{ padding: '20px 24px' }}>
        <button
          onClick={() => setOrchestratorOpen(!orchestratorOpen)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', width: '100%',
            marginBottom: orchestratorOpen ? '16px' : '0',
          }}
        >
          <Zap size={14} color="var(--accent-secondary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Scanner Orchestrator</span>
          <span style={{ fontSize: '0.6rem', color: 'hsl(230,10%,45%)', marginLeft: '4px' }}>
            {scanners.filter(s => s.status === 'completed').length}/{scanners.length} completed
          </span>
          {orchestratorOpen ? <ChevronUp size={14} color="hsl(230,10%,45%)" style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} color="hsl(230,10%,45%)" style={{ marginLeft: 'auto' }} />}
        </button>
        {orchestratorOpen && <ScannerOrchestrator />}
      </section>

      {/* ── Findings + SBOM tabs ─────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border-color)', marginBottom: '0' }}>
          {[
            { key: 'findings', label: 'Security Findings', icon: <Eye size={13} /> },
            { key: 'sbom',     label: 'Software Bill of Materials', icon: <Package size={13} /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px', background: 'none', border: 'none',
                borderBottom: activeTab === key ? '2px solid var(--accent-secondary)' : '2px solid transparent',
                color: activeTab === key ? 'var(--accent-secondary)' : 'hsl(230,10%,50%)',
                fontSize: '0.75rem', fontWeight: activeTab === key ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {icon}{label}
              {key === 'findings' && findings.length > 0 && (
                <span style={{
                  background: 'var(--color-danger)', color: '#fff',
                  borderRadius: '10px', padding: '0 5px', fontSize: '0.5rem', fontWeight: 700,
                }}>{findings.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="glass-panel" style={{ borderRadius: '0 0 12px 12px', padding: '20px 24px' }}>
          {activeTab === 'findings' ? (
            <>
              {/* Filters */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
                <Filter size={12} color="hsl(230,10%,45%)" />
                {SEVERITY_FILTERS.map(f => (
                  <FilterPill
                    key={f.value}
                    label={f.label}
                    active={filters.severity === f.value}
                    color={f.color}
                    onClick={() => setFilters({ severity: f.value })}
                  />
                ))}
                <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />
                <select
                  value={filters.category}
                  onChange={e => setFilters({ category: e.target.value as FindingCategory | 'all' })}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                    borderRadius: '20px', padding: '3px 10px', fontSize: '0.6rem',
                    color: 'hsl(230,10%,60%)', cursor: 'pointer', outline: 'none',
                  }}
                >
                  {CATEGORY_FILTERS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'hsl(230,10%,45%)' }}>
                  {filtered.length} findings
                </span>
              </div>

              {/* Findings list */}
              {filtered.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px 24px',
                  color: 'hsl(230,10%,40%)', fontSize: '0.8rem',
                }}>
                  <Shield size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <div style={{ fontWeight: 600 }}>No findings match the current filters</div>
                  <div style={{ fontSize: '0.65rem', marginTop: '4px' }}>
                    Trigger a scan to discover vulnerabilities
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {filtered.map(f => (
                    <FindingCard
                      key={f.id}
                      finding={f}
                      isSelected={selectedFindingId === f.id}
                      onSelect={() => selectFinding(selectedFindingId === f.id ? null : f.id)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <SBOMViewer sbom={sbom} />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.7rem', color: 'hsl(230,10%,40%)',
        padding: '12px 0 24px', borderTop: '1px solid rgba(255,255,255,0.03)',
      }}>
        <div>© 2026 CloudGuard AI Inc. — Security Intelligence Center v1.0</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Scanner Runtime: localhost:4002</span>
          <span>Scanners: {scanners.length} registered</span>
          <span>Last scan: {summary?.lastScanAt ? new Date(summary.lastScanAt).toLocaleTimeString() : '—'}</span>
        </div>
      </footer>
    </div>
  );
}
