import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bot, 
  Send, 
  Volume2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles,
  Play,
  Mic,
  MicOff,
  Loader2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'supervisor' | 'agent';
  timestamp: string;
  text: string;
  entityCard?: {
    discipline: string;
    targetActivityCode: string;
    targetActivityName: string;
    progress: string;
    actualStart: string;
    location: string;
    confidence: number;
  };
  confirmed?: boolean;
}

export const TimeAgentView: React.FC = () => {
  const { ingestNewRecord } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputPrompt, setInputPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'agent',
      timestamp: '08:00',
      text: "Namaste Supervisor. Time Agent is ready for Baghewala field updates. Type progress or select an audio transcript to log work."
    },
    {
      id: 'msg-2',
      sender: 'supervisor',
      timestamp: '12:15',
      text: "Piping crew started erecting Line 24-XX spool at the north rack today. 18 of 24 joints are complete."
    },
    {
      id: 'msg-3',
      sender: 'agent',
      timestamp: '12:15',
      text: "Detected Piping execution on Line 24-XX. Structured parameters extracted below:",
      entityCard: {
        discipline: 'Piping',
        targetActivityCode: 'PIP-L6-024A',
        targetActivityName: 'Erect Line 24-XX',
        progress: '18 of 24 joints (75%)',
        actualStart: '12 Sep 2026',
        location: 'North pipe rack',
        confidence: 94.2
      },
      confirmed: true
    }
  ]);

  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = true;
        recog.lang = 'en-US';

        recog.onstart = () => {
          setIsListening(true);
        };

        recog.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            setInputPrompt(prev => (prev + ' ' + finalTranscript).trim());
            // Optionally auto-send: handleSend((prev + ' ' + finalTranscript).trim());
          } else if (interimTranscript) {
            setInputPrompt(interimTranscript);
          }
        };

        recog.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        setRecognition(recog);
      }
    }
  }, []);

  const toggleMicrophone = () => {
    if (!recognition) {
      alert("Voice recognition is not supported in this browser. Please use the simulated audio presets.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setInputPrompt('');
      recognition.start();
    }
  };

  // Selectable Transcripts across all 6 disciplines
  const audioPresets = [
    {
      label: 'Piping (Line 24-XX Spool)',
      discipline: 'Piping',
      transcript: 'Piping crew started erecting Line 24-XX spool at the north rack today. 18 of 24 joints are complete.'
    },
    {
      label: 'Rotating Equip (Pump P-204)',
      discipline: 'Rotating Equip',
      transcript: 'Pump P-204 alignment completed today; final shimming is pending.'
    },
    {
      label: 'Electrical (Substation Tray)',
      discipline: 'Electrical',
      transcript: 'Cable tray installation completed in substation corridor. Approx. 42 metres installed on 14 Sep 2026.'
    },
    {
      label: 'Civil (Foundation Excavation)',
      discipline: 'Civil',
      transcript: 'Foundation excavation for equipment foundation reached 160 m³ today in Compressor Bay A.'
    },
    {
      label: 'Instrumentation (Junction Box)',
      discipline: 'Instrumentation',
      transcript: 'Junction box installation completed for 4 units on local racks in process area.'
    },
    {
      label: 'HSE (Scaffold Inspection)',
      discipline: 'HSE',
      transcript: 'Scaffold safety inspection completed for 8 work zones across plant area; permit signed off.'
    },
    {
      label: 'Piping Delay (Hydrotest Pump)',
      discipline: 'Piping',
      transcript: 'Hydrotest on Line 24-XX held because the high-pressure test pump was unavailable.'
    }
  ];

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'supervisor',
      timestamp: timeStr,
      text
    };

    // Agent response simulation
    let entityCard;
    const lower = text.toLowerCase();
    if (lower.includes('pump p-204') || lower.includes('shimming')) {
      entityCard = {
        discipline: 'Rotating Equipment',
        targetActivityCode: 'ROT-L6-037',
        targetActivityName: 'Pump P-204 Alignment',
        progress: '80% (Shimming pending)',
        actualStart: '15 Sep 2026',
        location: 'Pump Shelter - Bay 2',
        confidence: 91.0
      };
    } else if (lower.includes('cable tray') || lower.includes('substation')) {
      entityCard = {
        discipline: 'Electrical',
        targetActivityCode: 'ELE-L5-041',
        targetActivityName: 'Cable Tray Installation',
        progress: '42 meters (35%)',
        actualStart: '14 Sep 2026',
        location: 'Substation to Process Area',
        confidence: 88.0
      };
    } else if (lower.includes('foundation') || lower.includes('excavation') || lower.includes('bay a')) {
      entityCard = {
        discipline: 'Civil',
        targetActivityCode: 'CIV-L5-012',
        targetActivityName: 'Equipment Foundation',
        progress: '160 m³ of 320 m³ (50%)',
        actualStart: '25 Aug 2026',
        location: 'Compressor Area - Bay A',
        confidence: 92.5
      };
    } else if (lower.includes('junction box') || lower.includes('racks') || lower.includes('instrument')) {
      entityCard = {
        discipline: 'Instrumentation',
        targetActivityCode: 'INS-L5-051',
        targetActivityName: 'Junction Box Installation',
        progress: '4 of 16 units (25%)',
        actualStart: '11 Sep 2026',
        location: 'Process Area - Local Racks',
        confidence: 93.0
      };
    } else if (lower.includes('scaffold') || lower.includes('permit') || lower.includes('safety')) {
      entityCard = {
        discipline: 'HSE',
        targetActivityCode: 'HSE-L5-006',
        targetActivityName: 'Scaffold Inspection',
        progress: '32 of 40 inspections (80%)',
        actualStart: '01 Aug 2026',
        location: 'Plant Wide',
        confidence: 95.0
      };
    } else if (lower.includes('hydrotest')) {
      entityCard = {
        discipline: 'Piping',
        targetActivityCode: 'PIP-L6-025',
        targetActivityName: 'Hydrotest Line 24-XX',
        progress: 'Held (Equipment Delay)',
        actualStart: '17 Sep 2026',
        location: 'North Pipe Rack - Bay 3 to 7',
        confidence: 89.0
      };
    } else {
      entityCard = {
        discipline: 'Piping',
        targetActivityCode: 'PIP-L6-024A',
        targetActivityName: 'Erect Line 24-XX',
        progress: '18 of 24 joints (75%)',
        actualStart: '12 Sep 2026',
        location: 'North pipe rack',
        confidence: 94.0
      };
    }

    const agentMsg: ChatMessage = {
      id: `msg-${Date.now()}-agent`,
      sender: 'agent',
      timestamp: timeStr,
      text: `Captured field entry. Extracted parameters and candidate schedule link:`,
      entityCard,
      confirmed: false
    };

    setMessages(prev => [...prev, userMsg, agentMsg]);
    setInputPrompt('');
  };

  const handleConfirmEntry = (msgId: string, card: any) => {
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, confirmed: true } : m))
    );

    // Ingest into actual state
    ingestNewRecord({
      sourceType: 'voice',
      sourceName: `TimeAgent_Voice_${Date.now().toString(36)}.m4a`,
      submittedBy: 'Field Supervisor (Time Agent)',
      rawText: `${card.targetActivityName}: ${card.progress} at ${card.location}. Actual Start: ${card.actualStart}`
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Time Agent (Supervisor Assistant)
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Conversational voice/chat logging for site supervisors: Captures actuals at point-of-work in under 30 seconds.
        </p>
      </div>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '8fr 4fr', gap: '20px' }}>
        {/* Left: Chat Stream & Input */}
        <div className="oil-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)', minHeight: '400px', maxHeight: '640px', padding: 0 }}>
          {/* Chat Header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-surface-elevated)'
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
            <strong style={{ fontSize: '13px' }}>Time Agent Active</strong>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>| Natural Language Field Logger</span>
          </div>

          {/* Messages Feed */}
          <div 
            role="log"
            aria-live="polite"
            aria-label="Time Agent conversational field logger transcript"
            style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            {messages.map(m => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'supervisor' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  background: m.sender === 'supervisor' ? '#0284C7' : 'var(--bg-surface-elevated)',
                  color: m.sender === 'supervisor' ? '#FFFFFF' : 'var(--text-primary)',
                  padding: '12px 16px',
                  borderRadius: m.sender === 'supervisor' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  border: m.sender === 'supervisor' ? '1px solid #0284C7' : '1px solid var(--border-subtle)',
                  fontSize: '13px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}>
                  <div>{m.text}</div>

                  {/* Immediate Entity Card */}
                  {m.entityCard && (
                    <div style={{
                      marginTop: '10px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--teal-accent)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'var(--text-primary)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span className="badge badge-info">{m.entityCard.discipline}</span>
                        <span className="badge badge-success">{m.entityCard.confidence}% Match</span>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--teal-accent)', marginBottom: '4px' }}>
                        <span className="font-mono">{m.entityCard.targetActivityCode}</span> : {m.entityCard.targetActivityName}
                      </div>

                      <div className="preserve-grid" style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '10px' }}>
                        <div>Progress: <strong style={{ color: 'var(--text-primary)' }}>{m.entityCard.progress}</strong></div>
                        <div>Date: <strong style={{ color: 'var(--text-primary)' }}>{m.entityCard.actualStart}</strong></div>
                        <div style={{ gridColumn: '1 / -1' }}>Location: <strong style={{ color: 'var(--text-primary)' }}>{m.entityCard.location}</strong></div>
                      </div>

                      {m.confirmed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#10B981', fontWeight: 600 }}>
                          <CheckCircle2 size={14} />
                          <span>Captured &amp; Queued for Approval</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConfirmEntry(m.id, m.entityCard)}
                          className="btn btn-success"
                          style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                        >
                          <CheckCircle2 size={14} />
                          <span>Confirm and Submit for Review</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: '10px', color: m.sender === 'supervisor' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Quick Chips */}
          <div style={{ padding: '8px 20px', background: 'var(--bg-surface-elevated)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {['Start Activity', 'Update Progress %', 'Report Delay', 'Mark Completed'].map(chip => (
              <button
                key={chip}
                onClick={() => setInputPrompt(`${chip}: `)}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '14px' }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '10px' }}>
            <button 
              onClick={toggleMicrophone}
              className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
              style={{ padding: '0 14px', position: 'relative' }}
              title="Toggle Microphone"
            >
              {isListening ? (
                <>
                  <MicOff size={16} />
                  <span style={{ 
                    position: 'absolute', top: -4, right: -4, 
                    display: 'flex', height: 10, width: 10 
                  }}>
                    <span style={{ animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite', position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: 'var(--danger)', opacity: 0.75 }}></span>
                    <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: 10, width: 10, backgroundColor: 'var(--danger)' }}></span>
                  </span>
                </>
              ) : (
                <Mic size={16} />
              )}
            </button>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? "Listening... speak now" : "Speak or type field update (e.g. 'Piping crew erected Line 24-XX...')"}
                style={{ 
                  fontSize: '13px', 
                  width: '100%', 
                  boxSizing: 'border-box',
                  borderColor: isListening ? 'var(--danger)' : 'var(--border-subtle)',
                  paddingRight: '40px'
                }}
              />
              {isListening && (
                <Loader2 size={16} className="spin" style={{ position: 'absolute', right: 12, top: 12, color: 'var(--danger)' }} />
              )}
            </div>
            <button onClick={() => handleSend()} className="btn btn-primary" disabled={isListening}>
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* Right: Audio Transcript Presets */}
        <div className="oil-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mic size={18} color="var(--teal-accent)" />
            <h2 style={{ fontSize: '14px', fontWeight: 700 }}>Voice Audio Presets (Simulated ASR)</h2>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            One-click audio transcripts eliminate microphone browser permission issues during demonstration.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {audioPresets.map(preset => (
              <div
                key={preset.label}
                role="button"
                tabIndex={0}
                aria-label={`Simulate audio preset: ${preset.label}`}
                onClick={() => handleSend(preset.transcript)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSend(preset.transcript);
                  }
                }}
                className="oil-card"
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  background: 'var(--bg-surface-elevated)',
                  transition: 'border-color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--teal-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '12.5px', color: 'var(--teal-accent)' }}>{preset.label}</strong>
                  <Play size={12} color="var(--teal-accent)" />
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  "{preset.transcript}"
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 'auto',
            background: 'rgba(14, 165, 233, 0.08)',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '11.5px',
            color: 'var(--text-muted)'
          }}>
            <strong>Supervisor Promise:</strong> Immediate feedback confirms work is registered; schedule matching occurs transparently in the background.
          </div>
        </div>
      </div>
    </div>
  );
};
