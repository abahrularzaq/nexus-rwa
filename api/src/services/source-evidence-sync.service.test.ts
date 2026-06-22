import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { extractSourceEvidenceFromSourcesJson, syncCanonicalSourceEvidence } from './source-evidence-sync.service.js';

function source(overrides: Record<string, unknown> = {}) {
  return { layer: 'market', field: 'tvl', value: '100', sourceUrl: 'https://example.test/source', sourceType: 'official', reliability: 90, checkedBy: 'analyst', notes: 'canonical evidence', ...overrides };
}

function tempAssets(rows: unknown[], slug = 'test-asset') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-sources-'));
  const assetDir = path.join(root, slug);
  fs.mkdirSync(assetDir, { recursive: true });
  fs.writeFileSync(path.join(assetDir, 'sources.json'), JSON.stringify(rows));
  return root;
}

function manySources(count: number) {
  return Array.from({ length: count }, (_, index) => source({ field: `field_${index}`, sourceUrl: `https://example.test/source/${index}`, value: String(index) }));
}

type MockOptions = { maxTransactionOperations?: number; failTransactionNumber?: number };

function mockClient(options: MockOptions = {}) {
  const assets = new Map<string, { id: string; slug: string }>();
  const records = new Map<string, any>();
  const calls = { assetUpsert: 0, transactions: [] as number[], interactiveTransactions: 0 };
  let inserted = 0;
  let updated = 0;
  let transactionCount = 0;

  const dbKey = (data: { assetId: string; layer: string; field: string; sourceUrl: string }) => JSON.stringify({ assetId: data.assetId, layer: data.layer, field: data.field, sourceUrl: data.sourceUrl });

  const client: any = {
    asset: {
      upsert: ({ where }: any) => {
        calls.assetUpsert += 1;
        const asset = assets.get(where.slug) ?? { id: `asset:${where.slug}`, slug: where.slug };
        assets.set(where.slug, asset);
        return Promise.resolve(asset);
      },
      findMany: ({ where }: any) => {
        const slugs: string[] = where.slug.in;
        return Promise.resolve(slugs.map((slug) => assets.get(slug)).filter(Boolean));
      },
    },
    assetSource: {
      findMany: ({ where }: any) => {
        const filters = where.OR ?? [];
        const found = filters.map((filter: any) => records.get(dbKey(filter))).filter(Boolean);
        return Promise.resolve(found);
      },
      create: ({ data }: any) => {
        inserted += 1;
        const id = `source:${inserted}`;
        const record = { id, ...data };
        records.set(dbKey(data), record);
        return Promise.resolve(record);
      },
      update: ({ where, data }: any) => {
        updated += 1;
        const entry = [...records.entries()].find(([, value]) => value.id === where.id);
        assert.ok(entry);
        records.set(entry[0], { ...entry[1], ...data });
        return Promise.resolve(records.get(entry[0]));
      },
      count: async () => records.size,
    },
    $transaction: async (operations: any) => {
      if (typeof operations === 'function') {
        calls.interactiveTransactions += 1;
        throw new Error('interactive transactions are not allowed in source sync tests');
      }
      transactionCount += 1;
      calls.transactions.push(operations.length);
      if (options.maxTransactionOperations !== undefined && operations.length > options.maxTransactionOperations) {
        throw new Error(`too many operations in one transaction: ${operations.length}`);
      }
      if (options.failTransactionNumber === transactionCount) {
        throw new Error(`transaction ${transactionCount} failed`);
      }
      return Promise.all(operations);
    },
  };

  return {
    client,
    seedAsset(slug: string) {
      const asset = { id: `asset:${slug}`, slug };
      assets.set(slug, asset);
      return asset;
    },
    seedSource(slug: string, row: ReturnType<typeof source>, overrides: Record<string, unknown> = {}) {
      const asset = assets.get(slug) ?? { id: `asset:${slug}`, slug };
      assets.set(slug, asset);
      const record = { id: `seed:${records.size + 1}`, assetId: asset.id, layer: row.layer, field: row.field, value: row.value, sourceUrl: row.sourceUrl, sourceType: row.sourceType, reliability: row.reliability, checkedBy: row.checkedBy, notes: row.notes, ...overrides };
      records.set(dbKey(record), record);
      return record;
    },
    stats: () => ({ inserted, updated, assets: [...assets.values()], records: [...records.values()], calls }),
  };
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

  it('syncs more rows than one chunk, executes later chunks, and keeps counters accurate', async () => {
    const assetsDir = tempAssets(manySources(60));
    const { client, stats } = mockClient({ maxTransactionOperations: 25 });

    const result = await syncCanonicalSourceEvidence({ assetsDir, client });
    const repeated = await syncCanonicalSourceEvidence({ assetsDir, client });

    assert.equal(result.discovered, 60);
    assert.equal(result.inserted, 60);
    assert.equal(result.updated, 0);
    assert.equal(result.finalTotal, 60);
    assert.equal(repeated.discovered, 60);
    assert.equal(repeated.inserted, 0);
    assert.equal(repeated.updated, 60);
    assert.equal(repeated.finalTotal, 60);
    assert.equal(stats().records.length, 60);
    assert.ok(stats().calls.transactions.length >= 8);
    assert.ok(stats().calls.transactions.some((size) => size === 10));
    assert.equal(stats().calls.interactiveTransactions, 0);
  });

  it('upserts each asset once instead of once per source row', async () => {
    const assetsDir = tempAssets(manySources(40));
    const { client, stats } = mockClient();

    await syncCanonicalSourceEvidence({ assetsDir, client });

    assert.equal(stats().calls.assetUpsert, 1);
    assert.equal(stats().assets.length, 1);
  });

  it('imports sources.json idempotently without overwriting manual review metadata', async () => {
    const rows = [source()];
    const assetsDir = tempAssets(rows);
    const { client, stats, seedAsset, seedSource } = mockClient();
    seedAsset('test-asset');
    seedSource('test-asset', rows[0], { status: 'verified', checkedBy: 'reviewer', notes: 'manual notes', value: 'old', sourceType: 'old', reliability: 10 });

    const first = await syncCanonicalSourceEvidence({ assetsDir, client });
    const second = await syncCanonicalSourceEvidence({ assetsDir, client });

    assert.equal(first.inserted, 0);
    assert.equal(first.updated, 1);
    assert.equal(second.inserted, 0);
    assert.equal(second.updated, 1);
    assert.equal(stats().records.length, 1);
    assert.equal(stats().records[0].value, '100');
    assert.equal(stats().records[0].sourceType, 'official');
    assert.equal(stats().records[0].reliability, 90);
    assert.equal(stats().records[0].status, 'verified');
    assert.equal(stats().records[0].checkedBy, 'reviewer');
    assert.equal(stats().records[0].notes, 'manual notes');
  });

  it('propagates chunk failures with chunk number and source key and does not count failed writes', async () => {
    const assetsDir = tempAssets(manySources(60));
    const { client } = mockClient({ failTransactionNumber: 3 });

    await assert.rejects(
      () => syncCanonicalSourceEvidence({ assetsDir, client }),
      /writing source chunk 2 starting at test-asset::market::field_25::https:\/\/example\.test\/source\/25/,
    );
  });

  it('reports a valid dry-run empty state and performs no database writes', async () => {
    const assetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-sources-empty-'));
    const { client, stats } = mockClient();
    const result = await syncCanonicalSourceEvidence({ assetsDir, dryRun: true, client });
    assert.equal(result.discovered, 0);
    assert.equal(result.inserted, 0);
    assert.equal(result.updated, 0);
    assert.equal(result.warnings.length, 0);
    assert.equal(stats().calls.assetUpsert, 0);
    assert.equal(stats().calls.transactions.length, 0);
  });

  it('syncs 100 synthetic rows without a single oversized transaction', async () => {
    const assetsDir = tempAssets(manySources(100));
    const { client, stats } = mockClient({ maxTransactionOperations: 25 });

    const result = await syncCanonicalSourceEvidence({ assetsDir, client });

    assert.equal(result.discovered, 100);
    assert.equal(result.inserted, 100);
    assert.equal(result.finalTotal, 100);
    assert.ok(stats().calls.transactions.every((size) => size <= 25));
    assert.equal(stats().calls.interactiveTransactions, 0);
  });
});
