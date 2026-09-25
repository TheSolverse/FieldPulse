import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  RotateCcw, 
  Layers, 
  PlayCircle,
  Sun,
  Moon,
  Activity
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const { 
    project, 
    settings, 
    theme,
    toggleTheme,
    resetAllData,
    progressEvents,
    fieldRecords
  } = useApp();

  const metrics = {
    received: fieldRecords.filter(r => r.processingStatus === 'received').length,
    processed: progressEvents.length,
    pending: progressEvents.filter(e => e.validationStatus === 'pending').length,
    approved: progressEvents.filter(e => e.validationStatus === 'approved').length,
    unmatched: progressEvents.filter(e => e.confidenceLevel === 'UNMATCHED').length
  };

  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 50,
      position: 'relative'
    }}>
      {/* Decorative brand gradient line at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'var(--brand-gradient)',
        opacity: 0.6
      }} />

      {/* LEFT: Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          background: 'var(--accent-primary)',
          color: '#ffffff',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(79, 70, 229, 0.3)',
          flexShrink: 0
        }}>
          <Activity size={20} strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 700, 
              letterSpacing: '1.2px', 
              color: 'var(--accent-primary)', 
              textTransform: 'uppercase' 
            }}>
              SOLVERSE
            </span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-primary)', lineHeight: 1.2 }}>
            FIELD PULSE
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Execution-to-Schedule Intelligence
          </div>
        </div>
      </div>

      {/* Center: Project Selector */}
      <div className="topbar-project-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.1px' }}>
          {project.name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          {project.location}
        </div>
      </div>

      {/* Right: Controls & User */}
      <div className="topbar-actions-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <Calendar size={13} color="var(--accent-primary)" />
          <span>Cut-off:</span>
          <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{settings.dataDate}</strong>
        </div>

        <button
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{ padding: '6px', borderRadius: '4px' }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button
          onClick={resetAllData}
          className="btn btn-secondary"
          style={{ padding: '5px 11px', fontSize: '12px', borderRadius: '4px' }}
          title="Reset Demo State"
        >
          <RotateCcw size={13} />
          <span>Reset Demo</span>
        </button>
      </div>
    </header>
  );
};
