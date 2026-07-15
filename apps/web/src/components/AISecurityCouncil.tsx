"use client";

import React, { useEffect, useRef } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { MessageSquare, BadgeHelp, CheckCircle } from 'lucide-react';

export const AISecurityCouncil: React.FC = () => {
  const agents = useSimulationStore(state => state.agents);
  const chatMessages = useSimulationStore(state => state.chatMessages);
  const phase = useSimulationStore(state => state.phase);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const getAgentColor = (agentId: string) => {
    switch (agentId) {
      case 'agent-network':
        return 'var(--accent-secondary)';
      case 'agent-iam':
        return 'var(--accent-primary)';
      case 'agent-compliance':
        return 'var(--color-info)';
      default:
        return '#fff';
    }
  };

  const getAgentBg = (agentId: string) => {
    switch (agentId) {
      case 'agent-network':
        return 'rgba(186, 90, 48, 0.05)';
      case 'agent-iam':
        return 'rgba(262, 85, 63, 0.05)';
      case 'agent-compliance':
        return 'rgba(205, 85, 55, 0.05)';
      default:
        return 'rgba(255, 255, 255, 0.03)';
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
          <MessageSquare size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>AI Security Council</h3>
        </div>
        <span style={{
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          backgroundColor: phase === 'future' ? 'rgba(245, 34, 45, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          color: phase === 'future' ? 'var(--color-danger)' : 'hsl(230, 10%, 60%)',
          padding: '2px 8px',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {phase === 'future' ? 'Active Investigation' : 'Monitor Mode'}
        </span>
      </div>

      {/* Agents Row */}
      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(0,0,0,0.1)'
      }}>
        {agents.map(agent => {
          const isSpeaking = agent.status === 'speaking';
          const isCompleted = agent.status === 'completed';
          const color = getAgentColor(agent.id);

          return (
            <div
              key={agent.id}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: `1px solid ${isSpeaking ? color : 'var(--border-color)'}`,
                boxShadow: isSpeaking ? `0 0 10px ${color}33` : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all var(--transition-normal)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{agent.avatar}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'hsl(230, 10%, 50%)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {agent.role}
                  </div>
                </div>
              </div>

              {/* Agent Status indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '6px'
              }}>
                <span style={{ color: 'hsl(230, 10%, 60%)' }}>Status:</span>
                <span style={{
                  fontWeight: 600,
                  color: isSpeaking 
                    ? color 
                    : isCompleted 
                    ? 'var(--color-safe)' 
                    : 'hsl(230, 10%, 45%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isSpeaking ? (
                    <>
                      <span className="pulse-icon">●</span> Speaking
                    </>
                  ) : isCompleted ? (
                    <>
                      ✓ Done
                    </>
                  ) : (
                    'Idle'
                  )}
                </span>
              </div>

              {/* Confidence Meter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'hsl(230, 10%, 50%)' }}>
                  <span>Model Confidence</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{agent.confidence}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${agent.confidence}%`,
                    backgroundColor: color,
                    transition: 'width 1s ease-in-out'
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat Thread Area */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'rgba(0, 0, 0, 0.15)'
      }}>
        {chatMessages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'hsl(230, 10%, 45%)',
            gap: '12px',
            textAlign: 'center',
            padding: '20px'
          }}>
            <BadgeHelp size={32} strokeWidth={1.5} />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'hsl(230, 10%, 70%)', fontWeight: 500 }}>Council Standby</div>
              <p style={{ fontSize: '0.75rem', marginTop: '4px', maxWidth: '280px' }}>
                Move the timeline slider to **&quot;Simulated PR-402&quot;** to trigger collaborative multi-agent threat reasoning.
              </p>
            </div>
          </div>
        ) : (
          chatMessages.map(msg => {
            const color = getAgentColor(msg.agentId);
            const agentBg = getAgentBg(msg.agentId);

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  maxWidth: '85%',
                  alignSelf: 'flex-start',
                  animation: 'float 6s ease-in-out infinite'
                }}
              >
                {/* Agent Name Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.7rem',
                  color: 'hsl(230, 10%, 55%)',
                  marginBottom: '4px',
                  paddingLeft: '4px'
                }}>
                  <span style={{ color }}>●</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{msg.agentName} Agent</span>
                  <span>{msg.timestamp}</span>
                  <span style={{
                    fontSize: '0.6rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '1px 4px',
                    borderRadius: '3px'
                  }}>
                    {msg.phase}
                  </span>
                </div>

                {/* Message Bubble */}
                <div style={{
                  backgroundColor: agentBg,
                  border: `1px solid ${color}2b`,
                  borderRadius: '10px',
                  borderTopLeftRadius: '2px',
                  padding: '12px 14px',
                  fontSize: '0.8rem',
                  color: 'hsl(230, 10%, 90%)',
                  lineHeight: '1.45',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Footer System Log Status */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.75rem',
        color: 'hsl(230, 10%, 60%)'
      }}>
        {chatMessages.length === 0 ? (
          <>
            <span style={{ color: 'var(--color-info)' }}>●</span>
            <span>Standing by. Awaiting deployment simulations...</span>
          </>
        ) : chatMessages.length < 6 ? (
          <>
            <span className="pulse-icon" style={{ color: 'var(--color-warning)' }}>●</span>
            <span>Council negotiating system context...</span>
          </>
        ) : (
          <>
            <CheckCircle size={12} color="var(--color-safe)" />
            <span style={{ color: 'var(--color-safe)' }}>Consensus Reached. Security Copilot Canvas loaded.</span>
          </>
        )}
      </div>
    </div>
  );
};
