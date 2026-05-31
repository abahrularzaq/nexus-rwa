import type { Prisma } from '@prisma/client';
import { db } from './database.js';
import { fullInclude } from '../types/asset.types.js';
import type { AssetFull } from '../types/asset.types.js';

export type LayerKey =
  | 'identity'
  | 'market'
  | 'risk'
  | 'reserve'
  | 'yield'
  | 'institutional'
  | 'blockchain'
  | 'compliance'
  | 'liquidity'
  | 'aiNarrative'
  | 'events'
  | 'history';

/** Scalar fields that must be non-null for layer completeness (excludes ids/timestamps). */
export const LAYER_REQUIRED_FIELDS: Record<LayerKey, string[]> = {
  identity: ['name', 'symbol', 'category'],
  market: ['tvl', 'lastUpdated'],
  risk: ['overallScore', 'overallLevel', 'counterpartyRisk', 'liquidityRisk'],
  reserve: ['backingType', 'collateralizationRatio'],
  yield: ['currentYield', 'yieldType'],
  institutional: ['issuerName', 'issuerType'],
  blockchain: ['chain', 'contractAddress'],
  compliance: ['regulatoryStatus', 'kycRequired'],
  liquidity: ['redemptionType', 'liquidityScore'],
  aiNarrative: ['summary', 'outlook', 'confidence'],
  events: ['title', 'eventType', 'occurredAt'],
  history: ['timestamp', 'source'],
};

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return true;
}

function layerRecord(
  asset: AssetFull,
  layer: LayerKey,
): Record<string, unknown> | unknown[] | null | undefined {
  switch (layer) {
    case 'blockchain':
      return asset.blockchain;
    case 'events':
      return asset.events;
    case 'history':
      return asset.history;
    default:
      return asset[layer] as Record<string, unknown> | null | undefined;
  }
}

export type LayerCompleteness = {
  layer: LayerKey;
  present: boolean;
  filled: number;
  total: number;
  pct: number;
  missing: string[];
};

export type AssetCompletenessReport = {
  slug: string;
  id: string;
  overallPct: number;
  layers: LayerCompleteness[];
  gaps: string[];
  historyPointCount: number;
  eventCount: number;
  blockchainCount: number;
};

function scoreLayer(asset: AssetFull, layer: LayerKey): LayerCompleteness {
  const required = LAYER_REQUIRED_FIELDS[layer];
  const data = layerRecord(asset, layer);

  if (layer === 'blockchain') {
    const rows = (data as AssetFull['blockchain']) ?? [];
    const present = rows.length > 0;
    const missing: string[] = [];
    let filled = 0;
    const perRow = required.length;
    const total = present ? perRow * rows.length : perRow;
    if (!present) {
      return { layer, present: false, filled: 0, total: perRow, pct: 0, missing: required };
    }
    for (const row of rows) {
      for (const field of required) {
        const v = row[field as keyof typeof row];
        if (isFilled(v)) filled += 1;
        else missing.push(`${field}@${row.chain}`);
      }
    }
    return {
      layer,
      present: true,
      filled,
      total,
      pct: total > 0 ? Math.round((filled / total) * 100) : 0,
      missing,
    };
  }

  if (layer === 'events' || layer === 'history') {
    const rows = (data as unknown[]) ?? [];
    const present = rows.length > 0;
    if (!present) {
      return {
        layer,
        present: false,
        filled: 0,
        total: 1,
        pct: 0,
        missing: [layer === 'events' ? '≥1 event' : '≥1 history point'],
      };
    }
    return {
      layer,
      present: true,
      filled: 1,
      total: 1,
      pct: 100,
      missing: [],
    };
  }

  const row = data as Record<string, unknown> | null | undefined;
  const present = row != null;
  const missing: string[] = [];
  let filled = 0;

  for (const field of required) {
    const v = row?.[field];
    if (isFilled(v)) filled += 1;
    else missing.push(field);
  }

  const total = required.length;
  return {
    layer,
    present,
    filled,
    total,
    pct: present && total > 0 ? Math.round((filled / total) * 100) : 0,
    missing,
  };
}

export function computeAssetCompleteness(asset: AssetFull): AssetCompletenessReport {
  const layerKeys = Object.keys(LAYER_REQUIRED_FIELDS) as LayerKey[];
  const layers = layerKeys.map((layer) => scoreLayer(asset, layer));
  const overallPct =
    layers.length > 0
      ? Math.round(layers.reduce((sum, l) => sum + l.pct, 0) / layers.length)
      : 0;

  const gaps = layers
    .filter((l) => !l.present || l.pct < 100)
    .map((l) => {
      if (!l.present) return `${l.layer}: missing row`;
      if (l.missing.length) return `${l.layer}: ${l.missing.join(', ')}`;
      return `${l.layer}: incomplete`;
    });

  return {
    slug: asset.slug,
    id: asset.id,
    overallPct,
    layers,
    gaps,
    historyPointCount: asset.history?.length ?? 0,
    eventCount: asset.events?.length ?? 0,
    blockchainCount: asset.blockchain?.length ?? 0,
  };
}

export async function fetchAllAssetCompleteness(options?: {
  slug?: string;
  activeOnly?: boolean;
}): Promise<AssetCompletenessReport[]> {
  const where: Prisma.AssetWhereInput = {
    ...(options?.activeOnly !== false ? { isActive: true } : {}),
    ...(options?.slug ? { slug: options.slug } : {}),
  };

  const assets = await db.asset.findMany({
    where,
    include: fullInclude,
    orderBy: { slug: 'asc' },
  });

  return assets.map((a) => computeAssetCompleteness(a as AssetFull));
}

export function formatCompletenessTable(reports: AssetCompletenessReport[]): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('Asset data completeness');
  lines.push('─'.repeat(72));
  lines.push(
    pad('Slug', 22) +
      pad('Overall', 8) +
      pad('Hist', 6) +
      pad('Evts', 6) +
      pad('Chains', 7) +
      'Weakest layers',
  );
  lines.push('─'.repeat(72));

  for (const r of reports) {
    const weak = r.layers
      .filter((l) => l.pct < 100)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3)
      .map((l) => `${l.layer}(${l.pct}%)`)
      .join(', ');
    lines.push(
      pad(r.slug, 22) +
        pad(`${r.overallPct}%`, 8) +
        pad(String(r.historyPointCount), 6) +
        pad(String(r.eventCount), 6) +
        pad(String(r.blockchainCount), 7) +
        (weak || 'complete'),
    );
  }

  lines.push('─'.repeat(72));
  const avg =
    reports.length > 0
      ? Math.round(reports.reduce((s, r) => s + r.overallPct, 0) / reports.length)
      : 0;
  lines.push(`Average overall: ${avg}% across ${reports.length} asset(s)`);
  lines.push('');
  return lines.join('\n');
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

export function formatAssetDetail(report: AssetCompletenessReport): string {
  const lines: string[] = [];
  lines.push(`\n=== ${report.slug} (${report.overallPct}% overall) ===\n`);
  for (const layer of report.layers) {
    const status = !layer.present ? 'MISSING' : layer.pct === 100 ? 'OK' : 'PARTIAL';
    lines.push(
      `  ${pad(layer.layer, 14)} ${pad(status, 8)} ${layer.filled}/${layer.total} (${layer.pct}%)`,
    );
    if (layer.missing.length > 0) {
      lines.push(`      missing: ${layer.missing.join(', ')}`);
    }
  }
  if (report.gaps.length) {
    lines.push('\n  Action items:');
    for (const g of report.gaps) lines.push(`    - ${g}`);
  }
  lines.push('');
  return lines.join('\n');
}
