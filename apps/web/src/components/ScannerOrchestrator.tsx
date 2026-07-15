"use client";

import React from 'react';
import { useSecurityStore } from '../store/useSecurityStore';
import type { ScannerDefinition } from '@cloudguard/types';
import { Play, CheckCircle2, Loader, AlertCircle, Clock, Zap } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  container:    '#FF9900',
  sast:         '#4285F4',
  iac:          '#7B42BC',
  secrets:      '#E53935',
  kubernetes:   '#326CE5',
  runtime:      '#FF5722',
  api:          '#00BCD4',
  dependency:   '#8BC34A',
  sbom:         '#FFC107',
  compliance:   '#9C27B0',
};

const CATEGORY_LABELS: Record<string, string> = {
  container: 'Container', sast: 'SAST', iac: 'IaC',
  secrets: 'Secrets', kubernetes: 'Kubernetes', runtime: 'Runtime',
  api: 'API', dependency: 'Deps', sbom: 'SBOM', compliance: 'Compliance',
};

interface ScannerCardProps {
  scanner: ScannerDefinition;
  logs: string[];
  onTrigger: () => void;
}

function ScannerCard({ scanner, logs, onTrigger }: ScannerCardProps) {
  const catColor = CATEGORY_COLORS[scanner.category] ?? 'var(--accent-secondary)';
  const isRunning = scanner.status === 'running';
  const isDone = scanner.status === 'completed';
  const isFailed = scanner.status === 'failed';
  const lastLog = logs[logs.length - 1] ?? '';

  return (
    <div style={{
      background: isRunning
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(255,255,255,0.015)',
      border: isRunning
        ? `1px solid ${catColor}55`
        : isDone
          ? `1px solid ${catColor}30`
          : '1px solid var(--border-color)',
      borderRadius: '10px',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: 'all 0.25s ease',
      boxShadow: isRunning ? `0 0 16px ${catColor}18` : 'none',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Running progress bar */}
      {isRunning && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${catColor}, transparent)`,
          animation: 'scan-progress 1.8s linear infinite',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {scanner.name}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.5rem', padding: '1px 6px', borderRadius: '3px',
              background: `${catColor}20`, color: catColor, fontWeight: 600, border: `1px solid ${catColor}40`,
            }}>
              {CATEGORY_LABELS[scanner.category] ?? scanner.category}
            </span>
            <span style={{ fontSize: '0.5rem', color: 'hsl(230,10%,40%)', fontFamily: 'var(--font-mono)', paddingTop: '1px' }}>
              v{scanner.version}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div style={{ flexShrink: 0 }}>
          {isRunning && <Loader size={14} color={catColor} style={{ animation: 'spin 1s linear infinite' }} />}
          {isDone && <CheckCircle2 size={14} color="var(--color-safe)" />}
          {isFailed && <AlertCircle size={14} color="var(--color-danger)" />}
          {scanner.status === 'idle' && (
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(230,10%,35%)', margin: '3px' }} />
          )}
        </div>
      </div>

      {/* Findings summary */}
      {isDone && scanner.findingsCount > 0 && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={9} color="var(--color-danger)" />
            <span style={{ fontSize: '0.6rem', color: 'var(--color-danger)', fontWeight: 700 }}>
              {scanner.criticalCount} critical
            </span>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'hsl(230,10%,50%)' }}>
            {scanner.findingsCount} total
          </div>
          {scanner.lastRunAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: 'auto' }}>
              <Clock size={9} color="hsl(230,10%,40%)" />
              <span style={{ fontSize: '0.55rem', color: 'hsl(230,10%,40%)' }}>
                {new Date(scanner.lastRunAt).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Last log line */}
      {isRunning && lastLog && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
          color: 'hsl(230,10%,55%)', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          background: 'rgba(0,0,0,0.3)', padding: '4px 6px', borderRadius: '4px',
        }}>
          {lastLog}
        </div>
      )}

      {/* Trigger button */}
      {!isRunning && (
        <button
          onClick={(e) => { e.stopPropagation(); onTrigger(); }}
          style={{
            width: '100%', padding: '6px',
            background: isDone ? 'rgba(255,255,255,0.03)' : `${catColor}`,
            border: isDone ? '1px solid var(--border-color)' : 'none',
            borderRadius: '5px',
            color: isDone ? 'hsl(230,10%,55%)' : '#000',
            fontWeight: 600, fontSize: '0.65rem',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          }}
        >
          <Play size={10} fill={isDone ? 'none' : '#000'} />
          {isDone ? 'Re-scan' : 'Trigger Scan'}
        </button>
      )}
    </div>
  );
}

export const ScannerOrchestrator: React.FC = () => {
  const scanners = useSecurityStore(s => s.scanners);
  const scanLogs = useSecurityStore(s => s.scanLogs);
  const triggerScan = useSecurityStore(s => s.triggerScan);

  const running = scanners.filter(s => s.status === 'running').length;
  const completed = scanners.filter(s => s.status === 'completed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={14} color="var(--accent-secondary)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Scanner Orchestrator</span>
        </div>
        {running > 0 && (
          <span style={{
            fontSize: '0.6rem', padding: '2px 8px', borderRadius: '20px',
            background: 'rgba(0,217,255,0.1)', color: 'var(--accent-secondary)',
            border: '1px solid rgba(0,217,255,0.2)',
          }}>
            {running} running
          </span>
        )}
        {completed > 0 && (
          <span style={{
            fontSize: '0.6rem', padding: '2px 8px', borderRadius: '20px',
            background: 'rgba(82,196,26,0.1)', color: 'var(--color-safe)',
            border: '1px solid rgba(82,196,26,0.2)',
          }}>
            {completed} completed
          </span>
        )}
      </div>

      {/* Scanner grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '10px',
      }}>
        {scanners.map(scanner => (
          <ScannerCard
            key={scanner.id}
            scanner={scanner}
            logs={scanLogs[scanner.id] ?? []}
            onTrigger={() => triggerScan(scanner.id)}
          />
        ))}
      </div>
    </div>
  );
};
