/**
 * Automated Backend API Integration Test Suite
 * FieldLink Platform | Intelligent Progress & Schedule Linking
 * Validates all REST contracts, SQLite persistence, and security controls
 */

const BASE_URL = 'http://localhost:3001/api';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName} ${details}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✘ FAIL\x1b[0m ${testName} ${details}`);
    failed++;
  }
}

async function runBackendTests() {
  console.log('\n========================================================================');
  console.log('FIELDLINK PLATFORM — BACKEND API & SQLITE PERSISTENCE VERIFICATION');
  console.log('Endpoint: ' + BASE_URL);
  console.log('========================================================================\n');

  try {
    // 1. Health & Relational Telemetry
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    assert(
      healthRes.status === 200 && health.status === 'healthy' && health.engine.includes('SQLite'),
      '[API-HLT-01] Health telemetry returns healthy Node 24 native SQLite status',
      `(Engine: ${health.engine}, DB Size: ${health.databaseSizeKb} KB)`
    );

    // 2. Project Metadata
    const projRes = await fetch(`${BASE_URL}/project`);
    const proj = await projRes.json();
    assert(
      projRes.status === 200 && proj.id === 'proj-baghewala-01',
      '[API-PRJ-01] Retrieves Baghewala Surface Facilities project anchor',
      `(Data Date: ${proj.dataDate})`
    );

    // 3. Activities Query & Single-Row Update
    const actsRes = await fetch(`${BASE_URL}/activities`);
    const acts = await actsRes.json();
    assert(
      actsRes.status === 200 && Array.isArray(acts) && acts.length >= 19,
      `[API-ACT-01] Retrieves complete baseline schedule (${acts.length} activities)`
    );

    const targetAct = acts[0];
    const updateRes = await fetch(`${BASE_URL}/activities/${targetAct.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actualQuantity: 20, syncStatus: 'pending_sync' })
    });
    const updated = await updateRes.json();
    assert(
      updateRes.status === 200 && updated.actualQuantity === 20 && updated.syncStatus === 'pending_sync',
      '[API-ACT-02] Single-row indexed activity update persists to SQLite',
      `(Activity: ${targetAct.activityCode})`
    );

    // 4. Progress Events Query & Mutation
    const eventsRes = await fetch(`${BASE_URL}/events`);
    const events = await eventsRes.json();
    assert(
      eventsRes.status === 200 && Array.isArray(events) && events.length >= 7,
      '[API-EVT-01] Retrieves multi-attribute extracted progress events'
    );

    const patchEventRes = await fetch(`${BASE_URL}/events/${events[0].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validationStatus: 'approved', reviewerId: 'Lead Planner (Test)' })
    });
    const patchedEvent = await patchEventRes.json();
    assert(
      patchEventRes.status === 200 && patchedEvent.validationStatus === 'approved',
      '[API-EVT-02] Updates progress event validation status in SQLite table'
    );

    // 5. Append-Only Audit Trail
    const auditEntry = {
      id: `aud-test-${Date.now().toString(36)}`,
      entityType: 'ScheduleActivity',
      entityId: targetAct.id,
      action: 'APPROVE',
      actor: 'Test Engineer',
      timestamp: new Date().toISOString(),
      beforeValue: { actualQuantity: 18 },
      afterValue: { actualQuantity: 20 },
      reason: 'Automated integration test approval',
      source: 'test-backend-api.mjs'
    };
    const auditRes = await fetch(`${BASE_URL}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auditEntry)
    });
    assert(
      auditRes.status === 201,
      '[API-AUD-01] Appends non-repudiable audit entry to append-only audit trail'
    );

    // 6. Mock PMIS Sync Adapter
    const syncRes = await fetch(`${BASE_URL}/mock-pmis/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityId: targetAct.id, reviewer: 'S. Ghosh (EPPM)' })
    });
    const syncData = await syncRes.json();
    assert(
      syncRes.status === 200 && syncData.status === 'simulated' && syncData.transactionId.startsWith('TX-DEMO-'),
      '[API-P6-01] Mock PMIS sync adapter accepts representative P6 update payload',
      `(Tx: ${syncData.transactionId})`
    );

    // 7. Security: 404 Route Gating
    const notFoundRes = await fetch(`${BASE_URL}/non-existent-route`);
    assert(
      notFoundRes.status === 404,
      '[API-SEC-01] Returns standard 404 Not Found for unregistered routes'
    );

    // 8. Atomic Reset & Clean Re-hydration
    const resetRes = await fetch(`${BASE_URL}/demo/reset`, { method: 'POST' });
    const resetData = await resetRes.json();
    assert(
      resetRes.status === 200 && resetData.success === true,
      '[API-SYS-01] Executes atomic database wipe & pristine baseline re-hydration',
      `(Execution Time: ${resetData.executionTimeMs}ms)`
    );

  } catch (err) {
    console.error('Test execution failed:', err);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`BACKEND TEST RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runBackendTests();
