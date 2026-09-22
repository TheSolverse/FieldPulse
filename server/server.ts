import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { localDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 1. Health & Database Stats
app.get('/api/health', (req, res) => {
  res.json(localDb.getDatabaseStats());
});

// 2. Project
app.get('/api/project', (req, res) => {
  res.json(localDb.getProject());
});

// 3. Activities
app.get('/api/activities', (req, res) => {
  res.json(localDb.getActivities());
});

app.patch('/api/activities/:id', (req, res) => {
  const updated = localDb.updateActivity(req.params.id, req.body);
  if (!updated) res.status(404).json({ error: 'Activity not found' });
  else res.json(updated);
});

// 4. Field Records
app.get('/api/records', (req, res) => {
  res.json(localDb.getFieldRecords());
});

app.post('/api/records', (req, res) => {
  res.status(201).json(localDb.createFieldRecord(req.body));
});

// 5. Progress Events
app.get('/api/events', (req, res) => {
  res.json(localDb.getProgressEvents());
});

app.post('/api/events', (req, res) => {
  res.status(201).json(localDb.createProgressEvent(req.body));
});

app.patch('/api/events/:id', (req, res) => {
  const updated = localDb.updateProgressEvent(req.params.id, req.body);
  if (!updated) res.status(404).json({ error: 'Event not found' });
  else res.json(updated);
});

// 6. Audit Trail
app.get('/api/audit', (req, res) => {
  res.json(localDb.getAuditTrail());
});

app.post('/api/audit', (req, res) => {
  res.status(201).json(localDb.addAuditEntry(req.body));
});

// 7. Project Memory
app.get('/api/memory', (req, res) => {
  res.json(localDb.getProjectMemory());
});

app.post('/api/memory', (req, res) => {
  res.status(201).json(localDb.addProjectMemory(req.body));
});

// 8. Delay Patterns
app.get('/api/delays', (req, res) => {
  res.json(localDb.getDelayPatterns());
});

// 9. App Settings
app.get('/api/settings', (req, res) => {
  res.json(localDb.getSettings());
});

app.patch('/api/settings', (req, res) => {
  res.json(localDb.updateSettings(req.body));
});

// 10. Local Mock PMIS Synchronization Endpoint
app.post(['/api/mock-pmis/sync', '/api/sync-pmis'], (req, res) => {
  const { activityId, reviewer = 'Lead Planner' } = req.body;
  if (!activityId) {
    res.status(400).json({ error: 'activityId is required' });
    return;
  }

  const acts = localDb.getActivities();
  const target = acts.find(a => a.id === activityId);
  if (!target) {
    res.status(404).json({ error: `Activity ${activityId} not found` });
    return;
  }

  // Mark activity as synced
  localDb.updateActivity(activityId, { syncStatus: 'synced' });

  // Add audit log
  const txId = `TX-DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
  localDb.addAuditEntry({
    id: `aud-sync-${Date.now().toString(36)}`,
    entityType: 'ScheduleActivity',
    entityId: activityId,
    action: 'SYNC',
    actor: `Planner-Attributed (${reviewer})`,
    timestamp: new Date().toISOString(),
    beforeValue: { syncStatus: 'pending_sync' },
    afterValue: { syncStatus: 'synced', mockTransactionId: txId },
    reason: `Recorded progress synchronization to Local Mock PMIS Adapter (Demo Tx: ${txId})`,
    source: 'Local Mock PMIS Adapter (/api/mock-pmis/sync)'
  });

  res.json({
    status: 'simulated',
    success: true,
    transactionId: txId,
    activityCode: target.activityCode,
    message: 'Representative payload accepted by local mock adapter'
  });
});

// 11. Atomic Reset Endpoint
app.post(['/api/demo/reset', '/api/reset'], (req, res) => {
  const t0 = performance.now();
  localDb.resetToBaseline();
  const elapsedMs = performance.now() - t0;
  res.json({
    success: true,
    message: 'Reset complete: pure Baghewala baseline dataset restored.',
    executionTimeMs: Math.round(elapsedMs * 100) / 100
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  const status = err.type === 'entity.too.large' ? 413 : 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n[FIELD_PULSE EXPRESS SERVER]`);
  console.log(`✓ Engine: Node 24 Native SQLite (node:sqlite)`);
  console.log(`✓ Database: ${localDb.getDatabaseStats().databasePath}`);
  console.log(`✓ REST API: http://localhost:${PORT}/api`);
  console.log(`✓ Static Frontend serving enabled\n`);
});
