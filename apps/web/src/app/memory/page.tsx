"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMemoryStore } from '../../store/useMemoryStore';
import {
  Brain, ChevronLeft, Search, Database, Network, ShieldAlert,
  Clock, GitBranch, ArrowRight, Loader, Tag, ShieldAlert as AlertIcon,
  Layers, Lock, HelpCircle, Code2, PlusCircle, CheckCircle2
} from 'lucide-react';
import type { MemoryLayer, MemoryEntry, MemoryGraphData } from '@cloudguard/types';

// ─── Layer Badge Colors ──────────────────────────────────────────────────────

const LAYER_COLORS: Record<MemoryLayer, { color: string; bg: string }> = {
  working:        { color: 'var(--accent-secondary)', bg: 'rgba(0, 217, 255, 0.08)' },
  conversation:   { color: '#a0a0a0',                bg: 'rgba(250, 250, 250, 0.03)' },
  infrastructure: { color: '#4285F4',                bg: 'rgba(66, 133, 244, 0.08)' },
  threat:         { color: 'var(--color-danger)',    bg: 'rgba(245, 34, 45, 0.08)' },
  incident:       { color: 'var(--color-warning)',   bg: 'rgba(250, 173, 20, 0.08)' },
  deployment:     { color: '#7B42BC',                bg: 'rgba(123, 66, 188, 0.08)' },
  compliance:     { color: '#8BC34A',                bg: 'rgba(139, 195, 74, 0.08)' },
  executive:      { color: '#00D9FF',                bg: 'rgba(0, 217, 255, 0.08)' },
};

// ─── Stats Ribbon Card ────────────────────────────────────────────────────────

function MetricCard({ label, value, icon, color }: {
  label: string; value: string | number; icon: React.ReactNode; color: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
    }}>
      <div style={{ color, background: `${color}10`, padding: '8px', borderRadius: '6px' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: '0.55rem', color: 'hsl(230,10%,50%)', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '2px' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Predefined Prompt button ─────────────────────────────────────────────────

function PromptButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-color)',
        color: 'hsl(230,10%,70%)',
        fontSize: '0.62rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-secondary)'; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'hsl(230,10%,70%)'; }}
    >
      <HelpCircle size={10} color="var(--accent-secondary)" />
      {text}
    </button>
  );
}

// ─── Visual Memory Graph Rendering ────────────────────────────────────────────

