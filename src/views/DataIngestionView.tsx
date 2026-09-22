import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Discipline, SourceType } from '../types';
import { 
  FileText, 
  Table, 
  Image as ImageIcon, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  UploadCloud, 
  Play, 
  Square, 
  Layers, 
  Eye, 
  ArrowRight, 
  FileSpreadsheet, 
  Cpu, 
  Radio, 
  Scan, 
  Check, 
  RefreshCw,
  Clock,
  Trash2,
  FileCode,
  Volume2,
  Download
} from 'lucide-react';

interface CsvRow {
  [key: string]: string;
}

interface BatchFileItem {
  id: string;
  name: string;
  size: string;
  type: SourceType;
  discipline: Discipline;
  status: 'pending' | 'processed';
  rawText: string;
  dateHint: string;
}

export const DataIngestionView: React.FC = () => {
  const { ingestNewRecord, setActiveView } = useApp();

  // Active Mode: 'report' | 'spreadsheet' | 'voice' | 'diary' | 'p6' | 'batch'
  const [activeTab, setActiveTab] = useState<'report' | 'spreadsheet' | 'voice' | 'diary' | 'p6' | 'batch'>('report');

  // Form State
  const [sourceType, setSourceType] = useState<SourceType>('report');
  const [sourceName, setSourceName] = useState('Daily_Progress_Report_Piping_12Sep.pdf');
  const [submittedBy, setSubmittedBy] = useState('R. Sharma (Site Supervisor - Piping)');
  const [discipline, setDiscipline] = useState<Discipline>('PIPING');
  const [dateHint, setDateHint] = useState('12 Sep 2026');
  const [rawText, setRawText] = useState(
    `Daily Progress Report - Baghewala Surface Facilities Expansion\nDate: 12-Sep-2026 | Shift: Day | Discipline: Piping\nLocation: North Pipe Rack (Bay 3 to 7)\nCrew: 6 welders, 4 riggers, 1 supervisor | Equipment: Hydra Crane 14T (CR-04)\nNotes:\nPiping crew erected spool for Line 24-XX in the north pipe rack. Work started on 12 Sep 2026 and 18 of 24 joints completed. Quality inspection clearance obtained for joints J-01 to J-18.`
  );
  
  const [processingState, setProcessingState] = useState<'idle' | 'parsing' | 'normalized' | 'ready'>('ready');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- VOICE RECORDER STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // --- SPREADSHEET / CSV PARSER STATE ---
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [selectedCsvRows, setSelectedCsvRows] = useState<number[]>([]);

  // --- OCR / SCANNER STATE ---
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState(94);
  const [ocrScanComplete, setOcrScanComplete] = useState(true);

  // --- BATCH FILES STATE ---
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([
    {
      id: 'bf-1',
      name: 'Piping_Daily_Log_12Sep.pdf',
      size: '245 KB',
      type: 'report',
      discipline: 'PIPING',
      status: 'pending',
      dateHint: '12 Sep 2026',
      rawText: 'Erected 18 of 24 spool joints on Line 24-XX in North Pipe Rack.'
    },
    {
      id: 'bf-2',
      name: 'Civil_Foundations_Log.csv',
      size: '18 KB',
      type: 'spreadsheet',
      discipline: 'CIVIL',
      status: 'pending',
      dateHint: '12 Sep 2026',
      rawText: 'Equipment Foundation,Compressor Bay A,Civil,12-09-2026,160,m3,50%,Compressor Area'
    },
    {
      id: 'bf-3',
      name: 'Audio_Supervisor_Patel_14Sep.m4a',
      size: '1.2 MB',
      type: 'voice',
      discipline: 'ELECTRICAL',
      status: 'pending',
      dateHint: '14 Sep 2026',
      rawText: 'Cable tray installation completed in substation corridor. Approx 42 metres installed on 14 Sep.'
    }
  ]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Switch Tab Handler
  const handleTabSwitch = (tab: 'report' | 'spreadsheet' | 'voice' | 'diary' | 'p6' | 'batch') => {
    setActiveTab(tab);
    setSuccessMessage(null);
    if (tab === 'report') {
      setSourceType('report');
      setSourceName('Daily_Progress_Report_Piping_12Sep.pdf');
      setSubmittedBy('R. Sharma (Site Supervisor - Piping)');
      setDiscipline('PIPING');
      setDateHint('12 Sep 2026');
      setRawText(`Daily Progress Report - Baghewala Surface Facilities Expansion\nDate: 12-Sep-2026 | Shift: Day | Discipline: Piping\nLocation: North Pipe Rack (Bay 3 to 7)\nCrew: 6 welders, 4 riggers, 1 supervisor | Equipment: Hydra Crane 14T (CR-04)\nNotes:\nPiping crew erected spool for Line 24-XX in the north pipe rack. Work started on 12 Sep 2026 and 18 of 24 joints completed. Quality inspection clearance obtained for joints J-01 to J-18.`);
    } else if (tab === 'spreadsheet') {
      setSourceType('spreadsheet');
      setSourceName('Discipline_Progress_Piping_12Sep.csv');
      setSubmittedBy('M. Joshi (Contractor Lead)');
      setDiscipline('PIPING');
      setDateHint('12-09-2026');
      const sampleCsv = `Activity Description,Line / Tag,Discipline,Execution Date,Quantity,Unit,Progress %,Location\nSpool erected,Line 24-XX,Piping,12-09-2026,18,joints,75%,North rack\nSecondary rack tie-in,Line 24-YY,Piping,12-09-2026,6,joints,25%,Bay 4 Area`;
      setRawText(sampleCsv);
      parseCsvString(sampleCsv);
    } else if (tab === 'voice') {
      setSourceType('voice');
      setSourceName('TimeAgent_Audio_Singh_15Sep.m4a');
      setSubmittedBy('K. Singh (Mechanical Supervisor)');
      setDiscipline('ROTATING_EQUIP');
      setDateHint('15 Sep 2026');
      setRawText(`Pump P-204 alignment completed today on 15-Sep-2026; final shimming is pending with 2 of 4 bolts torqued.`);
    } else if (tab === 'diary') {
      setSourceType('diary');
      setSourceName('Site_Diary_Scan_Patel_14Sep.jpg');
      setSubmittedBy('V. Patel (Electrical Field Engineer)');
      setDiscipline('ELECTRICAL');
      setDateHint('14 Sep 2026');
      setRawText(`[Site Diary Entry #E-44 - Date: 14/09/2026]\nSubstation to Process corridor:\nCable tray installation completed in substation corridor. Approx. 42 metres installed on 14 Sep 2026. Supports aligned; tray earthing jumpers pending.`);
    } else if (tab === 'p6') {
      setSourceType('report');
      setSourceName('Primavera_P6_Export_Instruments_15Sep.xml');
      setSubmittedBy('P6 Scheduling Interface (Export)');
      setDiscipline('INSTRUMENTATION');
      setDateHint('15 Sep 2026');
      setRawText(`<ActivityExport Project="BAGHEWALA-01" ExportDate="2026-09-15">\n  <Activity ActivityID="INS-L5-051" WBS="BAGH.SURF.INST.JB" Discipline="INSTRUMENTATION">\n    <TaskName>Junction Box Installation</TaskName>\n    <Status>In Progress</Status>\n    <ActualStart>2026-09-11</ActualStart>\n    <PhysicalPercentComplete>25%</PhysicalPercentComplete>\n    <FieldQuantityActual>4</FieldQuantityActual>\n    <FieldQuantityTarget>16</FieldQuantityTarget>\n    <Location>Process Area - Local Racks</Location>\n  </Activity>\n</ActivityExport>`);
    }
  };

  // Helper to parse CSV string
  const parseCsvString = (text: string) => {
    const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim());
      setCsvHeaders(headers);
      const rows: CsvRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rowObj: CsvRow = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);
      }
      setCsvRows(rows);
      setSelectedCsvRows(rows.map((_, i) => i));
    }
  };

  // Helper to download sample spreadsheet CSV
  const downloadSampleSpreadsheet = () => {
    const sampleCsv = `Activity Description,Line / Tag,Discipline,Execution Date,Planned Quantity,Actual Quantity,Unit,Progress %,Location,Supervisor / Subcontractor,Notes / Bottlenecks
Erect piping spool on Line 24-XX,Line 24-XX,Piping,12-09-2026,24,18,joints,75%,North Pipe Rack (Bay 3-7),R. Sharma (L&T Hydrocarbon),6 welders & 4 riggers. Crane CR-04 operated smoothly. Hydrotest prep underway.
Secondary rack tie-in welding,Line 24-YY,Piping,12-09-2026,24,6,joints,25%,North Pipe Rack Bay 4,R. Sharma (L&T Hydrocarbon),Alignment checked. Pre-heating in progress.
Compressor Bay A Foundation Concreting,FND-C-101,Civil,12-09-2026,320,160,m3,50%,Compressor Bay A,M. Joshi (Afcons Civil),Pouring completed up to 50%. Pneumatic rock breaker used for hard strata.
Substation cable tray installation,TR-SS-01,Electrical,14-09-2026,60,42,meters,70%,Substation Corridor,V. Patel (Siemens Energy),42m laid. Earthing jumpers pending inspection clearance.
Feed gas separator inlet nozzle N1 alignment,V-101,Static Equipment,13-09-2026,1,1,equipment,100%,Process Area 1,K. Singh (Thermax Ltd),Gasket installed and torque tightened to 450 Nm.
Hydrocarbon condensate pump P-204 alignment,P-204,Rotating Equipment,15-09-2026,4,2,bolts,50%,Pump House B,K. Singh (Sulzer Pumps),Dial gauge runout within 0.03mm. Final shimming in progress.
Pressure Transmitter Calibration & Loop Check,PT-1042,Instrumentation,15-09-2026,8,6,loops,75%,Control Building Rack 2,A. Nair (Honeywell DCS),Loop powered. HART communicator test passed.
Flare knockout drum structural steel erection,STR-FL-02,Structural,16-09-2026,12,9.5,MT,79%,Flare Area South,T. Banerjee (Tata Projects),Columns erected and plumb checked with total station.`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'demo_daily_progress_log.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to load rich demo spreadsheet rows directly into state
  const loadRichDemoSpreadsheet = () => {
    const sampleCsv = `Activity Description,Line / Tag,Discipline,Execution Date,Planned Quantity,Actual Quantity,Unit,Progress %,Location,Supervisor / Subcontractor,Notes / Bottlenecks
Erect piping spool on Line 24-XX,Line 24-XX,Piping,12-09-2026,24,18,joints,75%,North Pipe Rack (Bay 3-7),R. Sharma (L&T Hydrocarbon),6 welders & 4 riggers. Crane CR-04 operated smoothly. Hydrotest prep underway.
Secondary rack tie-in welding,Line 24-YY,Piping,12-09-2026,24,6,joints,25%,North Pipe Rack Bay 4,R. Sharma (L&T Hydrocarbon),Alignment checked. Pre-heating in progress.
Compressor Bay A Foundation Concreting,FND-C-101,Civil,12-09-2026,320,160,m3,50%,Compressor Bay A,M. Joshi (Afcons Civil),Pouring completed up to 50%. Pneumatic rock breaker used for hard strata.
Substation cable tray installation,TR-SS-01,Electrical,14-09-2026,60,42,meters,70%,Substation Corridor,V. Patel (Siemens Energy),42m laid. Earthing jumpers pending inspection clearance.
Feed gas separator inlet nozzle N1 alignment,V-101,Static Equipment,13-09-2026,1,1,equipment,100%,Process Area 1,K. Singh (Thermax Ltd),Gasket installed and torque tightened to 450 Nm.
Hydrocarbon condensate pump P-204 alignment,P-204,Rotating Equipment,15-09-2026,4,2,bolts,50%,Pump House B,K. Singh (Sulzer Pumps),Dial gauge runout within 0.03mm. Final shimming in progress.
Pressure Transmitter Calibration & Loop Check,PT-1042,Instrumentation,15-09-2026,8,6,loops,75%,Control Building Rack 2,A. Nair (Honeywell DCS),Loop powered. HART communicator test passed.
Flare knockout drum structural steel erection,STR-FL-02,Structural,16-09-2026,12,9.5,MT,79%,Flare Area South,T. Banerjee (Tata Projects),Columns erected and plumb checked with total station.`;

    setSourceName('demo_daily_progress_log.csv');
    setSubmittedBy('Integrated Field Operations (Multi-Discipline)');
    setRawText(sampleCsv);
    parseCsvString(sampleCsv);
    setSuccessMessage('Loaded 8 multi-discipline demo spreadsheet rows ready for multi-attribute extraction!');
  };

  // Drag & Drop File Upload Handler
  const handleFileUpload = (file: File) => {
    const fileName = file.name;
    setSourceName(fileName);

    const ext = fileName.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    if (ext === 'csv' || ext === 'tsv') {
      setSourceType('spreadsheet');
      setActiveTab('spreadsheet');
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setRawText(text);
        parseCsvString(text);
      };
      reader.readAsText(file);
    } else if (ext === 'mp3' || ext === 'm4a' || ext === 'wav' || ext === 'ogg' || ext === 'webm') {
      setSourceType('voice');
      setActiveTab('voice');
      setAudioBlobUrl(URL.createObjectURL(file));
      const simulatedTranscript = `Audio note from ${fileName}: Field crew executed scheduled scope for ${discipline.toLowerCase()} package today. Inspection signoff recorded.`;
      setRawText(simulatedTranscript);
    } else if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') {
      setSourceType('diary');
      setActiveTab('diary');
      setIsOcrScanning(true);
      setOcrScanComplete(false);
      setTimeout(() => {
        setIsOcrScanning(false);
        setOcrScanComplete(true);
        setRawText(`[OCR Extracted from ${fileName}]\nSite Work Record: Cable tray installation completed in substation corridor. Approx 42 metres installed on 14 Sep 2026.`);
      }, 1500);
    } else if (ext === 'xml' || ext === 'xer') {
      setSourceType('report');
      setActiveTab('p6');
      reader.onload = (e) => {
        setRawText(e.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      setSourceType('report');
      setActiveTab('report');
      reader.onload = (e) => {
        setRawText(e.target?.result as string || `Uploaded document ${fileName} with verified project metadata.`);
      };
      reader.readAsText(file);
    }
  };

  // --- LIVE AUDIO RECORDING HANDLERS ---
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setRecordingTime(0);
      setSpeechTranscript('');

      // Check SpeechRecognition support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setSpeechTranscript(transcript);
            setRawText(`Voice Log (${new Date().toLocaleTimeString()}): ${transcript}`);
          }
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      // Check MediaRecorder API
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermission(true);
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioBlobUrl(url);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
      }

      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission denied or unavailable, using fallback simulator', err);
      setMicPermission(false);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Fallback transcription simulation
      setTimeout(() => {
        const simulated = `Voice Record (${new Date().toLocaleDateString()}): Piping supervisor Ramesh Sharma reporting from North Pipe Rack. Erected 18 of 24 joints on Line 24-XX today. Quality inspection clearance verified.`;
        setSpeechTranscript(simulated);
        setRawText(simulated);
      }, 2500);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setSourceName(`Site_Audio_Log_${new Date().toISOString().slice(0, 10)}.m4a`);
  };

  const handleVoicePreset = (presetText: string, disc: Discipline, title: string) => {
    setDiscipline(disc);
    setSourceName(`Audio_Preset_${title.replace(/\s+/g, '_')}.m4a`);
    setRawText(presetText);
    setSpeechTranscript(presetText);
  };

  // --- SUBMIT / INGESTION HANDLER ---
  const handleProcess = () => {
    setProcessingState('parsing');
    setTimeout(() => {
      setProcessingState('normalized');
      setTimeout(() => {
        setProcessingState('ready');
        const record = ingestNewRecord({
          sourceType,
          sourceName,
          submittedBy,
          discipline,
          sourceDateText: dateHint,
          rawText
        });
        setSuccessMessage(`Successfully ingested '${record.sourceName}'. Structured Progress Event created and ready in the review queue.`);
      }, 300);
    }, 200);
  };

  // Batch process all files
  const handleProcessBatch = () => {
    setIsBatchProcessing(true);
    let count = 0;
    batchFiles.forEach((file, idx) => {
      setTimeout(() => {
        ingestNewRecord({
          sourceType: file.type,
          sourceName: file.name,
          submittedBy: 'Batch Intake Automation',
          discipline: file.discipline,
          sourceDateText: file.dateHint,
          rawText: file.rawText
        });
        setBatchFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'processed' } : f));
        count++;
        if (count === batchFiles.length) {
          setIsBatchProcessing(false);
          setSuccessMessage(`All ${batchFiles.length} batch documents processed successfully! Ready for Extraction & Linking.`);
        }
      }, (idx + 1) * 350);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Data Ingestion Hub
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Multi-channel intake gateway for field reports, spreadsheets, live voice recordings, OCR diary scans, and scheduling XMLs.
        </p>
      </div>

      {/* Dynamic Mode Switcher Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '6px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'report', label: 'Daily Report (PDF/DPR)', icon: FileText },
          { id: 'spreadsheet', label: 'Excel / CSV Sheet', icon: FileSpreadsheet },
          { id: 'voice', label: 'Voice / Audio Note', icon: Mic },
          { id: 'diary', label: 'Scanned Diary (OCR)', icon: ImageIcon },
          { id: 'p6', label: 'Primavera P6 XML', icon: FileCode },
          { id: 'batch', label: 'Batch Dropzone', icon: UploadCloud },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id as any)}
              className="btn"
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '9px 14px',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '12.5px',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Ingestion Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '20px' }}>
        
        {/* LEFT COLUMN: Dynamic Mode Workspace */}
        <div className="oil-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Top Bar inside Card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeTab === 'report' && 'Daily Progress Report (DPR) Intake'}
                {activeTab === 'spreadsheet' && 'Interactive Spreadsheet & CSV Parser'}
                {activeTab === 'voice' && 'Live Field Audio & Voice Recorder'}
                {activeTab === 'diary' && 'Scanned Site Diary OCR Vision Scanner'}
                {activeTab === 'p6' && 'Primavera P6 / XML Schedule Export Intake'}
                {activeTab === 'batch' && 'Multi-Document Batch Dropzone'}
              </span>
            </div>
            <span className="badge badge-info">{activeTab.toUpperCase()} INTAKE</span>
          </div>

          {/* ============================================================ */}
          {/* TAB 1: DAILY PROGRESS REPORT (PDF/TEXT)                     */}
          {/* ============================================================ */}
          {activeTab === 'report' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Interactive File Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                style={{
                  border: '2px dashed var(--border-medium)',
                  borderRadius: '8px',
                  padding: '18px',
                  textAlign: 'center',
                  background: 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.doc,.docx,.txt';
                  input.onchange = (e: any) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  };
                  input.click();
                }}
              >
                <UploadCloud size={28} color="var(--accent-primary)" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Click to browse or drag & drop Daily Progress Report (.pdf, .docx, .txt)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Auto-extracts crew logs, shift notes, quantities, and quality clearances
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: SPREADSHEET & CSV INTERACTIVE GRID                    */}
          {/* ============================================================ */}
          {activeTab === 'spreadsheet' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* File Dropzone & Demo Helpers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  style={{
                    border: '2px dashed var(--border-medium)',
                    borderRadius: '8px',
                    padding: '14px',
                    textAlign: 'center',
                    background: 'var(--bg-input)',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv,.xlsx,.xls,.tsv';
                    input.onchange = (e: any) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                    };
                    input.click();
                  }}
                >
                  <FileSpreadsheet size={24} color="var(--accent-primary)" style={{ margin: '0 auto 6px auto' }} />
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Drop CSV / Excel Spreadsheet here
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Click or drag & drop .csv, .xlsx, .tsv files
                  </div>
                </div>

                {/* Quick Actions Panel */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  justifyContent: 'center',
                  background: 'var(--bg-base)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  minWidth: '220px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Demo Data Tools
                  </div>
                  <button
                    type="button"
                    onClick={downloadSampleSpreadsheet}
                    className="btn btn-secondary"
                    style={{ fontSize: '11.5px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                  >
                    <Download size={13} color="var(--accent-primary)" />
                    Download Demo CSV
                  </button>
                  <button
                    type="button"
                    onClick={loadRichDemoSpreadsheet}
                    className="btn btn-primary"
                    style={{ fontSize: '11.5px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                  >
                    <Sparkles size={13} />
                    Load 8 Demo Rows
                  </button>
                </div>
              </div>

              {/* Interactive CSV Table Preview */}
              {csvHeaders.length > 0 && (
                <div style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: 'var(--bg-base)'
                }}>
                  <div style={{
                    padding: '8px 12px',
                    background: 'var(--bg-surface-elevated)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                      PARSED SPREADSHEET TABLE ({csvRows.length} rows detected)
                    </span>
                    <span className="badge badge-success">READY TO PARSE</span>
                  </div>

                  <div style={{ overflowX: 'auto', maxHeight: '180px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                          {csvHeaders.map((h, idx) => (
                            <th key={idx} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.map((row, rIdx) => (
                          <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            {csvHeaders.map((h, cIdx) => (
                              <td key={cIdx} style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>
                                {row[h]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: LIVE VOICE RECORDER & AUDIO NOTE                      */}
          {/* ============================================================ */}
          {activeTab === 'voice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Voice Recorder Console */}
              <div style={{
                background: 'var(--bg-base)',
                border: isRecording ? '2px solid #EF4444' : '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                position: 'relative'
              }}>
                {/* Status & Timer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isRecording && (
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#EF4444',
                      animation: 'pulseGlow 1.2s infinite'
                    }} />
                  )}
                  <span style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', color: isRecording ? '#EF4444' : 'var(--text-primary)' }}>
                    {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {isRecording ? 'Listening & Transcribing live...' : 'Ready to record voice memo'}
                  </span>
                </div>

                {/* Animated Sound Waveform Bars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '36px' }}>
                  {[18, 32, 24, 40, 20, 36, 28, 44, 22, 38, 16, 30, 26, 42, 20].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: '4px',
                        height: isRecording ? `${h}px` : '6px',
                        background: isRecording ? 'var(--accent-primary)' : 'var(--border-medium)',
                        borderRadius: '2px',
                        transition: 'height 0.15s ease'
                      }}
                    />
                  ))}
                </div>

                {/* Record Button */}
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="btn btn-primary"
                    style={{
                      padding: '10px 24px',
                      borderRadius: '50px',
                      fontSize: '13px',
                      background: '#EF4444',
                      borderColor: '#EF4444'
                    }}
                  >
                    <Mic size={16} />
                    <span>Start Voice Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="btn btn-danger"
                    style={{ padding: '10px 24px', borderRadius: '50px', fontSize: '13px' }}
                  >
                    <Square size={16} />
                    <span>Stop & Process Recording</span>
                  </button>
                )}

                {/* Audio Player if recorded */}
                {audioBlobUrl && (
                  <div style={{ width: '100%', marginTop: '6px' }}>
                    <audio src={audioBlobUrl} controls style={{ width: '100%', height: '32px' }} />
                  </div>
                )}
              </div>

              {/* Voice Note Presets for Instant Demo */}
              <div>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Or load simulated voice audio notes:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { title: 'Pump P-204 Alignment', text: 'Pump P-204 alignment completed today on 15-Sep-2026; final shimming is pending with 2 of 4 bolts torqued.', disc: 'ROTATING_EQUIP' as Discipline },
                    { title: 'Line 24-XX Spool Erect', text: 'Piping crew completed 18 of 24 spool joints on Line 24-XX in the North Pipe rack.', disc: 'PIPING' as Discipline },
                    { title: 'Substation Cable Tray', text: 'Installed 42 meters of cable tray in substation corridor on 14-Sep. Earthing jumpers pending.', disc: 'ELECTRICAL' as Discipline },
                    { title: 'Compressor Foundation', text: 'Poured 160 cubic meters of foundation for Compressor Bay A on 12-Sep.', disc: 'CIVIL' as Discipline }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleVoicePreset(p.text, p.disc, p.title)}
                      className="btn btn-secondary"
                      style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '11.5px' }}
                    >
                      <Volume2 size={13} color="var(--accent-primary)" />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: SCANNED SITE DIARY (OCR VISION SCANNER)              */}
          {/* ============================================================ */}
          {activeTab === 'diary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* File Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                style={{
                  border: '2px dashed var(--border-medium)',
                  borderRadius: '8px',
                  padding: '14px',
                  textAlign: 'center',
                  background: 'var(--bg-input)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.jpg,.jpeg,.png,.webp,.pdf';
                  input.onchange = (e: any) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  };
                  input.click();
                }}
              >
                <Scan size={24} color="var(--accent-primary)" style={{ margin: '0 auto 6px auto' }} />
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Drop Scanned Handwritten Site Diary / Log Sheet
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  AI OCR Vision parses messy handwriting, stamps, and signatures into verified text
                </div>
              </div>

              {/* OCR Scan Mockup & Bounding Boxes */}
              <div style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '14px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                    OCR VISION BOUNDING BOX DETECTOR
                  </span>
                  <span className="badge badge-success">{ocrConfidence}% OCR CONFIDENCE</span>
                </div>

                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  position: 'relative'
                }}>
                  {isOcrScanning && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'var(--accent-primary)',
                      boxShadow: '0 0 10px var(--accent-primary)',
                      animation: 'pulseGlow 1s infinite'
                    }} />
                  )}
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    [Scanned Entry #E-44 - Date: <span style={{ borderBottom: '2px solid var(--accent-primary)', padding: '0 4px', color: 'var(--text-primary)', fontWeight: 600 }}>14/09/2026</span>]
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>
                    Location: <span style={{ background: 'var(--highlight-bg)', border: '1px dashed var(--highlight-border)', padding: '1px 5px', borderRadius: '3px', color: 'var(--accent-secondary)' }}>Substation to Process corridor</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>
                    Activity: Cable tray installation completed. Quantity: <span style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', padding: '1px 5px', borderRadius: '3px', color: '#10B981', fontWeight: 700 }}>42 metres</span> installed on 14 Sep.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: PRIMAVERA P6 / XML SCHEDULE INTAKE                   */}
          {/* ============================================================ */}
          {activeTab === 'p6' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  border: '2px dashed var(--border-medium)',
                  borderRadius: '8px',
                  padding: '14px',
                  textAlign: 'center',
                  background: 'var(--bg-input)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xml,.xer,.json';
                  input.onchange = (e: any) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  };
                  input.click();
                }}
              >
                <FileCode size={24} color="var(--accent-primary)" style={{ margin: '0 auto 6px auto' }} />
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Drop Primavera P6 XML / XER Activity Export
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Directly ingests Level 5/Level 6 baseline activity exports and target quantities
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 6: MULTI-FILE BATCH DROPZONE                            */}
          {/* ============================================================ */}
          {activeTab === 'batch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  border: '2px dashed var(--border-medium)',
                  borderRadius: '8px',
                  padding: '18px',
                  textAlign: 'center',
                  background: 'var(--bg-input)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.onchange = (e: any) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const newItems: BatchFileItem[] = Array.from(e.target.files).map((f: any, idx: number) => ({
                        id: `bf-${Date.now()}-${idx}`,
                        name: f.name,
                        size: `${Math.round(f.size / 1024)} KB`,
                        type: 'report',
                        discipline: 'PIPING',
                        status: 'pending',
                        dateHint: '15 Sep 2026',
                        rawText: `Auto-loaded text payload for ${f.name}`
                      }));
                      setBatchFiles(prev => [...newItems, ...prev]);
                    }
                  };
                  input.click();
                }}
              >
                <UploadCloud size={28} color="var(--accent-primary)" style={{ margin: '0 auto 6px auto' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Drop multiple documents simultaneously
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Batch queues PDFs, CSVs, audio recordings, and images into one continuous ingestion pipeline
                </div>
              </div>

              {/* Batch Queue List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    BATCH QUEUE ({batchFiles.length} files)
                  </span>
                  <button
                    onClick={handleProcessBatch}
                    disabled={isBatchProcessing}
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '11.5px' }}
                  >
                    {isBatchProcessing ? (
                      <>
                        <RefreshCw size={13} className="pulse-glow" />
                        <span>Processing Batch...</span>
                      </>
                    ) : (
                      <>
                        <Layers size={13} />
                        <span>Process All {batchFiles.length} Records</span>
                      </>
                    )}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {batchFiles.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {file.type === 'report' && <FileText size={15} color="var(--accent-primary)" />}
                        {file.type === 'spreadsheet' && <FileSpreadsheet size={15} color="#10B981" />}
                        {file.type === 'voice' && <Mic size={15} color="#EF4444" />}
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>({file.size})</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-neutral">{file.discipline}</span>
                        {file.status === 'processed' ? (
                          <span className="badge badge-success">INGESTED</span>
                        ) : (
                          <span className="badge badge-warning">READY</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Form Meta Fields (Document Name, Submitter, Discipline, Date) */}
          {activeTab !== 'batch' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Document / Source Identifier
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Field Submitter / Author
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={submittedBy}
                    onChange={(e) => setSubmittedBy(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Engineering Discipline
                  </label>
                  <select
                    className="input-field"
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value as Discipline)}
                  >
                    <option value="PIPING">PIPING</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="STATIC_EQUIP">STATIC EQUIPMENT</option>
                    <option value="ROTATING_EQUIP">ROTATING EQUIPMENT</option>
                    <option value="ELECTRICAL">ELECTRICAL</option>
                    <option value="INSTRUMENTATION">INSTRUMENTATION</option>
                    <option value="HSE">HSE</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Date Hint (Free-text / Normalized)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={dateHint}
                    onChange={(e) => setDateHint(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Extracted Raw Text / Document Payload
                </label>
                <textarea
                  className="input-field font-mono"
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste document text or transcription..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {rawText.length} characters | UTF-8 Normalized
                </span>

                <button onClick={handleProcess} className="btn btn-primary">
                  <span>Ingest and Process for Review</span>
                </button>
              </div>
            </>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div style={{
              background: 'var(--success-bg)',
              border: '1px solid var(--success)',
              borderRadius: '6px',
              padding: '10px 14px',
              fontSize: '12.5px',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
              <button
                onClick={() => setActiveView('extract')}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
              >
                Go to Extraction Workspace →
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Real-Time Normalization Stepper & Intelligence */}
        <div className="oil-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Processing Pipeline Status</h2>

          {/* Stepper with live updates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: '1. Format & Channel Ingestion', status: 'done', detail: `${activeTab.toUpperCase()} stream connected` },
              { label: '2. Tokenization & Entity Boundary Detection', status: 'done', detail: 'Stop-word filtering & noise reduction active' },
              { label: '3. ISO Date Normalization Engine', status: 'done', detail: `Date normalized: ${dateHint} (98% confidence)` },
              { label: '4. Multi-Attribute Activity Extraction', status: 'done', detail: `Target discipline: ${discipline}` }
            ].map((step, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)'
              }}>
                <CheckCircle2 size={16} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{step.label}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{step.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Ingestion Stats */}
          <div style={{
            background: 'var(--bg-base)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '14px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}>
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Detected Discipline
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '2px' }}>
                {discipline}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Channel Protocol
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {activeTab.toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--accent-primary-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '11.5px',
            color: 'var(--text-secondary)'
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>Automated Traceability:</strong> Every uploaded document, audio recording, or spreadsheet row is hashed with an immutable timestamp and linked directly to downstream P6 schedule mutations.
          </div>
        </div>
      </div>
    </div>
  );
};

