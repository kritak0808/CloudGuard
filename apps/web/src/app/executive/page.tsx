"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useExecutiveStore } from '../../store/useExecutiveStore';
import {
  Brain, ChevronLeft, ShieldCheck, TrendingUp, DollarSign,
  FileText, Loader, Sparkles, AlertTriangle, Award, Globe,
  BarChart3, Zap, Maximize2, Minimize2, ChevronRight, ArrowLeft, Send
} from 'lucide-react';
import type { RiskHeatmapNode, ExecutiveMetrics, SecurityROIMetrics, RiskForecastPoint } from '@cloudguard/types';

// ─── Heatmap Card Render ─────────────────────────────────────────────────────

function HeatmapCard({ node }: { node: RiskHeatmapNode }) {
  const sevColors = {
    critical: 'var(--color-danger)',
    high:     'var(--color-warning)',
    medium:   'var(--color-info)',
    low:      'var(--color-safe)'
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.015)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: 'all 0.3s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.52rem', textTransform: 'uppercase', color: 'hsl(230,10%,45%)', fontFamily: 'var(--font-mono)' }}>
          {node.provider.toUpperCase()} | {node.region}
        </span>
        <span style={{
          fontSize: '0.48rem', padding: '1px 5px', borderRadius: '3px',
          background: `${sevColors[node.severity]}15`, color: sevColors[node.severity],
          fontWeight: 700, textTransform: 'uppercase',
        }}>{node.severity}</span>
      </div>

      <div>
        <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', margin: 0 }}>{node.businessUnit}</h4>
        <span style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)' }}>App: {node.application}</span>
      </div>

      <div style={{
        marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.03)',
        paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,40%)', textTransform: 'uppercase' }}>Financial Exposure</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
          ${node.financialExposureUSD.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─── Primary Executive Metric Block ──────────────────────────────────────────

function BoardroomStat({ label, value, sublabel, icon, color }: {
  label: string; value: string | number; sublabel: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.01)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px', padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: '18px',
    }}>
      <div style={{ color, background: `${color}10`, padding: '10px', borderRadius: '8px' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.4rem', fontWeight: 850, color: '#fff', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ fontSize: '0.6rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '0.52rem', color: 'hsl(230,10%,40%)', marginTop: '1px' }}>{sublabel}</div>
      </div>
    </div>
  );
}

// ─── Main Presentation Slide Rendering ───────────────────────────────────────

