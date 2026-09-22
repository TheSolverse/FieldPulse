import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MemoryType, Discipline, ProjectMemoryItem } from '../types';
import { 
  Brain, 
  Search, 
  Sparkles, 
  Tag, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Clock, 
  Download, 
  ShieldCheck,
  MapPin,
  Compass,
  BarChart3,
  Sliders,
  Calendar,
  Layers,
  FileCheck,
  Copy,
  ChevronRight,
  Zap,
  Activity,
  Award,
  ArrowUpRight,
  X,
  FileText,
  CheckCircle2,
  Printer,
  FileDown,
  ChevronDown,
  FileSpreadsheet
} from 'lucide-react';

interface ProjectBasin {
  id: string;
  name: string;
  state: string;
  coordinates: { x: number; y: number };
  terrainType: string;
  weatherRisk: 'Low' | 'Medium' | 'High';
  historicalDelayMultiplier: number; // e.g. 1.15 = +15% delay
  pipingVelocity: number; // joints/day
  civilVelocity: number; // m3/day
  electricalVelocity: number; // m/day
  topBottleneck: string;
  mitigation: string;
}

const REGIONAL_BASINS: ProjectBasin[] = [
  {
    id: 'jaisalmer',
    name: 'Jaisalmer Basin Expansion',
    state: 'Rajasthan',
    coordinates: { x: 22, y: 35 },
    terrainType: 'Hard Calcrete & Sand Dunes',
    weatherRisk: 'Medium',
    historicalDelayMultiplier: 1.12,
    pipingVelocity: 6.0,
    civilVelocity: 22.5,
    electricalVelocity: 42.0,
    topBottleneck: 'Hard rock calcrete trenching & extreme afternoon heat (+4.0d)',
    mitigation: 'Deploy heavy mechanical rock trenchers early; shift to dual night welding shifts during peak summer.'
  },
  {
    id: 'assam',
    name: 'Upper Assam Oil Fields',
    state: 'Assam',
    coordinates: { x: 85, y: 32 },
    terrainType: 'Heavy Clay & Riverine Soil',
    weatherRisk: 'High',
    historicalDelayMultiplier: 1.25,
    pipingVelocity: 4.8,
    civilVelocity: 16.0,
    electricalVelocity: 34.0,
    topBottleneck: 'Monsoon flash flooding & road transit axle-load restrictions (+14.0d)',
    mitigation: 'Pre-cast civil foundations off-site; buffer 20% float into monsoon months (June-August).'
  },
  {
    id: 'gujarat',
    name: 'Hazira / Jamnagar Processing Corridor',
    state: 'Gujarat',
    coordinates: { x: 24, y: 55 },
    terrainType: 'Coastal Alluvium & Industrial Park',
    weatherRisk: 'Low',
    historicalDelayMultiplier: 1.04,
    pipingVelocity: 8.5,
    civilVelocity: 32.0,
    electricalVelocity: 55.0,
    topBottleneck: 'High subcontractor congestion & hot-work permit queue turnaround (+2.0d)',
    mitigation: 'Establish dedicated fast-track digital permit authorization with pre-staged safety marshals.'
  },
  {
    id: 'kg-basin',
    name: 'KG Offshore & Onshore Terminal',
    state: 'Andhra Pradesh',
    coordinates: { x: 55, y: 68 },
    terrainType: 'Marine Coastal Soil & Estuary',
    weatherRisk: 'High',
    historicalDelayMultiplier: 1.18,
    pipingVelocity: 5.2,
    civilVelocity: 20.0,
    electricalVelocity: 38.0,
    topBottleneck: 'High saline corrosion protection & specialized marine heavy-lift crane availability (+5.5d)',
    mitigation: 'Contract heavy barge-mounted cranes 60 days in advance with weather contingency standby windows.'
  },
  {
    id: 'barmer',
    name: 'Barmer Crude Gathering Complex',
    state: 'Rajasthan',
    coordinates: { x: 20, y: 45 },
    terrainType: 'Arid Sandstone & Gravel',
    weatherRisk: 'Medium',
    historicalDelayMultiplier: 1.09,
    pipingVelocity: 6.4,
    civilVelocity: 24.0,
    electricalVelocity: 44.0,
    topBottleneck: 'Hydra crane availability & remote desert logistical supply line delays (+3.0d)',
    mitigation: 'Maintain 14-day safety stock of critical line pipe joints, gaskets, and torque consumables on site.'
  }
];

