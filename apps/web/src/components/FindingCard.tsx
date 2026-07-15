"use client";

import React from 'react';
import type { SecurityFinding } from '@cloudguard/types';
import { AlertTriangle, Shield, Code2, Lock, Server, Activity, Globe, Package, CheckCircle2, ChevronRight, ExternalLink } from 'lucide-react';

interface FindingCardProps {
  finding: SecurityFinding;
  isSelected: boolean;
  onSelect: () => void;
}

const SEVERITY_CONFIG = {
  critical: { color: 'var(--color-danger)', bg: 'rgba(245,34,45,0.08)', border: 'rgba(245,34,45,0.3)', label: 'CRITICAL' },
  high:     { color: 'hsl(24,90%,55%)',     bg: 'rgba(255,120,0,0.08)', border: 'rgba(255,120,0,0.3)',  label: 'HIGH' },
  medium:   { color: 'var(--color-warning)', bg: 'rgba(250,173,20,0.08)', border: 'rgba(250,173,20,0.3)', label: 'MEDIUM' },
  low:      { color: 'var(--color-safe)',    bg: 'rgba(82,196,26,0.08)',  border: 'rgba(82,196,26,0.3)',  label: 'LOW' },
  info:     { color: 'var(--color-info)',    bg: 'rgba(24,144,255,0.08)', border: 'rgba(24,144,255,0.3)', label: 'INFO' },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  container:  <Server size={12} />,
  sast:       <Code2 size={12} />,
  iac:        <Code2 size={12} />,
  secrets:    <Lock size={12} />,
  kubernetes: <Server size={12} />,
  runtime:    <Activity size={12} />,
  api:        <Globe size={12} />,
  dependency: <Package size={12} />,
  sbom:       <Package size={12} />,
  compliance: <Shield size={12} />,
};

function CVSSRing({ value }: { value: number }) {
  const pct = value / 10;
  const r = 14;
  const circ = 2 * Math.PI * r;
  const color = value >= 9 ? 'var(--color-danger)' : value >= 7 ? 'hsl(24,90%,55%)' : 'var(--color-warning)';
  return (
    <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
      <svg width={36} height={36} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={18} cy={18} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3.5} />
        <circle cx={18} cy={18} r={r} fill="none" stroke={color} strokeWidth={3.5}
          strokeDasharray={`${pct * circ} ${(1 - pct) * circ}`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.55rem', fontWeight: 700, color,
      }}>
        {value.toFixed(1)}
      </div>
    </div>
  );
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, isSelected, onSelect }) => {
  const cfg = SEVERITY_CONFIG[finding.severity] ?? SEVERITY_CONFIG.info;

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.015)',
        border: isSelected ? `1px solid ${cfg.color}50` : '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: isSelected ? `0 0 14px ${cfg.color}18` : 'none',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {finding.cvss && <CVSSRing value={finding.cvss} />}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.55rem', padding: '1px 6px', borderRadius: '3px',
              background: cfg.bg, color: cfg.color, fontWeight: 700, border: `1px solid ${cfg.border}`,
            }}>
              {cfg.label}
            </span>
            {finding.cve && (
              <span style={{
                fontSize: '0.55rem', fontFamily: 'var(--font-mono)',
                color: 'hsl(205,85%,60%)', background: 'rgba(24,144,255,0.08)',
                padding: '1px 5px', borderRadius: '3px',
              }}>
                {finding.cve}
              </span>
            )}
            <span style={{
              fontSize: '0.5rem', display: 'flex', alignItems: 'center', gap: '3px',
              color: 'hsl(230,10%,45%)',
            }}>
              {CATEGORY_ICONS[finding.category]}
              {finding.scanner}
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff', lineHeight: '1.3', margin: 0 }}>
            {finding.title}
          </p>
        </div>
        <ChevronRight
          size={14}
          color="hsl(230,10%,35%)"
          style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        />
      </div>

      {/* Resource + location */}
      <div style={{
        fontSize: '0.6rem', color: 'hsl(230,10%,50%)',
        fontFamily: 'var(--font-mono)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {finding.resource} — {finding.location}
      </div>

      {/* Expanded AI enrichment */}
      {isSelected && (
        <div style={{
          marginTop: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '10px',
        }}>
          {/* MITRE mapping */}
          {finding.aiEnrichment.mitreTechnique && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '6px', padding: '8px 10px',
            }}>
              <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                MITRE ATT&CK
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                {finding.aiEnrichment.mitreTactic}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'hsl(230,10%,65%)', marginTop: '2px' }}>
                {finding.aiEnrichment.mitreTechnique}
              </div>
            </div>
          )}

          {/* AI enrichment accordion items */}
          {[
            { label: 'Root Cause', value: finding.aiEnrichment.rootCause },
            { label: 'Business Impact', value: finding.aiEnrichment.businessImpact },
            { label: 'Attack Scenario', value: finding.aiEnrichment.attackScenario },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)', marginBottom: '3px', textTransform: 'uppercase', fontWeight: 600 }}>
                {label}
              </div>
              <p style={{ fontSize: '0.65rem', color: 'hsl(230,10%,75%)', lineHeight: '1.5', margin: 0 }}>{value}</p>
            </div>
          ))}

          {/* Evidence */}
          <div>
            <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
              Evidence
            </div>
            <pre style={{
              background: '#030508', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '5px', padding: '8px', margin: 0,
              fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
              color: 'hsl(230,10%,75%)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {finding.evidence}
            </pre>
          </div>

          {/* Patch if available */}
          {(finding.aiEnrichment.terraformPatch || finding.aiEnrichment.yamlPatch) && (
            <div>
              <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                {finding.aiEnrichment.terraformPatch ? 'Terraform Patch' : 'YAML Patch'}
              </div>
              <pre style={{
                background: '#030508', border: '1px solid rgba(123,66,188,0.3)',
                borderRadius: '5px', padding: '8px', margin: 0,
                fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
                color: 'hsl(270,80%,80%)', overflowX: 'auto', whiteSpace: 'pre-wrap',
              }}>
                {finding.aiEnrichment.terraformPatch ?? finding.aiEnrichment.yamlPatch}
              </pre>
            </div>
          )}

          {/* Developer guidance */}
          <div style={{
            background: 'rgba(0,217,255,0.04)', border: '1px solid rgba(0,217,255,0.15)',
            borderRadius: '6px', padding: '8px 10px',
          }}>
            <div style={{ fontSize: '0.55rem', color: 'var(--accent-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Developer Guidance
            </div>
            <p style={{ fontSize: '0.65rem', color: 'hsl(230,10%,75%)', lineHeight: '1.5', margin: 0 }}>
              {finding.aiEnrichment.developerGuidance}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button style={{
              flex: 1, padding: '6px',
              background: 'rgba(82,196,26,0.08)', border: '1px solid rgba(82,196,26,0.25)',
              borderRadius: '5px', color: 'var(--color-safe)', fontSize: '0.65rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            }}>
              <CheckCircle2 size={10} /> Mark Fixed
            </button>
            <button style={{
              flex: 1, padding: '6px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              borderRadius: '5px', color: 'hsl(230,10%,55%)', fontSize: '0.65rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            }}>
              <ExternalLink size={10} /> View PR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
