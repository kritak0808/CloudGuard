"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Terminal, GitCommit, ShieldAlert, CheckCircle, Code } from 'lucide-react';

export const SecurityCopilotCanvas: React.FC = () => {
  const phase = useSimulationStore(state => state.phase);
  const chatMessages = useSimulationStore(state => state.chatMessages);
  const remediationPlan = useSimulationStore(state => state.remediationPlan);
  const runRemediation = useSimulationStore(state => state.runRemediation);
  
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const isConsensusReached = chatMessages.length >= 6;

  // Auto scroll terminal logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [remediationPlan.deploymentLogs]);

  // Reset file selection when phase resets
  useEffect(() => {
    if (phase === 'current') {
      const handle = requestAnimationFrame(() => {
        setActiveFileIndex(0);
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [phase]);

  const activeDiff = remediationPlan.diffs[activeFileIndex];

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
          <Terminal size={18} color="var(--accent-secondary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Security Copilot Canvas</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            color: phase === 'remediated' 
              ? 'var(--color-safe)' 
              : phase === 'remediating' 
              ? 'var(--color-warning)'
              : isConsensusReached && phase === 'future'
              ? 'var(--color-danger)'
              : 'hsl(230, 10%, 50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {phase === 'remediated' ? 'SYS_SYNCHRONIZED' : phase === 'remediating' ? 'APPLYING_HOTFIX' : isConsensusReached ? 'REMEDIATION_READY' : 'MONITORING'}
          </span>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* State A: Current (Secure State) */}
        {phase === 'current' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: 'hsl(230, 10%, 45%)',
            gap: '12px',
            textAlign: 'center',
            padding: '20px'
          }}>
            <CheckCircle size={32} strokeWidth={1.5} color="var(--color-safe)" />
            <div>
              <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>No Action Required</div>
              <p style={{ fontSize: '0.75rem', marginTop: '4px', maxWidth: '300px' }}>
                All cloud configurations conform to approved Infrastructure-as-Code definitions.
              </p>
            </div>
          </div>
        )}

        {/* State B: Future (Vulnerable State, analyzing) */}
        {phase === 'future' && !isConsensusReached && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: 'hsl(230, 10%, 55%)',
            gap: '12px',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div className="pulse-violet" style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(114, 46, 209, 0.1)',
              border: '1px solid var(--accent-primary)'
            }}>
              <Code size={18} color="var(--accent-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>Synthesizing Remediation Plan</div>
              <p style={{ fontSize: '0.75rem', marginTop: '4px', maxWidth: '280px' }}>
                Awaiting AI Security Council consensus to reconcile Terraform schemas.
              </p>
            </div>
          </div>
        )}

        {/* State C: Future (Consensus Reached, Diff ready to review) */}
        {phase === 'future' && isConsensusReached && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Remediation Info Header */}
            <div style={{ padding: '16px 20px', background: 'rgba(245, 34, 45, 0.04)', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ShieldAlert size={16} color="var(--color-danger)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Proposed Self-Healing Resolution</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'hsl(230, 10%, 70%)', lineHeight: '1.4' }}>
                {remediationPlan.description}
              </p>
            </div>

            {/* Diffs file select tabs */}
            <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.2)', borderBottom: '1px solid var(--border-color)', padding: '0 10px' }}>
              {remediationPlan.diffs.map((diff, i) => (
                <button
                  key={diff.filepath}
                  onClick={() => setActiveFileIndex(i)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '0.75rem',
                    color: activeFileIndex === i ? '#fff' : 'hsl(230, 10%, 55%)',
                    background: activeFileIndex === i ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    borderBottom: activeFileIndex === i ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    fontWeight: activeFileIndex === i ? 600 : 400,
                  }}
                >
                  {diff.filepath.split('/').pop()}
                </button>
              ))}
            </div>

            {/* Code Diff Display */}
            {activeDiff && (
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                gap: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem'
              }}>
                {/* Original column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ color: 'var(--color-danger)', borderBottom: '1px solid rgba(245, 34, 45, 0.2)', paddingBottom: '4px', marginBottom: '8px', fontWeight: 600 }}>
                    - Original Configuration
                  </div>
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    color: 'hsla(230, 10%, 80%, 0.6)',
                    background: 'rgba(245, 34, 45, 0.03)',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(245, 34, 45, 0.1)',
                    lineHeight: '1.4'
                  }}>
                    {activeDiff.original}
                  </pre>
                </div>

                {/* Modified column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ color: 'var(--color-safe)', borderBottom: '1px solid rgba(82, 196, 26, 0.2)', paddingBottom: '4px', marginBottom: '8px', fontWeight: 600 }}>
                    + Self-Healed Configuration
                  </div>
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    color: 'hsl(230, 10%, 90%)',
                    background: 'rgba(82, 196, 26, 0.04)',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(82, 196, 26, 0.15)',
                    lineHeight: '1.4'
                  }}>
                    {activeDiff.modified}
                  </pre>
                </div>
              </div>
            )}

            {/* Deploy Trigger Section */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--border-color)',
              background: 'rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'hsl(230, 10%, 65%)' }}>
                Secure, cryptographic signature will be attached on deploy.
              </span>
              <button
                onClick={runRemediation}
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, #822ed1 100%)',
                  boxShadow: '0 0 12px var(--accent-primary-glow)',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <GitCommit size={14} />
                Approve & Deploy Self-Healing Plan
              </button>
            </div>
          </div>
        )}

        {/* State D: Remediating (Terminal runner logs) */}
        {phase === 'remediating' && (
          <div style={{
            flex: 1,
            background: '#040711',
            padding: '20px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'hsl(186, 90%, 50%)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(186, 90, 50, 0.15)', paddingBottom: '8px', marginBottom: '12px' }}>
              <span className="pulse-icon" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }} />
              <span style={{ color: 'hsl(230, 10%, 60%)' }}>Autonomous Pipeline Execution Console</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {remediationPlan.deploymentLogs.map((log, index) => (
                <div key={index} style={{
                  color: (log && log.startsWith('✅')) ? 'var(--color-safe)' : (log && log.startsWith('⚡')) ? 'var(--accent-primary)' : 'hsl(230, 10%, 80%)',
                  lineHeight: '1.4'
                }}>
                  {log || ''}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        )}

        {/* State E: Remediated (Success display) */}
        {phase === 'remediated' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: 'hsl(230, 10%, 90%)',
            gap: '16px',
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <div className="pulse-cyan" style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(82, 196, 26, 0.1)',
              border: '1px solid var(--color-safe)'
            }}>
              <CheckCircle size={24} color="var(--color-safe)" />
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, marginBottom: '6px' }}>
                Self-Healing Plan Applied Successfully
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'hsl(230, 10%, 65%)', maxWidth: '380px', margin: '0 auto', lineHeight: '1.45' }}>
                The EKS Security group public ingress policies have been terminated. Wildcard policies have been revoked and replaced with secure target S3 actions. Attack path checks show zero risk paths remain.
              </p>
            </div>

            {/* Sync metrics banner */}
            <div style={{
              display: 'flex',
              gap: '24px',
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.65rem', color: 'hsl(230, 10%, 50%)' }}>RECONCILED ACTIONS</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-safe)' }}>2 Git Commits Pushed</div>
              </div>
              <div style={{ width: '1px', background: 'var(--border-color)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.65rem', color: 'hsl(230, 10%, 50%)' }}>NEW ATTACK HOP COUNT</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-safe)' }}>7 Hops (Secure)</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
