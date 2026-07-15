"use client";

import React from 'react';
import type { SBOMEntry } from '@cloudguard/types';
import { Package, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';

interface SBOMViewerProps {
  sbom: SBOMEntry[];
}

export const SBOMViewer: React.FC<SBOMViewerProps> = ({ sbom }) => {
  const vulnerable = sbom.filter(s => s.cveCount > 0);
  const critical = sbom.filter(s => s.criticalCves.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {[
          { label: 'Total Packages', value: sbom.length, color: 'var(--accent-secondary)' },
          { label: 'Vulnerable', value: vulnerable.length, color: 'var(--color-warning)' },
          { label: 'Critical CVEs', value: critical.length, color: 'var(--color-danger)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: 1,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px', padding: '10px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Package table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 0.8fr 1fr 0.6fr 0.6fr',
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.03)',
          fontSize: '0.55rem',
          color: 'hsl(230,10%,45%)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          <span>Package</span>
          <span>Version</span>
          <span>License</span>
          <span>Type</span>
          <span>CVEs</span>
        </div>

        {/* Rows */}
        {sbom.map(pkg => {
          const hasCritical = pkg.criticalCves.length > 0;
          const hasVulns = pkg.cveCount > 0;
          return (
            <div key={pkg.id} style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 0.8fr 1fr 0.6fr 0.6fr',
              padding: '7px 12px',
              background: hasCritical
                ? 'rgba(245,34,45,0.04)'
                : hasVulns
                  ? 'rgba(250,173,20,0.03)'
                  : 'transparent',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={10} color={hasCritical ? 'var(--color-danger)' : hasVulns ? 'var(--color-warning)' : 'hsl(230,10%,40%)'} />
                <span style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  color: hasCritical ? 'var(--color-danger)' : hasVulns ? 'var(--color-warning)' : 'hsl(230,10%,75%)',
                  fontWeight: hasCritical ? 600 : 400,
                }}>
                  {pkg.name}
                </span>
              </div>
              <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'hsl(230,10%,55%)' }}>
                {pkg.version}
              </span>
              <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)' }}>
                {pkg.license}
              </span>
              <span style={{
                fontSize: '0.5rem', padding: '1px 5px', borderRadius: '3px',
                background: 'rgba(255,255,255,0.04)', color: 'hsl(230,10%,50%)',
                textTransform: 'uppercase', fontWeight: 600, width: 'fit-content',
              }}>
                {pkg.type}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {pkg.cveCount > 0 ? (
                  <>
                    <AlertTriangle size={9} color={hasCritical ? 'var(--color-danger)' : 'var(--color-warning)'} />
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700,
                      color: hasCritical ? 'var(--color-danger)' : 'var(--color-warning)',
                    }}>
                      {pkg.cveCount}
                    </span>
                  </>
                ) : (
                  <CheckCircle2 size={10} color="var(--color-safe)" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
