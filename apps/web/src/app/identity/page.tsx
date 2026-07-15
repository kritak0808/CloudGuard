"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useIdentityStore } from '../../store/useIdentityStore';
import {
  ShieldAlert, ChevronLeft, Calendar, FileText, CheckSquare, Clock, Users,
  Activity, Play, Pause, Award, Key, Copy, Download, User, ArrowRight,
  Loader, CheckCircle2, AlertTriangle, Shield, Check, FileCheck, Circle,
  Fingerprint, KeyRound, Globe, FileSignature, Settings, ShieldCheck, HelpCircle, UserPlus, Info,
  Database, RefreshCw, Trash2, Eye, ShieldCheck as LockIcon, Lock
} from 'lucide-react';
import type { ABACPolicy, TenantIsolationProfile, UserAccount, ApiKeyProfile, ServiceAccount, DirectoryNode, ComplianceEvidence } from '@cloudguard/types';

export default function IdentityPage() {
  const tenants = useIdentityStore(s => s.tenants);
  const activeTenant = useIdentityStore(s => s.activeTenant);
  const users = useIdentityStore(s => s.users);
  const sessions = useIdentityStore(s => s.sessions);
  const apiKeys = useIdentityStore(s => s.apiKeys);
  const serviceAccounts = useIdentityStore(s => s.serviceAccounts);
  const policies = useIdentityStore(s => s.policies);
  const auditLogs = useIdentityStore(s => s.auditLogs);
  const directory = useIdentityStore(s => s.directory);
  const config = useIdentityStore(s => s.config);
  const complianceEvidence = useIdentityStore(s => s.complianceEvidence);
  const isLoading = useIdentityStore(s => s.isLoading);

  // Simulated Operator context state
  const activeSessionId = useIdentityStore(s => s.activeSessionId);
  const activeEnvironment = useIdentityStore(s => s.activeEnvironment);
  const simulatedDevice = useIdentityStore(s => s.simulatedDevice);

  // Actions
  const fetchIdentityData = useIdentityStore(s => s.fetchIdentityData);
  const switchTenant = useIdentityStore(s => s.switchTenant);
  const terminateSession = useIdentityStore(s => s.terminateSession);
  const upsertPolicy = useIdentityStore(s => s.upsertPolicy);
  const deletePolicy = useIdentityStore(s => s.deletePolicy);
  const provisionSCIM = useIdentityStore(s => s.provisionSCIM);
  const setSimulatedOperator = useIdentityStore(s => s.setSimulatedOperator);
  const setDeviceRiskScore = useIdentityStore(s => s.setDeviceRiskScore);
  const setMfaStatus = useIdentityStore(s => s.setMfaStatus);
  const setEnvironment = useIdentityStore(s => s.setEnvironment);
  const updateBYOK = useIdentityStore(s => s.updateBYOK);
  const setLegalHold = useIdentityStore(s => s.setLegalHold);
  const triggerRightToErasure = useIdentityStore(s => s.triggerRightToErasure);
  const createApiKey = useIdentityStore(s => s.createApiKey);
  const revokeApiKey = useIdentityStore(s => s.revokeApiKey);
  const createServiceAccount = useIdentityStore(s => s.createServiceAccount);
  const rotateServiceAccount = useIdentityStore(s => s.rotateServiceAccount);
  const updateConfig = useIdentityStore(s => s.updateConfig);
  const exportComplianceEvidence = useIdentityStore(s => s.exportComplianceEvidence);

  // UI state
  const [activeTab, setActiveTab] = useState<'sandbox' | 'policies' | 'directory' | 'apikeys' | 'isolation' | 'compliance' | 'settings'>('sandbox');
  const [copiedSignId, setCopiedSignId] = useState<string | null>(null);
  const [scimCSV, setScimCSV] = useState(
    `name,email,role,department,businessUnit\nSarah Connor,s.connor@cyberdyne.io,Incident Commander,SecOps,Defense Systems\nJohn Connor,j.connor@cyberdyne.io,Cloud Administrator,Platform Engineering,Core Infra\nKyle Reese,k.reese@cyberdyne.io,Security Analyst,SecOps,Defense Systems`
  );

  // New Policy form state
  const [newPolName, setNewPolName] = useState('');
  const [newPolType, setNewPolType] = useState<'connectors' | 'scanners' | 'evidence' | 'remediation' | 'executive_reports' | 'memory' | 'api_usage'>('remediation');
  const [newPolRoles, setNewPolRoles] = useState('Incident Commander, Platform Owner');
  const [newPolDept, setNewPolDept] = useState('SecOps');
  const [newPolEnv, setNewPolEnv] = useState('production');
  const [newPolRisk, setNewPolRisk] = useState(30);

  // API Key Form State
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState('connectors:write');

  // Service Account Form State
  const [newSAName, setNewSAName] = useState('');
  const [newSAScope, setNewSAScope] = useState('remediation:execute');

  // BYOK Form State
  const [byokArnInput, setByokArnInput] = useState('');

  // Right to Erasure Form State
  const [erasureEmail, setErasureEmail] = useState('');

  // Branding Custom Colors State
  const [primaryBrandingColor, setPrimaryBrandingColor] = useState('#7B42BC');
  const [orgBrandingName, setOrgBrandingName] = useState('Cyberdyne Systems Research');
  const [customDomainInput, setCustomDomainInput] = useState('cloudguard.cyberdyne.io');

  // Zero Trust Intercept Alerts
  const [ztBlockedReason, setZtBlockedReason] = useState<string | null>(null);

  useEffect(() => {
    fetchIdentityData();
    
    // Listen for global custom events from fetch interceptor
    function handleZTBlock(e: Event) {
      const reason = (e as CustomEvent).detail;
      setZtBlockedReason(reason);
      // Auto close after 6 seconds
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
    if (activeTenant) {
      const handle = requestAnimationFrame(() => {
        setByokArnInput(activeTenant.byokArn || '');
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [activeTenant]);

  useEffect(() => {
    if (config) {
      const handle = requestAnimationFrame(() => {
        setPrimaryBrandingColor(config.branding.primaryColor);
        setOrgBrandingName(config.branding.orgName);
        setCustomDomainInput(config.customDomain);
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [config]);

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedSignId(id);
    setTimeout(() => setCopiedSignId(null), 1500);
  }

  function handleUpsertPolicySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPolName.trim()) return;

    const policy: ABACPolicy = {
      id: `pol-${Date.now()}`,
      name: newPolName.trim(),
      resourceType: newPolType,
      effect: 'allow',
      conditions: {
        roles: newPolRoles.split(',').map(r => r.trim()).filter(r => r !== ''),
        departments: newPolDept.split(',').map(d => d.trim()).filter(d => d !== ''),
        environments: newPolEnv.split(',').map(ev => ev.trim()).filter(ev => ev !== ''),
        maxRiskLevel: Number(newPolRisk)
      }
    };

    upsertPolicy(policy);
    setNewPolName('');
  }

  function handleSCIMSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scimCSV.trim()) return;
    provisionSCIM(scimCSV.trim());
    alert('SCIM CSV payload uploaded and synced successfully.');
  }

  function handleCreateApiKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    createApiKey(newKeyName.trim(), newKeyScope);
    setNewKeyName('');
  }

  function handleCreateSA(e: React.FormEvent) {
    e.preventDefault();
    if (!newSAName.trim()) return;
    createServiceAccount(newSAName.trim(), newSAScope);
    setNewSAName('');
  }

  function handleBYOKSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!byokArnInput.trim()) return;
    updateBYOK(byokArnInput.trim());
    alert('KMS BYOK Key ARN registered successfully.');
  }

  function handleErasureSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!erasureEmail.trim()) return;
    triggerRightToErasure(erasureEmail.trim());
    alert(`Right to Erasure compliance request initiated for: ${erasureEmail}. Personal context purged.`);
    setErasureEmail('');
  }

  function handleSettingsSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateConfig({
      branding: {
        primaryColor: primaryBrandingColor,
        orgName: orgBrandingName
      },
      customDomain: customDomainInput
    });
    alert('Branding and Enterprise Settings synchronized.');
  }

  // Helper to render Directory Tree Node recursively
  function renderDirectoryTree(node: DirectoryNode) {
    return <DirectoryTreeNodeView key={node.id} node={node} />;
  }

  const activeUser = users.find(u => {
    const activeSess = sessions.find(s => s.sessionId === activeSessionId);
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
              Access Denied by Policy
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)', marginTop: '4px', lineHeight: 1.4 }}>
              {ztBlockedReason}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
              Zero Trust Gate verified: Rejected (403 Forbidden)
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
            background: `linear-gradient(135deg, ${primaryBrandingColor}, var(--accent-secondary))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 12px ${primaryBrandingColor}55`,
          }}>
            <Fingerprint size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              {orgBrandingName} Identity Console
            </h1>
            <p style={{ fontSize: '0.65rem', color: 'hsl(230,10%,50%)', margin: 0 }}>
              Enterprise Directory isolation, custom BYOK encryption, and Zero Trust runtime validation gates.
            </p>
          </div>
        </div>

        {/* Global Env Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '4px 10px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', fontWeight: 600 }}>Active Env:</span>
          <select
            value={activeEnvironment}
            onChange={e => setEnvironment(e.target.value)}
            style={{
              background: 'none', border: 'none', color: '#fff', fontSize: '0.7rem', fontWeight: 700,
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="production" style={{ background: '#080c10', color: '#fff' }}>Production</option>
            <option value="staging" style={{ background: '#080c10', color: '#fff' }}>Staging</option>
            <option value="development" style={{ background: '#080c10', color: '#fff' }}>Development</option>
          </select>
        </div>

        {/* Multi-Tenant Switcher */}
        {activeTenant && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '4px 10px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', fontWeight: 600 }}>Tenant Isolation:</span>
            <select
              value={activeTenant.tenantId}
              onChange={e => switchTenant(e.target.value)}
              style={{
                background: 'none', border: 'none', color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                outline: 'none', cursor: 'pointer',
              }}
            >
              {tenants.map(t => (
                <option key={t.tenantId} value={t.tenantId} style={{ background: '#080c10', color: '#fff' }}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* ── Active Tenant Diagnostic Banner ──────────────────────── */}
      {activeTenant && (
        <section className="glass-panel" style={{
          padding: '12px 20px',
          background: 'rgba(123, 66, 188, 0.03)',
          border: '1px solid rgba(123, 66, 188, 0.15)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap', gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <KeyRound size={15} color="var(--accent-secondary)" />
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                KMS Registry: {activeTenant.name} ({activeTenant.tenantId})
              </div>
              <div style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)', fontFamily: 'var(--font-mono)' }}>
                BYOK Key ARN: {activeTenant.byokArn || 'UNCONFIGURED (DEFAULT)'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.5rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', display: 'block' }}>Database isolated</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-safe)' }}>
                {activeTenant.databaseIsolated ? 'VERIFIED SEPARATE CONTEXT' : 'SHARED'}
              </span>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.5rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', display: 'block' }}>Legal Hold</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: activeTenant.isolation?.legalHoldActive ? 'var(--color-warning)' : 'hsl(230,10%,60%)' }}>
                {activeTenant.isolation?.legalHoldActive ? 'ACTIVE HOLD' : 'INACTIVE'}
              </span>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.5rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', display: 'block' }}>Retention Policy</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff' }}>
                {activeTenant.retentionDays} Days
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Main Layout Body ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', flex: 1, alignItems: 'start' }}>
        
        {/* Navigation Sidebar */}
        <aside className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.6rem', color: 'hsl(230,10%,40%)', fontWeight: 700, paddingLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Identity Settings
          </span>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={activeTab === 'sandbox' ? 'active-tab' : 'tab'}
            style={getTabStyle(activeTab === 'sandbox')}
          >
            <Fingerprint size={14} /> Zero Trust Sandbox
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={activeTab === 'policies' ? 'active-tab' : 'tab'}
            style={getTabStyle(activeTab === 'policies')}
          >
            <ShieldCheck size={14} /> ABAC Policies ({policies.length})
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={activeTab === 'directory' ? 'active-tab' : 'tab'}
            style={getTabStyle(activeTab === 'directory')}
          >
            <Globe size={14} /> Organization Directory
          </button>
          <button
            onClick={() => setActiveTab('apikeys')}
            className={activeTab === 'apikeys' ? 'active-tab' : 'tab'}
            style={getTabStyle(activeTab === 'apikeys')}
          >
            <KeyRound size={14} /> API Keys & service accounts
          </button>
          <button
            onClick={() => setActiveTab('isolation')}
            className={activeTab === 'isolation' ? 'active-tab' : 'tab'}
            style={getTabStyle(activeTab === 'isolation')}
          >
            <Database size={14} /> Data Isolation & BYOK
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={activeTab === 'compliance' ? 'active-tab' : 'tab'}
            style={getTabStyle(activeTab === 'compliance')}
          >
            <Award size={14} /> Evidence & Compliance
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={activeTab === 'settings' ? 'active-tab' : 'tab'}
            style={getTabStyle(activeTab === 'settings')}
          >
            <Settings size={14} /> White-Label Settings
          </button>
        </aside>

        {/* Tab Content Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TAB 1: Operator Sandbox */}
          {activeTab === 'sandbox' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Zero Trust Identity Sandbox</h2>
                  <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                    Simulate different enterprise operator identities, adjust device parameters, and test adaptive authentication behaviors in real-time.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                  
                  {/* Operator Switcher */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.6rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Simulated Active User Identity
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {users.map(u => {
                          const active = sessions.find(s => s.sessionId === activeSessionId)?.userId === u.id;
                          return (
                            <button
                              key={u.id}
                              onClick={() => setSimulatedOperator(u.id)}
                              style={{
                                background: active ? 'rgba(123,66,188,0.15)' : 'rgba(255,255,255,0.02)',
                                border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                color: active ? '#fff' : 'hsl(230,10%,65%)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.68rem',
                                fontWeight: active ? 700 : 500,
                                transition: 'all 0.2s'
                              }}
                            >
                              <User size={13} color={active ? 'var(--accent-secondary)' : 'hsl(230,10%,50%)'} />
                              <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 700 }}>{u.name}</div>
                                <div style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)' }}>{u.role} ({u.department})</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Environment status banner */}
                    {activeUser && (
                      <div style={{
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ fontSize: '0.6rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', fontWeight: 600 }}>Active Role Boundaries</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#fff' }}>
                          <span>Operator Name:</span>
                          <span style={{ fontWeight: 700 }}>{activeUser.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#fff' }}>
                          <span>Access Group / Dept:</span>
                          <span style={{ fontWeight: 700 }}>{activeUser.department} — {activeUser.businessUnit}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#fff' }}>
                          <span>Assigned Privilege Role:</span>
                          <span style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>{activeUser.role}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#fff' }}>
                          <span>Status:</span>
                          <span style={{ color: activeUser.status === 'active' ? 'var(--color-safe)' : 'var(--color-danger)', fontWeight: 700 }}>
                            {activeUser.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Device Trust & Adaptive Auth */}
                  {simulatedDevice && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(0,0,0,0.15)', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Fingerprint size={14} color="var(--accent-secondary)" />
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>Adaptive Device Trust Context</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Device Fingerprint info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'hsl(230,10%,60%)' }}>
                          <span>Device ID:</span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{simulatedDevice.deviceFingerprint}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'hsl(230,10%,60%)' }}>
                          <span>IP Origin:</span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{simulatedDevice.ip} ({simulatedDevice.location})</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'hsl(230,10%,60%)' }}>
                          <span>Platform:</span>
                          <span>{simulatedDevice.os} / {simulatedDevice.browser}</span>
                        </div>

                        {/* MFA toggle */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#fff' }}>MFA Verification Status:</span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => setMfaStatus(true)}
                              style={{
                                background: simulatedDevice.mfaStatus === 'verified' ? 'var(--color-safe)' : 'rgba(255,255,255,0.02)',
                                border: 'none', borderRadius: '4px', color: simulatedDevice.mfaStatus === 'verified' ? '#000' : '#fff',
                                padding: '3px 8px', fontSize: '0.55rem', fontWeight: 700, cursor: 'pointer'
                              }}
                            >
                              VERIFIED
                            </button>
                            <button
                              onClick={() => setMfaStatus(false)}
                              style={{
                                background: simulatedDevice.mfaStatus === 'unverified' ? 'var(--color-danger)' : 'rgba(255,255,255,0.02)',
                                border: 'none', borderRadius: '4px', color: simulatedDevice.mfaStatus === 'unverified' ? '#fff' : '#fff',
                                padding: '3px 8px', fontSize: '0.55rem', fontWeight: 700, cursor: 'pointer'
                              }}
                            >
                              UNVERIFIED
                            </button>
                          </div>
                        </div>

                        {/* Risk score slider */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 600, color: '#fff' }}>
                            <span>Simulated Device Risk Index:</span>
                            <span style={{
                              color: simulatedDevice.riskScore > 60 ? 'var(--color-danger)' : (simulatedDevice.riskScore > 20 ? 'var(--color-warning)' : 'var(--color-safe)'),
                              fontWeight: 700
                            }}>
                              {simulatedDevice.riskScore}% {simulatedDevice.riskScore > 60 ? '(HIGH RISK - BLOCKED)' : ''}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={simulatedDevice.riskScore}
                            onChange={e => setDeviceRiskScore(Number(e.target.value))}
                            style={{
                              accentColor: simulatedDevice.riskScore > 60 ? 'var(--color-danger)' : 'var(--accent-secondary)',
                              cursor: 'pointer'
                            }}
                          />
                          <p style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', margin: 0 }}>
                            Device risk scores &gt; 60% automatically reject all runtime authorization attempts via adaptive authentication gates.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </section>

              {/* ACTIVE SESSION LOGGER */}
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0 }}>Concurrent User Session Registry</h3>
                    <p style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                      Auditable browser sessions fingerprinted with JWT rotation counts.
                    </p>
                  </div>
                  <button onClick={fetchIdentityData} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.55rem', color: '#fff' }}>
                    <RefreshCw size={10} /> Refresh
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sessions.map(s => {
                    const user = users.find(u => u.id === s.userId);
                    const isActive = s.sessionId === activeSessionId;
                    return (
                      <div key={s.sessionId} style={{
                        background: isActive ? 'rgba(123,66,188,0.03)' : 'rgba(255,255,255,0.01)',
                        border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        borderRadius: '6px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: s.device.riskScore > 60 ? 'var(--color-danger)' : (isActive ? 'var(--color-safe)' : 'hsl(230,10%,30%)'),
                            boxShadow: isActive ? '0 0 6px var(--color-safe)' : 'none'
                          }} />
                          <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>
                              {user?.name || 'Unknown User'} <span style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)', fontFamily: 'var(--font-mono)' }}>({s.sessionId})</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.55rem', color: 'hsl(230,10%,45%)', marginTop: '2px' }}>
                              <span>IP: {s.device.ip}</span>
                              <span>•</span>
                              <span>OS: {s.device.os}</span>
                              <span>•</span>
                              <span>MFA: {s.device.mfaStatus.toUpperCase()}</span>
                              <span>•</span>
                              <span>Rotations: {s.tokenRotations}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {isActive && <span style={{ fontSize: '0.55rem', background: 'rgba(82,196,26,0.1)', color: 'var(--color-safe)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>ACTIVE SESSION</span>}
                          <button
                            onClick={() => terminateSession(s.sessionId)}
                            style={{
                              padding: '4px 8px', background: 'rgba(245,34,45,0.08)', border: '1px solid rgba(245,34,45,0.2)',
                              borderRadius: '4px', color: 'var(--color-danger)', fontSize: '0.55rem', fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: ABAC Policies */}
          {activeTab === 'policies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>ABAC Policy Configuration Engine</h2>
                  <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                    Construct dynamic Attribute-Based Access Control policies specifying roles, departments, environment parameters, and maximum risk limits.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {policies.map(p => (
                    <div key={p.id} style={{
                      background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                      borderRadius: '6px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{p.name}</span>
                          <span style={{ fontSize: '0.52rem', background: 'rgba(123,66,188,0.1)', color: 'var(--accent-primary)', padding: '1px 5px', borderRadius: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
                            {p.resourceType}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                          <span style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px', color: 'hsl(230,10%,60%)' }}>
                            Roles: {p.conditions.roles.join(', ')}
                          </span>
                          <span style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px', color: 'hsl(230,10%,60%)' }}>
                            Depts: {p.conditions.departments.join(', ')}
                          </span>
                          <span style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px', color: 'hsl(230,10%,60%)' }}>
                            Envs: {p.conditions.environments.join(', ')}
                          </span>
                          <span style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px', color: 'hsl(230,10%,60%)' }}>
                            Max Risk: &lt; {p.conditions.maxRiskLevel}%
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => deletePolicy(p.id)}
                        style={{
                          padding: '4px', background: 'none', border: 'none', color: 'hsl(230,10%,45%)',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleUpsertPolicySubmit} style={{
                  marginTop: '10px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex', flexDirection: 'column', gap: '14px'
                }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Create Dynamic ABAC Policy Rule
                  </span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Rule Description</label>
                      <input
                        type="text" required placeholder="e.g. Allow Compliance Officer access to evidence vault in production"
                        value={newPolName} onChange={e => setNewPolName(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Target Resource Type</label>
                      <select
                        value={newPolType} onChange={e => setNewPolType(e.target.value as 'connectors' | 'scanners' | 'evidence' | 'remediation' | 'executive_reports' | 'memory' | 'api_usage')}
                        style={{ background: '#04070b', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                      >
                        <option value="remediation">Remediation actions</option>
                        <option value="scanners">Scanners execution</option>
                        <option value="connectors">Connectors sync</option>
                        <option value="evidence">Evidence Access</option>
                        <option value="executive_reports">Executive reports</option>
                        <option value="memory">AI Memory indexes</option>
                        <option value="api_usage">API Request logs</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Authorized Roles (comma separated)</label>
                      <input type="text" value={newPolRoles} onChange={e => setNewPolRoles(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Authorized Departments</label>
                      <input type="text" value={newPolDept} onChange={e => setNewPolDept(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Target Environments</label>
                      <input type="text" value={newPolEnv} onChange={e => setNewPolEnv(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Max Risk Index limit</label>
                      <input type="number" value={newPolRisk} onChange={e => setNewPolRisk(Number(e.target.value))} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }} />
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
                    Commit Policy Rule
                  </button>
                </form>
              </section>

              {/* SCIM Sync Section */}
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0 }}>SCIM Directory Synchronizer</h3>
                  <p style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                    Bulk import users and map organizations teams automatically using standard SCIM CSV payloads.
                  </p>
                </div>
                <form onSubmit={handleSCIMSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea
                    value={scimCSV} onChange={e => setScimCSV(e.target.value)} rows={4}
                    style={{ width: '100%', background: '#020406', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'hsl(230,10%,70%)', resize: 'vertical', outline: 'none' }}
                  />
                  <button type="submit" style={{ alignSelf: 'flex-end', padding: '6px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', fontWeight: 600, fontSize: '0.62rem', cursor: 'pointer' }}>
                    Sync SCIM CSV Registry
                  </button>
                </form>
              </section>
            </div>
          )}

          {/* TAB 3: Directory Hierarchy */}
          {activeTab === 'directory' && (
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Multi-Tenancy Enterprise Directory</h2>
                <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                  Organizations, Business Units, Projects, and Teams structural relationships mapping resource ownership boundaries.
                </p>
              </div>

              {directory ? (
                <div style={{
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '16px'
                }}>
                  {renderDirectoryTree(directory)}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'hsl(230,10%,45%)' }}>
                  <Loader className="animate-spin" size={24} style={{ margin: '0 auto 12px' }} />
                  <span style={{ fontSize: '0.7rem' }}>Syncing enterprise directory tree...</span>
                </div>
              )}
            </section>
          )}

          {/* TAB 4: API Keys & Machine Identities */}
          {activeTab === 'apikeys' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* API Keys Panel */}
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Organization API Credentials</h2>
                  <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                    Scoped and temporary keys generated for agent runtimes and third-party cloud connector integrations.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {apiKeys.map(key => (
                    <div key={key.id} style={{
                      background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                      borderRadius: '6px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {key.name}
                          <span style={{ fontSize: '0.52rem', background: 'rgba(255,255,255,0.05)', color: 'hsl(230,10%,55%)', fontFamily: 'var(--font-mono)', padding: '1px 5px', borderRadius: '3px' }}>
                            {key.keyPrefix}_xxxxxx
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.58rem', color: 'hsl(230,10%,45%)', marginTop: '4px' }}>
                          <span>Scope: {key.scope}</span>
                          <span>•</span>
                          <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Status: <strong style={{ color: key.status === 'active' ? 'var(--color-safe)' : 'var(--color-danger)' }}>{key.status.toUpperCase()}</strong></span>
                        </div>
                      </div>

                      {key.status === 'active' && (
                        <button
                          onClick={() => revokeApiKey(key.id)}
                          style={{
                            padding: '4px 8px', background: 'rgba(245,34,45,0.08)', border: '1px solid rgba(245,34,45,0.2)',
                            borderRadius: '4px', color: 'var(--color-danger)', fontSize: '0.55rem', fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleCreateApiKey} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Key Description Name</label>
                    <input
                      type="text" required placeholder="e.g. external-siem-integration"
                      value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Scope Permissions</label>
                    <select
                      value={newKeyScope} onChange={e => setNewKeyScope(e.target.value)}
                      style={{ background: '#04070b', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                    >
                      <option value="connectors:write">connectors:write (discovery updates)</option>
                      <option value="findings:write">findings:write (push scanner results)</option>
                      <option value="remediation:execute">remediation:execute (deploy hotfixes)</option>
                      <option value="evidence:read">evidence:read (fetch compliance logs)</option>
                    </select>
                  </div>
                  <button type="submit" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', fontWeight: 600, fontSize: '0.65rem', cursor: 'pointer' }}>
                    Create Scoped Key
                  </button>
                </form>
              </section>

              {/* Service Accounts Panel */}
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Service Machine Accounts</h2>
                  <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                    Machine identities mapped to autonomous scripts. Secrets are automatically rotated under least-privilege policies.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {serviceAccounts.map(sa => (
                    <div key={sa.id} style={{
                      background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                      borderRadius: '6px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {sa.name}
                          <span style={{ fontSize: '0.52rem', background: 'rgba(255,255,255,0.05)', color: 'hsl(230,10%,50%)', fontFamily: 'var(--font-mono)', padding: '1px 5px', borderRadius: '3px' }}>
                            ID: {sa.clientId}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.58rem', color: 'hsl(230,10%,45%)', marginTop: '4px' }}>
                          <span>Scopes: {sa.scope}</span>
                          <span>•</span>
                          <span>Last Rotated: {new Date(sa.lastRotatedAt).toLocaleTimeString()}</span>
                          <span>•</span>
                          <span>Expires: {new Date(sa.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => rotateServiceAccount(sa.id)}
                        style={{
                          padding: '4px 8px', background: 'rgba(123,66,188,0.1)', border: '1px solid rgba(123,66,188,0.3)',
                          borderRadius: '4px', color: 'var(--accent-primary)', fontSize: '0.55rem', fontWeight: 700,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                      >
                        <RefreshCw size={10} /> Rotate Credentials
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleCreateSA} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Service Account Name</label>
                    <input
                      type="text" required placeholder="e.g. self-healing-controller"
                      value={newSAName} onChange={e => setNewSAName(e.target.value)}
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Scopes</label>
                    <input
                      type="text" required placeholder="e.g. remediation:execute scanners:read"
                      value={newSAScope} onChange={e => setNewSAScope(e.target.value)}
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <button type="submit" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', fontWeight: 600, fontSize: '0.65rem', cursor: 'pointer' }}>
                    Create Service Account
                  </button>
                </form>
              </section>

            </div>
          )}

          {/* TAB 5: Data Isolation & BYOK */}
          {activeTab === 'isolation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* BYOK Controls */}
              <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Customer-Managed Encryption Keys (BYOK)</h2>
                  <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                    Provide independent cryptographically signed KMS keys. All backups and tenant files will compile using this hardware security boundary.
                  </p>
                </div>

                <form onSubmit={handleBYOKSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>AWS / Azure KMS Key ARN Identifier</label>
                    <input
                      type="text" required placeholder="arn:aws:kms:us-east-1:1122334455:key/..."
                      value={byokArnInput} onChange={e => setByokArnInput(e.target.value)}
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px', fontSize: '0.68rem', color: '#fff', outline: 'none', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <button type="submit" style={{ alignSelf: 'flex-end', padding: '8px 16px', background: 'var(--accent-secondary)', border: 'none', borderRadius: '4px', color: '#000', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer' }}>
                    Register KMS Key
                  </button>
                </form>
              </section>

              {/* Legal Holds & Retention */}
              {activeTenant && (
                <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Legal Hold & Retention Overrides</h2>
                    <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                      Enabling Legal Hold overrides standard automated purging intervals to preserve immutable database contexts for forensics.
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '6px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff', display: 'block' }}>Compliance Legal Hold:</span>
                      <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,45%)' }}>Prevent erasure of logs, incident records, and executive boards.</span>
                    </div>
                    <button
                      onClick={() => setLegalHold(!activeTenant.isolation?.legalHoldActive)}
                      style={{
                        padding: '6px 14px',
                        background: activeTenant.isolation?.legalHoldActive ? 'var(--color-warning)' : 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        color: activeTenant.isolation?.legalHoldActive ? '#000' : '#fff',
                        fontWeight: 700,
                        fontSize: '0.62rem',
                        cursor: 'pointer'
                      }}
                    >
                      {activeTenant.isolation?.legalHoldActive ? 'ACTIVE HOLD ON' : 'DISABLED'}
                    </button>
                  </div>
                </section>
              )}

              {/* Right to Erasure */}
              {activeTenant && (
                <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Right to Erasure (GDPR Compliance)</h2>
                    <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                      Programmatically purge all historical threat graphs, telemetry nodes, and sessions associated with a specific user profile.
                    </p>
                  </div>

                  <form onSubmit={handleErasureSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Target email to purge</label>
                      <input
                        type="email" required placeholder="e.g. decommissioned-contractor@cyberdyne.io"
                        value={erasureEmail} onChange={e => setErasureEmail(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                      />
                    </div>
                    <button type="submit" style={{ padding: '8px 16px', background: 'rgba(245,34,45,0.1)', border: '1px solid rgba(245,34,45,0.3)', borderRadius: '4px', color: 'var(--color-danger)', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer' }}>
                      Execute Right-To-Erasure
                    </button>
                  </form>

                  {/* Erasure Audit Logs */}
                  {activeTenant.isolation?.rightToErasureLogs && activeTenant.isolation.rightToErasureLogs.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', fontWeight: 600 }}>GDPR Erasure Signatures:</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                        {activeTenant.isolation.rightToErasureLogs.map((log, i) => (
                          <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', background: '#000', padding: '6px 10px', borderRadius: '4px', color: 'hsl(230,10%,60%)', border: '1px solid rgba(255,255,255,0.01)' }}>
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

            </div>
          )}

          {/* TAB 6: Compliance Evidence */}
          {activeTab === 'compliance' && (
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Automated Governance Evidence Hub</h2>
                  <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                    Verifiable cryptographic compliance logs generated automatically from identity audits and environment topologies.
                  </p>
                </div>
                <button
                  onClick={exportComplianceEvidence}
                  style={{
                    padding: '6px 14px', background: 'var(--accent-secondary)', border: 'none', borderRadius: '4px',
                    color: '#000', fontWeight: 800, fontSize: '0.62rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Download size={11} /> Export Signed Evidence Bundle
                </button>
              </div>

              {/* Evidence list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {complianceEvidence.map(ev => (
                  <div key={ev.id} style={{
                    background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                    borderRadius: '6px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{ev.framework} {ev.controlId}</span>
                        <span style={{
                          fontSize: '0.52rem', padding: '1px 5px', borderRadius: '3px',
                          background: ev.status === 'pass' ? 'rgba(82,196,26,0.1)' : 'rgba(250,173,20,0.1)',
                          color: ev.status === 'pass' ? 'var(--color-safe)' : 'var(--color-warning)',
                          fontWeight: 700, textTransform: 'uppercase'
                        }}>
                          {ev.status === 'pass' ? 'verified compliance' : 'requires action'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.55rem', color: 'hsl(230,10%,45%)' }}>
                        {new Date(ev.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.65rem', color: 'hsl(230,10%,70%)' }}>
                      {ev.description}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#000', padding: '4px 8px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '0.45rem', color: 'hsl(230,10%,40%)', fontWeight: 700 }}>CHECKSUM</span>
                      <span style={{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)', color: 'hsl(230,10%,50%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {ev.verifiableHash}
                      </span>
                      <button
                        onClick={() => handleCopy(ev.verifiableHash, ev.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedSignId === ev.id ? 'var(--color-safe)' : 'hsl(230,10%,50%)', outline: 'none' }}
                      >
                        {copiedSignId === ev.id ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB 7: Branding & Settings */}
          {activeTab === 'settings' && (
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>White-Label Customization & SSO Settings</h2>
                <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', marginTop: '2px' }}>
                  Custom branding properties, SSO configurations, and general administrative preferences.
                </p>
              </div>

              <form onSubmit={handleSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Custom Branding Name</label>
                    <input
                      type="text" value={orgBrandingName} onChange={e => setOrgBrandingName(e.target.value)}
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Branding Primary Hex Accent</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="color" value={primaryBrandingColor} onChange={e => setPrimaryBrandingColor(e.target.value)}
                        style={{ border: 'none', background: 'none', width: '32px', height: '24px', cursor: 'pointer' }}
                      />
                      <input
                        type="text" value={primaryBrandingColor} onChange={e => setPrimaryBrandingColor(e.target.value)}
                        style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>SSO Identity Provider</label>
                    <select
                      value={config?.ssoSettings.provider || 'Okta'}
                      onChange={e => updateConfig({ ssoSettings: { enabled: true, provider: e.target.value as 'Okta' | 'Microsoft Entra' | 'Google Workspace' | 'OIDC' | 'SAML' } })}
                      style={{ background: '#04070b', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none' }}
                    >
                      <option value="Okta">Okta Enterprise Identity</option>
                      <option value="Microsoft Entra">Microsoft Entra ID (Azure AD)</option>
                      <option value="Google Workspace">Google Workspace Identity</option>
                      <option value="SAML">Standard SAML 2.0 Identity Server</option>
                      <option value="OIDC">Standard OIDC (OpenID Connect)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase' }}>Custom Access Domain</label>
                    <input
                      type="text" value={customDomainInput} onChange={e => setCustomDomainInput(e.target.value)}
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.68rem', color: '#fff', outline: 'none', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>

                <button type="submit" style={{ alignSelf: 'flex-end', padding: '8px 16px', background: 'var(--accent-secondary)', border: 'none', borderRadius: '4px', color: '#000', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer' }}>
                  Sync Settings config
                </button>
              </form>
            </section>
          )}

          {/* IMMUTABLE CRYPTOGRAPHIC AUDIT EVENTS LOGGER (Bottom panel) */}
          <section className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileSignature size={14} color="var(--accent-secondary)" /> Immutable Cryptographic Audit Log Feed
              </h3>
              <p style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)', margin: '2px 0 0' }}>
                Every authentication, permission evaluation, and data boundary validation is cryptographically signed using SHA-256 HMAC checksums.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
              {[...auditLogs].reverse().map(log => {
                const isApproved = log.eventType === 'ZeroTrustAccessApproved' || log.outcome === 'success';
                return (
                  <div key={log.id} style={{
                    background: '#020406', border: '1px solid rgba(255,255,255,0.03)',
                    borderRadius: '6px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 800,
                        color: log.eventType.includes('Denied') ? 'var(--color-danger)' : (isApproved ? 'var(--color-safe)' : 'var(--accent-secondary)')
                      }}>
                        {log.eventType}
                      </span>
                      <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'hsl(230,10%,60%)' }}>
                      <span>Operator / Actor: <strong style={{ color: '#fff' }}>{log.actor}</strong></span>
                      <span>Outcome: <strong style={{ color: isApproved ? 'var(--color-safe)' : 'var(--color-danger)' }}>{log.outcome.toUpperCase()}</strong></span>
                    </div>

                    {log.details && (
                      <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', fontStyle: 'italic', marginTop: '2px' }}>
                        Details: {log.details}
                      </div>
                    )}

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: '#000', border: '1px solid rgba(255,255,255,0.02)',
                      borderRadius: '4px', padding: '4px 6px', marginTop: '4px'
                    }}>
                      <span style={{ fontSize: '0.45rem', color: 'hsl(230,10%,40%)', textTransform: 'uppercase' }}>SHA-256 SIGNATURE</span>
                      <span style={{
                        fontSize: '0.52rem', fontFamily: 'var(--font-mono)', color: 'hsl(230,10%,50%)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
                      }}>
                        {log.signature}
                      </span>
                      <button
                        onClick={() => handleCopy(log.signature, log.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: copiedSignId === log.id ? 'var(--color-safe)' : 'hsl(230,10%,50%)',
                          outline: 'none', padding: '2px'
                        }}
                      >
                        {copiedSignId === log.id ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

      </div>

      {/* Footer */}
      <footer style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.7rem', color: 'hsl(230,10%,40%)',
        padding: '12px 0 24px', borderTop: '1px solid rgba(255,255,255,0.03)'
      }}>
        <div>© 2026 CloudGuard AI Inc. — Enterprise Security Console v1.0</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Identity Runtime: localhost:4006</span>
          <span>Zero Trust Interceptor Policy Gate</span>
        </div>
      </footer>
    </div>
  );
}

// ─── Auxiliary Components ────────────────────────────────────────────────────

function DirectoryTreeNodeView({ node }: { node: DirectoryNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const iconMap = {
    organization: <Globe size={12} color="var(--accent-secondary)" />,
    business_unit: <Award size={12} color="var(--accent-primary)" />,
    project: <FileText size={12} color="#ff9c6e" />,
    team: <Users size={12} color="#95de64" />,
    user: <User size={12} color="#5cdbd3" />,
    resource: <Shield size={12} color="#ff85c0" />
  };

  return (
    <div style={{ marginLeft: '14px', marginTop: '6px' }}>
      <div
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: hasChildren ? 'pointer' : 'default',
          padding: '4px 8px',
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.01)',
          alignSelf: 'start',
          width: 'fit-content'
        }}
      >
        {iconMap[node.type]}
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fff' }}>{node.name}</span>
        <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase' }}>({node.type.replace('_', ' ')})</span>
        {node.owner && (
          <span style={{ fontSize: '0.52rem', background: 'rgba(186,186,186,0.05)', color: 'var(--accent-secondary)', padding: '1px 5px', borderRadius: '3px' }}>
            Owner: {node.owner}
          </span>
        )}
      </div>
      {hasChildren && isOpen && (
        <div style={{ borderLeft: '1px dashed rgba(255,255,255,0.08)', marginLeft: '12px', paddingLeft: '8px' }}>
          {node.children?.map(child => (
            <DirectoryTreeNodeView key={child.id} node={child} />
          ))}
        </div>
      )}
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
