"use client";

import React, { useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { 
  Flame, 
  RotateCcw, 
  Activity, 
  FileText, 
  CheckCircle2, 
  Zap, 
  HelpCircle, 
  TrendingUp, 
  Cpu, 
  Key, 
  Network, 
  ShieldAlert 
} from 'lucide-react';

export const PredictiveSecurityEngine: React.FC = () => {
  const whatIfActive = useSimulationStore(state => state.whatIfActive);
  const activeScenario = useSimulationStore(state => state.activeScenario);
  const whatIfPlan = useSimulationStore(state => state.whatIfPlan);
  const triggerWhatIf = useSimulationStore(state => state.triggerWhatIf);
  const clearWhatIf = useSimulationStore(state => state.clearWhatIf);
  
  const runRemediation = useSimulationStore(state => state.runRemediation);
  const remediationPlan = useSimulationStore(state => state.remediationPlan);
  const overallRisk = useSimulationStore(state => state.overallRisk);
  const expectedHops = useSimulationStore(state => state.expectedHops);

  const [customQuery, setCustomQuery] = useState('');

  const scenarios = [
    { id: 'ransomware', name: 'Ransomware Escape', icon: <Cpu size={14} />, desc: 'Simulate container RCE pivot to IAM privileges.' },
    { id: 'credential_theft', name: 'Credential Theft', icon: <Key size={14} />, desc: 'Simulate darknet leaked access key exposures.' },
    { id: 'ingress_leak', name: 'Public Ingress', icon: <Network size={14} />, desc: 'Simulate open port 22 security group drifts.' },
    { id: 's3_exposure', name: 'S3 Data Leak', icon: <ShieldAlert size={14} />, desc: 'Simulate anonymous public bucket reads.' },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery) return;
    
    // Parse query keywords to trigger corresponding simulated scenario
    const q = customQuery.toLowerCase();
    if (q.includes('ransom') || q.includes('escape') || q.includes('pod') || q.includes('rce')) {
      triggerWhatIf('ransomware');
    } else if (q.includes('key') || q.includes('theft') || q.includes('credential') || q.includes('leak')) {
      triggerWhatIf('credential_theft');
    } else if (q.includes('port') || q.includes('ssh') || q.includes('ingress')) {
      triggerWhatIf('ingress_leak');
    } else {
      triggerWhatIf('s3_exposure');
    }
  };

  // Determine delta details
  const blastRadius = whatIfActive ? (activeScenario === 'ransomware' ? '38%' : activeScenario === 'credential_theft' ? '25%' : '12%') : '0%';
  const complianceDrift = whatIfActive ? (activeScenario === 'ingress_leak' ? 'CIS AWS 4.1' : 'SOC2 CC6.1') : 'Compliant';
  const confidenceScore = whatIfActive ? '94%' : '100%';

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Flame size={18} color="var(--color-danger)" className="pulse-icon" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Predictive What-If Security Engine</h3>
        </div>
        {whatIfActive && (
          <button
            onClick={clearWhatIf}
            style={{
              fontSize: '0.7rem',
              color: 'hsl(230, 10%, 65%)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RotateCcw size={10} />
            Reset Reality
          </button>
        )}
      </div>

      {/* Scenarios Preset Selector Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        {scenarios.map(sc => {
          const isSelected = activeScenario === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => triggerWhatIf(sc.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '10px 12px',
                borderRadius: '6px',
                background: isSelected ? 'rgba(245, 34, 45, 0.08)' : 'rgba(0,0,0,0.2)',
                border: isSelected ? '1px solid var(--color-danger)' : '1px solid var(--border-color)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isSelected ? 'var(--color-danger)' : '#fff', fontWeight: 600, fontSize: '0.75rem', marginBottom: '4px' }}>
                {sc.icon}
                {sc.name}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'hsl(230, 10%, 55%)', lineHeight: '1.2' }}>
                {sc.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Simulation Box */}
      <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder='Query reality (e.g. "What if payment-app-iam-role gains wildcard admin permissions?")'
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '0.75rem',
            color: '#fff',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          style={{
            background: 'var(--accent-secondary)',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Predict
        </button>
      </form>

      {/* Simulator Workspace details */}
      {whatIfActive ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '16px', flex: 1, minHeight: 0 }}>
          {/* Left Column: Executive Impact Delta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.75rem', color: 'hsl(230, 10%, 55%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Projected Security Deltas
            </h4>

            {/* Impact Metric Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Risk Gauge */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'hsl(230, 10%, 50%)', textTransform: 'uppercase' }}>Projected Risk Score</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-danger)', fontWeight: 600 }}>{overallRisk}% (CRITICAL)</div>
                </div>
                <TrendingUp size={16} color="var(--color-danger)" />
              </div>

              {/* Blast Radius */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'hsl(230, 10%, 50%)', textTransform: 'uppercase' }}>Simulated Blast Radius</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-warning)', fontWeight: 600 }}>{blastRadius} of nodes affected</div>
                </div>
                <HelpCircle size={16} color="var(--color-warning)" />
              </div>

              {/* Compliance Drift */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'hsl(230, 10%, 50%)', textTransform: 'uppercase' }}>Compliance Drift</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-warning)', fontWeight: 600 }}>{complianceDrift} Breach</div>
                </div>
                <ShieldAlert size={16} color="var(--color-warning)" />
              </div>
            </div>
          </div>

          {/* Right Column: Remediation hotfix patch synthesis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
            {whatIfPlan && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'hsl(230, 10%, 65%)' }}>
                  <FileText size={12} />
                  <span>Synthesized Hotfix: <code>{whatIfPlan.diffs[0]?.filepath}</code></span>
                </div>
                {/* Scrollable code diff container */}
                <div style={{
                  flex: 1,
                  background: '#04060a',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  overflow: 'auto',
                  whiteSpace: 'pre',
                  lineHeight: '1.4'
                }}>
                  {whatIfPlan.diffs[0]?.modified.split('\n').map((line, i) => {
                    const isAdded = line.startsWith('+');
                    const isRemoved = line.startsWith('-');
                    const color = isAdded ? '#389e0d' : isRemoved ? '#cf1322' : 'inherit';
                    const bgColor = isAdded ? 'rgba(56, 158, 13, 0.15)' : isRemoved ? 'rgba(207, 19, 34, 0.15)' : 'transparent';
                    return (
                      <div key={i} style={{ color, backgroundColor: bgColor, padding: '0 4px' }}>
                        {line}
                      </div>
                    );
                  })}
                </div>

                {/* Apply Hotfix trigger */}
                <button
                  onClick={runRemediation}
                  disabled={remediationPlan.deployed}
                  style={{
                    backgroundColor: remediationPlan.deployed ? 'rgba(255,255,255,0.05)' : 'var(--accent-primary)',
                    color: remediationPlan.deployed ? 'hsl(230, 10%, 50%)' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: remediationPlan.deployed ? 'not-allowed' : 'pointer',
                    boxShadow: remediationPlan.deployed ? 'none' : '0 0 12px var(--accent-primary-glow)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {remediationPlan.deployed ? (
                    <>
                      <CheckCircle2 size={14} color="var(--color-safe)" />
                      Reality Corrected (Remediation Deployed)
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Apply Predictive Hotfix
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'hsl(230, 10%, 45%)', padding: '20px', minHeight: '180px' }}>
          <Activity size={32} className="pulse-icon" style={{ opacity: 0.3, marginBottom: '4px' }} />
          <div style={{ fontSize: '0.8rem', textAlign: 'center' }}>
            No active pre-deployment simulation.
          </div>
          <div style={{ fontSize: '0.65rem', textAlign: 'center', maxWidth: '280px', lineHeight: '1.3' }}>
            Trigger a What-If scenario above or query natural language inputs to analyze security blast radius and synthesize hotfixes before production deployments.
          </div>
        </div>
      )}
    </div>
  );
};
