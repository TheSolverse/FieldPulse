import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ScheduleActivity } from '../types';
import { 
  Calendar, 
  RotateCw, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Eye,
  Filter
} from 'lucide-react';

export const LiveScheduleGanttView: React.FC = () => {
  const { 
    activities, 
    settings, 
    syncWithPMIS, 
    setInspectingP6Activity, 
    setTracingEvidenceActivity 
  } = useApp();

  const [disciplineFilter, setDisciplineFilter] = useState<string>('ALL');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const filteredActivities = activities.filter(a => {
    if (disciplineFilter !== 'ALL' && a.discipline !== disciplineFilter) return false;
    return true;
  });

  const pendingSyncCount = activities.filter(a => a.syncStatus === 'pending_sync').length;

  const handleSyncAll = async () => {
    const pending = activities.filter(a => a.syncStatus === 'pending_sync');
    for (const act of pending) {
      await syncWithPMIS(act.id);
    }
    setSyncSuccessMsg(`Synchronized ${pending.length} activity actuals to Local Mock PMIS Adapter (/api/mock-pmis/sync).`);
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  // Timeline bounds (Aug 2026 to Oct 2026: ~90 days)
  const timelineStart = new Date('2026-08-01').getTime();
  const timelineEnd = new Date('2026-10-31').getTime();
  const totalDuration = timelineEnd - timelineStart;

  const getPositionPercent = (dateStr: string) => {
    const d = new Date(dateStr).getTime();
    const pos = ((d - timelineStart) / totalDuration) * 100;
    return Math.max(0, Math.min(100, pos));
  };

  const dataDatePos = getPositionPercent(settings.dataDate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Live Schedule & Gantt Baseline Comparison
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time visual comparison of planned Primavera baseline bars against field actual progress with indicative elapsed variance.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
          >
            <option value="ALL">All Disciplines</option>
            <option value="PIPING">Piping</option>
            <option value="CIVIL">Civil</option>
            <option value="STATIC_EQUIP">Static Equipment</option>
            <option value="ROTATING_EQUIP">Rotating Equipment</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="INSTRUMENTATION">Instrumentation</option>
            <option value="HSE">HSE</option>
          </select>

          <button
            disabled={pendingSyncCount === 0}
            onClick={handleSyncAll}
            className="btn btn-primary"
            style={{ opacity: pendingSyncCount > 0 ? 1 : 0.6 }}
          >
            <RotateCw size={14} />
            <span>Sync to Mock PMIS ({pendingSyncCount})</span>
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncSuccessMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '12.5px',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* Gantt Canvas */}
      <div className="oil-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table & Timeline Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '440px 1fr',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface-elevated)'
        }}>
          {/* Left Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 180px 70px 80px',
            padding: '12px 16px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            borderRight: '1px solid var(--border-subtle)'
          }}>
            <span>Code</span>
            <span>Description</span>
            <span>% Comp</span>
            <span>Variance</span>
          </div>

          {/* Right Calendar Scale */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <div style={{ position: 'absolute', left: '0%' }}>01 Aug</div>
            <div style={{ position: 'absolute', left: '16%' }}>15 Aug</div>
            <div style={{ position: 'absolute', left: '33%' }}>01 Sep</div>
            <div style={{ position: 'absolute', left: '50%' }}>15 Sep</div>
            <div style={{ position: 'absolute', left: '66%' }}>01 Oct</div>
            <div style={{ position: 'absolute', left: '83%' }}>15 Oct</div>
            <div style={{ position: 'absolute', right: '16px' }}>31 Oct</div>

            {/* Vertical Data Date Line */}
            <div style={{
              position: 'absolute',
              left: `${dataDatePos}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              background: '#EF4444',
              zIndex: 10
            }} title={`Status Data Date: ${settings.dataDate}`} />
          </div>
        </div>

        {/* Activity Rows */}
        <div style={{ maxHeight: '620px', overflowY: 'auto' }}>
          {filteredActivities.map((act) => {
            const plannedLeft = getPositionPercent(act.plannedStart);
            const plannedWidth = Math.max(3, getPositionPercent(act.plannedFinish) - plannedLeft);

            const actualStart = act.actualStart || act.plannedStart;
            const actualEnd = act.actualFinish || settings.dataDate;
            const actualLeft = getPositionPercent(actualStart);
            const actualWidth = Math.max(3, getPositionPercent(actualEnd) - actualLeft);

            return (
              <div
                key={act.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '440px 1fr',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: act.syncStatus === 'pending_sync' ? 'rgba(245, 158, 11, 0.04)' : 'transparent',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = act.syncStatus === 'pending_sync' ? 'rgba(245, 158, 11, 0.06)' : 'transparent'}
              >
                {/* Left Columns */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 180px 70px 80px',
                  padding: '10px 16px',
                  fontSize: '12px',
                  alignItems: 'center',
                  borderRight: '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <strong style={{ color: 'var(--teal-accent)' }}>{act.activityCode}</strong>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>L{act.level} / {act.discipline}</div>
                  </div>

                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }} title={act.description}>
                    {act.description}
                  </div>

                  <div>
                    <strong style={{ color: act.percentComplete === 100 ? '#34D399' : act.percentComplete > 0 ? 'var(--teal-accent)' : 'var(--text-muted)' }}>
                      {act.percentComplete}%
                    </strong>
                  </div>

                  <div>
                    {act.durationVariance !== undefined && act.durationVariance !== null && act.percentComplete > 0 ? (
                      <span className={`badge badge-${act.durationVariance > 0 ? 'warning' : act.durationVariance < 0 ? 'success' : 'neutral'}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                        {act.durationVariance > 0 ? `+${act.durationVariance}d` : `${act.durationVariance}d`}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
                    )}
                  </div>
                </div>

                {/* Right Timeline Bars */}
                <div style={{ position: 'relative', height: '52px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 16px' }}>
                  {/* Vertical Data Date Line */}
                  <div style={{
                    position: 'absolute',
                    left: `${dataDatePos}%`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    borderLeft: '1px dashed rgba(239, 68, 68, 0.6)',
                    zIndex: 2,
                    pointerEvents: 'none'
                  }} />

                  {/* Baseline Planned Bar (Top) */}
                  <div style={{
                    position: 'absolute',
                    left: `${plannedLeft}%`,
                    width: `${plannedWidth}%`,
                    top: '10px',
                    height: '11px',
                    background: '#334155',
                    borderRadius: '2px',
                    zIndex: 3
                  }} title={`Planned Baseline: ${act.plannedStart} to ${act.plannedFinish} (${act.baselineDuration} days)`} />

                  {/* Actual Progress Bar (Bottom) */}
                  {act.percentComplete > 0 && (
                    <div style={{
                      position: 'absolute',
                      left: `${actualLeft}%`,
                      width: `${actualWidth}%`,
                      top: '25px',
                      height: '14px',
                      background: act.percentComplete === 100 ? '#10B981' : '#0EA5E9',
                      borderRadius: '3px',
                      zIndex: 4,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '4px'
                    }} title={`Actual Execution: ${actualStart} to ${actualEnd} (${act.percentComplete}% complete)`}>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#000' }}>
                        {act.percentComplete}%
                      </span>
                    </div>
                  )}

                  {/* Hover Actions Pill */}
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 6
                  }}>
                    <button
                      onClick={() => setTracingEvidenceActivity(act)}
                      className="btn btn-secondary"
                      style={{ padding: '3px 7px', fontSize: '10px' }}
                      title="View 6-point evidence lineage"
                    >
                      <Eye size={11} />
                      <span>Trace</span>
                    </button>

                    <button
                      onClick={() => setInspectingP6Activity(act)}
                      className="btn btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '10px' }}
                      title="Inspect representative PMIS payload"
                    >
                      <Server size={11} color="var(--teal-accent)" />
                      <span>Preview PMIS Update</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
