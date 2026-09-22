import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Presentation, ChevronRight, ChevronLeft, X, MessageSquare, Target, Code, Key } from 'lucide-react';

interface DemoStep {
  view: string;
  title: string;
  description: string;
  talkingPoints: string[];
  actionPrompt?: string;
}

const DEMO_SCRIPT: DemoStep[] = [
  {
    view: 'capture',
    title: '1. Ingestion: Field Data Reality',
    description: 'We start at the source. Field data is messy and multi-format.',
    talkingPoints: [
      'Point out the 12 diverse sample inputs on the left (PDFs, CSVs, Audio, Diaries).',
      'Mention that these simulate reality: contractors use different formats.',
      'Click the "Process All Pending Records" button to trigger the pipeline.'
    ],
    actionPrompt: 'Click "Process All Pending Records"'
  },
  {
    view: 'agent',
    title: '2. Time Agent: Voice First',
    description: 'Supervisors need zero-friction input. We built a voice agent.',
    talkingPoints: [
      'Select the "Piping (Line 24-XX Spool)" preset or use the microphone.',
      'Show how unstructured voice is instantly translated into an Entity Card.',
      'Mention that this removes the need for evening spreadsheet data entry.'
    ]
  },
  {
    view: 'extract',
    title: '3. Extraction: Structuring Chaos',
    description: 'The engine parses unstructured text into structured Progress Events.',
    talkingPoints: [
      'Show the color-coded extraction highlights (Quantity, Location, Discipline).',
      'Explain that we don\'t just extract text, we normalize it to canonical terms.',
      'Show that cubic meters, percentages, and arbitrary text are handled.'
    ]
  },
  {
    view: 'link',
    title: '4. Linker: The 6-Signal Match',
    description: 'The core IP of Field Pulse: mapping field events to L5/L6 activities.',
    talkingPoints: [
      'Select the Piping Line 24-XX event.',
      'Open the "Analyze Match" drawer to show the 6-signal breakdown (Text, Discipline, Location, Date, WBS, Synonyms).',
      'Explain that we never just say "AI matched it" — we show the exact math.'
    ]
  },
  {
    view: 'review',
    title: '5. Planner Review: Human in the Loop',
    description: 'Planners don\'t want black boxes. They want a fast-track review queue.',
    talkingPoints: [
      'Show the queue filtering (Fast-Track vs Mandatory Review).',
      'Show the 1:N Split capability for allocating progress across multiple IDs.',
      'Approve the High Confidence Piping event.'
    ],
    actionPrompt: 'Approve a High Confidence event'
  },
  {
    view: 'schedule',
    title: '6. Schedule: Real-Time Gantt',
    description: 'Approved progress instantly mutates the baseline schedule.',
    talkingPoints: [
      'Point out the blue "Actual Progress" bars vs gray "Baseline" bars.',
      'Show that the data date (cutoff) line visualizes whether we are ahead/behind.',
      'Mention that this is ready for Oracle P6 / MS Project synchronization.'
    ]
  },
  {
    view: 'audit',
    title: '7. Audit Trail: Chain of Custody',
    description: 'Enterprise systems need traceability. Field Pulse tracks every mutation.',
    talkingPoints: [
      'Show the immutable append-only ledger.',
      'Click "Trace Evidence" to show the direct lineage from a schedule change back to the raw field text.',
      'Explain this solves contractor dispute claims.'
    ]
  },
  {
    view: 'analytics',
    title: '8. Analytics: What-If Simulator',
    description: 'We don\'t just look backward, we simulate forward.',
    talkingPoints: [
      'Show the cumulative S-curve.',
      'Use the What-If Simulator: inject a 5-day delay on a critical path item.',
      'Show how the delay ripples to downstream successors.'
    ]
  },
  {
    view: 'memory',
    title: '9. Memory: Organizational Learning',
    description: 'Projects learn from mistakes. We capture delay patterns.',
    talkingPoints: [
      'Show the delay pattern cards.',
      'Explain that this feeds back into future baselines.',
      'Conclude the demo.'
    ]
  }
];

export const DemoOverlay: React.FC = () => {
  const { setActiveView, activeView } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D toggles demo mode
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        setIsVisible(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync step with active view
  useEffect(() => {
    const stepIdx = DEMO_SCRIPT.findIndex(s => s.view === activeView);
    if (stepIdx !== -1) {
      setCurrentStepIndex(stepIdx);
    }
  }, [activeView]);

  if (!isVisible) return null;

  const currentStep = DEMO_SCRIPT[currentStepIndex];

  const goNext = () => {
    if (currentStepIndex < DEMO_SCRIPT.length - 1) {
      const nextStep = DEMO_SCRIPT[currentStepIndex + 1];
      setActiveView(nextStep.view as any);
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentStepIndex > 0) {
      const prevStep = DEMO_SCRIPT[currentStepIndex - 1];
      setActiveView(prevStep.view as any);
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  if (isMinimized) {
    return (
      <div 
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'var(--accent-primary)',
          padding: '2px',
          borderRadius: '50px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          cursor: 'pointer'
        }}
        onClick={() => setIsMinimized(false)}
      >
        <div style={{
          background: 'var(--bg-surface)',
          padding: '8px 16px',
          borderRadius: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '13px',
          color: 'var(--text-primary)'
        }}>
          <Presentation size={16} color="var(--accent-primary)" />
          <span>Presenter Mode Active</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '380px',
      zIndex: 9999,
      background: 'var(--bg-surface-elevated)',
      border: '1px solid var(--accent-primary)',
      borderRadius: '12px',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-subtle)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--accent-primary)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px' }}>
          <Presentation size={16} />
          <span>SIH Demo Guide ({currentStepIndex + 1}/{DEMO_SCRIPT.length})</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setIsMinimized(true)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8 }}
            title="Minimize"
          >
            _
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            title="Close Demo Guide"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
          {currentStep.title}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          {currentStep.description}
        </p>

        <div style={{ 
          background: 'var(--bg-base)', 
          borderRadius: '8px', 
          padding: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-secondary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            <MessageSquare size={12} />
            Talking Points
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-primary)', fontSize: '12px', lineHeight: 1.6 }}>
            {currentStep.talkingPoints.map((tp, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>{tp}</li>
            ))}
          </ul>
        </div>

        {currentStep.actionPrompt && (
          <div style={{ 
            marginTop: '16px', 
            padding: '10px 12px', 
            background: 'var(--accent-primary-subtle)', 
            border: '1px dashed var(--accent-primary)',
            borderRadius: '6px',
            color: 'var(--accent-primary)',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Target size={14} />
            {currentStep.actionPrompt}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--bg-input)',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <button 
          onClick={goPrev}
          disabled={currentStepIndex === 0}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          <ChevronLeft size={14} />
          Prev
        </button>
        
        <button 
          onClick={goNext}
          disabled={currentStepIndex === DEMO_SCRIPT.length - 1}
          className="btn btn-primary"
          style={{ padding: '6px 16px', fontSize: '12px' }}
        >
          Next Step
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