function SlideRenderer({ slideIndex, metrics, roi, forecasts, heatmap }: {
  slideIndex: number;
  metrics: ExecutiveMetrics | null;
  roi: SecurityROIMetrics | null;
  forecasts: RiskForecastPoint[] | null;
  heatmap: RiskHeatmapNode[] | null;
}) {
  if (!metrics || !roi || !forecasts || !heatmap) return null;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', gap: '30px',
      justifyContent: 'center', minHeight: '380px', padding: '0 40px',
    }}>
      {slideIndex === 0 && (
        <div className="finding-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 850, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>
            Executive Cybersecurity Posture Index
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'hsl(230,10%,60%)', maxWidth: '600px', lineHeight: 1.6, margin: 0 }}>
            CloudGuard AI auto-remediation and threat defense engines stabilized enterprise infrastructure risk, reducing cyber exposure score to historical lows.
          </p>

          <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-secondary)' }}>{metrics.securityScore}</div>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'hsl(230,10%,45%)', letterSpacing: '0.05em' }}>Security Posture Score</span>
            </div>
            <div style={{ width: '1px', height: '60px', background: 'var(--border-color)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-safe)' }}>{metrics.autonomousRemediationRate}%</div>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'hsl(230,10%,45%)', letterSpacing: '0.05em' }}>Autonomous Containment</span>
            </div>
            <div style={{ width: '1px', height: '60px', background: 'var(--border-color)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-primary)' }}>{metrics.businessContinuityScore}%</div>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'hsl(230,10%,45%)', letterSpacing: '0.05em' }}>Business Continuity</span>
            </div>
          </div>
        </div>
      )}

      {slideIndex === 1 && (
        <div className="finding-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 850, letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
              Cyber Security Investment ROI Summary
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'hsl(230,10%,55%)', margin: '4px 0 0' }}>
              Financial and operational returns generated through automated intelligence scanning and prevention
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 850, color: 'var(--accent-secondary)' }}>${roi.automationValueUSD.toLocaleString()}</div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, margin: '8px 0 4px', color: '#fff' }}>Automation Value</h4>
              <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)' }}>Preventative containment dollar outcomes</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 850, color: '#7B42BC' }}>{roi.hoursSaved} Hours</div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, margin: '8px 0 4px', color: '#fff' }}>Engineering Hours Restored</h4>
              <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)' }}>Time recovered from manual debugging</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 850, color: 'var(--color-safe)' }}>${roi.complianceSavingsUSD.toLocaleString()}</div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, margin: '8px 0 4px', color: '#fff' }}>Compliance Auditing Savings</h4>
              <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)' }}>Reduced manual evidence compilation costs</span>
            </div>
          </div>
        </div>
      )}

      {slideIndex === 2 && (
        <div className="finding-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 850, letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
              90-Day Cyber Risk Forecast & Trends
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'hsl(230,10%,55%)', margin: '4px 0 0' }}>
              Projections indicating risk score increases and attack surface reduction over time
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '10px' }}>
            {forecasts.map((f) => (
              <div key={f.horizonDays} style={{
                background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '16px', flex: 1, textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.62rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', fontWeight: 700 }}>
                  {f.horizonDays}-Day Horizon
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 850, color: 'var(--accent-secondary)', margin: '8px 0' }}>
                  {f.predictedScore} / 100
                </div>
                <div style={{ fontSize: '0.58rem', color: 'hsl(230,10%,55%)' }}>
                  Compliance Drift: {f.complianceDrift}% | Attack Surface: -{f.attackSurfacePercentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {slideIndex === 3 && (
        <div className="finding-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 850, letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
              Business Units Cyber Risk Profile
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'hsl(230,10%,55%)', margin: '4px 0 0' }}>
              Identified financial risk exposures across department applications
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginTop: '10px' }}>
            {heatmap.slice(0, 3).map((node, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.52rem', color: 'hsl(230,10%,45%)' }}>
                  <span>{node.provider.toUpperCase()} | {node.region}</span>
                  <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>{node.severity.toUpperCase()}</span>
                </div>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', margin: 0 }}>{node.businessUnit}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                  <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,40%)' }}>EXPOSURE</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>${node.financialExposureUSD.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Presenter Notes Footer ──────────────────────────────────────────────────

function PresenterNotes({ slideIndex }: { slideIndex: number }) {
  const notes = [
    "Board Takeaway: Automated patching systems and Council Debate consensus engines are containment-safe. We prevented 14 critical incidents entirely through zero-trust cordoning.",
    "Board Takeaway: Automated compliance checks saved over 380 engineering hours, translating directly into $184K restored developer bandwidth and lower external audit bills.",
    "Board Takeaway: 90-day forecasts predict a security score climb to 96/100, driven by the rollout of IAM IMDSv2 policies across EKS templates, cutting compliance drift below 0.5%.",
    "Board Takeaway: Financial exposure is heavily consolidated in Payments API ($185k) and BigData Analytics ($142k). Outbound egress blocks are in place to prevent lateral data leak vectors."
  ];

  return (
    <footer style={{
      background: 'rgba(0,0,0,0.4)',
      borderTop: '1px solid var(--border-color)',
      padding: '16px 40px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}>
      <div style={{
        fontSize: '0.52rem', fontWeight: 700, background: 'rgba(255,255,255,0.06)',
        padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', color: 'hsl(230,10%,60%)',
      }}>
        Presenter Note
      </div>
      <p style={{ fontSize: '0.68rem', color: 'hsl(230,10%,65%)', fontStyle: 'italic', margin: 0, flex: 1 }}>
        &quot;{notes[slideIndex] || ''}&quot;
      </p>
    </footer>
  );
}

// ─── Executive Copilot Chat component ────────────────────────────────────────

function CopilotChatWindow() {
  const chat = useExecutiveStore(s => s.copilotChat);
  const isCopilotLoading = useExecutiveStore(s => s.isCopilotLoading);
  const askCopilot = useExecutiveStore(s => s.askCopilot);

  const [chatInput, setChatInput] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || isCopilotLoading) return;
    askCopilot(chatInput.trim());
    setChatInput('');
  }

  function handleQuickQuestion(q: string) {
    askCopilot(q);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', minHeight: '340px' }}>
      {/* Dialogue area */}
      <div style={{
        flex: 1, background: '#020406', border: '1px solid var(--border-color)',
        borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column',
        gap: '12px', overflowY: 'auto', maxHeight: '280px',
      }}>
        {chat.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'hsl(230,10%,40%)' }}>
            <Sparkles size={24} style={{ opacity: 0.2, marginBottom: '8px' }} />
            <div style={{ fontSize: '0.68rem' }}>Executive Copilot Sandbox active</div>
            <div style={{ fontSize: '0.55rem', marginTop: '2px' }}>Query strategic cyber risk details and ROI outcomes below.</div>
          </div>
        ) : (
          chat.map((c, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* User Question */}
              <div style={{ display: 'flex', gap: '6px', alignSelf: 'flex-end', maxWidth: '80%' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
                  borderRadius: '6px 6px 0 6px', padding: '8px 12px', fontSize: '0.65rem', color: '#fff',
                }}>
                  {c.question}
                </div>
              </div>
              {/* AI Answer */}
              <div style={{ display: 'flex', gap: '6px', alignSelf: 'flex-start', maxWidth: '80%' }}>
                <div style={{
                  background: 'rgba(0, 217, 255, 0.04)', border: '1px solid rgba(0, 217, 255, 0.12)',
                  borderRadius: '6px 6px 6px 0', padding: '8px 12px', fontSize: '0.65rem', color: 'var(--accent-secondary)',
                  lineHeight: '1.4',
                }}>
                  {c.answer}
                </div>
              </div>
            </div>
          ))
        )}

        {isCopilotLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.62rem', color: 'hsl(230,10%,50%)' }}>
            <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} /> Processing strategic report references...
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleQuickQuestion('What is our security ROI?')}
          style={{
            padding: '4px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)', color: 'hsl(230,10%,70%)', fontSize: '0.55rem', cursor: 'pointer',
          }}
        >
          What is our security ROI?
        </button>
        <button
          onClick={() => handleQuickQuestion('Where should we invest?')}
          style={{
            padding: '4px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)', color: 'hsl(230,10%,70%)', fontSize: '0.55rem', cursor: 'pointer',
          }}
        >
          Where should we invest?
        </button>
      </div>

      {/* Chat Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Ask Copilot: 'What are our largest compliance gaps?'..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          style={{
            flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
            borderRadius: '6px', padding: '8px 12px', fontSize: '0.68rem', color: '#fff', outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            background: 'var(--accent-secondary)', border: 'none', borderRadius: '6px',
            padding: '0 14px', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}

// ─── Main Executive Page Route ────────────────────────────────────────────────

export default function ExecutivePage() {
  const metrics = useExecutiveStore(s => s.metrics);
  const impact = useExecutiveStore(s => s.impact);
  const roi = useExecutiveStore(s => s.roi);
  const forecasts = useExecutiveStore(s => s.forecasts);
  const heatmap = useExecutiveStore(s => s.heatmap);
  const reports = useExecutiveStore(s => s.reports);

  const activeForecastIndex = useExecutiveStore(s => s.activeForecastIndex);
  const presentationMode = useExecutiveStore(s => s.presentationMode);
  const presentationSlideIndex = useExecutiveStore(s => s.presentationSlideIndex);

  const fetchExecutiveData = useExecutiveStore(s => s.fetchExecutiveData);
  const setForecastIndex = useExecutiveStore(s => s.setForecastIndex);
  const togglePresentationMode = useExecutiveStore(s => s.togglePresentationMode);
  const setPresentationSlide = useExecutiveStore(s => s.setPresentationSlide);

  useEffect(() => {
    fetchExecutiveData();
  }, []);

  // Compute selected forecast details
  const activeForecast = forecasts[activeForecastIndex];

  // Render Presentation Mode
  if (presentationMode) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#020306',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed', inset: 0, zIndex: 10000,
        fontFamily: 'var(--font-sans)',
      }}>
        {/* Navigation Bar */}
        <nav style={{
          padding: '20px 40px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="var(--accent-secondary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Q2 Cyber Security Executive Report
            </span>
          </div>

          <button
            onClick={() => togglePresentationMode(false)}
            style={{
              padding: '6px 14px', borderRadius: '4px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
              color: '#fff', fontSize: '0.68rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Minimize2 size={12} /> Exit Presentation Mode
          </button>
        </nav>

        {/* Immersive Slide Renderer */}
        <SlideRenderer
          slideIndex={presentationSlideIndex}
          metrics={metrics}
          roi={roi}
          forecasts={forecasts}
          heatmap={heatmap}
        />

        {/* Slide navigation controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '24px 0' }}>
          <button
            disabled={presentationSlideIndex === 0}
            onClick={() => setPresentationSlide(presentationSlideIndex - 1)}
            style={{
              padding: '8px 16px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              color: presentationSlideIndex === 0 ? 'hsl(230,10%,30%)' : '#fff',
              fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <ArrowLeft size={13} /> Previous
          </button>

          {/* Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: presentationSlideIndex === i ? 'var(--accent-secondary)' : 'hsl(230,10%,30%)',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>

          <button
            disabled={presentationSlideIndex === 3}
            onClick={() => setPresentationSlide(presentationSlideIndex + 1)}
            style={{
              padding: '8px 16px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              color: presentationSlideIndex === 3 ? 'hsl(230,10%,30%)' : '#fff',
              fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            Next <ChevronRight size={13} />
          </button>
        </div>

        {/* Notes */}
        <PresenterNotes slideIndex={presentationSlideIndex} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '1600px',
      margin: '0 auto',
    }}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'hsl(230,10%,55%)', textDecoration: 'none', fontSize: '0.75rem' }}>
          <ChevronLeft size={14} /> Dashboard
        </Link>
        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px',
            background: 'linear-gradient(135deg, var(--accent-secondary), #7B42BC)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0, 217, 255, 0.3)',
          }}>
            <Award size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Executive Risk & Intelligence Suite</h1>
            <p style={{ fontSize: '0.65rem', color: 'hsl(230,10%,50%)', margin: 0 }}>
              Bloomberg-style cybersecurity ROI, business continuity, and board narrative summaries
            </p>
          </div>
        </div>

        <button
          onClick={() => togglePresentationMode(true)}
          style={{
            padding: '8px 14px',
            background: 'var(--accent-secondary)', border: 'none',
            borderRadius: '6px', color: '#000', fontSize: '0.7rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          <Maximize2 size={13} /> Board Presentation
        </button>
      </header>

      {/* ── KPIs Ribbon ──────────────────────────────────────────── */}
      {metrics && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          <BoardroomStat label="Security Posture Rating" value={`${metrics.securityScore} / 100`} sublabel="12% improvement this quarter" icon={<ShieldCheck size={18} />} color="var(--accent-secondary)" />
          <BoardroomStat label="Executive Risk Index" value={`${metrics.executiveRiskIndex}%`} sublabel="Minimized attack vulnerabilities" icon={<AlertTriangle size={18} />} color="var(--color-warning)" />
          <BoardroomStat label="Autonomous Remediation Rate" value={`${metrics.autonomousRemediationRate}%`} sublabel="Kyverno network policy isolations" icon={<Zap size={18} />} color="var(--color-safe)" />
          <BoardroomStat label="Business Continuity Score" value={`${metrics.businessContinuityScore}%`} sublabel="High cluster availability" icon={<Globe size={18} />} color="var(--accent-primary)" />
        </section>
      )}

      {/* ── Primary Sections Grid ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px' }}>
        
        {/* Left Side Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* ROI and Financial metrics */}
          {roi && impact && (
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '-0.01em' }}>
                  <DollarSign size={14} color="var(--accent-secondary)" /> Cyber Risk Exposure & ROI Analytics
                </h3>
                <p style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)', margin: '2px 0 0' }}>
                  Computed engineering restoral savings and revenue protection outcomes
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase' }}>Hours Restored</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-secondary)', margin: '4px 0' }}>
                    {roi.hoursSaved} Hrs
                  </div>
                  <span style={{ fontSize: '0.48rem', color: 'hsl(230,10%,55%)' }}>Restored dev time</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase' }}>Incidents Prevented</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7B42BC', margin: '4px 0' }}>
                    {roi.incidentsPrevented} Cases
                  </div>
                  <span style={{ fontSize: '0.48rem', color: 'hsl(230,10%,55%)' }}>Escapes contained</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase' }}>Automation Value</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-safe)', margin: '4px 0' }}>
                    ${roi.automationValueUSD.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.48rem', color: 'hsl(230,10%,55%)' }}>Est. dollar outcomes</span>
                </div>
              </div>

              {/* Exposure Ranges */}
              <div style={{
                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase' }}>Estimated Revenue Impact Range</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', marginTop: '3px' }}>
                    ${impact.revenueImpactRange[0].toLocaleString()} — ${impact.revenueImpactRange[1].toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase' }}>Compliance Drift Rate</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '3px' }}>
                    {impact.complianceDriftRate}% / Month
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Forecast Scrubber */}
          {activeForecast && (
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={14} color="var(--accent-secondary)" /> Predictive Risk Forecast Scrubber
                  </h3>
                  <p style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)', margin: '2px 0 0' }}>
                    Forecast security posture scoring and compliance drift rates over 90-day horizon
                  </p>
                </div>

                <div style={{
                  fontSize: '0.62rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
                  padding: '3px 8px', borderRadius: '4px', fontWeight: 700,
                }}>
                  {activeForecast.horizonDays}-Day Horizon
                </div>
              </div>

              {/* Slider scrubber */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="range"
                  min={0}
                  max={forecasts.length - 1}
                  value={activeForecastIndex}
                  onChange={e => setForecastIndex(parseInt(e.target.value))}
                  style={{
                    width: '100%', height: '5px', borderRadius: '3px',
                    background: 'rgba(255,255,255,0.1)', outline: 'none',
                    cursor: 'pointer', accentColor: 'var(--accent-secondary)',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'hsl(230,10%,45%)' }}>
                  <span>7 Days</span>
                  <span>30 Days (Recommended)</span>
                  <span>90 Days</span>
                </div>
              </div>

              {/* Scrubber Forecast Metric values */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: '#020406', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', padding: '10px 12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase' }}>Predicted Score</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-secondary)', marginTop: '4px' }}>
                    {activeForecast.predictedScore} / 100
                  </div>
                </div>
                <div style={{ background: '#020406', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', padding: '10px 12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase' }}>Compliance Drift</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '4px' }}>
                    {activeForecast.complianceDrift}%
                  </div>
                </div>
                <div style={{ background: '#020406', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', padding: '10px 12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase' }}>Attack Surface</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-safe)', marginTop: '4px' }}>
                    -{activeForecast.attackSurfacePercentage}%
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Interactive Risk Heatmap */}
          <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={14} color="var(--accent-secondary)" /> Business Units Risk Heatmap Grid
              </h3>
              <p style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)', margin: '2px 0 0' }}>
                Departments mapping displaying applications severity, cloud provider, and exposure outcomes
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {heatmap.map((node, i) => (
                <HeatmapCard key={i} node={node} />
              ))}
            </div>
          </section>
        </div>

        {/* Right Side Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Executive Copilot Chat */}
          <section className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Brain size={14} color="var(--accent-secondary)" /> Boardroom Copilot Sandbox
              </h3>
              <p style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)', margin: '2px 0 0' }}>
                Audit corporate compliance, investment priorities, and ROI outcomes via natural language
              </p>
            </div>
            <CopilotChatWindow />
          </section>

          {/* Board Report Narratives */}
          {reports.length > 0 && (
            <section className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="var(--accent-secondary)" /> Board Narrative & Briefings
                </h3>
                <p style={{ fontSize: '0.58rem', color: 'hsl(230,10%,50%)', margin: '2px 0 0' }}>
                  Quarterly summaries prepared for SecOps board reporting reviews
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reports.map(rep => (
                  <div key={rep.id} style={{
                    background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                    borderRadius: '6px', padding: '14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fff' }}>{rep.title}</span>
                      <span style={{
                        fontSize: '0.48rem', padding: '1px 5px', borderRadius: '3px',
                        background: 'rgba(255,255,255,0.04)', color: 'hsl(230,10%,50%)',
                        textTransform: 'uppercase', fontWeight: 600,
                      }}>{rep.type}</span>
                    </div>
                    <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,65%)', margin: 0, lineHeight: 1.4 }}>
                      {rep.narrativeSummary}
                    </p>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', marginTop: '10px', paddingTop: '8px' }}>
                      <span style={{ fontSize: '0.52rem', textTransform: 'uppercase', color: 'hsl(230,10%,45%)', display: 'block', marginBottom: '4px' }}>
                        Executive Draft
                      </span>
                      <pre style={{
                        background: '#020406', border: '1px solid rgba(255,255,255,0.02)',
                        borderRadius: '4px', padding: '8px', fontSize: '0.52rem', fontFamily: 'var(--font-mono)',
                        color: 'hsl(230,10%,70%)', margin: 0, whiteSpace: 'pre-wrap', maxHeight: '120px',
                        overflowY: 'auto',
                      }}>
                        {rep.markdownContent}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

      </div>

      {/* Footer */}
      <footer style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.7rem', color: 'hsl(230,10%,40%)',
        padding: '12px 0 24px', borderTop: '1px solid rgba(255,255,255,0.03)',
      }}>
        <div>© 2026 CloudGuard AI Inc. — Executive Risk Suite v1.0</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Executive Service: localhost:4005</span>
          <span>Bloomberg Keynote Framework</span>
        </div>
      </footer>
    </div>
  );
}
