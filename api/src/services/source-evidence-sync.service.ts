import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { db } from '../lib/database.js';

export type CanonicalSourceEvidence = {
  assetSlug: string;
  layer: string;
  field: string;
  value: string | null;
  sourceUrl: string;
  sourceType: string;
  reliability: number;
  checkedBy: string | null;
  notes: string | null;
};

export type SourceEvidenceWarning = { assetSlug: string; index: number; message: string };
export type SourceEvidenceSyncResult = { discovered: number; inserted: number; updated: number; skippedInvalid: number; duplicateRowsPrevented: number; warnings: SourceEvidenceWarning[]; finalTotal?: number };

type DbClient = PrismaClient;
type AssetSourceKey = Pick<CanonicalSourceEvidence, 'assetSlug' | 'layer' | 'field' | 'sourceUrl'>;

const SOURCE_SYNC_CHUNK_SIZE = 25;

const ROOT = process.cwd();
export const DEFAULT_ASSETS_DIR = path.resolve(ROOT, '..', 'data', 'assets');

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function keyOf(row: AssetSourceKey): string {
  return `${row.assetSlug}::${row.layer}::${row.field}::${row.sourceUrl}`;
}

function dbKeyOf(row: Pick<CanonicalSourceEvidence, 'layer' | 'field' | 'sourceUrl'> & { assetId: string }): string {
  return `${row.assetId}::${row.layer}::${row.field}::${row.sourceUrl}`;
}

function chunks<T>(items: T[], size = SOURCE_SYNC_CHUNK_SIZE): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export function extractSourceEvidenceFromSourcesJson(assetSlug: string, json: unknown): { rows: CanonicalSourceEvidence[]; warnings: SourceEvidenceWarning[]; duplicateRowsPrevented: number } {
  const warnings: SourceEvidenceWarning[] = [];
  if (!Array.isArray(json)) {
    return { rows: [], warnings: [{ assetSlug, index: -1, message: 'sources.json must be an array' }], duplicateRowsPrevented: 0 };
  }

  const rows: CanonicalSourceEvidence[] = [];
  const seen = new Set<string>();
  let duplicateRowsPrevented = 0;

  json.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      warnings.push({ assetSlug, index, message: 'source evidence row must be an object' });
      return;
    }
    const source = item as Record<string, unknown>;
    const layer = typeof source.layer === 'string' ? source.layer.trim() : '';
    const field = typeof source.field === 'string' ? source.field.trim() : '';
    const sourceUrl = typeof source.sourceUrl === 'string' ? source.sourceUrl.trim() : '';
    const sourceType = typeof source.sourceType === 'string' ? source.sourceType.trim() : '';
    const reliability = typeof source.reliability === 'number' ? source.reliability : Number.NaN;

    if (!layer || !field || !sourceUrl || !sourceType || !Number.isFinite(reliability)) {
      warnings.push({ assetSlug, index, message: 'source evidence row requires layer, field, sourceUrl, sourceType, and numeric reliability' });
      return;
    }

    const row: CanonicalSourceEvidence = {
      assetSlug,
      layer,
      field,
      value: source.value === undefined || source.value === null ? null : String(source.value),
      sourceUrl,
      sourceType,
      reliability: Math.round(reliability),
      checkedBy: typeof source.checkedBy === 'string' && source.checkedBy.trim() ? source.checkedBy.trim() : null,
      notes: typeof source.notes === 'string' ? source.notes : null,
    };
    const key = keyOf(row);
    if (seen.has(key)) {
      duplicateRowsPrevented += 1;
      warnings.push({ assetSlug, index, message: `duplicate source evidence key skipped: ${key}` });
      return;
    }
    seen.add(key);
    rows.push(row);
  });

  return { rows, warnings, duplicateRowsPrevented };
}

export function readCanonicalSourceEvidence(assetsDir = DEFAULT_ASSETS_DIR, assetSlugs?: string[]) {
  const slugs = assetSlugs ?? fs.readdirSync(assetsDir).filter((entry) => fs.statSync(path.join(assetsDir, entry)).isDirectory()).sort();
  const rows: CanonicalSourceEvidence[] = [];
  const warnings: SourceEvidenceWarning[] = [];
  let duplicateRowsPrevented = 0;

  for (const assetSlug of slugs) {
    const filePath = path.join(assetsDir, assetSlug, 'sources.json');
    if (!fs.existsSync(filePath)) continue;
    const extracted = extractSourceEvidenceFromSourcesJson(assetSlug, readJson(filePath));
    rows.push(...extracted.rows);
    warnings.push(...extracted.warnings);
    duplicateRowsPrevented += extracted.duplicateRowsPrevented;
  }

  return { rows, warnings, duplicateRowsPrevented };
}

