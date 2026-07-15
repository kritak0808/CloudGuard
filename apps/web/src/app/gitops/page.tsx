"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDevSecOpsStore } from '../../store/useDevSecOpsStore';
import { useIdentityStore } from '../../store/useIdentityStore';
import {
  ChevronLeft, GitPullRequest, ShieldAlert, CheckCircle2,
  AlertTriangle, RefreshCw, Layers, Award, Fingerprint, Globe, Loader, RotateCcw,
  HardDrive, CheckCircle, XCircle
} from 'lucide-react';

export default function GitOpsPage() {
  const repositories = useDevSecOpsStore(s => s.repositories);
  const pullRequests = useDevSecOpsStore(s => s.pullRequests);
  const pipelines = useDevSecOpsStore(s => s.pipelines);
  const deployments = useDevSecOpsStore(s => s.deployments);
  const validations = useDevSecOpsStore(s => s.validations);
  const rollbacks = useDevSecOpsStore(s => s.rollbacks);
  const knowledgeGraph = useDevSecOpsStore(s => s.knowledgeGraph);

  const fetchDevSecOpsData = useDevSecOpsStore(s => s.fetchDevSecOpsData);
  const triggerPrReview = useDevSecOpsStore(s => s.triggerPrReview);
  const triggerPipelineRun = useDevSecOpsStore(s => s.triggerPipelineRun);
  const promoteDeployment = useDevSecOpsStore(s => s.promoteDeployment);
  const triggerRollback = useDevSecOpsStore(s => s.triggerRollback);
  const validateArtifact = useDevSecOpsStore(s => s.validateArtifact);

  // Identity Store state for context
  const activeSessionId = useIdentityStore(s => s.activeSessionId);
  const simulatedDevice = useIdentityStore(s => s.simulatedDevice);
  const users = useIdentityStore(s => s.users);
  const fetchIdentityData = useIdentityStore(s => s.fetchIdentityData);

  // Tab State
  const [activeTab, setActiveTab] = useState<'prs' | 'pipelines' | 'deployments' | 'rollback' | 'artifacts' | 'graph'>('prs');

  // Input states for new validations
  const [valImageName, setValImageName] = useState('cyberdyne/skynet-agent');
  const [valTag, setValTag] = useState('v1.2.0');
  const [valDigest, setValDigest] = useState('');
  const [valCosign, setValCosign] = useState(true);
  const [valSLSA, setValSLSA] = useState(true);

  // Input states for rollback trigger
  const [selectedDepId, setSelectedDepId] = useState('');
  const [rollbackType, setRollbackType] = useState<'git_revert' | 'terraform_rollback' | 'helm_rollback' | 'k8s_rollout_undo'>('git_revert');
  const [rollbackReason, setRollbackReason] = useState('Security baseline compliance drift identified');

  // Zero Trust Intercept Alerts
  const [ztBlockedReason, setZtBlockedReason] = useState<string | null>(null);

  useEffect(() => {
    fetchDevSecOpsData();
    fetchIdentityData();

    // Listen for global custom events from fetch interceptor
    function handleZTBlock(e: Event) {
      const reason = (e as CustomEvent).detail;
      setZtBlockedReason(reason);
      setTimeout(() => {
        setZtBlockedReason(null);
      }, 7000);
    }
    
    window.addEventListener('zero-trust-block', handleZTBlock);
    return () => {
      window.removeEventListener('zero-trust-block', handleZTBlock);
    };
  }, []);

  useEffect(() => {
    if (deployments.length > 0 && !selectedDepId) {
      const handle = requestAnimationFrame(() => {
        setSelectedDepId(deployments[0].id);
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [deployments, selectedDepId]);

  function handleTriggerReview(id: string) {
    triggerPrReview(id);
  }

  function handleTriggerPipeline(id: string) {
    triggerPipelineRun(id);
  }

  function handlePromote(id: string) {
    promoteDeployment(id);
  }

  function handleExecuteRollback(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDepId) return;
    triggerRollback(selectedDepId, rollbackType, rollbackReason);
    alert('Rollback sequence initiated successfully.');
  }

  function handleValidateArtifactSubmit(e: React.FormEvent) {
    e.preventDefault();
    validateArtifact({
      imageName: valImageName.trim(),
      tag: valTag.trim(),
      digest: valDigest.trim() || undefined,
      cosignSignature: valCosign,
      slsaProvenance: valSLSA
    });
    alert('Artifact signature registry validation complete.');
    setValDigest('');
  }

  const activeUser = users.find(u => {
    const activeSess = useIdentityStore.getState().sessions.find(s => s.sessionId === activeSessionId);
    return activeSess ? activeSess.userId === u.id : false;
  });

  return (
    <div style={{
      minHeight: '100vh',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '1600px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* ── Zero Trust Block Toast ────────────────────────────────────── */}
      {ztBlockedReason && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'rgba(255, 34, 45, 0.95)',
          border: '1px solid rgba(255, 34, 45, 0.4)',
          borderRadius: '8px',
          padding: '16px 20px',
          boxShadow: '0 8px 32px rgba(255,34,45,0.4)',
          backdropFilter: 'var(--glass-blur)',
          display: 'flex',
          gap: '12px',
          maxWidth: '450px',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <ShieldAlert size={20} color="#fff" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Zero Trust Policy Violation
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)', marginTop: '4px', lineHeight: 1.4 }}>
              {ztBlockedReason}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
              CloudGuard Gatekeeper verified: Intercepted (403 Forbidden)
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'hsl(230,10%,55%)', textDecoration: 'none', fontSize: '0.75rem' }}>
          <ChevronLeft size={14} /> Back to Dashboard
        </Link>
        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px var(--accent-primary-glow)',
          }}>
            <GitPullRequest size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              GitOps & Release Orchestrator
            </h1>
            <p style={{ fontSize: '0.65rem', color: 'hsl(230,10%,50%)', margin: 0 }}>
              AI-native DevSecOps control plane. Repository discovery, static analysis gates, artifact signatures, and rollback systems.
            </p>
          </div>
        </div>

        {/* Diagnostic Stat Pills */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '4px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'right' }}>
            <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', display: 'block' }}>Repos Synced</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{repositories.length} Modules</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '4px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'right' }}>
            <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', display: 'block' }}>Deployment Success</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-safe)' }}>98.4%</span>
          </div>
        </div>
      </header>

      {/* ── Active Operator Banner ─────────────────────────────────── */}
      {activeUser && simulatedDevice && (
        <section className="glass-panel" style={{
          padding: '12px 20px',
          background: 'rgba(0, 217, 255, 0.02)',
          border: '1px solid rgba(0, 217, 255, 0.12)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap', gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Fingerprint size={15} color="var(--accent-secondary)" />
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                Simulated Operator Session: <strong style={{ color: 'var(--accent-secondary)' }}>{activeUser.name}</strong> ({activeUser.role})
              </div>
              <div style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)' }}>
                Device Risk Score: {simulatedDevice.riskScore}% | IP: {simulatedDevice.ip} | MFA Status: {simulatedDevice.mfaStatus.toUpperCase()}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/identity" style={{
              padding: '4px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              borderRadius: '4px', color: '#fff', fontSize: '0.58rem', textDecoration: 'none', fontWeight: 600
            }}>
              Adjust Sandbox Context
            </Link>
          </div>
        </section>
      )}

      {/* ── Tabs Content ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', flex: 1, alignItems: 'start' }}>
        
        {/* Navigation Sidebar */}
        <aside className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.6rem', color: 'hsl(230,10%,40%)', fontWeight: 700, paddingLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            DevSecOps Control
          </span>
          <button onClick={() => setActiveTab('prs')} style={getTabStyle(activeTab === 'prs')}>
            <GitPullRequest size={14} /> Pull Request Review
          </button>
          <button onClick={() => setActiveTab('pipelines')} style={getTabStyle(activeTab === 'pipelines')}>
            <Layers size={14} /> Release Pipelines
          </button>
          <button onClick={() => setActiveTab('deployments')} style={getTabStyle(activeTab === 'deployments')}>
            <Globe size={14} /> GitOps Deployments
          </button>
          <button onClick={() => setActiveTab('rollback')} style={getTabStyle(activeTab === 'rollback')}>
            <RotateCcw size={14} /> Rollback Orchestrator
          </button>
          <button onClick={() => setActiveTab('artifacts')} style={getTabStyle(activeTab === 'artifacts')}>
            <Award size={14} /> Artifact Security
          </button>
          <button onClick={() => setActiveTab('graph')} style={getTabStyle(activeTab === 'graph')}>
            <HardDrive size={14} /> Knowledge Graph
          </button>
        </aside>

        {/* Tab Panel Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TAB 1: Pull Request Review */}
          {activeTab === 'prs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Pull Request Intelligence Hub</h2>
                  <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                    Automated security audits and risk calculation delta computed for infrastructure configuration updates.
                  </p>
                </div>

                {pullRequests.map(pr => (
                  <div key={pr.id} style={{
                    background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                    borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.05)', color: 'hsl(230,10%,55%)', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '4px' }}>
                          PR #{pr.number}
                        </span>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>{pr.title}</h3>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.58rem', color: 'hsl(230,10%,45%)', marginTop: '4px' }}>
                          <span>Author: {pr.author}</span>
                          <span>•</span>
                          <span>Branch: {pr.branch}</span>
                          <span>•</span>
                          <span>Status: <strong style={{ color: pr.status === 'open' ? 'var(--accent-secondary)' : 'hsl(230,10%,60%)' }}>{pr.status.toUpperCase()}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.5rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', display: 'block' }}>Risk index</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: pr.riskScore > 60 ? 'var(--color-danger)' : 'var(--color-safe)' }}>
                            {pr.riskScore}%
                          </span>
                        </div>
                        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.5rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', display: 'block' }}>Blast Radius</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: pr.blastRadius === 'critical' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                            {pr.blastRadius.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Diff summaries */}
                    <div style={{ background: '#020406', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize: '0.58rem', color: 'hsl(230,10%,40%)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Infrastructure Diff Summary</div>
                      {pr.diffSummary.map((diff, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', padding: '2px 0' }}>
                          <span style={{ color: 'hsl(230,10%,70%)' }}>{diff.filepath}</span>
                          <span style={{ color: 'var(--color-safe)' }}>+{diff.additions} lines / -{diff.deletions} lines</span>
                        </div>
                      ))}
                    </div>

                    {/* Security and Compliance Delta */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                        <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,40%)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                          Vulnerability Static analysis issues
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {pr.analysis.terraformIssues.map((issue, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '6px', fontSize: '0.62rem', color: 'var(--color-danger)' }}>
                              <ShieldAlert size={11} style={{ marginTop: '2px', flexShrink: 0 }} />
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                        <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,40%)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                          Compliance drift delta
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {pr.complianceDelta.map((c, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem' }}>
                              <span style={{ color: 'hsl(230,10%,70%)' }}>{c.standard}</span>
                              <span style={{ color: 'var(--color-danger)' }}>{c.before.toUpperCase()} ➔ {c.after.toUpperCase()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Narrative & Guidance */}
                    <div style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: '12px' }}>
                      <div style={{ fontSize: '0.58rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>AI Release Engineer summary</div>
                      <p style={{ fontSize: '0.68rem', color: '#fff', marginTop: '4px', lineHeight: 1.4 }}>{pr.narrative}</p>
                      <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,60%)', marginTop: '6px' }}><strong>Guidance:</strong> {pr.guidance}</p>
                    </div>

                    {/* Recommendation and triggers */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '14px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'hsl(230,10%,45%)' }}>AI Recommendation Gate:</span>
                        <span style={{
                          fontSize: '0.6rem', padding: '3px 8px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase',
                          background: pr.aiRecommendation === 'block' ? 'rgba(255,34,45,0.1)' : 'rgba(82,196,26,0.1)',
                          color: pr.aiRecommendation === 'block' ? 'var(--color-danger)' : 'var(--color-safe)'
                        }}>
                          {pr.aiRecommendation === 'block' ? 'BLOCK DEPLOYMENT' : 'APPROVE'}
                        </span>
                      </div>
                      {pr.status === 'open' && (
                        <button
                          onClick={() => handleTriggerReview(pr.id)}
                          style={{
                            padding: '6px 14px', background: 'var(--accent-secondary)', border: 'none', borderRadius: '4px',
                            color: '#000', fontWeight: 700, fontSize: '0.62rem', cursor: 'pointer'
                          }}
                        >
                          Synthesize Auto-Remediation & Approve PR
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            </div>
          )}

          {/* TAB 2: Release Pipelines */}
          {activeTab === 'pipelines' && (
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>CI/CD Release Pipelines</h2>
                <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                  Continuous delivery workflow tracking source ingestion, automated checks, and compliance gates.
                </p>
              </div>

              {pipelines.map(pipe => (
                <div key={pipe.id} style={{
                  background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.05)', color: 'hsl(230,10%,55%)', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '4px' }}>
                        Pipeline ID: {pipe.id}
                      </span>
                      <div style={{ fontSize: '0.58rem', color: 'hsl(230,10%,45%)', marginTop: '4px' }}>
                        Commit: <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{pipe.commitSha}</strong> | Branch: {pipe.branch}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.6rem', padding: '3px 8px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase',
                        background: pipe.status === 'success' ? 'rgba(82,196,26,0.1)' : (pipe.status === 'failed' ? 'rgba(255,34,45,0.1)' : 'rgba(24,144,255,0.1)'),
                        color: pipe.status === 'success' ? 'var(--color-safe)' : (pipe.status === 'failed' ? 'var(--color-danger)' : 'var(--color-info)')
                      }}>
                        {pipe.status.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleTriggerPipeline(pipe.id)}
                        style={{
                          padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                          borderRadius: '4px', color: '#fff', fontSize: '0.55rem', fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <RefreshCw size={10} /> Rerun
                      </button>
                    </div>
                  </div>

                  {/* Pipeline Stage visual workflow */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    {pipe.stages.map((stage, i) => {
                      const isErr = stage.status === 'failed';
                      const isSucc = stage.status === 'success';
                      const isRun = stage.status === 'running';
                      return (
                        <div key={i} style={{
                          background: isSucc ? 'rgba(82,196,26,0.02)' : (isErr ? 'rgba(255,34,45,0.02)' : 'rgba(255,255,255,0.01)'),
                          border: isSucc ? '1px solid rgba(82,196,26,0.2)' : (isErr ? '1px solid rgba(255,34,45,0.2)' : '1px solid var(--border-color)'),
                          borderRadius: '6px', padding: '10px 12px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>{stage.name}</span>
                            {isSucc && <CheckCircle size={11} color="var(--color-safe)" />}
                            {isErr && <XCircle size={11} color="var(--color-danger)" />}
                            {isRun && <Loader className="animate-spin" size={11} color="var(--color-info)" />}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.52rem', color: 'hsl(230,10%,50%)', marginTop: '4px' }}>
                            <span>{stage.status.toUpperCase()}</span>
                            <span>{stage.durationMs > 0 ? `${(stage.durationMs / 1000).toFixed(1)}s` : '-'}</span>
                          </div>
                          {stage.logSnippet && (
                            <pre style={{
                              background: '#000', padding: '6px', borderRadius: '4px', fontSize: '0.48rem',
                              fontFamily: 'var(--font-mono)', color: 'var(--color-danger)', whiteSpace: 'pre-wrap',
                              marginTop: '6px', border: '1px solid rgba(255,255,255,0.01)', maxHeight: '60px', overflowY: 'auto'
                            }}>
                              {stage.logSnippet}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Gates Evaluation list */}
                  <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '14px' }}>
                    <div style={{ fontSize: '0.58rem', color: 'hsl(230,10%,40%)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Security & Compliance Policy Gates</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {pipe.gates.map((gate, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.62rem' }}>
                          {gate.status === 'pass' ? <CheckCircle2 size={12} color="var(--color-safe)" style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertTriangle size={12} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />}
                          <div>
                            <span style={{ fontWeight: 700, color: '#fff' }}>{gate.name}</span>
                            <span style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)', display: 'block', marginTop: '1px' }}>{gate.details}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Commentary */}
                  <div style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: '12px', fontSize: '0.65rem' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>AI COMMENTARY</span>
                    <p style={{ color: '#fff', marginTop: '2px', fontStyle: 'italic', margin: 0 }}>{pipe.aiCommentary}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* TAB 3: GitOps Deployments */}
          {activeTab === 'deployments' && (
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>GitOps Application Status</h2>
                <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                  Sync synchronization status via ArgoCD/Flux and automated post-deployment health verification.
                </p>
              </div>

              {deployments.map(dep => (
                <div key={dep.id} style={{
                  background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Argo Application: {dep.argoAppName || 'default'}</h3>
                      <span style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)' }}>ID: {dep.id} | Environment: {dep.env.toUpperCase()}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.58rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700,
                        background: dep.status === 'healthy' ? 'rgba(82,196,26,0.1)' : (dep.status === 'degraded' ? 'rgba(250,173,20,0.1)' : 'rgba(24,144,255,0.1)'),
                        color: dep.status === 'healthy' ? 'var(--color-safe)' : (dep.status === 'degraded' ? 'var(--color-warning)' : 'var(--color-info)')
                      }}>
                        {dep.status.toUpperCase()}
                      </span>
                      {dep.status !== 'healthy' && (
                        <button
                          onClick={() => handlePromote(dep.id)}
                          style={{
                            padding: '5px 10px', background: 'var(--accent-secondary)', border: 'none',
                            borderRadius: '4px', color: '#000', fontWeight: 700, fontSize: '0.55rem', cursor: 'pointer'
                          }}
                        >
                          Auto Sync Reversion
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Verification Status Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {Object.entries(dep.verificationStatus).map(([key, val]) => {
                      const isOk = val === 'healthy' || val === 'secure' || val === 'pass';
                      return (
                        <div key={key} style={{
                          background: isOk ? 'rgba(82,196,26,0.02)' : 'rgba(255,34,45,0.02)',
                          border: isOk ? '1px solid rgba(82,196,26,0.15)' : '1px solid rgba(255,34,45,0.15)',
                          borderRadius: '4px', padding: '8px', textTransform: 'capitalize'
                        }}>
                          <span style={{ fontSize: '0.5rem', color: 'hsl(230,10%,50%)', display: 'block' }}>{key}</span>
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: isOk ? 'var(--color-safe)' : 'var(--color-danger)' }}>{val}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Deployment logs console */}
                  <div style={{ background: '#000', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,40%)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Deployment Verification Log</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '100px', overflowY: 'auto' }}>
                      {dep.verificationLogs.map((log, idx) => (
                        <div key={idx} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'hsl(230,10%,65%)' }}>{log}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* TAB 4: Rollback Orchestrator */}
          {activeTab === 'rollback' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Automated Rollback Engine</h2>
                  <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                    Revert Git, rollback Helm releases, undo Kubernetes rollouts, or restore databases automatically upon compliance drift detection.
                  </p>
                </div>

                <form onSubmit={handleExecuteRollback} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Target GitOps Deployment</label>
                      <select
                        value={selectedDepId} onChange={e => setSelectedDepId(e.target.value)}
                        style={{ background: '#04070b', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                      >
                        {deployments.map(d => (
                          <option key={d.id} value={d.id}>{d.argoAppName || d.id} ({d.env.toUpperCase()})</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Rollback Action Type</label>
                      <select
                        value={rollbackType} onChange={e => setRollbackType(e.target.value as 'git_revert' | 'terraform_rollback' | 'helm_rollback' | 'k8s_rollout_undo')}
                        style={{ background: '#04070b', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                      >
                        <option value="git_revert">Git Revert (Push code revert)</option>
                        <option value="terraform_rollback">Terraform state rollback (reapply baseline)</option>
                        <option value="helm_rollback">Helm Rollback (Helm rollback release)</option>
                        <option value="k8s_rollout_undo">Kubernetes Rollout Undo (replicas reversion)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Rollback Reason Summary</label>
                    <input
                      type="text" required value={rollbackReason} onChange={e => setRollbackReason(e.target.value)}
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      alignSelf: 'flex-end', padding: '8px 16px', background: 'rgba(255, 34, 45, 0.1)',
                      border: '1px solid rgba(255, 34, 45, 0.3)', borderRadius: '4px', color: 'var(--color-danger)',
                      fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <RotateCcw size={12} /> Trigger Rollback Sequence
                  </button>
                </form>
              </section>

              {/* Rollback Audits log */}
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0 }}>Rollback Audit Trail Logs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {rollbacks.map(r => (
                    <div key={r.id} style={{
                      background: '#020406', border: '1px solid rgba(255,255,255,0.02)',
                      borderRadius: '6px', padding: '12px 14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-danger)' }}>{r.type.toUpperCase()} ({r.status.toUpperCase()})</span>
                        <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)' }}>{new Date(r.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'hsl(230,10%,70%)', margin: '4px 0' }}>Reason: {r.reason}</div>
                      <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)' }}>Initiated by: {r.initiatedBy}</div>

                      {/* Logs console */}
                      <div style={{ background: '#000', padding: '8px', borderRadius: '4px', marginTop: '8px', maxHeight: '110px', overflowY: 'auto' }}>
                        {r.logs.map((log, i) => (
                          <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'hsl(230,10%,60%)' }}>{log}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 5: Artifact Security */}
          {activeTab === 'artifacts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Artifact validations list */}
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Artifact Signature Verification Registry</h2>
                  <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                    Validate container images SBOM hashes and SLSA supply chain provenance certificates.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {validations.map(val => (
                    <div key={val.id} style={{
                      background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                      borderRadius: '6px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>
                          {val.imageName}:{val.tag}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.55rem', color: 'hsl(230,10%,45%)', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span>Cosign Signed: <strong style={{ color: val.cosignSignatureVerified ? 'var(--color-safe)' : 'var(--color-danger)' }}>{val.cosignSignatureVerified ? 'YES' : 'NO'}</strong></span>
                          <span>•</span>
                          <span>SLSA Provenance: <strong style={{ color: val.slsaProvenanceVerified ? 'var(--color-safe)' : 'var(--color-danger)' }}>{val.slsaProvenanceVerified ? 'YES' : 'NO'}</strong></span>
                          <span>•</span>
                          <span>SBOM Matches: <strong style={{ color: val.sbomMatches ? 'var(--color-safe)' : 'var(--color-danger)' }}>{val.sbomMatches ? 'YES' : 'NO'}</strong></span>
                          <span>•</span>
                          <span>CVEs: Critical ({val.cveCount.critical}) High ({val.cveCount.high})</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '0.58rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700,
                          background: val.status === 'approved' ? 'rgba(82,196,26,0.1)' : 'rgba(255,34,45,0.1)',
                          color: val.status === 'approved' ? 'var(--color-safe)' : 'var(--color-danger)'
                        }}>
                          {val.status.toUpperCase()}
                        </span>
                        <div style={{ fontSize: '0.5rem', color: 'hsl(230,10%,45%)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                          Hash: {val.signedAuditHash.substring(0, 10)}...
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Validation Form */}
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0 }}>Verify Container Artifact</h3>
                
                <form onSubmit={handleValidateArtifactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Image Repository Name</label>
                      <input
                        type="text" required value={valImageName} onChange={e => setValImageName(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Image Tag</label>
                      <input
                        type="text" required value={valTag} onChange={e => setValTag(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="checkbox" checked={valCosign} onChange={e => setValCosign(e.target.checked)}
                        id="chkCosign" style={{ accentColor: 'var(--accent-secondary)' }}
                      />
                      <label htmlFor="chkCosign" style={{ fontSize: '0.62rem', color: '#fff', cursor: 'pointer' }}>Verify Cosign Cryptographic Signature</label>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="checkbox" checked={valSLSA} onChange={e => setValSLSA(e.target.checked)}
                        id="chkSLSA" style={{ accentColor: 'var(--accent-secondary)' }}
                      />
                      <label htmlFor="chkSLSA" style={{ fontSize: '0.62rem', color: '#fff', cursor: 'pointer' }}>Verify SLSA supply-chain provenance</label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      alignSelf: 'flex-end', padding: '8px 16px', background: 'var(--accent-secondary)',
                      border: 'none', borderRadius: '4px', color: '#000', fontWeight: 800, fontSize: '0.65rem',
                      cursor: 'pointer'
                    }}
                  >
                    Audit & Verify Image Signatures
                  </button>
                </form>
              </section>
            </div>
          )}

          {/* TAB 6: Knowledge Graph */}
          {activeTab === 'graph' && (
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>DevSecOps Knowledge Graph Integration</h2>
                <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                  Full pedigree mapping repositories, pull requests, pipelines, containers, and active cloud deployment targets.
                </p>
              </div>

              {knowledgeGraph ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', fontWeight: 700 }}>Linked Nodes:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {knowledgeGraph.nodes.map(node => (
                      <div key={node.id} style={{
                        background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                        borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <Layers size={13} color="var(--accent-secondary)" />
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fff' }}>{node.label}</span>
                        </div>
                        <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>({node.group})</span>
                      </div>
                    ))}
                  </div>

                  <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', fontWeight: 700, marginTop: '10px' }}>Mapping Relations:</span>
                  <div style={{ background: '#020406', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {knowledgeGraph.edges.map((edge, i) => (
                      <div key={i} style={{ fontSize: '0.62rem', color: 'hsl(230,10%,70%)', display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{edge.from}</span>
                        <span style={{ color: 'hsl(230,10%,45%)' }}>➔ {edge.relation} ➔</span>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{edge.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'hsl(230,10%,45%)' }}>
                  <Loader className="animate-spin" size={24} style={{ margin: '0 auto 12px' }} />
                  <span style={{ fontSize: '0.7rem' }}>Constructing pedigree graph mapping...</span>
                </div>
              )}
            </section>
          )}

        </div>

      </div>

      {/* Footer */}
      <footer style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.7rem', color: 'hsl(230,10%,40%)',
        padding: '12px 0 24px', borderTop: '1px solid rgba(255,255,255,0.03)'
      }}>
        <div>© 2026 CloudGuard AI Inc. — GitOps Console v1.0</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>DevSecOps Runtime: localhost:4007</span>
          <span>Automatic Signatures Gate</span>
        </div>
      </footer>
    </div>
  );
}

// ─── Style Helpers ────────────────────────────────────────────────────────────

function getTabStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 12px',
    background: active ? 'rgba(123, 66, 188, 0.08)' : 'transparent',
    border: 'none',
    borderLeft: active ? '3px solid var(--accent-primary)' : '3px solid transparent',
    borderRadius: '0 6px 6px 0',
    color: active ? '#fff' : 'hsl(230,10%,65%)',
    fontSize: '0.72rem',
    fontWeight: active ? 700 : 500,
    textAlign: 'left',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s'
  };
}
