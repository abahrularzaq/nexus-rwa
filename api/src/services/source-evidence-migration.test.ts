import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

type AssetSourceRow = { id: string; assetId: string; layer: string; field: string; sourceUrl: string; status: string; checkedBy: string | null; notes: string | null; checkedAt: Date; reliability: number };
type AuditRow = { id: string; assetSourceId: string };

function metadataScore(row: AssetSourceRow): number {
  return (row.status !== 'needs_review' ? 100 : 0)
    + (row.checkedBy && !['manual', 'importer'].includes(row.checkedBy) ? 10 : 0)
    + (row.notes ? 5 : 0)
    + row.reliability / 100;
}

function dedupeLikeMigration(sources: AssetSourceRow[], audits: AuditRow[]) {
  const groups = new Map<string, AssetSourceRow[]>();
  for (const source of sources) {
    const key = `${source.assetId}::${source.layer}::${source.field}::${source.sourceUrl}`;
    groups.set(key, [...(groups.get(key) ?? []), source]);
  }

  const survivors = new Set<string>();
  const duplicateToSurvivor = new Map<string, string>();
  for (const group of groups.values()) {
    const [survivor, ...duplicates] = [...group].sort((a, b) => metadataScore(b) - metadataScore(a) || b.checkedAt.getTime() - a.checkedAt.getTime() || a.id.localeCompare(b.id));
    survivors.add(survivor.id);
    for (const duplicate of duplicates) duplicateToSurvivor.set(duplicate.id, survivor.id);
  }

  for (const audit of audits) {
    audit.assetSourceId = duplicateToSurvivor.get(audit.assetSourceId) ?? audit.assetSourceId;
  }

  return sources.filter((source) => survivors.has(source.id));
}

describe('AssetSource unique-key migration policy', () => {
  it('reassigns SourceRepairAudit records before duplicate AssetSource deletion', () => {
    const sources: AssetSourceRow[] = [
      { id: 'plain', assetId: 'asset-1', layer: 'market', field: 'tvl', sourceUrl: 'https://example.test', status: 'needs_review', checkedBy: 'manual', notes: null, checkedAt: new Date('2026-06-20T00:00:00Z'), reliability: 70 },
      { id: 'reviewed', assetId: 'asset-1', layer: 'market', field: 'tvl', sourceUrl: 'https://example.test', status: 'verified', checkedBy: 'reviewer', notes: 'manual review', checkedAt: new Date('2026-06-21T00:00:00Z'), reliability: 90 },
    ];
    const audits: AuditRow[] = [{ id: 'audit-1', assetSourceId: 'plain' }];

    const deduped = dedupeLikeMigration(sources, audits);

    assert.deepEqual(deduped.map((row) => row.id), ['reviewed']);
    assert.equal(audits[0].assetSourceId, 'reviewed');
  });

  it('keeps the strongest survivor metadata and removes duplicate rows before unique index creation', () => {
    const sources: AssetSourceRow[] = [
      { id: 'a', assetId: 'asset-1', layer: 'legal', field: 'docs', sourceUrl: 'https://example.test/docs', status: 'needs_review', checkedBy: null, notes: null, checkedAt: new Date('2026-06-19T00:00:00Z'), reliability: 50 },
      { id: 'b', assetId: 'asset-1', layer: 'legal', field: 'docs', sourceUrl: 'https://example.test/docs', status: 'verified', checkedBy: 'legal-reviewer', notes: 'approved', checkedAt: new Date('2026-06-20T00:00:00Z'), reliability: 80 },
    ];

    const deduped = dedupeLikeMigration(sources, []);

    assert.equal(deduped.length, 1);
    assert.equal(deduped[0].id, 'b');
    assert.equal(deduped[0].status, 'verified');
    assert.equal(deduped[0].checkedBy, 'legal-reviewer');
    assert.equal(deduped[0].notes, 'approved');
  });

  it('migration SQL updates dependent audits before deleting duplicate sources', () => {
    const sql = fs.readFileSync(path.resolve('prisma/migrations/20260621000000_asset_source_unique_key/migration.sql'), 'utf8');
    const auditUpdate = sql.indexOf('UPDATE "SourceRepairAudit"');
    const sourceDelete = sql.indexOf('DELETE FROM "AssetSource"');
    const uniqueIndex = sql.indexOf('CREATE UNIQUE INDEX');

    assert.ok(auditUpdate > -1);
    assert.ok(sourceDelete > auditUpdate);
    assert.ok(uniqueIndex > sourceDelete);
    assert.match(sql, /Survivor policy/);
  });
});
