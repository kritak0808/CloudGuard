"use client";

import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { ShieldAlert, Info, AlertTriangle, ShieldCheck } from 'lucide-react';

export const AlertPanel: React.FC = () => {
  const alerts = useSimulationStore(state => state.alerts);

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert size={16} color="var(--color-danger)" />;
      case 'high':
        return <AlertTriangle size={16} color="var(--color-warning)" />;
      case 'info':
        return <Info size={16} color="var(--color-info)" />;
      case 'safe':
        return <ShieldCheck size={16} color="var(--color-safe)" />;
      default:
        return <Info size={16} color="#fff" />;
    }
  };

  const getAlertBg = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'rgba(245, 34, 45, 0.08)';
      case 'high':
        return 'rgba(250, 173, 20, 0.08)';
      case 'info':
        return 'rgba(24, 144, 255, 0.08)';
      case 'safe':
        return 'rgba(82, 196, 26, 0.08)';
      default:
        return 'rgba(255, 255, 255, 0.03)';
    }
  };

  const getAlertBorder = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'rgba(245, 34, 45, 0.15)';
      case 'high':
        return 'rgba(250, 173, 20, 0.15)';
      case 'info':
        return 'rgba(24, 144, 255, 0.15)';
      case 'safe':
        return 'rgba(82, 196, 26, 0.15)';
      default:
        return 'rgba(255, 255, 255, 0.06)';
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '440px' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={18} color="var(--color-danger)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Security Ingestion Stream</h3>
        </div>
        <span style={{
          fontSize: '0.7rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: 'hsl(230, 10%, 65%)',
          padding: '2px 8px',
          borderRadius: '4px'
        }}>
          {alerts.length} Active {alerts.length === 1 ? 'Event' : 'Events'}
        </span>
      </div>

      {/* Compliance indicators banner */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 20px',
        background: 'rgba(0, 0, 0, 0.15)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {['SOC2', 'PCI-DSS', 'HIPAA', 'ISO27001'].map(framework => {
          const isBreached = alerts.some(a => a.category === 'compliance' && (a.severity === 'critical' || a.severity === 'high'));
          return (
            <div
              key={framework}
              style={{
                flex: 1,
                fontSize: '0.65rem',
                textAlign: 'center',
                padding: '4px',
                borderRadius: '4px',
                background: isBreached ? 'rgba(245, 34, 45, 0.08)' : 'rgba(82, 196, 26, 0.08)',
                border: `1px solid ${isBreached ? 'rgba(245, 34, 45, 0.2)' : 'rgba(82, 196, 26, 0.2)'}`,
                color: isBreached ? 'var(--color-danger)' : 'var(--color-safe)',
                fontWeight: 600
              }}
            >
              {framework}: {isBreached ? 'FAIL' : 'PASS'}
            </div>
          );
        })}
      </div>

      {/* Alert Stream Container */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'rgba(0, 0, 0, 0.08)'
      }}>
        {alerts.map(alert => (
          <div
            key={alert.id}
            style={{
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: getAlertBg(alert.severity),
              border: `1px solid ${getAlertBorder(alert.severity)}`,
              display: 'flex',
              gap: '12px',
              animation: 'float 5s ease-in-out infinite'
            }}
          >
            <div style={{ marginTop: '2px' }}>
              {getAlertIcon(alert.severity)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>
                  {alert.title}
                </h4>
                <span style={{ fontSize: '0.65rem', color: 'hsl(230, 10%, 50%)' }}>{alert.timestamp}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'hsl(230, 10%, 75%)', lineHeight: '1.4' }}>
                {alert.description}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <span style={{
                  fontSize: '0.6.rem',
                  textTransform: 'uppercase',
                  color: 'hsl(230, 10%, 60%)',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
                className='text-[10px]'
                >
                  Target: {alert.resourceId}
                </span>
                <span style={{
                  fontSize: '0.6.rem',
                  textTransform: 'uppercase',
                  color: alert.category === 'iam' ? 'var(--accent-primary)' : alert.category === 'network' ? 'var(--accent-secondary)' : 'var(--color-info)',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
                className='text-[10px]'
                >
                  Category: {alert.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
