import React from 'react';
import { useApp } from '../../context/AppContext';

export const GlobalStatusStrip: React.FC = () => {
  const { fieldRecords, progressEvents } = useApp();

  const metrics = {
    received: fieldRecords.filter(r => r.processingStatus === 'received').length,
    processed: progressEvents.length,
    pending: progressEvents.filter(e => e.validationStatus === 'pending').length,
    approved: progressEvents.filter(e => e.validationStatus === 'approved').length,
    unmatched: progressEvents.filter(e => e.confidenceLevel === 'UNMATCHED').length
  };

  return (
    <div className="global-status-strip" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '8px 24px',
      background: 'var(--bg-base)',
      borderBottom: '1px solid var(--border-subtle)',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.5px',
      color: 'var(--text-secondary)'
    }}>
      <div style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
        <span>RECEIVED</span>
        <span style={{ color: 'var(--text-primary)' }}>{metrics.received}</span>
      </div>
      
      <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />
      
      <div style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
        <span>PROCESSED</span>
        <span style={{ color: 'var(--text-primary)' }}>{metrics.processed}</span>
      </div>
      
      <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />
      
      <div style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
        <span>REVIEW</span>
        <span style={{ color: metrics.pending > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
          {metrics.pending}
        </span>
      </div>
      
      <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />
      
      <div style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
        <span>APPROVED</span>
        <span style={{ color: 'var(--success)' }}>{metrics.approved}</span>
      </div>
      
      {metrics.unmatched > 0 && (
        <>
          <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', gap: '8px', cursor: 'pointer', color: 'var(--danger)' }}>
            <span>UNMATCHED</span>
            <span>{metrics.unmatched}</span>
          </div>
        </>
      )}
    </div>
  );
};