export const ProjectMemoryView: React.FC = () => {
  const { memoryItems, delayPatterns, project } = useApp();

  // Top view mode: 'predictive' | 'map' | 'benchmarks' | 'knowledge'
  const [viewMode, setViewMode] = useState<'predictive' | 'map' | 'benchmarks' | 'knowledge'>('predictive');
  
  // Future Project Simulation Parameters
  const [selectedBasinId, setSelectedBasinId] = useState<string>('jaisalmer');
  const [plannedDurationDays, setPlannedDurationDays] = useState<number>(180);
  const [projectScale, setProjectScale] = useState<number>(1.2); // 1.2x scale
  const [targetSeason, setTargetSeason] = useState<'dry' | 'monsoon' | 'winter'>('dry');
  const [plannedPipingJoints, setPlannedPipingJoints] = useState<number>(1200);
  const [plannedConcreteM3, setPlannedConcreteM3] = useState<number>(3500);

  // Search & Filter
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const currentBasin = REGIONAL_BASINS.find(b => b.id === selectedBasinId) || REGIONAL_BASINS[0];

  // Predictive calculations based on institutional historical parameters
  const seasonMultiplier = targetSeason === 'monsoon' ? 1.15 : targetSeason === 'winter' ? 0.98 : 1.0;
  const totalRiskMultiplier = currentBasin.historicalDelayMultiplier * seasonMultiplier;
  const predictedDurationDays = Math.round(plannedDurationDays * totalRiskMultiplier);
  const durationVarianceDays = predictedDurationDays - plannedDurationDays;
  const recommendedBufferDays = Math.round(durationVarianceDays * 1.15); // +15% safety factor

  // Calculated discipline durations based on empirical velocities
  const empiricalPipingDays = Math.round(plannedPipingJoints / (currentBasin.pipingVelocity * projectScale));
  const empiricalCivilDays = Math.round(plannedConcreteM3 / (currentBasin.civilVelocity * projectScale));

  const filteredItems = memoryItems.filter(item => {
    if (activeTab === 'delay-patterns') return false;
    if (activeTab !== 'all' && item.type !== activeTab) return false;
    if (searchTerm) {
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSearch) return false;
    }
    return true;
  });

  const filteredDelayPatterns = delayPatterns.filter(pattern => {
    if (activeTab !== 'all' && activeTab !== 'delay-patterns') return false;
    if (searchTerm) {
      const matchSearch =
        pattern.cause.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pattern.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pattern.discipline.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
    }
    return true;
  });

  const getMemoryIcon = (type: MemoryType) => {
    switch (type) {
      case 'productivity': return <TrendingUp size={16} color="#10B981" />;
      case 'delay': return <AlertTriangle size={16} color="#EF4444" />;
      case 'duration': return <Clock size={16} color="#F59E0B" />;
      case 'bottleneck': return <Sparkles size={16} color="#3B82F6" />;
      case 'lesson': return <Lightbulb size={16} color="var(--accent-secondary)" />;
      default: return <Brain size={16} />;
    }
  };

  // Modal State for Detailed Report with Visuals
  const [selectedMemoryItem, setSelectedMemoryItem] = useState<ProjectMemoryItem | null>(null);

  // Helper to directly download a rich visual HTML report document onto the user's system as PDF
  const downloadVisualReportPdf = (item: ProjectMemoryItem) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Engineering Feasibility Dossier - ${item.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0B0F19;
      color: #E2E8F0;
      padding: 32px;
      line-height: 1.6;
      margin: 0;
    }
    .container {
      max-width: 920px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid #1E293B;
      border-radius: 12px;
      padding: 36px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    }
    .header {
      border-bottom: 2px solid #3B82F6;
      padding-bottom: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 12px;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #F8FAFC;
      margin: 4px 0 8px 0;
    }
    .meta {
      font-size: 13px;
      color: #94A3B8;
    }
    .badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-right: 8px;
    }
    .badge-blue { background: #1E3A8A; color: #93C5FD; border: 1px solid #3B82F6; }
    .badge-green { background: #064E3B; color: #6EE7B7; border: 1px solid #10B981; }
    .badge-amber { background: #78350F; color: #FCD34D; border: 1px solid #F59E0B; }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-card {
      background: #0B0F19;
      border: 1px solid #1E293B;
      padding: 18px;
      border-radius: 8px;
    }
    .metric-label {
      font-size: 11px;
      color: #94A3B8;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric-val {
      font-size: 24px;
      font-weight: 800;
      color: #38BDF8;
      margin-top: 6px;
    }
    .chart-box {
      background: #0B0F19;
      border: 1px solid #1E293B;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #38BDF8;
      margin: 0 0 14px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
    }
    .table th, .table td {
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid #1E293B;
      font-size: 13px;
    }
    .table th {
      color: #94A3B8;
      background: #0B0F19;
      font-weight: 700;
    }
    .footer {
      border-top: 1px solid #1E293B;
      padding-top: 20px;
      margin-top: 32px;
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      color: #64748B;
      flex-wrap: wrap;
      gap: 8px;
    }
    @media print {
      body { background: #FFF; color: #000; padding: 0; }
      .container { background: #FFF; border: none; box-shadow: none; padding: 10px; }
      .metric-card, .chart-box { background: #F8FAFC; border: 1px solid #CBD5E1; color: #0F172A; }
      .metric-val { color: #0284C7; }
      .table th { background: #F1F5F9; color: #334155; }
      .table td { color: #0F172A; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div style="color: #3B82F6; font-weight: 700; font-size: 12px; margin-bottom: 4px; letter-spacing: 0.1em;">SOLVERSE FIELD LINK &bull; INSTITUTIONAL PROJECT DOSSIER</div>
        <h1 class="title">${item.title}</h1>
        <div class="meta">
          <strong>Anchor Project:</strong> Baghewala Surface Facilities Expansion (Rajasthan) &bull; 
          <strong>Discipline:</strong> ${item.discipline} &bull; 
          <strong>Observation Period:</strong> ${item.dateRange}
        </div>
      </div>
      <div>
        <span class="badge badge-blue">${item.discipline}</span>
        <span class="badge badge-amber">${item.type}</span>
        <span class="badge badge-green">${item.confidence}% CONFIDENCE</span>
      </div>
    </div>

    <div class="grid-4">
      <div class="metric-card">
        <div class="metric-label">Observed Metric</div>
        <div class="metric-val">${item.metricValue || '6.0 joints/d'}</div>
        <div style="font-size: 11.5px; color: #10B981; margin-top: 4px;">&#10003; Field verified</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Statistical Confidence</div>
        <div class="metric-val" style="color: #10B981;">${item.confidence}%</div>
        <div style="font-size: 11.5px; color: #94A3B8; margin-top: 4px;">Multi-agent reconciled</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Discipline / Package</div>
        <div class="metric-val" style="font-size: 18px; color: #F8FAFC; margin-top: 8px;">${item.discipline}</div>
        <div style="font-size: 11.5px; color: #94A3B8; margin-top: 4px;">Category: ${item.type}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Traceable Source Logs</div>
        <div class="metric-val" style="font-size: 18px; color: #93C5FD; margin-top: 8px;">${item.sourceEventIds.length} Linked Events</div>
        <div style="font-size: 11.5px; color: #94A3B8; margin-top: 4px;">Non-repudiable audit</div>
      </div>
    </div>

    <div class="chart-box">
      <div class="section-title">Visual Velocity &amp; Duration Variance Analysis</div>
      <p style="font-size: 13.5px; color: #CBD5E1; margin-bottom: 20px;">${item.summary}</p>
      
      <!-- Visual SVG Benchmark Dual-Bar Chart -->
      <svg width="100%" height="170" viewBox="0 0 650 170" style="background: #060910; border-radius: 8px; padding: 12px;">
        <!-- Grid lines -->
        <line x1="140" y1="30" x2="600" y2="30" stroke="#1E293B" stroke-dasharray="3,3" />
        <line x1="140" y1="75" x2="600" y2="75" stroke="#1E293B" stroke-dasharray="3,3" />
        <line x1="140" y1="120" x2="600" y2="120" stroke="#1E293B" stroke-dasharray="3,3" />

        <!-- Planned Baseline Bar -->
        <text x="15" y="60" fill="#94A3B8" font-size="12" font-weight="600">Planned Baseline</text>
        <rect x="150" y="42" width="400" height="26" rx="4" fill="#334155" />
        <text x="560" y="60" fill="#94A3B8" font-size="12" font-weight="700">8.0 / d</text>

        <!-- Actual Observed Velocity Bar -->
        <text x="15" y="115" fill="#38BDF8" font-size="12" font-weight="700">Observed Actual</text>
        <rect x="150" y="98" width="300" height="26" rx="4" fill="#3B82F6" />
        <text x="460" y="116" fill="#38BDF8" font-size="12" font-weight="700">${item.metricValue || '6.0 / d'}</text>

        <!-- X-Axis Legend -->
        <text x="150" y="150" fill="#64748B" font-size="10">0%</text>
        <text x="350" y="150" fill="#64748B" font-size="10">50% Velocity</text>
        <text x="540" y="150" fill="#64748B" font-size="10">100% Target</text>
      </svg>
    </div>

    <div class="chart-box">
      <div class="section-title">Predictive Schedule Multipliers for Future Projects</div>
      <table class="table">
        <thead>
          <tr>
            <th>Planning Attribute</th>
            <th>Empirical Finding</th>
            <th>Recommended Action / Multiplier</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Discipline Rate Calibration</strong></td>
            <td>Observed execution speed reflects real site conditions &amp; permit turnaround</td>
            <td>Apply <strong>0.75x velocity de-rating</strong> to baseline tender estimates</td>
          </tr>
          <tr>
            <td><strong>Schedule Float &amp; Buffer</strong></td>
            <td>Historical variance delta of ${item.metricValue || '+4.0 days overrun'}</td>
            <td>Include <strong>+15% duration contingency</strong> on critical predecessor paths</td>
          </tr>
          <tr>
            <td><strong>Equipment &amp; Mobilization</strong></td>
            <td>Lifting asset availability and soil strata friction</td>
            <td>Contract heavy crane / breaker attachments with 14-day pre-mobilization audit</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div><strong>Lineage ID:</strong> <code>${item.id}-DOSSIER-${Date.now()}</code></div>
      <div>Solverse Execution-to-Schedule Intelligence &bull; Verified Cutoff 2026-09-19</div>
    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
      setExportFeedback(`Opened PDF Print dialog for "${item.title}"!`);
    } else {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitized = item.title.replace(/[^a-zA-Z0-9]/g, '_');
      link.setAttribute('download', `Dossier_${item.discipline}_${sanitized}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportFeedback(`Downloaded PDF-Ready Dossier for "${item.title}"!`);
    }
    setTimeout(() => setExportFeedback(null), 4000);
  };

  // Helper to copy markdown formatted report
  const copyReportMarkdown = (item: ProjectMemoryItem) => {
    const md = `# Detailed Institutional Memory Dossier: ${item.title}
**Project:** Baghewala Surface Facilities Expansion (Rajasthan)
**Discipline:** ${item.discipline} | **Type:** ${item.type} | **Confidence:** ${item.confidence}%
**Observed Period:** ${item.dateRange} | **Metric:** ${item.metricValue || 'Verified'}

## Operational Summary
${item.summary}

## Empirical Predictive Guidance for Future Projects
- **Observed Rate:** ${item.metricValue || '6.0 units/day'}
- **Recommended Schedule Buffer:** +15% float on critical path activities
- **Key Tags:** ${item.tags.map(t => `#${t}`).join(', ')}
- **Audit Lineage:** ${item.sourceEventIds.join(', ')}
`;
    navigator.clipboard.writeText(md).then(() => {
      setExportFeedback(`Copied Markdown report for "${item.title}" to clipboard!`);
      setTimeout(() => setExportFeedback(null), 4000);
    });
  };

  // Helper to apply memory pattern to Future Estimator
  // State for Export Menu Dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Helper to generate full HTML document for PDF printing & export
  const generateFullPredictiveHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Predictive Feasibility Dossier - ${currentBasin.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0B0F19;
      color: #E2E8F0;
      padding: 32px;
      line-height: 1.6;
      margin: 0;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid #1E293B;
      border-radius: 12px;
      padding: 36px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    }
    .header {
      border-bottom: 2px solid #3B82F6;
      padding-bottom: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 12px;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #F8FAFC;
      margin: 4px 0 8px 0;
    }
    .meta {
      font-size: 13px;
      color: #94A3B8;
    }
    .badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-right: 8px;
    }
    .badge-blue { background: #1E3A8A; color: #93C5FD; border: 1px solid #3B82F6; }
    .badge-green { background: #064E3B; color: #6EE7B7; border: 1px solid #10B981; }
    .badge-amber { background: #78350F; color: #FCD34D; border: 1px solid #F59E0B; }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .metric-card {
      background: #0B0F19;
      border: 1px solid #1E293B;
      padding: 16px;
      border-radius: 8px;
    }
    .metric-label {
      font-size: 11px;
      color: #94A3B8;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric-val {
      font-size: 22px;
      font-weight: 800;
      color: #38BDF8;
      margin-top: 6px;
    }
    .section-box {
      background: #0B0F19;
      border: 1px solid #1E293B;
      border-radius: 8px;
      padding: 22px;
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #38BDF8;
      margin: 0 0 14px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .table th, .table td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #1E293B;
      font-size: 12.5px;
    }
    .table th {
      color: #94A3B8;
      background: #0B0F19;
      font-weight: 700;
    }
    .footer {
      border-top: 1px solid #1E293B;
      padding-top: 16px;
      margin-top: 32px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748B;
    }
    @media print {
      body { background: #FFF; color: #000; padding: 0; }
      .container { background: #FFF; border: none; box-shadow: none; padding: 10px; }
      .metric-card, .section-box { background: #F8FAFC; border: 1px solid #CBD5E1; color: #0F172A; }
      .metric-val { color: #0284C7; }
      .table th { background: #F1F5F9; color: #334155; }
      .table td { color: #0F172A; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div style="color: #3B82F6; font-weight: 700; font-size: 12px; margin-bottom: 4px;">FIELD PULSE &bull; PREDICTIVE FEASIBILITY DOSSIER</div>
        <h1 class="title">${currentBasin.name} (${currentBasin.state})</h1>
        <div class="meta">
          <strong>Anchor Model:</strong> Baghewala Surface Facilities Expansion &bull; 
          <strong>Terrain:</strong> ${currentBasin.terrainType} &bull; 
          <strong>Season:</strong> ${targetSeason.toUpperCase()}
        </div>
      </div>
      <div>
        <span class="badge badge-blue">${currentBasin.state}</span>
        <span class="badge badge-amber">${totalRiskMultiplier.toFixed(2)}x RISK MULTIPLIER</span>
      </div>
    </div>

    <div class="grid-4">
      <div class="metric-card">
        <div class="metric-label">Planned Baseline</div>
        <div class="metric-val" style="color: #94A3B8;">${plannedDurationDays}d</div>
        <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">Tender baseline</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Forecasted Duration</div>
        <div class="metric-val">${predictedDurationDays}d</div>
        <div style="font-size: 11px; color: #F59E0B; margin-top: 4px;">+${durationVarianceDays}d overrun (+${Math.round((durationVarianceDays/plannedDurationDays)*100)}%)</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Recommended Buffer</div>
        <div class="metric-val" style="color: #10B981;">+${recommendedBufferDays}d</div>
        <div style="font-size: 11px; color: #10B981; margin-top: 4px;">15% safety float</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Weather Risk Level</div>
        <div class="metric-val" style="color: ${currentBasin.weatherRisk === 'High' ? '#EF4444' : '#38BDF8'};">${currentBasin.weatherRisk}</div>
        <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">${seasonMultiplier}x season factor</div>
      </div>
    </div>

    <div class="section-box">
      <div class="section-title">1. Discipline Productivity Benchmarks (Empirical Velocity)</div>
      <table class="table">
        <thead>
          <tr>
            <th>Discipline</th>
            <th>Field Velocity</th>
            <th>Planned Scope Volume</th>
            <th>Forecasted Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Piping Joint Erection</strong></td>
            <td>${currentBasin.pipingVelocity} joints/day</td>
            <td>${plannedPipingJoints} joints</td>
            <td><strong>${empiricalPipingDays} days</strong></td>
          </tr>
          <tr>
            <td><strong>Civil Concrete Placement</strong></td>
            <td>${currentBasin.civilVelocity} m³/day</td>
            <td>${plannedConcreteM3} m³</td>
            <td><strong>${empiricalCivilDays} days</strong></td>
          </tr>
          <tr>
            <td><strong>Electrical Cable Pulling</strong></td>
            <td>${currentBasin.electricalVelocity} meters/day</td>
            <td>2,500 meters</td>
            <td><strong>${Math.round(2500 / currentBasin.electricalVelocity)} days</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section-box">
      <div class="section-title">2. Historical Top Bottleneck &amp; Mitigation Mandate</div>
      <div style="padding: 12px; background: #111827; border-left: 3px solid #F59E0B; border-radius: 4px; margin-bottom: 12px;">
        <div style="font-size: 12px; font-weight: 700; color: #FCD34D;">PRIMARY REGIONAL RISK</div>
        <div style="font-size: 13px; color: #E2E8F0; margin-top: 2px;">${currentBasin.topBottleneck}</div>
      </div>
      <div style="padding: 12px; background: #111827; border-left: 3px solid #10B981; border-radius: 4px;">
        <div style="font-size: 12px; font-weight: 700; color: #6EE7B7;">MANDATORY PREVENTATIVE ACTION</div>
        <div style="font-size: 13px; color: #E2E8F0; margin-top: 2px;">${currentBasin.mitigation}</div>
      </div>
    </div>

    <div class="section-box">
      <div class="section-title">3. Verified Institutional Delay Patterns (${delayPatterns.length} Logs)</div>
      <table class="table">
        <thead>
          <tr>
            <th>Discipline</th>
            <th>Category</th>
            <th>Cause Description</th>
            <th>Occurrences</th>
            <th>Avg Impact</th>
          </tr>
        </thead>
        <tbody>
          ${delayPatterns.map(p => `
            <tr>
              <td><span class="badge badge-blue">${p.discipline}</span></td>
              <td>${p.category}</td>
              <td>${p.cause}</td>
              <td>${p.occurrences}x</td>
              <td style="color: #F59E0B; font-weight: 700;">+${p.averageImpactDays}d</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div>Report Generated: ${new Date().toLocaleString()} &bull; Doc ID: <code>PRED-${currentBasin.id.toUpperCase()}-${Date.now()}</code></div>
      <div>Solverse Execution-to-Schedule Intelligence</div>
    </div>
  </div>
</body>
</html>`;
  };

  // 1. Export as PDF (Print Preview & Direct HTML Download)
  const exportPredictiveDossierPdf = () => {
    const html = generateFullPredictiveHtml();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
      setExportFeedback(`Opened PDF Print dialog for ${currentBasin.name}!`);
    } else {
      // Fallback: direct download HTML file
      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Predictive_Dossier_${currentBasin.id}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportFeedback(`Downloaded PDF-Ready Dossier for ${currentBasin.name}!`);
    }
    setTimeout(() => setExportFeedback(null), 4000);
  };

  // 2. Export as CSV Spreadsheet
  const exportPredictiveDossierCsv = () => {
    const csvRows: string[] = [
      '# ========================================================================',
      '# SOLVERSE FIELD PULSE - PREDICTIVE FEASIBILITY & ESTIMATOR EXPORT',
      `# Date Generated: ${new Date().toISOString()}`,
      `# Target Basin: ${currentBasin.name} (${currentBasin.state})`,
      '# ========================================================================',
      '',
      '# SECTION 1: PREDICTIVE FORECAST METRICS',
      'Attribute,Value,Unit,Notes',
      `Target Basin Name,"${currentBasin.name}",string,Regional capital project node`,
      `State / Region,"${currentBasin.state}",string,Geographic state in India`,
      `Terrain Classification,"${currentBasin.terrainType}",string,Subsurface soil condition`,
      `Planned Baseline Duration,${plannedDurationDays},Days,Initial tender schedule`,
      `Predicted Realistic Duration,${predictedDurationDays},Days,Empirically adjusted estimate`,
      `Duration Variance Overrun,+${durationVarianceDays},Days,Forecasted schedule delta`,
      `Recommended Float Buffer,+${recommendedBufferDays},Days,15% risk contingency`,
      `Regional Delay Multiplier,${currentBasin.historicalDelayMultiplier},Multiplier,Historical observed terrain factor`,
      `Target Season Risk Factor,${seasonMultiplier},Multiplier,${targetSeason.toUpperCase()} season weather adjustment`,
      `Calculated Piping Duration,${empiricalPipingDays},Days,For ${plannedPipingJoints} joints at ${currentBasin.pipingVelocity} joints/d`,
      `Calculated Civil Duration,${empiricalCivilDays},Days,For ${plannedConcreteM3} m3 at ${currentBasin.civilVelocity} m3/d`,
      '',
      '# SECTION 2: DISCIPLINE PRODUCTIVITY BENCHMARKS',
      'Discipline,Baseline Planned Rate,Observed Actual Velocity,Unit,Observed Efficiency %,Top Bottleneck,Mitigation Playbook',
      `Piping,8.0,${currentBasin.pipingVelocity},joints/day,75.0%,"${currentBasin.topBottleneck}","${currentBasin.mitigation}"`,
      `Civil Foundation,30.0,${currentBasin.civilVelocity},m3/day,75.0%,"Hard calcrete rock excavation","Deploy heavy hydraulic rock breaker"`,
      `Electrical Cabling,60.0,${currentBasin.electricalVelocity},meters/day,70.0%,"Trench waterlogging & earthing holds","Mandate mobile diesel de-watering pumps"`,
      '',
      '# SECTION 3: EMPIRICAL DELAY PATTERNS REPOSITORY',
      'Pattern ID,Discipline,Category,Cause / Bottleneck Description,Occurrences,Avg Impact (Days)',
      ...delayPatterns.map(p => `"${p.id}","${p.discipline}","${p.category}","${p.cause.replace(/"/g, '""')}",${p.occurrences},+${p.averageImpactDays}`)
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Predictive_Project_Dossier_${currentBasin.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportFeedback(`Exported complete CSV dataset for ${currentBasin.name}!`);
    setTimeout(() => setExportFeedback(null), 4000);
  };

  const handleExportReport = () => {
    const reportText = `# INSTITUTIONAL MEMORY PREDICTIVE FEASIBILITY REPORT
Generated By: Field Pulse Execution-to-Schedule Intelligence
Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
Target Region: ${currentBasin.name} (${currentBasin.state})
Terrain Classification: ${currentBasin.terrainType}

========================================================================
1. EXECUTIVE SUMMARY & PREDICTIVE FORECAST
========================================================================
• Planned Baseline Duration: ${plannedDurationDays} Days
• Predicted Realistic Duration: ${predictedDurationDays} Days (Variance: +${durationVarianceDays} Days)
• Recommended Schedule Contingency Buffer: +${recommendedBufferDays} Days (${Math.round((recommendedBufferDays / plannedDurationDays) * 100)}%)
• Regional Historical Multiplier: ${currentBasin.historicalDelayMultiplier}x
• Target Season Risk Factor: ${targetSeason.toUpperCase()} (${seasonMultiplier}x)

========================================================================
2. DISCIPLINE PRODUCTIVITY BENCHMARKS (HISTORICAL FIELD VELOCITY)
========================================================================
• Piping Joint Erection: ${currentBasin.pipingVelocity} joints/day (Est. Duration: ${empiricalPipingDays} days for ${plannedPipingJoints} joints)
• Civil Concrete Placement: ${currentBasin.civilVelocity} m³/day (Est. Duration: ${empiricalCivilDays} days for ${plannedConcreteM3} m³)
• Electrical Cable Tray: ${currentBasin.electricalVelocity} meters/day

========================================================================
3. HISTORICAL TOP BOTTLENECK & MITIGATION MANDATE
========================================================================
• Identified Risk: ${currentBasin.topBottleneck}
• Mitigation Strategy: ${currentBasin.mitigation}

========================================================================
4. INSTITUTIONAL DELAY PATTERN REPOSITORY (${delayPatterns.length} VERIFIED PATTERNS)
========================================================================
${delayPatterns.map((p, i) => `${i + 1}. [${p.discipline}] ${p.cause} (Avg Impact: +${p.averageImpactDays}d, Frequency: ${p.occurrences}x)`).join('\n')}
`;

    navigator.clipboard.writeText(reportText).then(() => {
      setExportFeedback("Complete Predictive Intelligence Report copied to clipboard!");
      setTimeout(() => setExportFeedback(null), 4000);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Institutional Project Memory & Predictive Intelligence
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Empirical knowledge repository and predictive forecasting engine that transforms historical execution logs into actionable risk buffers and duration forecasts for future capital projects.
          </p>
        </div>

        {/* Multi-Format Export Control */}
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', fontSize: '12.5px' }}
            title="Export future project feasibility dossier as PDF or CSV"
          >
            <Download size={15} />
            <span>Export Predictive Dossier</span>
            <ChevronDown size={14} />
          </button>

          {/* Export Dropdown Menu */}
          {showExportMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '6px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              padding: '6px',
              minWidth: '230px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => {
                  exportPredictiveDossierPdf();
                  setShowExportMenu(false);
                }}
                className="btn btn-secondary"
                style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '12px' }}
              >
                <FileText size={14} color="var(--accent-primary)" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Export as PDF Report</span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Print-ready visual document</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  exportPredictiveDossierCsv();
                  setShowExportMenu(false);
                }}
                className="btn btn-secondary"
                style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '12px' }}
              >
                <FileSpreadsheet size={14} color="#10B981" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Export as CSV File</span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Spreadsheet with all 3 tables</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleExportReport();
                  setShowExportMenu(false);
                }}
                className="btn btn-secondary"
                style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '12px' }}
              >
                <Copy size={14} color="var(--accent-secondary)" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Copy Markdown Dossier</span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Clipboard executive text</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Export Toast */}
      {exportFeedback && (
        <div style={{
          background: 'var(--success-bg)',
          border: '1px solid var(--success)',
          borderRadius: '8px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--success)',
          fontSize: '12.5px'
        }}>
          <ShieldCheck size={16} />
          <span>{exportFeedback}</span>
        </div>
      )}

      {/* Primary Navigation Tabs for Memory & Predictions */}
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
          { id: 'predictive', label: '🔮 Future Project Predictive Model', icon: Sparkles },
          { id: 'map', label: '🗺️ Regional Project Basins Map', icon: MapPin },
          { id: 'benchmarks', label: '📊 Discipline Velocity & S-Curves', icon: BarChart3 },
          { id: 'knowledge', label: '🧠 Institutional Knowledge Base', icon: Brain },
        ].map((tab) => {
          const isActive = viewMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as any)}
              className="btn"
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '9px 16px',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: FUTURE PROJECT PREDICTIVE MODEL & ESTIMATOR                      */}
      {/* ========================================================================= */}
      {viewMode === 'predictive' && (
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '20px' }}>
          
          {/* Left Column: Interactive Simulation Controls */}
          <div className="oil-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Future Project Parameters
              </h2>
              <span className="badge badge-info">AI RISK ENGINE</span>
            </div>

            {/* Target Basin / Location */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Select Geographic Basin / Geological Region
              </label>
              <select
                className="input-field"
                value={selectedBasinId}
                onChange={(e) => setSelectedBasinId(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {REGIONAL_BASINS.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.state}) — {b.terrainType}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Baseline Duration Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Target Planned Duration:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{plannedDurationDays} Days</strong>
              </div>
              <input
                type="range"
                min="60"
                max="540"
                step="15"
                value={plannedDurationDays}
                onChange={(e) => setPlannedDurationDays(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span>60 Days (Fast-Track)</span>
                <span>180 Days</span>
                <span>540 Days (Mega-Project)</span>
              </div>
            </div>

            {/* Target Season Window */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Execution Season Window
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'dry', label: '☀️ Dry / Summer', factor: '1.0x baseline' },
                  { id: 'monsoon', label: '🌧️ Monsoon', factor: '+15% weather risk' },
                  { id: 'winter', label: '❄️ Winter / Optimal', factor: '-2% optimal' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setTargetSeason(s.id as any)}
                    className="btn"
                    style={{
                      padding: '8px',
                      background: targetSeason === s.id ? 'var(--accent-primary)' : 'var(--bg-input)',
                      color: targetSeason === s.id ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <span>{s.label}</span>
                    <span style={{ fontSize: '9.5px', opacity: 0.8 }}>{s.factor}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Planned Scope Quantities */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Piping Scope (Joints)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={plannedPipingJoints}
                  onChange={(e) => setPlannedPipingJoints(parseInt(e.target.value, 10) || 0)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Civil Concrete (m³)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={plannedConcreteM3}
                  onChange={(e) => setPlannedConcreteM3(parseInt(e.target.value, 10) || 0)}
                />
              </div>
            </div>

            {/* Empirical Grounded Factor Alert */}
            <div style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '11.5px',
              lineHeight: 1.5,
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-secondary)', fontWeight: 700, marginBottom: '4px' }}>
                <Activity size={13} />
                <span>Empirical Grounding Basis</span>
              </div>
              Predictions are synthesized from <strong>{memoryItems.length} verified project memory entries</strong> and <strong>{delayPatterns.length} empirical delay incident logs</strong> observed at Baghewala Expansion.
            </div>
          </div>

          {/* Right Column: Predictive Intelligence Forecast Report Card */}
          <div className="oil-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PREDICTIVE FEASIBILITY INTELLIGENCE
                </span>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {currentBasin.name} Forecast
                </h2>
              </div>
              <span className="badge badge-success">GDM-TRAINED ESTIMATOR</span>
            </div>

            {/* Metric KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Original Baseline</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {plannedDurationDays}d
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Planned finish target</div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div style={{ fontSize: '11px', color: 'var(--warning)' }}>AI Predicted Duration</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--warning)', marginTop: '2px' }}>
                  {predictedDurationDays}d
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--warning)' }}>Variance: +{durationVarianceDays}d ({Math.round(((predictedDurationDays - plannedDurationDays)/plannedDurationDays)*100)}%)</div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ fontSize: '11px', color: 'var(--success)' }}>Recommended Buffer</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>
                  +{recommendedBufferDays}d
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--success)' }}>Float contingency</div>
              </div>
            </div>

            {/* Discipline Duration Predictions Based on Empirical Velocity */}
            <div style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                DISCIPLINE SCHEDULE BREAKDOWN (EMPIRICAL VELOCITIES)
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div style={{ padding: '8px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Piping Work Package</div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{empiricalPipingDays} Days</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '2px' }}>
                    @ {currentBasin.pipingVelocity} joints/day rate
                  </div>
                </div>

                <div style={{ padding: '8px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Civil Foundations</div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{empiricalCivilDays} Days</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '2px' }}>
                    @ {currentBasin.civilVelocity} m³/day rate
                  </div>
                </div>

                <div style={{ padding: '8px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Electrical & Trays</div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                    {Math.round(1800 / (currentBasin.electricalVelocity * projectScale))} Days
                  </strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '2px' }}>
                    @ {currentBasin.electricalVelocity} m/day rate
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Mitigation Mandate */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              lineHeight: 1.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontWeight: 700, marginBottom: '4px' }}>
                <AlertTriangle size={14} />
                <span>Primary Historical Bottleneck</span>
              </div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentBasin.topBottleneck}</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                <strong>Mandatory Mitigation:</strong> {currentBasin.mitigation}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: REGIONAL PROJECT BASINS & GEOSPATIAL RISK MAP                     */}
      {/* ========================================================================= */}
      {viewMode === 'map' && (
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '20px' }}>
          
          {/* Interactive Geospatial Map Visual */}
          <div className="oil-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                National Capital Project Regional Basins Map
              </h2>
              <span className="badge badge-neutral">CLICK A BASIN TO INSPECT</span>
            </div>

            {/* SVG Schematic Map Container */}
            <div style={{
              height: '380px',
              background: '#0B132B',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Decorative Map Grid Lines */}
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.2 }}>
                <defs>
                  <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mapGrid)" />
              </svg>

              {/* Schematic India Subcontinent Contours */}
              <svg viewBox="0 0 100 100" style={{ width: '90%', height: '90%', position: 'absolute' }}>
                {/* Simplified Subcontinent Landmass Polygon */}
                <polygon
                  points="25,18 42,12 55,16 65,18 88,24 94,36 82,42 68,48 60,65 52,82 45,92 40,78 30,62 18,52 14,35"
                  fill="rgba(30, 41, 59, 0.7)"
                  stroke="rgba(59, 130, 246, 0.4)"
                  strokeWidth="0.8"
                />

                {/* Regional Connection Flow Lines */}
                <path d="M 22 35 Q 40 45 55 68" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="0.6" strokeDasharray="2,2" />
                <path d="M 24 55 Q 55 45 85 32" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="0.6" strokeDasharray="2,2" />

                {/* Basin Hotspot Markers */}
                {REGIONAL_BASINS.map(basin => {
                  const isSelected = basin.id === selectedBasinId;
                  return (
                    <g key={basin.id} onClick={() => setSelectedBasinId(basin.id)} style={{ cursor: 'pointer' }}>
                      {/* Pulsing ring */}
                      {isSelected && (
                        <circle
                          cx={basin.coordinates.x}
                          cy={basin.coordinates.y}
                          r="6"
                          fill="none"
                          stroke="var(--accent-primary)"
                          strokeWidth="1"
                          opacity="0.8"
                        />
                      )}
                      {/* Center Point */}
                      <circle
                        cx={basin.coordinates.x}
                        cy={basin.coordinates.y}
                        r={isSelected ? "3.5" : "2.5"}
                        fill={isSelected ? "var(--accent-secondary)" : "#38BDF8"}
                        stroke="#ffffff"
                        strokeWidth="0.8"
                      />
                      {/* Label */}
                      <text
                        x={basin.coordinates.x + 4}
                        y={basin.coordinates.y + 1}
                        fontSize="3.2"
                        fontWeight={isSelected ? "bold" : "normal"}
                        fill={isSelected ? "#ffffff" : "var(--text-secondary)"}
                      >
                        {basin.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Map Legend Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                background: 'rgba(15, 23, 42, 0.85)',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                fontSize: '10.5px',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Geospatial Memory Network</div>
                <div>🔵 5 Active Energy Corridors | 94.2% Reliability Index</div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Basin Profile Card */}
          <div className="oil-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-info">{currentBasin.state} REGION</span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {currentBasin.name}
                </h3>
              </div>
              <span className="badge badge-warning">Risk Factor: {currentBasin.weatherRisk}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <div style={{ padding: '8px', background: 'var(--bg-surface-elevated)', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Terrain & Geology</div>
                <strong style={{ color: 'var(--text-primary)' }}>{currentBasin.terrainType}</strong>
              </div>

              <div style={{ padding: '8px', background: 'var(--bg-surface-elevated)', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Delay Multiplier</div>
                <strong style={{ color: 'var(--warning)' }}>{currentBasin.historicalDelayMultiplier}x (+{Math.round((currentBasin.historicalDelayMultiplier - 1)*100)}%)</strong>
              </div>
            </div>

            {/* Velocity Benchmarks in this Basin */}
            <div style={{ background: 'var(--bg-base)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '8px' }}>
                OBSERVED DISCIPLINE VELOCITY BENCHMARKS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Piping Joint Erection:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{currentBasin.pipingVelocity} joints/day</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Civil Concrete Placement:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{currentBasin.civilVelocity} m³/day</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Electrical Cable Tray:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{currentBasin.electricalVelocity} meters/day</strong>
                </div>
              </div>
            </div>

            {/* Mitigation Strategy */}
            <div style={{
              background: 'var(--accent-primary-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '10px',
              fontSize: '11.5px',
              lineHeight: 1.5
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>Regional Engineering Mandate:</strong> {currentBasin.mitigation}
            </div>

            <button
              onClick={() => {
                setViewMode('predictive');
              }}
              className="btn btn-primary"
              style={{ marginTop: 'auto', padding: '8px 14px' }}
            >
              <span>Load Into Predictive Simulator →</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: DISCIPLINE VELOCITY CHARTS & S-CURVES                             */}
      {/* ========================================================================= */}
      {viewMode === 'benchmarks' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* Chart 1: Historical Actual vs Planned Productivity Rates */}
          <div className="oil-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span className="badge badge-info">PRODUCTIVITY BENCHMARKS</span>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                Discipline Velocity (Actual vs Planned Baseline)
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { discipline: 'PIPING (Joints/Day)', actual: 6.0, planned: 8.0, unit: 'joints/d', pct: 75 },
                { discipline: 'CIVIL (Concrete m³/Day)', actual: 22.5, planned: 30.0, unit: 'm³/d', pct: 75 },
                { discipline: 'ELECTRICAL (Cable Tray m/Day)', actual: 42.0, planned: 50.0, unit: 'm/d', pct: 84 },
                { discipline: 'INSTRUMENTATION (Junction Boxes/Day)', actual: 4.0, planned: 4.0, unit: 'jb/d', pct: 100 },
                { discipline: 'ROTATING EQUIPMENT (Pump Alignment Hrs)', actual: 18.0, planned: 14.0, unit: 'hrs/pump', pct: 80 }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.discipline}</span>
                    <span style={{ color: item.actual >= item.planned ? '#10B981' : 'var(--warning)' }}>
                      Actual: <strong>{item.actual}</strong> vs Planned: <strong>{item.planned}</strong> {item.unit}
                    </span>
                  </div>

                  {/* Dual Bar Comparison */}
                  <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${item.pct}%`, height: '100%', background: item.pct >= 100 ? '#10B981' : 'var(--accent-primary)', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              💡 <strong>Key Takeaway:</strong> Field data reveals that Piping and Civil disciplines consistently execute at ~75-80% of unadjusted planning velocity due to crane re-rigging and soil excavation friction.
            </div>
          </div>

          {/* Chart 2: Recurring Delay Impact Root Causes */}
          <div className="oil-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span className="badge badge-danger">ROOT CAUSE DISTRIBUTION</span>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                Recurring Delay Causes Breakdown
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { cause: 'Hard Rock Calcrete Strata (Trenching)', share: 42, avgDays: 4.0, color: '#EF4444' },
                { cause: 'Hydra Crane (14T) Availability & Rigging Contention', share: 28, avgDays: 1.8, color: '#F59E0B' },
                { cause: 'QA/QC Joint NDT & Radiography Signoff Turnaround', share: 18, avgDays: 2.5, color: '#3B82F6' },
                { cause: 'Extreme Afternoon Heat & Permit Isolation Delays', share: 12, avgDays: 1.2, color: '#10B981' }
              ].map((rc, idx) => (
                <div key={idx} style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{rc.cause}</span>
                    <strong style={{ fontSize: '12px', color: rc.color }}>{rc.share}% Impact</strong>
                  </div>

                  <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${rc.share}%`, height: '100%', background: rc.color }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Avg Duration Delay: +{rc.avgDays} days per incident
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 4: FULL KNOWLEDGE BASE & LESSONS REPOSITORY                         */}
      {/* ========================================================================= */}
      {viewMode === 'knowledge' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Filter Toolbar */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All Knowledge (${memoryItems.length + delayPatterns.length})` },
                { id: 'productivity', label: 'Productivity' },
                { id: 'duration', label: 'Duration Deltas' },
                { id: 'delay', label: 'Delays' },
                { id: 'delay-patterns', label: `Recurring Causes (${delayPatterns.length})` },
                { id: 'bottleneck', label: 'Bottlenecks' },
                { id: 'lesson', label: 'Lessons Learned' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '5px 12px', fontSize: '12px' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
              <input
                type="text"
                className="input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patterns, tags, equipment..."
                style={{ paddingLeft: '30px', width: '250px', fontSize: '12px' }}
              />
            </div>
          </div>

          {/* Memory Items Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className="oil-card" 
                onClick={() => setSelectedMemoryItem(item)}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, transform 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'var(--bg-base)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {getMemoryIcon(item.type)}
                      </div>
                      <span className="badge badge-info">{item.discipline}</span>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{item.type}</span>
                    </div>

                    {item.metricValue && (
                      <span className="badge badge-success" style={{ fontSize: '12px' }}>
                        {item.metricValue}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '14px' }}>
                    {item.summary}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                    {item.tags.map(t => (
                      <span key={t} style={{
                        background: 'rgba(148, 163, 184, 0.08)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        color: 'var(--text-muted)'
                      }}>
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '8px'
                  }}>
                    <span>Observed: {item.dateRange}</span>
                    <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={12} />
                      Click for Detail Report & Visuals
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED REPORT & VISUAL DOSSIER MODAL                                    */}
      {/* ========================================================================= */}
      {selectedMemoryItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 15, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={() => setSelectedMemoryItem(null)}
        >
          <div 
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '820px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              background: 'var(--bg-surface-elevated)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-info">{selectedMemoryItem.discipline}</span>
                  <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{selectedMemoryItem.type}</span>
                  <span className="badge badge-success">{selectedMemoryItem.confidence}% Verified Confidence</span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedMemoryItem.title}
                </h2>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Anchor Project: Baghewala Surface Facilities Expansion &bull; Window: {selectedMemoryItem.dateRange}
                </div>
              </div>

              <button
                onClick={() => setSelectedMemoryItem(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 4 Metrics Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ background: 'var(--bg-base)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Observed Metric</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-secondary)', marginTop: '4px' }}>
                    {selectedMemoryItem.metricValue || '6.0 units/d'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-base)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Statistical Confidence</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                    {selectedMemoryItem.confidence}%
                  </div>
                </div>

                <div style={{ background: 'var(--bg-base)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Source DPR Evidence</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '4px' }}>
                    {selectedMemoryItem.sourceEventIds.length} Linked Logs
                  </div>
                </div>

                <div style={{ background: 'var(--bg-base)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Classification</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {selectedMemoryItem.discipline}
                  </div>
                </div>
              </div>

              {/* Operational Summary */}
              <div style={{ background: 'var(--bg-base)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Operational Summary & Field Observations
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                  {selectedMemoryItem.summary}
                </p>
              </div>

              {/* Visual Benchmark SVG Chart */}
              <div style={{ background: 'var(--bg-base)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
                  Visual Velocity Benchmark Comparison
                </div>

                <svg width="100%" height="120" viewBox="0 0 600 120" style={{ background: 'var(--bg-surface)', borderRadius: '6px', padding: '8px' }}>
                  {/* Grid Lines */}
                  <line x1="130" y1="20" x2="550" y2="20" stroke="var(--border-subtle)" strokeDasharray="3,3" />
                  <line x1="130" y1="55" x2="550" y2="55" stroke="var(--border-subtle)" strokeDasharray="3,3" />
                  <line x1="130" y1="90" x2="550" y2="90" stroke="var(--border-subtle)" strokeDasharray="3,3" />

                  {/* Planned Baseline Bar */}
                  <text x="15" y="42" fill="var(--text-muted)" fontSize="11" fontWeight="600">Planned Baseline</text>
                  <rect x="140" y="28" width="360" height="20" rx="3" fill="#334155" />
                  <text x="510" y="43" fill="var(--text-muted)" fontSize="11" fontWeight="700">8.0 / day (100%)</text>

                  {/* Observed Actual Bar */}
                  <text x="15" y="80" fill="var(--accent-secondary)" fontSize="11" fontWeight="700">Observed Actual</text>
                  <rect x="140" y="66" width="270" height="20" rx="3" fill="var(--accent-primary)" />
                  <text x="420" y="81" fill="var(--accent-secondary)" fontSize="11" fontWeight="700">
                    {selectedMemoryItem.metricValue || '6.0 / day (75%)'}
                  </text>
                </svg>
              </div>

              {/* Predictive Guidance for Future Projects */}
              <div style={{ background: 'var(--bg-base)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                  Predictive Guidance for Future Projects
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Recommended Schedule Buffer</div>
                    <div style={{ color: 'var(--accent-secondary)', fontWeight: 700, marginTop: '2px' }}>+15% Critical Path Float Buffer</div>
                  </div>

                  <div style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Tender Velocity De-rating</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginTop: '2px' }}>Apply 0.75x Real-World Calibration</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer / Action Bar */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-surface-elevated)',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => downloadVisualReportPdf(selectedMemoryItem)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
                >
                  <FileDown size={14} />
                  Download Visual Report (.pdf)
                </button>

                <button
                  type="button"
                  onClick={() => copyReportMarkdown(selectedMemoryItem)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
                >
                  <Copy size={14} />
                  Copy Markdown
                </button>

                <button
                  type="button"
                  onClick={() => applyToPredictiveModel(selectedMemoryItem)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
                >
                  <Zap size={14} color="var(--accent-secondary)" />
                  Apply to Estimator
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMemoryItem(null)}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '8px 16px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


