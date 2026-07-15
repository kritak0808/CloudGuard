"use client";

import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

interface DiscoveryTerminalProps {
  logs: string[];
  providerId: string;
  resourceCount?: number;
  isActive?: boolean;
}

export const DiscoveryTerminal: React.FC<DiscoveryTerminalProps> = ({
  logs,
  providerId,
  resourceCount = 0,
  isActive = false,
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  function getLogColor(log: string): string {
    if (log.includes('[COMPLETE]')) return 'var(--color-safe)';
    if (log.includes('[WARNING]') || log.includes('[DRIFT]')) return 'var(--color-warning)';
    if (log.includes('critical') || log.includes('CRITICAL') || log.includes('CVE')) return 'var(--color-danger)';
    if (log.includes('[AUTH]') || log.includes('[INIT]')) return 'var(--accent-secondary)';
    if (log.includes('[AI]') || log.includes('[GENOME]') || log.includes('[NORMALIZE]')) return 'var(--accent-primary)';
    return 'hsl(230, 10%, 75%)';
  }

  function getLogPrefix(log: string): string {
    const match = log.match(/^\[([A-Z_]+)\]/);
    return match ? match[1] : 'LOG';
  }

  return (
    <div style={{
      background: '#030508',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100%',
    }}>
      {/* Terminal header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }} />
          </div>
          <Terminal size={12} color="var(--accent-secondary)" />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'hsl(230, 10%, 55%)'
          }}>
            cloudguard-discovery — {providerId}
          </span>
        </div>
        {resourceCount > 0 && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'var(--accent-secondary)',
            background: 'rgba(0, 217, 255, 0.08)',
            padding: '2px 8px',
            borderRadius: '3px',
            border: '1px solid rgba(0, 217, 255, 0.15)',
          }}>
            {resourceCount.toLocaleString()} resources
          </div>
        )}
      </div>

      {/* Log output */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.62rem',
      }}>
        {logs.length === 0 ? (
          <div style={{ color: 'hsl(230, 10%, 35%)', fontStyle: 'italic', paddingTop: '8px' }}>
            {isActive ? '$ Initiating connection...' : '$ Awaiting discovery initialization...'}
          </div>
        ) : (
          logs.map((log, i) => {
            const color = getLogColor(log);
            const isComplete = log.includes('[COMPLETE]');
            return (
              <div key={i} style={{
                display: 'flex',
                gap: '8px',
                color,
                lineHeight: '1.5',
                background: isComplete ? 'rgba(82, 196, 26, 0.05)' : 'transparent',
                padding: isComplete ? '3px 6px' : '0',
                borderRadius: isComplete ? '3px' : '0',
              }}>
                <span style={{ color: 'hsl(230,10%,35%)', flexShrink: 0 }}>$</span>
                <span style={{ wordBreak: 'break-word' }}>{log}</span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};
