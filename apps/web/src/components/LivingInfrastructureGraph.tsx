"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { 
  Globe, 
  ShieldCheck, 
  Cpu, 
  KeyRound, 
  Database, 
  FolderLock, 
  Key, 
  Network,
  Activity,
  Move
} from 'lucide-react';

// Coordinates layout base positions
const baseNodePositions: Record<string, { x: number; y: number }> = {
  internet: { x: 80, y: 200 },
  'alb-ingress': { x: 220, y: 200 },
  'eks-app-pod': { x: 380, y: 200 },
  'eks-iam-role': { x: 540, y: 200 },
  's3-customer-vault': { x: 720, y: 110 },
  'rds-payment-db': { x: 720, y: 290 },
  'kms-s3-key': { x: 880, y: 110 },
  'kms-rds-key': { x: 880, y: 290 },
};

export const LivingInfrastructureGraph: React.FC = () => {
  const resources = useSimulationStore(state => state.resources);
  const phase = useSimulationStore(state => state.phase);
  const activeLayer = useSimulationStore(state => state.activeLayer);
  const searchQuery = useSimulationStore(state => state.searchQuery);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('eks-app-pod');

  // Interactive Zoom / Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Interactive Node Drag State
  const [nodePositions, setNodePositions] = useState(baseNodePositions);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset positions when simulation resets to baseline
  useEffect(() => {
    if (phase === 'current') {
      const handle = requestAnimationFrame(() => {
        setNodePositions(baseNodePositions);
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [phase]);

  const selectedResource = resources.find(r => r.id === selectedNodeId);

  // Helper to determine node matching query
  const matchesSearch = (nodeId: string, nodeName: string, nodeType: string): boolean => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    
    if (q === 'database' || q === 'rds') {
      return nodeType === 'AWS_RDS_DB' || nodeId.includes('db');
    }
    if (q === 'exposed' || q === 'internet') {
      return nodeId === 'internet' || nodeId === 'alb-ingress' || nodeId === 'eks-app-pod';
    }
    if (q === 'role' || q === 'iam') {
      return nodeType === 'AWS_IAM_ROLE';
    }
    if (q === 'bucket' || q === 's3') {
      return nodeType === 'AWS_S3_BUCKET';
    }
    if (q === 'kms' || q === 'key') {
      return nodeType === 'AWS_KMS';
    }
    
    return nodeId.includes(q) || nodeName.toLowerCase().includes(q);
  };

  // Node Drag Event Handlers
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggedNodeId(nodeId);
    // Track cursor offset relative to node origin
    const pos = nodePositions[nodeId];
    dragStartRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
  };

  // Global SVG Mouse move handles both Panning and Dragging
  const handleSVGMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      // Node Dragging
      const x = e.clientX - dragStartRef.current.x;
      const y = e.clientY - dragStartRef.current.y;
      setNodePositions(prev => ({
        ...prev,
        [draggedNodeId]: { x, y }
      }));
    } else if (isPanning) {
      // Graph Panning
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({ x: dx, y: dy });
    }
  };

  const handleSVGMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking on background
    if (e.target instanceof SVGElement || e.target instanceof SVGGElement) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      };
    }
  };

  const handleSVGMouseUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  // Wheel Zoom Handler
  const handleSVGWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.08;
    let nextZoom = zoom + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
    // Cap zoom
    nextZoom = Math.max(0.5, Math.min(3, nextZoom));
    setZoom(nextZoom);
  };

  const resetZoomPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setNodePositions(baseNodePositions);
  };

  const getNodeIcon = (type: string, status: string) => {
    const size = 20;
    const color = 
      status === 'danger' 
        ? 'var(--color-danger)' 
        : status === 'warning' 
        ? 'var(--color-warning)' 
        : 'var(--accent-secondary)';

    switch (type) {
      case 'INTERNET':
        return <Globe size={size} color={color} />;
      case 'AWS_VPC':
        return <Network size={size} color={color} />;
      case 'K8S_POD':
        return <Cpu size={size} color={color} />;
      case 'AWS_IAM_ROLE':
        return <KeyRound size={size} color={color} />;
      case 'AWS_S3_BUCKET':
        return <FolderLock size={size} color={color} />;
      case 'AWS_RDS_DB':
        return <Database size={size} color={color} />;
      case 'AWS_KMS':
        return <Key size={size} color={color} />;
      default:
        return <ShieldCheck size={size} color={color} />;
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minHeight: '440px' }}>
      {/* Panel Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} color="var(--accent-secondary)" className="pulse-icon" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Living Infrastructure Digital Twin</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={resetZoomPan}
            style={{
              fontSize: '0.7rem',
              color: 'hsl(230, 10%, 60%)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              padding: '3px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Move size={10} />
            Recenter Graph
          </button>
          <span style={{
            fontSize: '0.75rem',
            color: 'hsl(230, 10%, 60%)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: phase === 'future' ? 'var(--color-danger)' : 'var(--color-safe)',
              boxShadow: phase === 'future' 
                ? '0 0 8px var(--color-danger)' 
                : '0 0 8px var(--color-safe)'
            }} />
            {phase === 'future' ? 'Simulated Vulnerable Twin' : 'Synchronized & Secure'}
          </span>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Left Side: SVG Graph Canvas */}
        <div 
          style={{ flex: 1, position: 'relative', background: 'rgba(0, 0, 0, 0.05)', minWidth: 0, cursor: isPanning ? 'grabbing' : 'grab' }}
          onMouseMove={handleSVGMouseMove}
          onMouseDown={handleSVGMouseDown}
          onMouseUp={handleSVGMouseUp}
          onMouseLeave={handleSVGMouseUp}
          onWheel={handleSVGWheel}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1000 400"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Arrow Markers and Filters */}
            <defs>
              <marker
                id="arrow-safe"
                viewBox="0 0 10 10"
                refX="25"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="hsla(186, 90%, 50%, 0.4)" />
              </marker>
              <marker
                id="arrow-danger"
                viewBox="0 0 10 10"
                refX="25"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-danger)" />
              </marker>
              {/* Blur filters for Risk Heatmap overlay */}
              <filter id="glow-risk">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Transform Group for Zoom / Pan */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transition: draggedNodeId ? 'none' : 'transform 0.1s ease-out' }}>
              
              {/* Draw Relationship edges */}
              {resources.map(res => {
                const fromPos = nodePositions[res.id];
                if (!fromPos) return null;

                const fromMatch = matchesSearch(res.id, res.name, res.type);

                return res.connections.map(targetId => {
                  const toPos = nodePositions[targetId];
                  if (!toPos) return null;

                  const toRes = resources.find(r => r.id === targetId);
                  const toMatch = toRes ? matchesSearch(targetId, toRes.name, toRes.type) : true;
                  
                  // Query highlight filter
                  const edgeOpacity = (fromMatch && toMatch) ? 1.0 : 0.15;

                  // Vulnerable check
                  const isVulnerablePath =
                    phase === 'future' &&
                    ((res.id === 'internet' && targetId === 'eks-app-pod') ||
                      (res.id === 'eks-app-pod' && targetId === 'eks-iam-role') ||
                      (res.id === 'eks-iam-role' && targetId === 's3-customer-vault'));

                  // Determine color based on active layer
                  let strokeColor = 'hsla(230, 15%, 35%, 0.35)';
                  let strokeWidth = 1.5;
                  let showFlow = false;

                  if (activeLayer === 'threat' && isVulnerablePath) {
                    strokeColor = 'var(--color-danger)';
                    strokeWidth = 3.0;
                    showFlow = true;
                  } else if (activeLayer === 'risk' && isVulnerablePath) {
                    strokeColor = 'var(--color-danger)';
                    strokeWidth = 2.5;
                    showFlow = true;
                  } else if (isVulnerablePath) {
                    strokeColor = 'var(--color-danger)';
                    strokeWidth = 2.0;
                    showFlow = true;
                  }

                  const markerId = isVulnerablePath ? 'url(#arrow-danger)' : 'url(#arrow-safe)';

                  return (
                    <g key={`${res.id}-${targetId}`} opacity={edgeOpacity} style={{ transition: 'opacity 0.2s' }}>
                      {/* Risk Heatmap overlay glow paths */}
                      {activeLayer === 'risk' && isVulnerablePath && (
                        <line
                          x1={fromPos.x}
                          y1={fromPos.y}
                          x2={toPos.x}
                          y2={toPos.y}
                          stroke="var(--color-danger)"
                          strokeWidth="8"
                          strokeOpacity="0.15"
                          strokeLinecap="round"
                          filter="url(#glow-risk)"
                        />
                      )}
                      <line
                        x1={fromPos.x}
                        y1={fromPos.y}
                        x2={toPos.x}
                        y2={toPos.y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        markerEnd={markerId}
                        className={showFlow ? 'animate-draw' : ''}
                        strokeLinecap="round"
                      />
                    </g>
                  );
                });
              })}

              {/* Draw Nodes */}
              {resources.map(res => {
                const pos = nodePositions[res.id];
                if (!pos) return null;

                const isSelected = selectedNodeId === res.id;
                const isDanger = res.status === 'danger';
                const isWarning = res.status === 'warning';

                const matched = matchesSearch(res.id, res.name, res.type);
                const nodeOpacity = matched ? 1.0 : 0.2;

                // Adjust color and glow depending on Active Layer
                let glowColor = 'rgba(0,0,0,0.5)';
                let borderColor = 'var(--border-color)';
                let rScore = res.riskScore;

                // Dynamic Risk Propagation Simulation
                if (activeLayer === 'risk') {
                  if (phase === 'future') {
                    // Propagate risk scores outward
                    if (res.id === 'eks-iam-role') rScore = 66; // 78 * 0.85
                    if (res.id === 's3-customer-vault') rScore = 56; // 66 * 0.85
                    if (res.id === 'rds-payment-db') rScore = 56;
                  }
                  
                  if (rScore >= 75) {
                    glowColor = 'var(--color-danger-glow)';
                    borderColor = 'var(--color-danger)';
                  } else if (rScore > 20) {
                    glowColor = 'var(--color-warning-glow)';
                    borderColor = 'var(--color-warning)';
                  } else {
                    glowColor = 'var(--color-safe-glow)';
                    borderColor = 'var(--color-safe)';
                  }
                } else if (activeLayer === 'compliance') {
                  // Compliance highlight
                  const hasViolation = isDanger || isWarning;
                  if (hasViolation) {
                    glowColor = 'var(--color-warning-glow)';
                    borderColor = 'var(--color-warning)';
                  }
                } else {
                  // Standard Layer
                  if (isSelected) {
                    glowColor = 'var(--accent-primary-glow)';
                    borderColor = 'var(--accent-primary)';
                  } else if (isDanger) {
                    glowColor = 'var(--color-danger-glow)';
                    borderColor = 'var(--color-danger)';
                  } else if (isWarning) {
                    glowColor = 'var(--color-warning-glow)';
                    borderColor = 'var(--color-warning)';
                  }
                }

                return (
                  <g
                    key={res.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => setSelectedNodeId(res.id)}
                    onMouseDown={(e) => handleNodeMouseDown(e, res.id)}
                    style={{ cursor: draggedNodeId === res.id ? 'grabbing' : 'grab' }}
                    opacity={nodeOpacity}
                  >
                    {/* Ring glow */}
                    <circle
                      r="24"
                      fill="var(--bg-card)"
                      stroke={borderColor}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      style={{
                        transition: 'all var(--transition-normal)',
                        filter: `drop-shadow(0 0 8px ${glowColor})`,
                      }}
                      className={(isDanger || activeLayer === 'risk' && rScore >= 75) ? 'pulse-danger' : ''}
                    />

                    {/* Centered Node Icon */}
                    <foreignObject
                      x="-10"
                      y="-10"
                      width="20"
                      height="20"
                      style={{ pointerEvents: 'none' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {getNodeIcon(res.type, (activeLayer === 'risk' && rScore > 20) ? 'danger' : res.status)}
                      </div>
                    </foreignObject>

                    {/* Node Title */}
                    <text
                      y="38"
                      textAnchor="middle"
                      fill="#fff"
                      style={{
                        fontSize: '11px',
                        fontWeight: isSelected ? 600 : 400,
                        fontFamily: 'var(--font-sans)',
                        pointerEvents: 'none',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {res.name}
                    </text>

                    {/* Risk Badge */}
                    {rScore > 0 && (
                      <g transform="translate(18, -18)">
                        <circle
                          r="8"
                          fill={rScore >= 70 ? 'var(--color-danger)' : 'var(--color-warning)'}
                        />
                        <text
                          textAnchor="middle"
                          y="3"
                          fill="#fff"
                          style={{
                            fontSize: '8px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {rScore}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Map instructions layout */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '0.65rem',
            color: 'hsl(230, 10%, 60%)',
            display: 'flex',
            gap: '8px',
            backdropFilter: 'var(--glass-blur)'
          }}>
            <span>🖱 Drag to Pan</span>
            <span>☸ Scroll to Zoom</span>
            <span>🔴 Drag Nodes</span>
          </div>
        </div>

        {/* Right Side: Genome Inspector Panel */}
        <div style={{
          width: '320px',
          borderLeft: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          {selectedResource ? (
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{
                  backgroundColor: 
                    selectedResource.status === 'danger' 
                      ? 'rgba(245, 34, 45, 0.15)' 
                      : selectedResource.status === 'warning'
                      ? 'rgba(250, 173, 20, 0.15)'
                      : 'rgba(82, 196, 26, 0.15)',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex'
                }}>
                  {getNodeIcon(selectedResource.type, selectedResource.status)}
                </span>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{selectedResource.name}</h4>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(230, 10%, 55%)', fontFamily: 'var(--font-mono)' }}>
                    {selectedResource.type}
                  </span>
                </div>
              </div>

              {/* Status Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(230, 10%, 65%)' }}>Entity Security State</span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 
                    selectedResource.status === 'danger' 
                      ? 'var(--color-danger)' 
                      : selectedResource.status === 'warning'
                      ? 'var(--color-warning)'
                      : 'var(--color-safe)'
                }}>
                  {selectedResource.status.toUpperCase()}
                </span>
              </div>

              {/* Genome Inspector Details */}
              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ fontSize: '0.75rem', color: 'hsl(230, 10%, 75%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Infrastructure Genome
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(selectedResource.genome).map(([key, value]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return (
                      <div key={key} style={{ fontSize: '0.75rem' }}>
                        <div style={{ color: 'hsl(230, 10%, 50%)', marginBottom: '3px' }}>{label}</div>
                        {Array.isArray(value) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {value.map((v, i) => (
                              <code key={i} style={{
                                display: 'block',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                color: selectedResource.status === 'danger' ? 'var(--color-danger)' : 'var(--accent-secondary)',
                                wordBreak: 'break-all',
                                fontSize: '0.7rem'
                              }}>
                                {v}
                              </code>
                            ))}
                          </div>
                        ) : (
                          <code style={{
                            display: 'block',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            padding: '4px 6px',
                            color: '#fff',
                            wordBreak: 'break-all',
                            fontSize: '0.7rem'
                          }}>
                            {String(value)}
                          </code>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Linked resources */}
              <div>
                <h5 style={{ fontSize: '0.75rem', color: 'hsl(230, 10%, 75%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Graph Boundaries ({selectedResource.connections.length})
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedResource.connections.map(connId => {
                    const connRes = resources.find(r => r.id === connId);
                    return (
                      <div
                        key={connId}
                        onClick={() => setSelectedNodeId(connId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          color: '#fff'
                        }}
                      >
                        <span style={{ opacity: 0.7 }}>➔</span>
                        <span>{connRes ? connRes.name : connId}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', color: 'hsl(230, 10%, 45%)', fontSize: '0.8rem', padding: '20px' }}>
              Select a resource node to inspect its genome boundaries.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
