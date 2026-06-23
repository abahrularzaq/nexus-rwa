import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

process.env.NODE_ENV = 'test';

const { setDatabaseClientForTests } = await import('./database.js');
const {
  buildReviewTaskFingerprint,
  normalizeSourceUrl,
  upsertReviewTaskDetection,
} = await import('./review-task-fingerprint.js');

type Row = Record<string, any>;

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, expected]) => row[key] === expected);
}

function applyData(row: Row, data: Row): void {
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && 'increment' in value) {
      row[key] = (row[key] ?? 0) + value.increment;
    } else {
      row[key] = value;
    }
  }
}

function orderRows(rows: Row[], orderBy?: Row): Row[] {
  if (!orderBy) return rows;
  const [[key, dir]] = Object.entries(orderBy);
  return [...rows].sort((a, b) => {
    const left = a[key] instanceof Date ? a[key].getTime() : a[key] ?? 0;
    const right = b[key] instanceof Date ? b[key].getTime() : b[key] ?? 0;
    return dir === 'desc' ? right - left : left - right;
  });
}

function reviewTaskCollection(rows: Row[]) {
  return {
    rows,
    async findUnique({ where }: any) {
      const row = rows.find((item) => matches(item, where));
      return row ? { ...row } : null;
    },
    async findUniqueOrThrow({ where }: any) {
      const row = rows.find((item) => matches(item, where));
      if (!row) throw new Error('not found');
      return { ...row };
    },
    async findFirst({ where, orderBy }: any = {}) {
      const row = orderRows(rows.filter((item) => matches(item, where)), orderBy)[0];
      return row ? { ...row } : null;
    },
    async update({ where, data }: any) {
      const row = rows.find((item) => matches(item, where));
      if (!row) throw new Error('not found');
      applyData(row, data);
      return { ...row };
    },
    async updateMany({ where, data }: any) {
      const matched = rows.filter((row) => matches(row, where));
      matched.forEach((row) => applyData(row, data));
      return { count: matched.length };
    },
    async create({ data }: any) {
      if (data.activeFingerprint && rows.some((row) => row.activeFingerprint === data.activeFingerprint)) {
        throw new Error('unique constraint failed');
      }
      const row = { id: `task-${rows.length + 1}`, createdAt: new Date(), ...data };
      rows.push(row);
      return { ...row };
    },
  };
}

function buildDb(seed: Row[] = []) {
  const reviewTask = reviewTaskCollection(seed);
  return {
    reviewTask,
    async $transaction(fn: any) { return fn(this); },
  } as any;
}

function detection(overrides: Partial<Parameters<typeof upsertReviewTaskDetection>[0]> = {}) {
  return {
    assetSlug: 'asset-a',
    layer: 'reserve',
    fieldPath: 'auditUrl',
    sourceUrl: 'https://issuer.example/reports/latest/',
    issueType: 'source-url:broken',
    priority: 'high',
    reason: 'Source URL issue',
    detectedAt: new Date('2026-06-23T00:00:00Z'),
    ...overrides,
  };
}

beforeEach(() => setDatabaseClientForTests(null));

describe('review task fingerprinting', () => {
  it('normalizes trailing slash and URL fragments into the same fingerprint', () => {
    const first = buildReviewTaskFingerprint(detection({
      sourceUrl: ' https://Issuer.Example/reports/latest/#section ',
    }));
    const second = buildReviewTaskFingerprint(detection({
      sourceUrl: 'https://issuer.example/reports/latest/',
    }));

    assert.equal(first, second);
  });

  it('keeps query strings that distinguish resources', () => {
    const first = buildReviewTaskFingerprint(detection({ sourceUrl: 'https://issuer.example/report?id=1' }));
    const second = buildReviewTaskFingerprint(detection({ sourceUrl: 'https://issuer.example/report?id=2' }));

    assert.notEqual(first, second);
  });

  it('preserves path and query casing while normalizing scheme and host', () => {
    assert.equal(
      normalizeSourceUrl(' HTTPS://Issuer.Example/Reports/Latest/?Token=ABC#section '),
      'https://issuer.example/Reports/Latest?Token=ABC',
    );

    const runtimeIdentity = buildReviewTaskFingerprint(detection({
      sourceUrl: 'https://issuer.example/Reports/Latest?Token=ABC',
    }));
    const backfillEquivalentIdentity = buildReviewTaskFingerprint(detection({
      sourceUrl: ' HTTPS://Issuer.Example/Reports/Latest/?Token=ABC#section ',
    }));
    const lowercasedPathIdentity = buildReviewTaskFingerprint(detection({
      sourceUrl: 'https://issuer.example/reports/latest?token=abc',
    }));

    assert.equal(backfillEquivalentIdentity, runtimeIdentity);
    assert.notEqual(lowercasedPathIdentity, runtimeIdentity);
  });

  it('does not merge different field paths', () => {
    const first = buildReviewTaskFingerprint(detection({ fieldPath: 'reserve.auditUrl' }));
    const second = buildReviewTaskFingerprint(detection({ fieldPath: 'legal.prospectusUrl' }));

    assert.notEqual(first, second);
  });

  it('updates the active issue on repeat detection', async () => {
    const db = buildDb();
    setDatabaseClientForTests(db);

    await upsertReviewTaskDetection(detection());
    const updated = await upsertReviewTaskDetection(detection({
      priority: 'medium',
      reason: 'Detected again',
      detectedAt: new Date('2026-06-23T01:00:00Z'),
    }));

    assert.equal(db.reviewTask.rows.length, 1);
    assert.equal(updated.occurrenceCount, 2);
    assert.equal(updated.priority, 'medium');
    assert.equal(updated.reason, 'Detected again');
    assert.equal(updated.lastDetectedAt.toISOString(), '2026-06-23T01:00:00.000Z');
  });

  it('reopens a resolved issue with the same fingerprint', async () => {
    const db = buildDb();
    setDatabaseClientForTests(db);

    const created = await upsertReviewTaskDetection(detection());
    db.reviewTask.rows[0].status = 'resolved';
    db.reviewTask.rows[0].activeFingerprint = null;
    db.reviewTask.rows[0].resolvedAt = new Date('2026-06-23T00:30:00Z');

    const reopened = await upsertReviewTaskDetection(detection({ detectedAt: new Date('2026-06-23T02:00:00Z') }));

    assert.equal(db.reviewTask.rows.length, 1);
    assert.equal(reopened.id, created.id);
    assert.equal(reopened.status, 'reopened');
    assert.equal(reopened.occurrenceCount, 2);
    assert.equal(reopened.activeFingerprint, reopened.fingerprint);
    assert.equal(reopened.resolvedAt, null);
  });

  it('does not create duplicate active issues for concurrent detections', async () => {
    const db = buildDb();
    setDatabaseClientForTests(db);

    await Promise.all([
      upsertReviewTaskDetection(detection()),
      upsertReviewTaskDetection(detection()),
      upsertReviewTaskDetection(detection()),
    ]);

    const active = db.reviewTask.rows.filter((row: Row) => row.activeFingerprint);
    assert.equal(active.length, 1);
    assert.equal(active[0].occurrenceCount, 3);
  });
});
