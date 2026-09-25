import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/layout/TopBar';
import { TopNavigation } from './components/layout/TopNavigation';
import { GlobalStatusStrip } from './components/layout/GlobalStatusStrip';

import { DataIngestionView } from './views/DataIngestionView';
import { TimeAgentView } from './views/TimeAgentView';
import { ExtractionWorkspaceView } from './views/ExtractionWorkspaceView';
import { ScheduleLinkerView } from './views/ScheduleLinkerView';
import { PlannerReviewQueueView } from './views/PlannerReviewQueueView';
import { LiveScheduleGanttView } from './views/LiveScheduleGanttView';
import { AnalyticsView } from './views/AnalyticsView';
import { AuditTrailView } from './views/AuditTrailView';
import { ProjectMemoryView } from './views/ProjectMemoryView';

import { DashboardView } from './views/DashboardView';
import { StoryProblemView } from './views/StoryProblemView';
import { StoryArchitectureView } from './views/StoryArchitectureView';
import { StoryFeasibilityView } from './views/StoryFeasibilityView';
import { StoryImpactView } from './views/StoryImpactView';

import { P6PayloadDrawer } from './components/drawers/P6PayloadDrawer';
import { EvidenceTraceDrawer } from './components/drawers/EvidenceTraceDrawer';
import { DemoOverlay } from './components/layout/DemoOverlay';

const AppContent: React.FC = () => {
  const { 
    activeView, 
    inspectingP6Activity, 
    setInspectingP6Activity,
    tracingEvidenceActivity,
    setTracingEvidenceActivity
  } = useApp();

  const [isMobileSimulated, setIsMobileSimulated] = React.useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'capture':
        return <DataIngestionView />;
      case 'agent':
        return <TimeAgentView />;
      case 'extract':
        return <ExtractionWorkspaceView />;
      case 'link':
        return <ScheduleLinkerView />;
      case 'review':
        return <PlannerReviewQueueView />;
      case 'schedule':
        return <LiveScheduleGanttView />;
      case 'audit':
        return <AuditTrailView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'memory':
        return <ProjectMemoryView />;
      case 'story-problem':
        return <StoryProblemView />;
      case 'story-architecture':
        return <StoryArchitectureView />;
      case 'story-feasibility':
        return <StoryFeasibilityView />;
      case 'story-impact':
        return <StoryImpactView />;
      default:
        return <DashboardView />;
    }
  };

  const appShell = (
    <div className={`app-container ${isMobileSimulated ? 'mobile-simulated' : ''}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      <TopBar 
        isMobileSimulated={isMobileSimulated} 
        onToggleMobile={() => setIsMobileSimulated(!isMobileSimulated)} 
      />
      <TopNavigation />
      {activeView === 'dashboard' && <GlobalStatusStrip />}

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '24px',
        position: 'relative'
      }}>
        {renderActiveView()}
      </main>

      {/* Global Application Drawers */}
      <P6PayloadDrawer 
        activity={inspectingP6Activity}
        onClose={() => setInspectingP6Activity(null)}
      />

      <EvidenceTraceDrawer
        activity={tracingEvidenceActivity}
        onClose={() => setTracingEvidenceActivity(null)}
      />

      {/* Global Presenter Mode Overlay */}
      <DemoOverlay />
    </div>
  );

  if (isMobileSimulated) {
    return (
      <div className="mobile-simulated-wrapper">
        <button className="mobile-close-btn" onClick={() => setIsMobileSimulated(false)}>
          Exit Mobile View
        </button>
        {appShell}
      </div>
    );
  }

  return appShell;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
