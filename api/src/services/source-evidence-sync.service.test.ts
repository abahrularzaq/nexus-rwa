import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { extractSourceEvidenceFromSourcesJson, syncCanonicalSourceEvidence } from './source-evidence-sync.service.js';

function source(overrides: Record<string, unknown> = {}) {
  return { layer: 'market', field: 'tvl', value: '100', sourceUrl: 'https://example.test/source', sourceType: 'official', reliability: 90, checkedBy: 'analyst', notes: 'canonical evidence', ...overrides };
}

function tempAssets(rows: unknown[]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-sources-'));
  const assetDir = path.join(root, 'test-asset');
  fs.mkdirSync(assetDir, { recursive: true });
  fs.writeFileSync(path.join(assetDir, 'sources.json'), JSON.stringify(rows));
  return root;
}

function mockClient() {
  const records = new Map<string, any>();
  let inserted = 0;
  let updated = 0;
  const tx: any = {
    asset: { upsert: async ({ where }: any) => ({ id: `asset:${where.slug}`, slug: where.slug }) },
    assetSource: {
      findUnique: async ({ where }: any) => records.get(JSON.stringify(where.assetId_layer_field_sourceUrl)) ?? null,
      create: async ({ data }: any) => { inserted += 1; const id = `source:${inserted}`; records.set(JSON.stringify({ assetId: data.assetId, layer: data.layer, field: data.field, sourceUrl: data.sourceUrl }), { id, ...data }); return { id, ...data }; },
      update: async ({ where, data }: any) => { updated += 1; const entry = [...records.entries()].find(([, value]) => value.id === where.id); assert.ok(entry); records.set(entry[0], { ...entry[1], ...data }); return records.get(entry[0]); },
      count: async () => records.size,
    },
  };
  return { client: { ...tx, $transaction: async (fn: any) => fn(tx) } as any, stats: () => ({ inserted, updated, records: [...records.values()] }) };
}

describe('source evidence synchronization', () => {
  it('extracts source rows from canonical sources.json data', () => {
    const result = extractSourceEvidenceFromSourcesJson('test-asset', [source()]);
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].assetSlug, 'test-asset');
    assert.equal(result.rows[0].sourceUrl, 'https://example.test/source');
    assert.equal(result.warnings.length, 0);
  });

  it('skips malformed source evidence with an explicit warning', () => {
    const result = extractSourceEvidenceFromSourcesJson('test-asset', [source(), { layer: 'market' }]);
    assert.equal(result.rows.length, 1);
    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0].message, /requires layer/);
  });

  it('prevents duplicate source rows by canonical key', () => {
    const result = extractSourceEvidenceFromSourcesJson('test-asset', [source(), source({ reliability: 80 })]);
    assert.equal(result.rows.length, 1);
    assert.equal(result.duplicateRowsPrevented, 1);
  });

  it('imports sources.json idempotently without overwriting manual review metadata', async () => {
    const assetsDir = tempAssets([source()]);
    const { client, stats } = mockClient();
    const first = await syncCanonicalSourceEvidence({ assetsDir, client });
    const second = await syncCanonicalSourceEvidence({ assetsDir, client });
    assert.equal(first.inserted, 1);
    assert.equal(second.inserted, 0);
    assert.equal(second.updated, 1);
    assert.equal(stats().records.length, 1);
    assert.equal(stats().records[0].checkedBy, 'analyst');
    assert.equal(stats().records[0].notes, 'canonical evidence');
  });

  it('reports a valid dry-run empty state', async () => {
    const assetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-sources-empty-'));
    const result = await syncCanonicalSourceEvidence({ assetsDir, dryRun: true });
    assert.equal(result.discovered, 0);
    assert.equal(result.inserted, 0);
    assert.equal(result.warnings.length, 0);
  });
});
