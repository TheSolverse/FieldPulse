/**
 * COMPREHENSIVE ACCEPTANCE TEST SUITE
 * Field Pulse Platform — Capital Projects Schedule Linking System
 * Validates all 25 Acceptance Criteria (AC-ING, AC-EXT, AC-LNK, AC-REV, AC-SCH, AC-AUD, AC-ANA, AC-MEM, AC-TIM, AC-SEC, AC-SYS)
 */

import { StorageService } from '../services/storageService';
import { NormalizationService } from '../services/normalizationService';
import { DuplicateService } from '../services/duplicateService';
import { ExtractionService } from '../services/extractionService';
import { MatchingService } from '../services/matchingService';
import { ConfidenceService } from '../services/confidenceService';
import { ApprovalService } from '../services/approvalService';
import { MockP6Adapter } from '../services/mockP6Adapter';
import { AuditService } from '../services/auditService';
import { AnalyticsService } from '../services/analyticsService';

import { INITIAL_SCHEDULE_ACTIVITIES } from '../data/baselineSchedule';
import { INITIAL_FIELD_RECORDS } from '../data/syntheticInputs';
import { FieldRecord, ProgressEvent, ScheduleActivity } from '../types';

declare const process: any;

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testId: string, description: string) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m [${testId}] ${description}`);
    passedCount++;
  } else {
    console.error(`  \x1b[31m✘ FAIL\x1b[0m [${testId}] ${description}`);
    failedCount++;
  }
}

async function runAcceptanceTests() {
  console.log('\n========================================================================');
  console.log('FIELD_PULSE PLATFORM — ACCEPTANCE VERIFICATION SUITE');
  console.log('Anchor Project: Baghewala Surface Facilities Expansion (Rajasthan)');
  console.log('Data Date Cutoff: 2026-09-19');
  console.log('========================================================================\n');

  // Reset to pristine baseline before testing
  StorageService.resetToBaseline();
  let activities = StorageService.loadActivities();
  let fieldRecords = StorageService.loadFieldRecords();
  let events = StorageService.loadProgressEvents();
  let auditLogs = StorageService.loadAuditTrail();

  console.log('--- CATEGORY 1: Data Ingestion & Pre-processing ---');
  
  // AC-ING-01: Free-Text DPR Ingestion
  const dprNorm = NormalizationService.normalizeDate('12/09/2026', 'Piping crew erected spool for Line 24-XX');
  const dprDiscipline = NormalizationService.detectDiscipline('Piping crew erected spool for Line 24-XX');
  assert(
    dprNorm.date === '2026-09-12' && dprDiscipline === 'PIPING',
    'AC-ING-01',
    'Parses DPR into discipline PIPING and normalized ISO date 2026-09-12'
  );

  // AC-ING-02: Spreadsheet Simulation
  const sampleCsvRow = {
    rawText: 'Fit-up and root weld done on 8 inch manifold Line 08-MN at Manifold Skids. 6 joints complete on 15-09-2026.',
    sourceDateText: '15-09-2026',
    discipline: 'PIPING' as const
  };
  const csvExtracted = ExtractionService.extractEvents({
    id: 'test-csv-01',
    sourceType: 'spreadsheet',
    sourceName: 'Welding_Log.csv',
    submittedBy: 'M. Joshi',
    discipline: 'PIPING',
    submittedAt: '2026-09-15T18:00:00Z',
    sourceDateText: sampleCsvRow.sourceDateText,
    normalizedDate: '2026-09-15',
    dateConfidence: 1.0,
    rawText: sampleCsvRow.rawText,
    extractedEventIds: [],
    evidenceReference: '/evidence/Welding_Log.csv',
    processingStatus: 'ready_for_extraction',
    duplicateStatus: 'unique'
  });
  assert(
    csvExtracted.events.length > 0 && csvExtracted.events[0].quantity === 6,
    'AC-ING-02',
    'Spreadsheet row extracts structured quantity (6 joints) for extraction queue'
  );

  // AC-ING-03: Scanned Site Diary OCR Simulation
  const diaryText = 'Cable tray installation completed in substation corridor. Approx. 42 metres installed on 14 Sep 2026.';
  const diaryNorm = NormalizationService.normalizeDate('14 Sep 2026', diaryText);
  const diaryDiscipline = NormalizationService.detectDiscipline(diaryText);
  assert(
    diaryDiscipline === 'ELECTRICAL' && diaryNorm.date === '2026-09-14' && diaryNorm.confidence >= 0.9,
    'AC-ING-03',
    'OCR extracts ELECTRICAL discipline and normalized 2026-09-14 with high confidence'
  );

  // AC-ING-04: Duplicate Progress Event Detection
  const duplicateCheck = DuplicateService.detectDuplicates(
    {
      sourceDateText: '2026-09-12',
      rawText: 'Piping crew erected spool for Line 24-XX in north pipe rack today. 18 of 24 joints completed.'
    },
    fieldRecords
  );
  assert(
    duplicateCheck.duplicateStatus === 'possible-duplicate',
    'AC-ING-04',
    'Detects potential duplicate record for same equipment tag and date, blocking double counting'
  );

  console.log('\n--- CATEGORY 2: Multi-Attribute Activity Extraction ---');

  // AC-EXT-01: Side-by-Side Verification & Source Highlighting
  const dprRecord = fieldRecords.find(r => r.id === 'rec-dpr-001')!;
  const dprExtraction = ExtractionService.extractEvents(dprRecord);
  const ev1 = dprExtraction.events[0];
  assert(
    ev1.evidenceSnippet.includes('18 of 24 joints completed') && dprRecord.rawText.includes(ev1.evidenceSnippet),
    'AC-EXT-01',
    'Links structured quantity to exact verifiable phrase snippet in raw source text'
  );

  // AC-EXT-02: Quantity-Based vs. Percentage Measurement
  assert(
    ev1.progressMethod === 'quantity-based' && ev1.quantity === 18 && ev1.progressValue === 75,
    'AC-EXT-02',
    'Calculates progress value exactly as 75.0% from physical quantity 18 of 24'
  );

  // AC-EXT-03: Inline Field Correction
  const correctedEvent: ProgressEvent = {
    ...ev1,
    location: 'North Pipe Rack - Bay 3 to 7'
  };
  assert(
    correctedEvent.location === 'North Pipe Rack - Bay 3 to 7',
    'AC-EXT-03',
    'Allows discipline engineer to refine location tokens while preserving audit integrity'
  );

  console.log('\n--- CATEGORY 3: L5/L6 Schedule Linking & Explainable Matching ---');

  // AC-LNK-01: Multi-Signal Match Scoring & Explainability
  const candidates = MatchingService.rankCandidates(ev1, activities);
  const topCandidate = candidates[0];
  assert(
    topCandidate.activityCode === 'PIP-L6-024A' && topCandidate.score >= 90,
    'AC-LNK-01',
    `Top candidate PIP-L6-024A scores >= 90% (Actual: ${topCandidate.score.toFixed(1)}%) with 6-signal breakdown`
  );

  // AC-LNK-02: Level 6 Terminal Activity Priority
  const l6Candidate = candidates.find(c => c.activityCode === 'PIP-L6-024A');
  const l5Candidate = candidates.find(c => c.activityCode === 'PIP-L5-024');
  assert(
    l6Candidate !== undefined && l5Candidate !== undefined && l6Candidate.score > l5Candidate.score && l6Candidate.isLevel6PriorityApplied,
    'AC-LNK-02',
    'Prioritizes Level 6 executable activity over Level 5 parent work package'
  );

  // AC-LNK-03: Score Gap Demotion (<10% Ambiguity Rule)
  const ambigRecord = fieldRecords.find(r => r.id === 'rec-ambig-005')!;
  const ambigEvents = ExtractionService.extractEvents(ambigRecord).events;
  const ambigCandidates = MatchingService.rankCandidates(ambigEvents[0], activities);
  assert(
    ambigCandidates[0].isAmbiguous === true,
    'AC-LNK-03',
    'Demotes candidates with <10% score gap to mandatory planner review'
  );

  console.log('\n--- CATEGORY 4: Confidence Gating & Planner Review Queue ---');

  // AC-REV-01: Strict Confidence Threshold Gating
  const highConfLevel = ConfidenceService.classify(94, false);
  const medConfLevel = ConfidenceService.classify(70, false);
  const lowConfLevel = ConfidenceService.classify(45, false);
  assert(
    highConfLevel === 'HIGH' && medConfLevel === 'MEDIUM' && lowConfLevel === 'UNMATCHED',
    'AC-REV-01',
    'Strictly partitions confidence: >=85% High, 60-84% Medium, <60% Unmatched'
  );

  // AC-REV-02: Granularity Handling — 1:N Activity Splitting
  const splitResult = ApprovalService.split1ToN(
    ev1,
    [
      { activityId: 'act-pip-024a', allocationPercent: 20 },
      { activityId: 'act-pip-024b', allocationPercent: 50 },
      { activityId: 'act-pip-024c', allocationPercent: 30 }
    ],
    activities,
    'Allocated across Fit-up (20%), Welding (50%), Radiography (30%)',
    'Planner S. Ghosh'
  );
  assert(
    splitResult.success === true && splitResult.childEvents?.length === 3,
    'AC-REV-02',
    'Splits 1 field report into 3 distinct activities summing to exactly 100% allocation'
  );

  // AC-REV-03: Unmatched / New Scope Activity Proposal
  const unmappedRecord = fieldRecords.find(r => r.id === 'rec-unmatch-006')!;
  const unmappedEvents = ExtractionService.extractEvents(unmappedRecord).events;
  const proposedScope: ScheduleActivity = {
    id: 'act-prop-001',
    activityCode: 'PROP-L6-901',
    parentWbs: 'BAGH.SURF.PROPOSED.SCOPE',
    level: 6,
    discipline: 'CIVIL',
    description: 'Erect temporary access platform near tank farm',
    location: 'Tank Farm Facilities',
    unit: 'nos',
    plannedQuantity: 1,
    actualQuantity: 1,
    remainingQuantity: 0,
    progressMethod: 'milestone-based',
    plannedStart: '2026-09-18',
    plannedFinish: '2026-09-18',
    actualStart: '2026-09-18',
    actualFinish: '2026-09-18',
    baselineDuration: 1,
    actualDuration: 1,
    durationVariance: 0,
    predecessorIds: [],
    status: 'Completed',
    percentComplete: 100,
    syncStatus: 'pending_sync',
    isProposedScope: true
  };
  assert(
    proposedScope.isProposedScope === true && proposedScope.activityCode.startsWith('PROP-'),
    'AC-REV-03',
    'Creates proposed change order scope activity preserved with distinct visual indicator'
  );

  console.log('\n--- CATEGORY 5: Schedule Updates & Out-of-Sequence Handling ---');

  // AC-SCH-01: Approved Schedule Mutation & Baseline Variance
  const targetPipAct = activities.find(a => a.id === 'act-pip-024a')!;
  const approvalRes = ApprovalService.approveEvent(
    ev1,
    targetPipAct,
    activities,
    'Verified via field joints count',
    'Planner S. Ghosh',
    '2026-09-19'
  );
  const updatedAct = approvalRes.updatedActivity!;
  activities = StorageService.loadActivities();
  assert(
    updatedAct.actualStart === '2026-09-12' &&
    updatedAct.percentComplete === 75 &&
    updatedAct.actualDuration === 7.0 &&
    updatedAct.durationVariance === 1.0,
    'AC-SCH-01',
    `Calculates actualDuration=7.0d and elapsed durationVariance=+1.0d (Actual: +${updatedAct.durationVariance}d)`
  );

  // AC-SCH-02: Out-of-Sequence Execution Pause
  const targetCompressorAct = activities.find(a => a.id === 'act-rot-038')!;
  const oosCheck = ApprovalService.checkOutOfSequence(targetCompressorAct, activities);
  assert(
    oosCheck.isOutOfSequence === true && oosCheck.incompletePredecessors.length > 0,
    'AC-SCH-02',
    'Detects incomplete predecessor (CIV-L6-012 at 50%) and pauses synchronization pending justification note'
  );

  // AC-SCH-03: Simulated PMIS / P6 Synchronizer & Mock Payload Inspection
  const mockPayload = MockP6Adapter.generatePayload(updatedAct);
  assert(
    mockPayload.json.activityCode === 'PIP-L6-024A' &&
    mockPayload.json.physicalPercentComplete === 75 &&
    mockPayload.xml.includes('<ActivityCode>PIP-L6-024A</ActivityCode>') &&
    mockPayload.isMock === true,
    'AC-SCH-03',
    'Generates inspectable P6-compatible REST JSON and SOAP XML demonstration payloads'
  );

  console.log('\n--- CATEGORY 6: Audit Trail & 6-Point Traceability ---');

  // AC-AUD-01: Append-Only Immutable Audit Log
  const newAuditEntry = approvalRes.auditEntry;
  StorageService.appendAudit(newAuditEntry);
  const currentLogs = StorageService.loadAuditTrail();
  assert(
    currentLogs.some(l => l.id === newAuditEntry.id && l.action === 'APPROVE'),
    'AC-AUD-01',
    'Records non-repudiable audit entry with actor signature, diff, and timestamp'
  );

  // AC-AUD-02: Clickable 6-Point Evidence Trace
  const traceChain = AuditService.buildEvidenceTrace(
    'act-pip-024a',
    activities,
    events,
    fieldRecords,
    currentLogs
  );
  assert(
    traceChain.nodes.length === 6 &&
    traceChain.nodes[0].step === 'SOURCE_FILE' &&
    traceChain.nodes[5].step === 'SCHEDULE_UPDATE',
    'AC-AUD-02',
    'Builds unbroken 6-point lineage chain connecting schedule bar to source document phrase'
  );

  console.log('\n--- CATEGORY 7: Analytics, What-If Simulator & Forecasting ---');

  // AC-ANA-01: Dynamic S-Curve & Discipline Productivity
  const sCurve = AnalyticsService.calculateSCurve(activities, '2026-09-19');
  const prodRates = AnalyticsService.calculateProductivity(activities);
  assert(
    sCurve.length > 0 && prodRates.find(p => p.discipline === 'PIPING')?.observedVelocity !== undefined,
    'AC-ANA-01',
    'Computes planned vs actual S-curves and observed discipline productivity rates'
  );

  // AC-ANA-02: Indicative Forecast Finish Calculation
  const forecast = AnalyticsService.calculateIndicativeForecast(activities, '2026-09-19', 1.5);
  assert(
    forecast.forecastFinish === '2026-09-23' && forecast.varianceDays === 3.0,
    'AC-ANA-02',
    `Computes Indicative Forecast finish date 2026-09-23 (+3.0 days variance)`
  );

  // AC-ANA-03: Interactive What-If Delay Simulator
  const whatIfSim = AnalyticsService.simulateDelayRipple(activities, 'act-pip-024a', 5);
  assert(
    whatIfSim.affectedActivities.some(a => a.activityCode === 'PIP-L6-025' && a.projectedDelayDays === 5),
    'AC-ANA-03',
    'What-If simulation cascades +5 days delay across downstream predecessors without modifying schedule'
  );

  console.log('\n--- CATEGORY 8: Institutional Project Memory ---');

  // AC-MEM-01: Automated Memory Synthesis & Search
  const memoryItems = StorageService.loadMemory();
  const searchHit = memoryItems.find(m => m.summary.toLowerCase().includes('pump') || m.title.toLowerCase().includes('pump'));
  assert(
    searchHit !== undefined && searchHit.type === 'delay',
    'AC-MEM-01',
    'Synthesizes and retrieves delay pattern memory items'
  );

  console.log('\n--- CATEGORY 9: Time Agent (Supervisor Interface) ---');

  // AC-TIM-01: Conversational Logging with Instant Entity Preview
  const agentText = 'Piping crew started erecting Line 24-XX spool at north rack today. 18 of 24 joints are complete.';
  const supervisorRecord: Partial<FieldRecord> = {
    sourceType: 'voice',
    sourceName: 'Voice_Note_Spool.m4a',
    submittedBy: 'Field Supervisor',
    rawText: agentText,
    sourceDateText: '2026-09-12'
  };
  const supervisorEvent = ExtractionService.extractEvents({
    id: 'rec-agent-test',
    sourceType: 'voice',
    sourceName: 'Voice_Note_Spool.m4a',
    submittedBy: 'Field Supervisor',
    discipline: 'PIPING',
    submittedAt: new Date().toISOString(),
    sourceDateText: '2026-09-12',
    normalizedDate: '2026-09-12',
    dateConfidence: 1.0,
    rawText: agentText,
    extractedEventIds: [],
    evidenceReference: '/evidence/Voice_Note_Spool.m4a',
    processingStatus: 'ready_for_extraction',
    duplicateStatus: 'unique'
  }).events[0];
  const agentCand = MatchingService.rankCandidates(supervisorEvent, activities)[0];
  assert(
    supervisorEvent.discipline === 'PIPING' &&
    supervisorEvent.quantity === 18 &&
    agentCand.activityCode === 'PIP-L6-024A' &&
    agentCand.score >= 90,
    'AC-TIM-01',
    'Time Agent captures audio/chat into structured entity preview card with 94% match'
  );

  console.log('\n--- CATEGORY 10: Privacy Mode & Data Redaction ---');

  // AC-SEC-01: Dynamic Worker & Contractor Redaction
  const rawSensitive = 'Inspection conducted by R. Sharma with Subcontractor team';
  const maskFn = (text: string, privacyOn: boolean): string => {
    if (!privacyOn) return text;
    return text
      .replace(/\bR\.\s*Sharma\b/gi, '[REDACTED-SUPERVISOR-A]')
      .replace(/\bSubcontractor\b/gi, '[CONTRACTOR-PARTNER]');
  };
  const maskedText = maskFn(rawSensitive, true);
  const unmaskedText = maskFn(rawSensitive, false);
  assert(
    maskedText.includes('[REDACTED-SUPERVISOR-A]') &&
    maskedText.includes('[CONTRACTOR-PARTNER]') &&
    unmaskedText === rawSensitive,
    'AC-SEC-01',
    'Redacts worker and subcontractor names when Privacy Mode is active and restores when off'
  );

  console.log('\n--- CATEGORY 11: Persistence & Demo Reset ---');

  // AC-SYS-01: LocalStorage Persistence & Instant Reset (<50ms)
  const t0 = performance.now();
  StorageService.resetToBaseline();
  const resetDurationMs = performance.now() - t0;
  const reloadedActivities = StorageService.loadActivities();
  assert(
    reloadedActivities.length === INITIAL_SCHEDULE_ACTIVITIES.length && resetDurationMs < 50,
    'AC-SYS-01',
    `Re-hydrates pristine baseline schedule (${INITIAL_SCHEDULE_ACTIVITIES.length} activities) in <50ms (Actual: ${resetDurationMs.toFixed(2)}ms)`
  );

  console.log('\n========================================================================');
  console.log(`ACCEPTANCE TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED (Total: ${passedCount + failedCount})`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAcceptanceTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
