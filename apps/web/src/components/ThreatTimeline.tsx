"use client";

import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { ShieldCheck, Flame, RotateCcw } from 'lucide-react';

export const ThreatTimeline: React.FC = () => {
  const phase = useSimulationStore(state => state.phase);
  const setPhase = useSimulationStore(state => state.setPhase);
  const overallRisk = useSimulationStore(state => state.overallRisk);
  const expectedHops = useSimulationStore(state => state.expectedHops);
  const resetSimulation = useSimulationStore(state => state.resetSimulation);

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Simulation Dashboard Header & Gauges */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Predictive Security Timeline</h3>
          <p style={{ fontSize: '0.75rem', color: 'hsl(230, 10%, 55%)' }}>
            Scrub the temporal track to simulate prospective deployments.
          </p>
        </div>

        {/* Real-time stats */}
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Risk Score Stat */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            minWidth: '150px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: overallRisk > 50 ? 'var(--color-danger)' : 'var(--color-safe)',
              boxShadow: overallRisk > 50 
                ? '0 0 10px var(--color-danger)' 
                : '0 0 10px var(--color-safe)',
            }} />
            <div>
              <div style={{ fontSize: '0.65rem', color: 'hsl(230, 10%, 50%)', textTransform: 'uppercase' }}>Overall Risk Score</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                {overallRisk}%
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 500, 
                  marginLeft: '4px',
                  color: overallRisk > 50 ? 'var(--color-danger)' : 'var(--color-safe)'
                }}>
                  {overallRisk > 50 ? '▲ High Risk' : '✓ Secure'}
                </span>
              </div>
            </div>
          </div>

          {/* Hops to Compromise Stat */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            minWidth: '160px'
          }}>
            <ShieldCheck size={18} color={expectedHops < 5 ? 'var(--color-danger)' : 'var(--color-safe)'} />
            <div>
              <div style={{ fontSize: '0.65rem', color: 'hsl(230, 10%, 50%)', textTransform: 'uppercase' }}>Attack Path Length</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                {expectedHops} Hops
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 500, 
                  marginLeft: '4px',
                  color: expectedHops < 5 ? 'var(--color-danger)' : 'var(--color-safe)'
                }}>
                  {expectedHops < 5 ? '▼ Direct Access' : '▲ Isolated'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrub timeline slider track */}
      <div style={{
        position: 'relative',
        height: '8px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px',
        margin: '20px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Active timeline filler */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: phase === 'current' ? '100%' : '0%',
          height: '100%',
          background: phase === 'future' 
            ? 'linear-gradient(90deg, var(--accent-primary) 0%, var(--color-danger) 100%)' 
            : 'var(--accent-primary)',
          borderRadius: '4px',
          transition: 'all var(--transition-slow)'
        }} />

        {/* Timeline Node 1: Current State */}
        <div 
          onClick={() => setPhase('current')}
          style={{
            position: 'absolute',
            left: '0%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            zIndex: 2
          }}
        >
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: phase === 'current' ? '#fff' : 'var(--bg-base)',
            border: `3px solid ${phase === 'current' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
            boxShadow: phase === 'current' ? '0 0 10px var(--accent-primary-glow)' : 'none',
            transition: 'all var(--transition-normal)',
            marginBottom: '6px'
          }} />
          <span style={{
            fontSize: '0.75rem',
            fontWeight: phase === 'current' ? 600 : 400,
            color: phase === 'current' ? '#fff' : 'hsl(230, 10%, 55%)'
          }}>
            Current State
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-safe)' }}>Production (Baseline)</span>
        </div>

        {/* Timeline Node 2: Tomorrow's Deployment */}
        <div 
          onClick={() => setPhase('future')}
          style={{
            position: 'absolute',
            right: '0%',
            transform: 'translateX(50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            zIndex: 2
          }}
        >
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: (phase === 'future' || phase === 'remediated' || phase === 'remediating') ? '#fff' : 'var(--bg-base)',
            border: `3px solid ${(phase === 'future' || phase === 'remediating') ? 'var(--color-danger)' : phase === 'remediated' ? 'var(--color-safe)' : 'var(--border-color)'}`,
            boxShadow: (phase === 'future' || phase === 'remediating') ? '0 0 10px var(--color-danger-glow)' : phase === 'remediated' ? '0 0 10px var(--color-safe-glow)' : 'none',
            transition: 'all var(--transition-normal)',
            marginBottom: '6px'
          }} />
          <span style={{
            fontSize: '0.75rem',
            fontWeight: (phase === 'future' || phase === 'remediated') ? 600 : 400,
            color: (phase === 'future' || phase === 'remediated') ? '#fff' : 'hsl(230, 10%, 55%)'
          }}>
            Simulated PR-402
          </span>
          <span style={{ 
            fontSize: '0.65rem', 
            color: phase === 'remediated' ? 'var(--color-safe)' : 'var(--color-warning)',
            fontWeight: 500
          }}>
            {phase === 'remediated' ? 'Self-Healed' : "Tomorrow's Deploy"}
          </span>
        </div>
      </div>

      {/* Quick control buttons */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {phase === 'future' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'var(--color-danger)',
              background: 'rgba(245, 34, 45, 0.08)',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid hsla(355, 85%, 53%, 0.15)'
            }}>
              <Flame size={12} />
              <span>Risk Critical: Wildcard IAM & Open Port detected.</span>
            </div>
          )}
          {phase === 'current' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'var(--color-safe)',
              background: 'rgba(82, 196, 26, 0.08)',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid hsla(145, 80%, 45%, 0.15)'
            }}>
              <ShieldCheck size={12} />
              <span>Security Baseline Verified. 0 Anomalies.</span>
            </div>
          )}
          {phase === 'remediated' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'var(--color-safe)',
              background: 'rgba(82, 196, 26, 0.08)',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid hsla(145, 80%, 45%, 0.15)'
            }}>
              <ShieldCheck size={12} />
              <span>Self-Healing Completed. Attacks path terminated.</span>
            </div>
          )}
        </div>

        <button
          onClick={resetSimulation}
          disabled={phase === 'current'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: phase === 'current' ? 'hsl(230, 10%, 40%)' : '#fff',
            backgroundColor: phase === 'current' ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${phase === 'current' ? 'transparent' : 'var(--border-color)'}`,
            cursor: phase === 'current' ? 'not-allowed' : 'pointer'
          }}
        >
          <RotateCcw size={12} />
          Reset Simulation
        </button>
      </div>
    </div>
  );
};
