"use client";

import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Search, Layers, ShieldCheck, Flame, ShieldAlert, Award } from 'lucide-react';

export const DigitalTwinSearch: React.FC = () => {
  const searchQuery = useSimulationStore(state => state.searchQuery);
  const setSearchQuery = useSimulationStore(state => state.setSearchQuery);
  const activeLayer = useSimulationStore(state => state.activeLayer);
  const setActiveLayer = useSimulationStore(state => state.setActiveLayer);

  const layersList = [
    { id: 'standard', name: 'Standard Twin', icon: <Layers size={14} />, color: 'var(--accent-secondary)' },
    { id: 'risk', name: 'Risk Heatmap', icon: <Flame size={14} />, color: 'var(--color-danger)' },
    { id: 'threat', name: 'Threat Vector', icon: <ShieldAlert size={14} />, color: 'var(--accent-primary)' },
    { id: 'compliance', name: 'Compliance Audit', icon: <Award size={14} />, color: 'var(--color-info)' },
  ] as const;

  return (
    <div className="glass-panel" style={{
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      flexWrap: 'wrap',
      background: 'rgba(0, 0, 0, 0.2)'
    }}>
      {/* Search Input Bar */}
      <div style={{
        position: 'relative',
        flex: 1,
        minWidth: '260px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <span style={{ position: 'absolute', left: '12px', display: 'flex', opacity: 0.5 }}>
          <Search size={16} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder='Query Digital Twin (e.g., "databases", "exposed roles", "S3 buckets")...'
          style={{
            width: '100%',
            backgroundColor: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '8px 12px 8px 36px',
            fontSize: '0.8rem',
            color: '#fff',
            outline: 'none',
            transition: 'border-color var(--transition-fast)'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '12px',
              fontSize: '0.75rem',
              color: 'hsl(230, 10%, 50%)',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Map Layer Overlays Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '0.7rem',
          color: 'hsl(230, 10%, 50%)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 600
        }}>
          Map Layer:
        </span>
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '2px'
        }}>
          {layersList.map((layer) => {
            const isSelected = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#fff' : 'hsl(230, 10%, 55%)',
                  background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  border: isSelected ? `1px solid ${layer.color}40` : '1px solid transparent',
                  boxShadow: isSelected ? `0 0 8px ${layer.color}15` : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <span style={{ color: isSelected ? layer.color : 'inherit', display: 'flex' }}>
                  {layer.icon}
                </span>
                <span>{layer.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