function VectorGraphVisualizer({ graph }: { graph: MemoryGraphData | null }) {
  if (!graph) return null;

  return (
    <div style={{
      background: '#030508',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '16px',
      minHeight: '380px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Neo4j grid style backgroud */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', zIndex: 1, position: 'relative' }}>
        <span style={{ fontSize: '0.7rem', color: 'hsl(230,10%,55%)' }}>Neo4j Threat Knowledge Graph Network Map</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['layer', 'threat', 'memory'].map(g => (
            <div key={g} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: g === 'layer' ? 'var(--accent-secondary)' : g === 'threat' ? 'var(--color-danger)' : '#4285F4',
              }} />
              <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'hsl(230,10%,50%)' }}>{g}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1, position: 'relative' }}>
        {graph.nodes.slice(0, 12).map((node) => {
          const isLayer = node.group === 'layer';
          const isThreat = node.group === 'threat';
          const nodeColor = isLayer ? 'var(--accent-secondary)' : isThreat ? 'var(--color-danger)' : '#4285F4';

          // find linked relations
          const links = graph.edges.filter((e) => e.from === node.id || e.to === node.id);

          return (
            <div key={node.id} style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${nodeColor}25`,
              borderRadius: '6px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: nodeColor, boxShadow: `0 0 6px ${nodeColor}` }} />
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#fff' }}>{node.label}</span>
                <span style={{ fontSize: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '1px 5px', borderRadius: '3px', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', marginLeft: 'auto' }}>
                  {node.group}
                </span>
              </div>

              {links.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {links.slice(0, 3).map((link, i) => {
                    const destination = graph.nodes.find((n) => n.id === (link.from === node.id ? link.to : link.from));
                    return (
                      <span key={i} style={{
                        fontSize: '0.52rem', color: 'hsl(230,10%,50%)',
                        background: 'rgba(255,255,255,0.015)',
                        border: '1px solid var(--border-color)',
                        padding: '1px 6px', borderRadius: '3px',
                      }}>
                        {link.relation} → {destination?.label.slice(0, 20)}...
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Create Memory Modal ──────────────────────────────────────────────────────

function CreateMemoryModal({ onClose, onCreate }: { onClose: () => void; onCreate: (m: Omit<MemoryEntry, 'id' | 'timestamp'>) => void }) {
  const [layer, setLayer] = useState<MemoryLayer>('infrastructure');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  function handleSubmit() {
    if (!title || !description) return;
    onCreate({
      layer,
      title,
      description,
      tags: tagsStr.split(',').map(s => s.trim()).filter(Boolean),
      metadata: {}
    });
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      <div className="glass-panel" style={{
        padding: '24px', width: '450px',
        display: 'flex', flexDirection: 'column', gap: '16px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={16} color="var(--accent-secondary)" /> Commit Context to Long-Term Memory
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)' }}>Memory Layer</label>
          <select
            value={layer}
            onChange={e => setLayer(e.target.value as MemoryLayer)}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              borderRadius: '6px', padding: '8px 12px', fontSize: '0.7rem',
              color: 'hsl(230,10%,80%)', outline: 'none',
            }}
          >
            <option value="infrastructure">Infrastructure</option>
            <option value="incident">Incident</option>
            <option value="deployment">Deployment</option>
            <option value="executive">Executive Decision</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)' }}>Memory Title</label>
          <input
            type="text"
            placeholder="e.g. Incident INC-2026-948: Security Group override remediation"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              borderRadius: '6px', padding: '8px 12px', fontSize: '0.7rem',
              color: 'hsl(230,10%,80%)', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)' }}>Context Description</label>
          <textarea
            rows={3}
            placeholder="Detail the interaction, incident parameters, remediation decisions, or infrastructure configuration details..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              borderRadius: '6px', padding: '8px 12px', fontSize: '0.7rem',
              color: 'hsl(230,10%,80%)', outline: 'none', fontFamily: 'var(--font-sans)',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)' }}>Tags (comma-separated)</label>
          <input
            type="text"
            placeholder="secrets, database, rollback"
            value={tagsStr}
            onChange={e => setTagsStr(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              borderRadius: '6px', padding: '8px 12px', fontSize: '0.7rem',
              color: 'hsl(230,10%,80%)', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={handleSubmit}
            style={{
              flex: 1, padding: '9px',
              background: 'var(--accent-secondary)', border: 'none', borderRadius: '6px',
              color: '#000', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
            }}
          >
            Store Memory
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '9px 16px',
              background: 'transparent', border: '1px solid var(--border-color)',
              borderRadius: '6px', color: 'hsl(230,10%,60%)', fontSize: '0.75rem', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MemoryPage() {
  const stats = useMemoryStore(s => s.stats);
  const searchResults = useMemoryStore(s => s.searchResults);
  const threats = useMemoryStore(s => s.threats);
  const graph = useMemoryStore(s => s.graph);
  const searchQuery = useMemoryStore(s => s.searchQuery);
  const isSearching = useMemoryStore(s => s.isSearching);
  const activeTab = useMemoryStore(s => s.activeTab);

  const fetchStats = useMemoryStore(s => s.fetchStats);
  const fetchThreats = useMemoryStore(s => s.fetchThreats);
  const fetchGraph = useMemoryStore(s => s.fetchGraph);
  const searchMemory = useMemoryStore(s => s.searchMemory);
  const createMemory = useMemoryStore(s => s.createMemory);
  const setSearchQuery = useMemoryStore(s => s.setSearchQuery);
  const setActiveTab = useMemoryStore(s => s.setActiveTab);

  const [inputVal, setInputVal] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchThreats();
    fetchGraph();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!inputVal.trim()) return;
    searchMemory(inputVal.trim());
  }

  function handleShortcut(promptText: string) {
    setInputVal(promptText);
    searchMemory(promptText);
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
      {/* Header */}
      <header className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
            <Brain size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Threat Knowledge & Context Engine</h1>
            <p style={{ fontSize: '0.65rem', color: 'hsl(230,10%,50%)', margin: 0 }}>
              Semantic retrieval network Purging memory statelessness across cloud deployments
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          style={{
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
            borderRadius: '6px', color: '#fff', fontSize: '0.7rem', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-secondary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <PlusCircle size={13} color="var(--accent-secondary)" /> Commit Context
        </button>
      </header>

      {/* Modal */}
      {modalOpen && (
        <CreateMemoryModal
          onClose={() => setModalOpen(false)}
          onCreate={(m) => createMemory(m)}
        />
      )}

      {/* Metrics ribbon */}
      {stats && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          <MetricCard label="Active Memory Vectors" value={stats.totalVectors.toLocaleString()} icon={<Database size={16} />} color="var(--accent-secondary)" />
          <MetricCard label="Knowledge Graph Nodes" value={stats.graphNodes} icon={<Network size={16} />} color="var(--accent-primary)" />
          <MetricCard label="Graph Relationships" value={stats.graphEdges} icon={<GitBranch size={16} />} color="#7B42BC" />
          <MetricCard label="Threat Advisories Ingested" value={stats.ingestedAdvisories} icon={<AlertIcon size={16} />} color="var(--color-danger)" />
        </section>
      )}

      {/* Semantic Explorer & Search Tab panel */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Navigation tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          {[
            { id: 'search', label: 'Semantic Memory Retrieval', icon: <Search size={12} /> },
            { id: 'threats', label: 'Threat Intel Feeds (CISA KEV)', icon: <AlertIcon size={12} /> },
            { id: 'graph', label: 'Neo4j Relations Map', icon: <Network size={12} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'search' | 'threats' | 'graph')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px', background: 'none', border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-secondary)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--accent-secondary)' : 'hsl(230,10%,50%)',
                fontSize: '0.72rem', fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content panel */}
        <div className="glass-panel" style={{ borderRadius: '0 0 12px 12px', padding: '20px 24px', minHeight: '420px' }}>
          {activeTab === 'search' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Search form */}
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '10px 14px',
                }}>
                  <Search size={16} color="hsl(230,10%,45%)" />
                  <input
                    type="text"
                    placeholder="Search database via natural language, e.g. 'Show every incident similar to Log4Shell'..."
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      fontSize: '0.78rem', color: '#fff',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  style={{
                    background: 'var(--accent-secondary)', border: 'none', borderRadius: '8px',
                    padding: '0 20px', color: '#000', fontSize: '0.75rem', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  {isSearching ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={14} />}
                  Recall
                </button>
              </form>

              {/* Suggestions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.58rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Predefined Semantic Context Targets
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <PromptButton text="Show every incident similar to Log4Shell" onClick={() => handleShortcut('Show every incident similar to Log4Shell')} />
                  <PromptButton text="When did this IAM role first become high risk?" onClick={() => handleShortcut('When did this IAM role first become high risk?')} />
                  <PromptButton text="Which deployment introduced this CVE?" onClick={() => handleShortcut('Which deployment introduced this CVE?')} />
                  <PromptButton text="Have we seen this attack before?" onClick={() => handleShortcut('Have we seen this attack before?')} />
                  <PromptButton text="What was the previous remediation?" onClick={() => handleShortcut('What was the previous remediation?')} />
                </div>
              </div>

              {/* Search results loading/empty/results feed */}
              {isSearching ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '60px 0', color: 'hsl(230,10%,50%)' }}>
                  <Loader size={24} color="var(--accent-secondary)" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '0.7rem' }}>Running Semantic Vector Search & Neo4j Relations Ingestion...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: 'hsl(230,10%,40%)' }}>
                  <Brain size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Memory Context Empty</div>
                  <div style={{ fontSize: '0.62rem', marginTop: '4px' }}>Submit a semantic search query or choose a predefined target.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.6rem', color: 'hsl(230,10%,45%)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Hybrid semantic matches found ({searchResults.length})
                  </div>
                  {searchResults.map((result, index) => {
                    const layerMeta = LAYER_COLORS[result.entry.layer] ?? { color: '#888', bg: 'rgba(255,255,255,0.05)' };
                    return (
                      <div key={index} className="finding-enter" style={{
                        background: 'rgba(255,255,255,0.015)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px', padding: '16px',
                        display: 'flex', flexDirection: 'column', gap: '12px',
                      }}>
                        {/* Title bar */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                          <div>
                            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                              {result.entry.title}
                            </h3>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '5px', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '0.52rem', padding: '1px 6px', borderRadius: '3px',
                                background: layerMeta.bg, color: layerMeta.color, fontWeight: 700,
                              }}>
                                {result.entry.layer.toUpperCase()}
                              </span>
                              <span style={{ fontSize: '0.52rem', color: 'hsl(230,10%,45%)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={10} /> {new Date(result.entry.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Similarity ring */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 850, color: 'var(--accent-secondary)' }}>
                              {result.similarityScore}%
                            </div>
                            <span style={{ fontSize: '0.48rem', color: 'hsl(230,10%,40%)', textTransform: 'uppercase' }}>
                              Similarity
                            </span>
                          </div>
                        </div>

                        {/* Content text */}
                        <p style={{ fontSize: '0.68rem', color: 'hsl(230,10%,75%)', lineHeight: '1.5', margin: 0 }}>
                          {result.entry.description}
                        </p>

                        {/* Retrieval Reason */}
                        <div style={{
                          background: 'rgba(0, 217, 255, 0.04)',
                          border: '1px solid rgba(0, 217, 255, 0.12)',
                          borderRadius: '6px', padding: '8px 10px',
                          fontSize: '0.62rem', color: 'var(--accent-secondary)', lineHeight: '1.4',
                        }}>
                          <strong style={{ textTransform: 'uppercase', fontSize: '0.52rem', display: 'block', marginBottom: '2px' }}>
                            Why This Memory Was Selected
                          </strong>
                          {result.retrievalReason}
                        </div>

                        {/* Supporting Evidence */}
                        {result.supportingEvidence && result.supportingEvidence.length > 0 && (
                          <div>
                            <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'hsl(230,10%,45%)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                              Supporting Evidence Sources
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {result.supportingEvidence.map((ev, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.6rem', color: 'hsl(230,10%,65%)' }}>
                                  <CheckCircle2 size={10} color="var(--color-safe)" /> {ev}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'threats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '0.7rem', color: 'hsl(230,10%,50%)', marginBottom: '4px' }}>
                Ingested Threat Advisories & Detections (CISA KEV / NVD Feeds)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {threats.map((threat, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)',
                    borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-danger)' }}>{threat.id}</span>
                      <span style={{ fontSize: '0.5rem', background: 'rgba(245,34,45,0.08)', border: '1px solid rgba(245,34,45,0.2)', padding: '1px 5px', borderRadius: '3px', color: 'var(--color-danger)', fontWeight: 600 }}>
                        {threat.source}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{threat.title}</div>
                    <p style={{ fontSize: '0.62rem', color: 'hsl(230,10%,50%)', lineHeight: '1.4', margin: 0 }}>
                      {threat.description}
                    </p>
                    {threat.mitreTtp && (
                      <div style={{ fontSize: '0.58rem', color: 'var(--accent-secondary)', fontFamily: 'var(--font-mono)' }}>
                        MITRE: {threat.mitreTtp}
                      </div>
                    )}
                    {threat.detectionRule && (
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '0.52rem', textTransform: 'uppercase', color: 'hsl(230,10%,45%)', display: 'block', marginBottom: '2px' }}>
                          Active YARA/Sigma Rule
                        </span>
                        <pre style={{
                          background: '#030508', border: '1px solid rgba(255,255,255,0.04)',
                          borderRadius: '4px', padding: '6px', fontSize: '0.52rem', fontFamily: 'var(--font-mono)',
                          color: 'hsl(230,10%,70%)', margin: 0, overflowX: 'auto',
                        }}>
                          {threat.detectionRule}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'graph' && (
            <VectorGraphVisualizer graph={graph} />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.7rem', color: 'hsl(230,10%,40%)',
        padding: '12px 0 24px', borderTop: '1px solid rgba(255,255,255,0.03)',
      }}>
        <div>© 2026 CloudGuard AI Inc. — Threat Knowledge & Context Engine v1.0</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Memory Service: localhost:4003</span>
          <span>Security Knowledge Base: Ingested</span>
        </div>
      </footer>
    </div>
  );
}
