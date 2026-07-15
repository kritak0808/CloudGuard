"use client";

import React, { useEffect, useRef } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { 
  Play, 
  CheckCircle2, 
  RotateCcw, 
  Terminal, 
  ShieldCheck, 
  Activity, 
  AlertCircle, 
  Settings,
  Lock,
  Hourglass
} from 'lucide-react';

export const LiveExecutionCenter: React.FC = () => {
  const whatIfActive = useSimulationStore(state => state.whatIfActive);
  const activeScenario = useSimulationStore(state => state.activeScenario);
  
  const autonomousMode = useSimulationStore(state => state.autonomousMode);
  const setAutonomousMode = useSimulationStore(state => state.setAutonomousMode);
  const workflowState = useSimulationStore(state => state.workflowState);
  const currentStepIndex = useSimulationStore(state => state.currentStepIndex);
  const executionLogs = useSimulationStore(state => state.executionLogs);
  
  const triggerPlaybook = useSimulationStore(state => state.triggerPlaybook);
  const deployPlaybookHotfix = useSimulationStore(state => state.deployPlaybookHotfix);
  const triggerRollback = useSimulationStore(state => state.triggerRollback);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll console logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [executionLogs]);

  const modes = [
    { id: 'observe', name: 'Observe' },
    { id: 'recommend', name: 'Recommend' },
    { id: 'guided', name: 'Guided' },
    { id: 'autonomous', name: 'Autonomous' }
  ] as const;

  const playbookSteps = [
    { label: 'Investigate Graph', stepNum: 1 },
    { label: 'Synthesize Patch', stepNum: 2 },
    { label: 'Compliance Audit', stepNum: 3 },
    { label: 'CISO Approval', stepNum: 4 },
    { label: 'Deploy Rollout', stepNum: 5 },
    { label: 'Verify Health', stepNum: 6 },
    { label: 'Sync Genome', stepNum: 7 }
  ];

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: '440px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={18} color="var(--accent-secondary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Autonomous Defense & Execution Center</h3>
        </div>

        {/* Operating Mode Selector */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '1px' }}>
          {modes.map(m => {
            const isSelected = autonomousMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setAutonomousMode(m.id)}
                style={{
                  fontSize: '0.65rem',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  border: 'none',
                  background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: isSelected ? 'var(--accent-secondary)' : 'hsl(230, 10%, 55%)',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer'
                }}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Playbook steps grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', overflowX: 'auto', padding: '10px 0' }}>
        {playbookSteps.map((step, i) => {
          const isDone = currentStepIndex > step.stepNum;
          const isActive = currentStepIndex === step.stepNum;
          const isPending = currentStepIndex < step.stepNum;

          let stepColor = 'hsl(230, 10%, 30%)';
          let borderStyle = '1px solid hsl(230, 10%, 30%)';
          let glow = 'none';

          if (isDone) {
            stepColor = 'var(--color-safe)';
            borderStyle = '1px solid var(--color-safe)';
          } else if (isActive) {
            stepColor = workflowState === 'paused-approval' ? 'var(--color-warning)' : 'var(--accent-primary)';
            borderStyle = workflowState === 'paused-approval' ? '1px solid var(--color-warning)' : '1px solid var(--accent-primary)';
            glow = workflowState === 'paused-approval' ? '0 0 10px var(--color-warning-glow)' : '0 0 10px var(--accent-primary-glow)';
          }

          return (
            <React.Fragment key={step.stepNum}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '70px', opacity: isPending ? 0.4 : 1, transition: 'all 0.3s' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: isActive || isDone ? '#fff' : 'inherit',
                  border: borderStyle,
                  boxShadow: glow,
                  background: isDone ? 'rgba(82, 196, 26, 0.1)' : isActive ? 'rgba(245, 34, 45, 0.1)' : 'transparent'
                }}>
                  {isDone ? <CheckCircle2 size={12} color="var(--color-safe)" /> : step.stepNum}
                </div>
                <div style={{ fontSize: '0.55rem', color: isDone || isActive ? '#fff' : 'hsl(230, 10%, 50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {step.label}
                </div>
              </div>
              {i < playbookSteps.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: isDone ? 'var(--color-safe)' : 'hsl(230, 10%, 30%)',
                  minWidth: '10px'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Terminal logs console */}
      <div style={{
        flex: 1,
        backgroundColor: '#030508',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        overflowY: 'auto',
        minHeight: '140px',
        boxShadow: 'inset 0 0 12px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '6px' }}>
          <Terminal size={12} color="var(--accent-secondary)" />
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'hsl(230, 10%, 60%)' }}>cloudguard-orchestrator-shell</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'hsl(230, 10%, 80%)' }}>
          {executionLogs.length > 0 ? (
            executionLogs.map((log, index) => {
              const isError = log.includes("ERROR") || log.includes("FAIL") || log.includes("Drift");
              const isSuccess = log.includes("SUCCESS") || log.includes("PASS");
              const isInfo = log.includes("INIT") || log.includes("STEP");
              let color = 'inherit';
              if (isError) color = 'var(--color-danger)';
              else if (isSuccess) color = 'var(--color-safe)';
              else if (isInfo) color = 'var(--accent-secondary)';
              
              return (
                <div key={index} style={{ color, wordBreak: 'break-all' }}>
                  $ {log}
                </div>
              );
            })
          ) : (
            <div style={{ color: 'hsl(230, 10%, 40%)', fontStyle: 'italic', padding: '10px 0' }}>
              $ Orchestrator idle. Awaiting playbook execution...
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Orchestration Control Deck */}
      <div>
        {workflowState === 'idle' && (
          <>
            {whatIfActive ? (
              <button
                onClick={() => triggerPlaybook(activeScenario || 'ransomware')}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px var(--accent-primary-glow)'
                }}
              >
                <Play size={12} fill="#fff" />
                Trigger Playbook Mitigation
              </button>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: 'hsl(230, 10%, 50%)'
              }}>
                Awaiting active incident threat simulation to coordinate playbook.
              </div>
            )}
          </>
        )}

        {workflowState === 'running' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'rgba(0,0,0,0.2)',
            fontSize: '0.75rem',
            color: 'var(--accent-primary)'
          }}>
            <Activity size={14} className="pulse-icon" />
            <span>Executing Playbook Steps...</span>
          </div>
        )}

        {workflowState === 'paused-approval' && (
          <div style={{
            border: '1px solid var(--color-warning)',
            borderRadius: '6px',
            padding: '12px',
            background: 'rgba(250, 173, 20, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-warning)', fontWeight: 600 }}>
              <Lock size={14} />
              <span>Governance Gateway Halted (Pending CISO Approval)</span>
            </div>
            <p style={{ fontSize: '0.65rem', color: 'hsl(230, 10%, 65%)', lineHeight: '1.3' }}>
              The playbook has parsed configurations and generated hotfixes. Enterprise policy enforces security and compliance validation sign-off before deployment rollout.
            </p>
            <button
              onClick={deployPlaybookHotfix}
              style={{
                backgroundColor: 'var(--color-safe)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(82, 196, 26, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <ShieldCheck size={12} />
              Approve & Authorize PR Deployment
            </button>
          </div>
        )}

        {workflowState === 'completed' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid var(--color-safe)',
              background: 'rgba(82, 196, 26, 0.05)',
              fontSize: '0.75rem',
              color: 'var(--color-safe)'
            }}>
              <ShieldCheck size={14} />
              <span>Environment Remediation Verified</span>
            </div>
            <button
              onClick={triggerRollback}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '10px 14px',
                color: 'hsl(230, 10%, 65%)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RotateCcw size={12} />
              Rollback
            </button>
          </div>
        )}

        {workflowState === 'rolling-back' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid var(--color-warning)',
            background: 'rgba(0,0,0,0.2)',
            fontSize: '0.75rem',
            color: 'var(--color-warning)'
          }}>
            <Hourglass size={14} className="pulse-icon" />
            <span>Rolling Back Infrastructure...</span>
          </div>
        )}
      </div>
    </div>
  );
};
