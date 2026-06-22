import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.REDIS_ENABLED = 'false';
process.env.ADMIN_API_KEY = 'test-admin-key';
process.env.X402_NETWORK = 'base-sepolia';
process.env.PAYMENT_RECIPIENT = '0x0000000000000000000000000000000000000001';

const { createApp } = await import('../src/index.js');
const { setDatabaseClientForTests } = await import('../src/lib/database.js');

const passThrough = async (_c: any, next: () => Promise<void>) => next();
const adminHeaders = { 'content-type': 'application/json', 'x-admin-key': 'test-admin-key' };

type Row = Record<string, any>;

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, expected]) => {
    const actual = row[key];
    if (key === 'asset' && expected && typeof expected === 'object' && 'slug' in expected) {
      return row.asset?.slug === expected.slug || row.assetSlug === expected.slug;
    }
    if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
      if ('in' in expected) return expected.in.includes(actual);
      if ('notIn' in expected) return !expected.notIn.includes(actual);
      if ('not' in expected) return actual !== expected.not;
      if ('gte' in expected) return actual >= expected.gte;
    }
    return actual === expected;
  });
}

function orderRows(rows: Row[], orderBy?: Row): Row[] {
  if (!orderBy) return rows;
  const [[key, dir]] = Object.entries(orderBy);
  return [...rows].sort((a, b) => (dir === 'desc' ? b[key] - a[key] : a[key] - b[key]));
}

function selectRow(row: Row, select?: Row): Row {
  if (!select) return { ...row };
  return Object.fromEntries(Object.keys(select).map((key) => [key, row[key]]));
}

function includeRow(row: Row, include?: Row): Row {
  const selected = { ...row };
  if (include?.asset?.select?.slug && !selected.asset) selected.asset = { slug: row.assetSlug, dataVersion: row.dataVersion ?? 1 };
  return selected;
}

function collection(rows: Row[]) {
  return {
    rows,
    async findUnique({ where }: any) { const row = rows.find((item) => matches(item, where)); return row ? { ...row } : null; },
    async findUniqueOrThrow({ where }: any) {
      const row = rows.find((item) => matches(item, where));
      if (!row) throw new Error('not found');
      return { ...row };
    },
    async findFirst({ where, orderBy }: any = {}) { const row = orderRows(rows.filter((item) => matches(item, where)), orderBy)[0]; return row ? { ...row } : null; },
    async findMany({ where, orderBy, take, select, include }: any = {}) {
      return orderRows(rows.filter((row) => matches(row, where)), orderBy).slice(0, take ?? rows.length).map((row) => select ? selectRow(row, select) : includeRow(row, include));
    },
    async count({ where }: any = {}) { return rows.filter((row) => matches(row, where)).length; },
    async update({ where, data }: any) {
      const row = rows.find((item) => matches(item, where));
      if (!row) throw new Error('not found');
      Object.assign(row, data);
      return { ...row };
    },
    async updateMany({ where, data }: any) {
      const matched = rows.filter((row) => matches(row, where));
      matched.forEach((row) => Object.assign(row, data));
      return { count: matched.length };
    },
    async create({ data }: any) {
      const row = { id: `${rows.length + 1}`, createdAt: new Date(), ...data };
      rows.push(row);
      return row;
    },
  };
}

function buildDb(seed: { reviewTasks?: Row[]; healthChecks?: Row[]; sourceHealth?: Row[]; assetSources?: Row[] } = {}) {
  const reviewTask = collection(seed.reviewTasks ?? []);
  const dataHealthCheck = collection(seed.healthChecks ?? []);
  const sourceHealth = collection(seed.sourceHealth ?? []);
  const monitoringRepairLog = collection([]);
  const syncLog = collection([]);
  const assetSource = collection(seed.assetSources ?? []);
  return {
    reviewTask,
    dataHealthCheck,
    sourceHealth,
    monitoringRepairLog,
    syncLog,
    assetSource,
    async $transaction(fn: any) { return fn(this); },
  } as any;
}

function appWithDb(db: any) {
  setDatabaseClientForTests(db);
  return createApp({ rateLimiter: passThrough, getDatabaseStatus: async () => 'ok', usageTracking: false });
}

beforeEach(() => setDatabaseClientForTests(null));

