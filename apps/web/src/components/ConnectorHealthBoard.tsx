"use client";

import React from 'react';
import type { ConnectorHealth } from '@cloudguard/types';
import { Activity, Clock, AlertCircle, Wifi, ShieldCheck, Key } from 'lucide-react';

interface ConnectorHealthBoardProps {
  health: ConnectorHealth;
  displayName: string;
}

function CircleGauge({ value, color, size = 56 }: { value: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  );
}

function MetricCard({ icon, label, value, unit, color, gaugeValue }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  gaugeValue?: number;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'center',
    }}>
      {gaugeValue !== undefined ? (
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <CircleGauge value={gaugeValue} color={color} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', fontWeight: 700, color,
          }}>
            {Math.round(gaugeValue)}
          </div>
        </div>
      ) : (
        <div style={{ color, padding: '12px 0 4px' }}>{icon}</div>
      )}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color }}>
          {value}{unit && <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>{unit}</span>}
        </div>
        <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  );
}

export const ConnectorHealthBoard: React.FC<ConnectorHealthBoardProps> = ({ health, displayName }) => {
  const latencyColor = health.apiLatencyMs < 50 ? 'var(--color-safe)' : health.apiLatencyMs < 150 ? 'var(--color-warning)' : 'var(--color-danger)';
  const rateLimitColor = health.rateLimitUsage < 50 ? 'var(--color-safe)' : health.rateLimitUsage < 80 ? 'var(--color-warning)' : 'var(--color-danger)';
  const credentialColor = health.credentialStatus === 'valid' ? 'var(--color-safe)' : health.credentialStatus === 'expiring' ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.7rem', color: 'hsl(230,10%,60%)' }}>Health Metrics — {displayName}</span>
        <span style={{
          fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
          color: 'hsl(230,10%,40%)',
        }}>
          Last sync: {new Date(health.lastSyncAt).toLocaleTimeString()}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        <MetricCard
          icon={<Activity size={18} />}
          label="API Latency"
          value={health.apiLatencyMs}
          unit="ms"
          color={latencyColor}
          gaugeValue={Math.min(100, health.apiLatencyMs / 3)}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label="Sync Duration"
          value={(health.lastSyncDurationMs / 1000).toFixed(1)}
          unit="s"
          color="var(--accent-secondary)"
          gaugeValue={Math.min(100, health.lastSyncDurationMs / 300)}
        />
        <MetricCard
          icon={<Wifi size={18} />}
          label="Rate Limit"
          value={health.rateLimitUsage}
          unit="%"
          color={rateLimitColor}
          gaugeValue={health.rateLimitUsage}
        />
        <MetricCard
          icon={<ShieldCheck size={18} />}
          label="Health Score"
          value={health.healthScore}
          unit="/100"
          color="var(--accent-primary)"
          gaugeValue={health.healthScore}
        />
      </div>

      {/* Credential + Webhook Status strip */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 10px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
        }}>
          <Key size={11} color={credentialColor} />
          <span style={{ fontSize: '0.6rem', color: credentialColor, fontWeight: 600 }}>
            Credentials: {health.credentialStatus.toUpperCase()}
          </span>
        </div>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 10px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: health.webhookConnected ? 'var(--color-safe)' : 'var(--color-danger)',
            boxShadow: health.webhookConnected ? '0 0 6px var(--color-safe)' : 'none',
          }} />
          <span style={{ fontSize: '0.6rem', color: 'hsl(230,10%,60%)' }}>
            Webhook: {health.webhookConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 10px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
        }}>
          <span style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)' }}>{health.apiVersion}</span>
        </div>
      </div>
    </div>
  );
};
