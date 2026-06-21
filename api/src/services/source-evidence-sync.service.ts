import fs from 'node:fs';
import path from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';
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
type Tx = Prisma.TransactionClient;

const ROOT = process.cwd();
export const DEFAULT_ASSETS_DIR = path.resolve(ROOT, '..', 'data', 'assets');

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function keyOf(row: Pick<CanonicalSourceEvidence, 'assetSlug' | 'layer' | 'field' | 'sourceUrl'>): string {
  return `${row.assetSlug}::${row.layer}::${row.field}::${row.sourceUrl}`;
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

  let inserted = 0;
  let updated = 0;

  await client.$transaction(async (tx: Tx) => {
    for (const row of rows) {
      const asset = await tx.asset.upsert({ where: { slug: row.assetSlug }, create: { slug: row.assetSlug }, update: {} });
      const existing = await tx.assetSource.findUnique({ where: { assetId_layer_field_sourceUrl: { assetId: asset.id, layer: row.layer, field: row.field, sourceUrl: row.sourceUrl } } });
      if (existing) {
        updated += 1;
        await tx.assetSource.update({
          where: { id: existing.id },
          data: { value: row.value, sourceType: row.sourceType, reliability: row.reliability },
        });
      } else {
        inserted += 1;
        await tx.assetSource.create({
          data: { assetId: asset.id, layer: row.layer, field: row.field, value: row.value, sourceUrl: row.sourceUrl, sourceType: row.sourceType, reliability: row.reliability, checkedBy: row.checkedBy ?? 'manual', notes: row.notes },
        });
      }
    }
  });

  const finalTotal = await client.assetSource.count();
  return { discovered: rows.length, inserted, updated, skippedInvalid: warnings.length - duplicateRowsPrevented, duplicateRowsPrevented, warnings, finalTotal };
}
