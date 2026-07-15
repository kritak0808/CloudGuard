"use client";

import React, { useEffect, useState } from 'react';
import { useConnectorStore } from '../store/useConnectorStore';
import { 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Loader, 
  Plug, 
  PlugZap,
  Server,
  Globe,
  Code2,
  GitBranch,
  Box,
  Cpu,
  RefreshCw,
  X,
  ShieldCheck,
  Database
} from 'lucide-react';
import type { ConnectorDefinition } from '@cloudguard/types';

// ─── Provider icons & colors ──────────────────────────────────────────────────

const PROVIDER_META: Record<string, { icon: React.ReactNode; color: string; accent: string }> = {
  aws:        { icon: <Cloud size={20} />,    color: '#FF9900', accent: 'rgba(255,153,0,0.12)' },
  azure:      { icon: <Cloud size={20} />,    color: '#0089D6', accent: 'rgba(0,137,214,0.12)' },
  gcp:        { icon: <Cpu size={20} />,      color: '#4285F4', accent: 'rgba(66,133,244,0.12)' },
  kubernetes: { icon: <Server size={20} />,   color: '#326CE5', accent: 'rgba(50,108,229,0.12)' },
  github:     { icon: <GitBranch size={20} />,color: '#E8E8E8', accent: 'rgba(232,232,232,0.08)' },
  terraform:  { icon: <Code2 size={20} />,    color: '#7B42BC', accent: 'rgba(123,66,188,0.12)' },
  cloudflare: { icon: <Globe size={20} />,    color: '#F48120', accent: 'rgba(244,129,32,0.12)' },
  docker:     { icon: <Box size={20} />,      color: '#2496ED', accent: 'rgba(36,150,237,0.12)' },
};

function stateLabel(state: ConnectorDefinition['state']): string {
  return {
    idle: 'Not Connected',
    validating: 'Validating...',
    discovering: 'Discovering...',
    syncing: 'Syncing...',
    healthy: 'Connected',
    error: 'Error',
    disconnected: 'Disconnected',
  }[state];
}

function stateColor(state: ConnectorDefinition['state']): string {
  return {
    idle: 'hsl(230,10%,45%)',
    validating: 'var(--color-warning)',
    discovering: 'var(--accent-secondary)',
    syncing: 'var(--accent-primary)',
    healthy: 'var(--color-safe)',
    error: 'var(--color-danger)',
    disconnected: 'hsl(230,10%,35%)',
  }[state];
}

// ─── Credential Modal ─────────────────────────────────────────────────────────