describe('monitoring workflow regressions', () => {
  it('returns complete source-library meta totals for filtered and unfiltered requests', async () => {
    const checkedAt = new Date('2026-06-21T09:00:00Z');
    const db = buildDb({
      assetSources: [
        { id: 'source-1', assetSlug: 'issuer-a', asset: { slug: 'issuer-a', dataVersion: 1 }, layer: 'market', field: 'tvl', sourceUrl: 'https://issuer.example/1', sourceType: 'official', reliability: 90, status: 'verified', checkedAt, checkedBy: 'reviewer', value: null, notes: null },
        { id: 'source-2', assetSlug: 'issuer-a', asset: { slug: 'issuer-a', dataVersion: 1 }, layer: 'market', field: 'aum', sourceUrl: 'https://issuer.example/2', sourceType: 'official', reliability: 90, status: 'verified', checkedAt, checkedBy: 'reviewer', value: null, notes: null },
        { id: 'source-3', assetSlug: 'issuer-a', asset: { slug: 'issuer-a', dataVersion: 1 }, layer: 'reserve', field: 'audit', sourceUrl: 'https://issuer.example/3', sourceType: 'audit', reliability: 75, status: 'needs_review', checkedAt, checkedBy: 'manual', value: null, notes: null },
      ],
    });
    const app = appWithDb(db);

    const unfiltered = await app.request('/v1/admin/monitoring/sources?limit=2', { headers: { 'x-admin-key': 'test-admin-key' } });
    const unfilteredBody = await unfiltered.json();
    assert.equal(unfiltered.status, 200);
    assert.equal(unfilteredBody.data.length, 2);
    assert.equal(unfilteredBody.meta.total, 3);
    assert.equal(unfilteredBody.meta.limit, 2);

    const filtered = await app.request('/v1/admin/monitoring/sources?status=verified&limit=1', { headers: { 'x-admin-key': 'test-admin-key' } });
    const filteredBody = await filtered.json();
    assert.equal(filtered.status, 200);
    assert.equal(filteredBody.data.length, 1);
    assert.equal(filteredBody.meta.total, 2);
    assert.equal(filteredBody.meta.limit, 1);
  });

  it('reopens only resolved review tasks, preserves original context, clears stale validation, and writes audit log', async () => {
    const db = buildDb({ reviewTasks: [{
      id: 'task-1', assetSlug: 'issuer-a', layer: 'reserve', priority: 'high', reason: 'original reserve mismatch', status: 'resolved',
      resolutionType: 'verified_manual', resolutionNote: 'prior fix', evidenceUrl: 'https://evidence.example/old', validationMethod: 'source-health',
      validationResult: 'healthy', validationEvidenceId: 'source-1', validationEvidenceRef: 'https://issuer.example/reserve', validatedAt: new Date('2026-06-20T00:00:00Z'), validatedBy: 'admin',
      createdAt: new Date('2026-06-19T00:00:00Z'), resolvedAt: new Date('2026-06-20T01:00:00Z'),
    }] });
    const app = appWithDb(db);

    const res = await app.request('/v1/admin/monitoring/review-tasks/task-1/reopen', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ reason: 'regression found' }) });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.data.status, 'reopened');
    assert.equal(body.data.reason, 'original reserve mismatch');
    assert.equal(body.data.validationEvidenceId, null);
    assert.equal(db.monitoringRepairLog.rows[0].action, 'reopen_review_task');
    assert.equal(db.monitoringRepairLog.rows[0].oldValue.validationEvidenceId, 'source-1');
    assert.equal(db.monitoringRepairLog.rows[0].newValue.reopenReason, 'regression found');

    const second = await app.request('/v1/admin/monitoring/review-tasks/task-1/reopen', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ reason: 'again' }) });
    assert.equal(second.status, 409);
  });

  it('requires validation evidence fresher than reopenedAt before resolving reopened review tasks', async () => {
    const now = Date.now();
    const reopenedAt = new Date(now - 60 * 60 * 1000);
    const staleEvidenceAt = new Date(reopenedAt.getTime() - 60 * 1000);
    const freshEvidenceAt = new Date(reopenedAt.getTime() + 60 * 1000);
    const db = buildDb({
      reviewTasks: [{ id: 'task-2', assetSlug: 'issuer-a', layer: 'legal', priority: 'medium', reason: 'bad legal URL https://issuer.example/legal', status: 'reopened', createdAt: new Date('2026-06-20T00:00:00Z'), reopenedAt }],
      sourceHealth: [{ id: 'old-source', assetSlug: 'issuer-a', layer: 'legal', field: 'docs', url: 'https://issuer.example/legal', status: 'healthy', lastCheckedAt: staleEvidenceAt }],
    });
    const app = appWithDb(db);
    const payload = { resolutionType: 'fixed_source', resolutionNote: 'fixed', evidenceUrl: 'https://issuer.example/legal' };

    const stale = await app.request('/v1/admin/monitoring/review-tasks/task-2/close', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify(payload) });
    assert.equal(stale.status, 409);

    db.sourceHealth.rows.push({ id: 'fresh-source', assetSlug: 'issuer-a', layer: 'legal', field: 'docs', url: 'https://issuer.example/legal', status: 'healthy', lastCheckedAt: freshEvidenceAt });
    const fresh = await app.request('/v1/admin/monitoring/review-tasks/task-2/close', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify(payload) });
    const body = await fresh.json();
    assert.equal(fresh.status, 200);
    assert.equal(body.data.status, 'resolved');
    assert.equal(body.data.validationEvidenceId, 'fresh-source');
  });

  it('counts reopened issues as active in overview summaries', async () => {
    const db = buildDb({
      reviewTasks: [
        { id: 'open-task', assetSlug: 'issuer-a', layer: 'reserve', priority: 'high', reason: 'open', status: 'open', createdAt: new Date('2026-06-21T09:00:00Z') },
        { id: 'reopened-task', assetSlug: 'issuer-a', layer: 'legal', priority: 'medium', reason: 'reopened', status: 'reopened', createdAt: new Date('2026-06-20T09:00:00Z'), reopenedAt: new Date('2026-06-21T09:30:00Z') },
        { id: 'resolved-task', assetSlug: 'issuer-a', layer: 'market', priority: 'low', reason: 'resolved', status: 'resolved', createdAt: new Date('2026-06-19T09:00:00Z') },
      ],
      healthChecks: [{ id: 'hc-1', assetSlug: 'issuer-a', layer: 'reserve', status: 'reopened', severity: 'medium', reason: 'still broken', lastCheckedAt: new Date('2026-06-21T09:00:00Z') }],
    });
    const app = appWithDb(db);

    const res = await app.request('/v1/admin/monitoring/overview', { headers: { 'x-admin-key': 'test-admin-key' } });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.data.overview.openReviewTasks, 2);
    assert.equal(body.data.overview.reopenedReviewTasks, 1);
    assert.equal(body.data.reviewStatusSummary.reopened, 1);
    assert.equal(body.data.healthStatusSummary.reopened, 1);
    assert.equal(body.data.recentHealthIssues[0].status, 'reopened');
  });

  it('uses conditional updateMany so concurrent reopen attempts can only reopen once', async () => {
    const db = buildDb({ reviewTasks: [{ id: 'task-3', assetSlug: 'issuer-a', layer: 'reserve', priority: 'high', reason: 'issue', status: 'resolved', createdAt: new Date('2026-06-20T00:00:00Z') }] });
    const app = appWithDb(db);
    let raced = false;
    const originalUpdateMany = db.reviewTask.updateMany;
    db.reviewTask.updateMany = async (args: any) => {
      if (!raced) {
        raced = true;
        db.reviewTask.rows[0].status = 'reopened';
      }
      return originalUpdateMany(args);
    };

    const res = await app.request('/v1/admin/monitoring/review-tasks/task-3/reopen', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ reason: 'race' }) });
    assert.equal(res.status, 409);
    assert.equal(db.monitoringRepairLog.rows.length, 0);
  });

  it('assigns, filters, preserves status, and audit-logs active review tasks', async () => {
    const db = buildDb({ reviewTasks: [{ id: 'task-owner-1', assetSlug: 'issuer-a', layer: 'reserve', priority: 'high', reason: 'owner needed', status: 'open', createdAt: new Date('2026-06-21T09:00:00Z'), assignedOwner: null }] });
    const app = appWithDb(db);

    const assign = await app.request('/v1/admin/monitoring/review-tasks/task-owner-1/assignment', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ assignedOwner: 'Bahrul', expectedAssignedOwner: null }) });
    const assigned = await assign.json();

    assert.equal(assign.status, 200);
    assert.equal(assigned.data.status, 'open');
    assert.equal(assigned.data.assignedOwner, 'Bahrul');
    assert.equal(db.monitoringRepairLog.rows[0].action, 'assign_monitoring_issue');
    assert.equal(db.monitoringRepairLog.rows[0].oldValue.assignedOwner, null);
    assert.equal(db.monitoringRepairLog.rows[0].newValue.assignedOwner, 'Bahrul');

    const filtered = await app.request('/v1/admin/monitoring/review-tasks?assignedOwner=Bahrul', { headers: { 'x-admin-key': 'test-admin-key' } });
    const filteredBody = await filtered.json();
    assert.equal(filtered.status, 200);
    assert.equal(filteredBody.data.length, 1);
  });

  it('rejects stale assignment overwrites and can explicitly unassign health checks', async () => {
    const db = buildDb({ healthChecks: [{ id: 'hc-owner-1', assetSlug: 'issuer-a', layer: 'legal', status: 'reopened', severity: 'medium', reason: 'owner needed', lastCheckedAt: new Date('2026-06-21T09:00:00Z'), assignedOwner: 'Bahrul', assignedAt: new Date('2026-06-21T09:10:00Z'), assignedBy: 'admin-a' }] });
    const app = appWithDb(db);

    const conflict = await app.request('/v1/admin/monitoring/health-checks/hc-owner-1/assignment', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ assignedOwner: 'Maya', expectedAssignedOwner: null }) });
    assert.equal(conflict.status, 409);
    assert.equal(db.dataHealthCheck.rows[0].assignedOwner, 'Bahrul');

    const unassign = await app.request('/v1/admin/monitoring/health-checks/hc-owner-1/assignment', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ assignedOwner: null, expectedAssignedOwner: 'Bahrul' }) });
    const body = await unassign.json();
    assert.equal(unassign.status, 200);
    assert.equal(body.data.assignedOwner, null);
    assert.equal(body.data.assignedAt, null);
    assert.equal(body.data.assignedBy, null);
    assert.equal(body.data.status, 'reopened');
    assert.equal(db.monitoringRepairLog.rows[0].action, 'unassign_monitoring_issue');
  });


  it('assigns resolved review tasks and preserves assignment when reopened', async () => {
    const db = buildDb({ reviewTasks: [{ id: 'task-owner-resolved', assetSlug: 'issuer-a', layer: 'legal', priority: 'medium', reason: 'resolved issue', status: 'resolved', createdAt: new Date('2026-06-20T09:00:00Z'), resolvedAt: new Date('2026-06-21T09:00:00Z'), assignedOwner: null }] });
    const app = appWithDb(db);

    const assign = await app.request('/v1/admin/monitoring/review-tasks/task-owner-resolved/assignment', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ assignedOwner: 'Bahrul', expectedAssignedOwner: null }) });
    const assigned = await assign.json();

    assert.equal(assign.status, 200);
    assert.equal(assigned.data.status, 'resolved');
    assert.equal(assigned.data.assignedOwner, 'Bahrul');
    assert.ok(assigned.data.assignedAt);
    assert.equal(assigned.data.assignedBy, 'admin');

    const reopen = await app.request('/v1/admin/monitoring/review-tasks/task-owner-resolved/reopen', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ reason: 'owner follow-up found new evidence' }) });
    const reopened = await reopen.json();

    assert.equal(reopen.status, 200);
    assert.equal(reopened.data.status, 'reopened');
    assert.equal(reopened.data.assignedOwner, 'Bahrul');
    assert.equal(reopened.data.assignedBy, 'admin');
    assert.ok(reopened.data.assignedAt);
  });

  it('preserves assignment metadata across repair and resolution lifecycle transitions', async () => {
    const now = Date.now();
    const createdAt = new Date(now - 2 * 60 * 60 * 1000);
    const assignedAt = new Date(now - 90 * 60 * 1000);
    const evidenceAt = new Date(now - 5 * 60 * 1000);
    const db = buildDb({
      reviewTasks: [{ id: 'task-owner-lifecycle', assetSlug: 'issuer-a', layer: 'reserve', priority: 'high', reason: 'bad reserve URL https://issuer.example/reserve', status: 'open', createdAt, assignedOwner: 'Bahrul', assignedAt, assignedBy: 'lead-admin' }],
      sourceHealth: [{ id: 'fresh-source-owner', assetSlug: 'issuer-a', layer: 'reserve', field: 'proof', url: 'https://issuer.example/reserve', status: 'healthy', lastCheckedAt: evidenceAt }],
    });
    const app = appWithDb(db);
    const payload = { resolutionType: 'fixed_source', resolutionNote: 'owner kept while source was fixed', evidenceUrl: 'https://issuer.example/reserve' };

    const repair = await app.request('/v1/admin/monitoring/review-tasks/task-owner-lifecycle/repair', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify(payload) });
    const repaired = await repair.json();
    assert.equal(repair.status, 200);
    assert.equal(repaired.data.status, 'pending_validation');
    assert.equal(repaired.data.assignedOwner, 'Bahrul');
    assert.equal(repaired.data.assignedBy, 'lead-admin');
    assert.equal(new Date(repaired.data.assignedAt).toISOString(), assignedAt.toISOString());

    const close = await app.request('/v1/admin/monitoring/review-tasks/task-owner-lifecycle/close', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify(payload) });
    const closed = await close.json();
    assert.equal(close.status, 200);
    assert.equal(closed.data.status, 'resolved');
    assert.equal(closed.data.assignedOwner, 'Bahrul');
    assert.equal(closed.data.assignedBy, 'lead-admin');
    assert.equal(new Date(closed.data.assignedAt).toISOString(), assignedAt.toISOString());
  });

});