export async function syncCanonicalSourceEvidence(options: { assetsDir?: string; assetSlugs?: string[]; dryRun?: boolean; client?: DbClient } = {}): Promise<SourceEvidenceSyncResult> {
  const { rows, warnings, duplicateRowsPrevented } = readCanonicalSourceEvidence(options.assetsDir, options.assetSlugs);
  const client = options.client ?? db;
  if (options.dryRun) return { discovered: rows.length, inserted: 0, updated: 0, skippedInvalid: warnings.length - duplicateRowsPrevented, duplicateRowsPrevented, warnings };

  const assetSlugs = [...new Set(rows.map((row) => row.assetSlug))].sort();

  for (const [chunkIndex, slugChunk] of chunks(assetSlugs).entries()) {
    try {
      await client.$transaction(slugChunk.map((slug) => client.asset.upsert({ where: { slug }, create: { slug }, update: {} })));
    } catch (error) {
      throw new Error(`Source evidence sync failed while ensuring assets in chunk ${chunkIndex + 1} for slugs: ${slugChunk.join(', ')}`, { cause: error });
    }
  }

  const assets = await client.asset.findMany({ where: { slug: { in: assetSlugs } }, select: { id: true, slug: true } });
  const assetIdBySlug = new Map(assets.map((asset) => [asset.slug, asset.id]));
  const missingSlugs = assetSlugs.filter((slug) => !assetIdBySlug.has(slug));
  if (missingSlugs.length > 0) {
    throw new Error(`Source evidence sync failed because required assets were not found after upsert: ${missingSlugs.join(', ')}`);
  }

  const existingSources = new Map<string, { id: string }>();
  for (const [chunkIndex, rowChunk] of chunks(rows).entries()) {
    const filters = rowChunk.map((row) => ({
      assetId: assetIdBySlug.get(row.assetSlug)!,
      layer: row.layer,
      field: row.field,
      sourceUrl: row.sourceUrl,
    }));
    try {
      const existing = await client.assetSource.findMany({
        where: { OR: filters },
        select: { id: true, assetId: true, layer: true, field: true, sourceUrl: true },
      });
      for (const source of existing) {
        existingSources.set(dbKeyOf(source), { id: source.id });
      }
    } catch (error) {
      const first = rowChunk[0];
      throw new Error(`Source evidence sync failed while reading existing sources in chunk ${chunkIndex + 1} starting at ${first ? keyOf(first) : 'empty chunk'}`, { cause: error });
    }
  }

  let inserted = 0;
  let updated = 0;

  for (const [chunkIndex, rowChunk] of chunks(rows).entries()) {
    let chunkInserted = 0;
    let chunkUpdated = 0;
    const operations = rowChunk.map((row) => {
      const assetId = assetIdBySlug.get(row.assetSlug)!;
      const dbKey = dbKeyOf({ assetId, layer: row.layer, field: row.field, sourceUrl: row.sourceUrl });
      const existing = existingSources.get(dbKey);
      if (existing) {
        chunkUpdated += 1;
        return client.assetSource.update({
          where: { id: existing.id },
          data: { value: row.value, sourceType: row.sourceType, reliability: row.reliability },
        });
      }

      chunkInserted += 1;
      return client.assetSource.create({
        data: { assetId, layer: row.layer, field: row.field, value: row.value, sourceUrl: row.sourceUrl, sourceType: row.sourceType, reliability: row.reliability, checkedBy: row.checkedBy ?? 'manual', notes: row.notes },
      });
    });

    try {
      await client.$transaction(operations);
      inserted += chunkInserted;
      updated += chunkUpdated;
      for (const row of rowChunk) {
        const assetId = assetIdBySlug.get(row.assetSlug)!;
        const dbKey = dbKeyOf({ assetId, layer: row.layer, field: row.field, sourceUrl: row.sourceUrl });
        if (!existingSources.has(dbKey)) {
          existingSources.set(dbKey, { id: dbKey });
        }
      }
    } catch (error) {
      const first = rowChunk[0];
      throw new Error(`Source evidence sync failed while writing source chunk ${chunkIndex + 1} starting at ${first ? keyOf(first) : 'empty chunk'}`, { cause: error });
    }
  }

  const finalTotal = await client.assetSource.count();
  return { discovered: rows.length, inserted, updated, skippedInvalid: warnings.length - duplicateRowsPrevented, duplicateRowsPrevented, warnings, finalTotal };
}