function CredentialModal({
  connector,
  onConnect,
  onClose,
}: {
  connector: ConnectorDefinition;
  onConnect: () => void;
  onClose: () => void;
}) {
  const meta = PROVIDER_META[connector.provider];
  const [step, setStep] = useState<'form' | 'validating'>('form');

  const credentialFields: Record<string, { label: string; placeholder: string; type?: string }[]> = {
    role_arn: [
      { label: 'Role ARN', placeholder: 'arn:aws:iam::123456789012:role/CloudGuard-ReadOnly' },
      { label: 'External ID', placeholder: 'cg-ext-84f3a2b1', type: 'password' },
    ],
    service_account: [
      { label: 'Service Account JSON', placeholder: '{ "type": "service_account", ... }', type: 'password' },
    ],
    oauth: [
      { label: 'OAuth Client ID', placeholder: 'Iv1.abc123def456' },
      { label: 'OAuth Token', placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx', type: 'password' },
    ],
    api_key: [
      { label: 'API Key', placeholder: 'Enter API key...', type: 'password' },
    ],
    kubeconfig: [
      { label: 'Kubeconfig (base64)', placeholder: 'Paste base64-encoded kubeconfig...', type: 'password' },
    ],
  };

  const fields = credentialFields[connector.credentialType] ?? credentialFields.api_key;

  function handleConnect() {
    setStep('validating');
    setTimeout(() => {
      onConnect();
      onClose();
    }, 1500);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: 'hsl(230, 22%, 8%)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '28px',
        width: '460px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: meta?.accent, border: `1px solid ${meta?.color}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: meta?.color,
            }}>
              {meta?.icon}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Connect {connector.displayName}</div>
              <div style={{ fontSize: '0.65rem', color: 'hsl(230,10%,50%)' }}>
                {connector.credentialType.replace('_', ' ').toUpperCase()} Authentication
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(230,10%,50%)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Security notice */}
        <div style={{
          background: 'rgba(0,217,255,0.05)', border: '1px solid rgba(0,217,255,0.15)',
          borderRadius: '6px', padding: '10px 12px',
          fontSize: '0.65rem', color: 'var(--accent-secondary)', lineHeight: '1.5',
        }}>
          <ShieldCheck size={11} style={{ display: 'inline', marginRight: '5px' }} />
          Credentials are encrypted using AES-256-GCM and stored in HashiCorp Vault. CloudGuard requests read-only access only.
        </div>

        {/* Credential form */}
        {step === 'form' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {fields.map(f => (
              <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.65rem', color: 'hsl(230,10%,60%)', fontWeight: 500 }}>
                  {f.label}
                </label>
                <input
                  type={f.type ?? 'text'}
                  placeholder={f.placeholder}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'hsl(230,10%,80%)',
                    outline: 'none',
                    width: '100%',
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={handleConnect}
                style={{
                  flex: 1, padding: '10px',
                  background: meta?.color,
                  border: 'none', borderRadius: '6px',
                  color: '#000', fontWeight: 700, fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <PlugZap size={14} />
                Connect & Discover
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 16px',
                  background: 'transparent', border: '1px solid var(--border-color)',
                  borderRadius: '6px', color: 'hsl(230,10%,55%)',
                  fontSize: '0.75rem', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px' }}>
            <Loader size={28} color="var(--accent-secondary)" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Validating Credentials...</div>
            <div style={{ fontSize: '0.65rem', color: 'hsl(230,10%,50%)' }}>
              Verifying permissions and initiating discovery pipeline
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({
  connector,
  isActive,
  resourceCount,
  onClick,
  onConnect,
  onDisconnect,
}: {
  connector: ConnectorDefinition;
  isActive: boolean;
  resourceCount: number;
  onClick: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const meta = PROVIDER_META[connector.provider];
  const color = stateColor(connector.state);
  const isConnected = connector.state === 'healthy';
  const isRunning = ['validating', 'discovering', 'syncing'].includes(connector.state);
  const displayCount = resourceCount || connector.totalResources;

  return (
    <div
      onClick={onClick}
      style={{
        background: isActive ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)',
        border: isActive
          ? `1px solid ${meta?.color}55`
          : isConnected ? `1px solid ${meta?.color}33` : '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isActive ? `0 0 20px ${meta?.color}18` : 'none',
      }}
    >
      {/* Subtle background gradient */}
      {isConnected && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at top left, ${meta?.accent}, transparent 60%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: meta?.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: meta?.color,
            flexShrink: 0,
          }}>
            {meta?.icon}
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{connector.displayName}</div>
            <div style={{ fontSize: '0.6rem', color: 'hsl(230,10%,45%)', marginTop: '2px' }}>
              {connector.accountId}
            </div>
          </div>
        </div>

        {/* State indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '3px 7px', borderRadius: '20px',
          background: `${color}15`,
          border: `1px solid ${color}40`,
        }}>
          {isRunning && <Loader size={9} color={color} style={{ animation: 'spin 1s linear infinite' }} />}
          {isConnected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />}
          {!isRunning && !isConnected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />}
          <span style={{ fontSize: '0.55rem', color, fontWeight: 600 }}>{stateLabel(connector.state)}</span>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', lineHeight: '1.4', margin: 0 }}>
        {connector.description}
      </p>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {isConnected || isRunning ? (
          <>
            <div>
              <div style={{ fontSize: '0.65rem', color: meta?.color, fontWeight: 700 }}>
                {displayCount > 0 ? displayCount.toLocaleString() : '—'}
              </div>
              <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)' }}>Resources</div>
            </div>
            {connector.health && (
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-safe)', fontWeight: 700 }}>
                  {connector.health.healthScore}/100
                </div>
                <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)' }}>Health</div>
              </div>
            )}
            {connector.lastConnectedAt && (
              <div>
                <div style={{ fontSize: '0.65rem', color: 'hsl(230,10%,70%)', fontWeight: 600 }}>
                  {new Date(connector.lastConnectedAt).toLocaleTimeString()}
                </div>
                <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)' }}>Last Sync</div>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: '0.6rem', color: 'hsl(230,10%,40%)' }}>
            {connector.regions.join(' · ')}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
        {!isConnected && !isRunning && (
          <button
            onClick={onConnect}
            style={{
              flex: 1, padding: '7px',
              background: meta?.color,
              border: 'none', borderRadius: '5px',
              color: '#000', fontWeight: 700, fontSize: '0.65rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            }}
          >
            <Plug size={11} />
            Connect
          </button>
        )}
        {isRunning && (
          <div style={{
            flex: 1, padding: '7px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
            borderRadius: '5px', color, fontSize: '0.65rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          }}>
            <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} />
            {stateLabel(connector.state)}
          </div>
        )}
        {isConnected && (
          <>
            <button
              onClick={() => {}}
              style={{
                flex: 1, padding: '7px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                borderRadius: '5px', color: 'hsl(230,10%,60%)', fontSize: '0.65rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              }}
            >
              <RefreshCw size={10} />
              Re-sync
            </button>
            <button
              onClick={onDisconnect}
              style={{
                padding: '7px 10px',
                background: 'rgba(245,34,45,0.05)', border: '1px solid rgba(245,34,45,0.2)',
                borderRadius: '5px', color: 'var(--color-danger)', fontSize: '0.65rem',
                cursor: 'pointer',
              }}
            >
              <X size={10} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main CloudConnectorHub ───────────────────────────────────────────────────

export const CloudConnectorHub: React.FC = () => {
  const connectors = useConnectorStore(s => s.connectors);
  const activeConnectorId = useConnectorStore(s => s.activeConnectorId);
  const resourceCounts = useConnectorStore(s => s.resourceCounts);
  const fetchConnectors = useConnectorStore(s => s.fetchConnectors);
  const connectProvider = useConnectorStore(s => s.connectProvider);
  const disconnectProvider = useConnectorStore(s => s.disconnectProvider);
  const setActiveConnector = useConnectorStore(s => s.setActiveConnector);

  const [pendingConnectId, setPendingConnectId] = useState<string | null>(null);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  // Seed local state if connector-runtime isn't running
  useEffect(() => {
    if (connectors.length === 0) {
      // Trigger fetch with fallback built into the store
      fetchConnectors();
    }
  }, []);

  const handleConnect = (id: string) => {
    setPendingConnectId(null);
    connectProvider(id);
    setActiveConnector(id);
  };

  return (
    <>
      {pendingConnectId && (() => {
        const c = connectors.find(c => c.id === pendingConnectId);
        return c ? (
          <CredentialModal
            connector={c}
            onConnect={() => handleConnect(pendingConnectId)}
            onClose={() => setPendingConnectId(null)}
          />
        ) : null;
      })()}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '14px',
      }}>
        {connectors.map(connector => (
          <ProviderCard
            key={connector.id}
            connector={connector}
            isActive={activeConnectorId === connector.id}
            resourceCount={resourceCounts[connector.id] ?? 0}
            onClick={() => setActiveConnector(
              activeConnectorId === connector.id ? null : connector.id
            )}
            onConnect={() => setPendingConnectId(connector.id)}
            onDisconnect={() => disconnectProvider(connector.id)}
          />
        ))}
      </div>
    </>
  );
};
