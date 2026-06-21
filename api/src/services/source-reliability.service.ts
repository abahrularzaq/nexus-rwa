import { db } from '../lib/database.js';
import { logger } from '../lib/logger.js';

export const SOURCE_VERIFICATION_STATUSES = [
  'verified',
  'stale',
  'unavailable',
  'conflicting',
  'needs_review',
] as const;

export type SourceVerificationStatus = (typeof SOURCE_VERIFICATION_STATUSES)[number];

type SourceTrailOptions = {
  assetSlug?: string;
  layer?: string;
  field?: string;
  status?: string;
  limit?: number;
};

type SourceLike = {
  reliability: number | null;
  checkedBy: string | null;
  checkedAt: Date;
  sourceType: string | null;
  status?: string | null;
};

type HealthLike = {
  status: string;
  httpStatus: number | null;
  errorMessage: string | null;
  lastCheckedAt: Date;
};

const STALE_AFTER_MS = 1000 * 60 * 60 * 24 * 30;
const CHECK_TIMEOUT_MS = 8_000;

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeStatus(value: unknown): SourceVerificationStatus | null {
  const status = String(value ?? '').toLowerCase().replace(/[\s-]+/g, '_');
  if (SOURCE_VERIFICATION_STATUSES.includes(status as SourceVerificationStatus)) {
    return status as SourceVerificationStatus;
  }
  return null;
}

function healthStatusToVerificationStatus(health: HealthLike | undefined, source: SourceLike): SourceVerificationStatus {
  const manual = source.checkedBy?.toLowerCase().replace(/[\s-]+/g, '_');
  if (manual === 'manual_required' || manual === 'manual_review_required') return 'needs_review';

  const sourceStatus = normalizeStatus(source.status);
  if (sourceStatus && sourceStatus !== 'needs_review') return sourceStatus;

  const explicit = normalizeStatus(health?.status);
  if (explicit) return explicit;

  if (!health) return 'needs_review';
  if (['healthy', 'redirected'].includes(health.status)) {
    const lastChecked = health.lastCheckedAt.getTime();
    return Number.isFinite(lastChecked) && Date.now() - lastChecked > STALE_AFTER_MS ? 'stale' : 'verified';
  }
  if (['broken', 'timeout', 'error', 'restricted'].includes(health.status)) return 'unavailable';
  return 'needs_review';
}

function statusScore(status: SourceVerificationStatus): number {
  switch (status) {
    case 'verified': return 100;
    case 'stale': return 65;
    case 'conflicting': return 45;
    case 'needs_review': return 55;
    case 'unavailable': return 15;
  }
}

function sourceTier(sourceType: string | null, sourceUrl: string): 'Tier 1' | 'Tier 2' | 'Tier 3' {
  const type = (sourceType ?? '').toLowerCase();
  const url = sourceUrl.toLowerCase();
  if (type.includes('official') || type.includes('legal') || type.includes('terms') || type.includes('transparency') || type.includes('audit') || type.includes('sec') || type.includes('block_explorer') || url.includes('etherscan.io') || url.includes('sec.gov')) return 'Tier 1';
  if (type.includes('market') || type.includes('aggregator') || url.includes('rwa.xyz') || url.includes('defillama') || url.includes('coingecko') || url.includes('coinmarketcap')) return 'Tier 2';
  return 'Tier 3';
}

function reliabilityFrom(source: SourceLike, status: SourceVerificationStatus): number {
  return clamp((source.reliability ?? 0) * 0.7 + statusScore(status) * 0.3);
}

function latestHealthKey(assetSlug: string, layer: string, field: string | null, url: string): string {
  return `${assetSlug}::${layer}::${field ?? ''}::${url}`;
}

export async function getSourceTrail(options: SourceTrailOptions = {}) {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  const sources = await db.assetSource.findMany({
    where: {
      ...(options.assetSlug ? { asset: { slug: options.assetSlug } } : {}),
      ...(options.layer ? { layer: options.layer } : {}),
      ...(options.field ? { field: options.field } : {}),
    },
    orderBy: { checkedAt: 'desc' },
    take: 5000,
    include: { asset: { select: { slug: true, dataVersion: true } } },
  });

  const healthRows = await db.sourceHealth.findMany({
    where: {
      ...(options.assetSlug ? { assetSlug: options.assetSlug } : {}),
      ...(options.layer ? { layer: options.layer } : {}),
      ...(options.field ? { field: options.field } : {}),
    },
    orderBy: { lastCheckedAt: 'desc' },
    take: 10000,
  });

  const latestHealth = new Map<string, HealthLike>();
  for (const row of healthRows) {
    const key = latestHealthKey(row.assetSlug, row.layer, row.field ?? null, row.url);
    if (!latestHealth.has(key)) latestHealth.set(key, row);
  }

  const rows = sources.map((source) => {
    const assetSlug = source.asset.slug;
    const health = latestHealth.get(latestHealthKey(assetSlug, source.layer, source.field, source.sourceUrl));
    const status = healthStatusToVerificationStatus(health, source);
    return {
      id: source.id,
      assetSlug,
      layer: source.layer,
      field: source.field,
      value: source.value,
      sourceUrl: source.sourceUrl,
      sourceType: source.sourceType,
      tier: sourceTier(source.sourceType, source.sourceUrl),
      reliability: reliabilityFrom(source, status),
      baseReliability: source.reliability,
      checkedBy: source.checkedBy,
      checkedAt: source.checkedAt,
      status,
      httpStatus: health?.httpStatus ?? null,
      errorMessage: health?.errorMessage ?? null,
      lastCheckedAt: health?.lastCheckedAt ?? source.checkedAt,
      notes: source.notes,
      dataVersion: source.asset.dataVersion,
    };
  }).filter((row) => !options.status || row.status === options.status);

  return rows.slice(0, limit);
}

export async function getSourceReliabilitySummary(assetSlug?: string) {
  const rows = await getSourceTrail({ assetSlug, limit: 500 });
  const grouped = rows.reduce<Map<string, typeof rows>>((acc, row) => {
    const key = `${row.assetSlug}::${row.layer}`;
    acc.set(key, [...(acc.get(key) ?? []), row]);
    return acc;
  }, new Map());

  return Array.from(grouped.entries()).map(([key, group]) => {
    const [slug, layer] = key.split('::');
    const verified = group.filter((row) => row.status === 'verified').length;
    const unavailable = group.filter((row) => row.status === 'unavailable').length;
    const conflicting = group.filter((row) => row.status === 'conflicting').length;
    const needsReview = group.filter((row) => row.status === 'needs_review').length;
    const avgReliability = group.length ? clamp(group.reduce((sum, row) => sum + row.reliability, 0) / group.length) : 0;
    return { assetSlug: slug, layer, totalSources: group.length, verified, stale: group.filter((row) => row.status === 'stale').length, unavailable, conflicting, needsReview, reliability: avgReliability };
  }).sort((a, b) => a.assetSlug.localeCompare(b.assetSlug) || a.layer.localeCompare(b.layer));
}

async function checkUrl(url: string): Promise<{ status: SourceVerificationStatus; httpStatus: number | null; errorMessage: string | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    const status = response.status >= 200 && response.status < 400 ? 'verified' : response.status === 409 ? 'conflicting' : 'unavailable';
    return { status, httpStatus: response.status, errorMessage: response.ok ? null : response.statusText };
  } catch (err) {
    return { status: 'unavailable', httpStatus: null, errorMessage: err instanceof Error ? err.message : 'Source URL check failed' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runSourceHealthChecks(limit = 250) {
  const sources = await db.assetSource.findMany({
    orderBy: { checkedAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 1000),
    include: { asset: { select: { slug: true } } },
  });

  let checked = 0;
  let failed = 0;
  for (const source of sources) {
    const result = await checkUrl(source.sourceUrl);
    checked += 1;
    if (result.status === 'unavailable') failed += 1;
    await db.sourceHealth.create({
      data: {
        assetSlug: source.asset.slug,
        layer: source.layer,
        field: source.field,
        url: source.sourceUrl,
        sourceType: source.sourceType,
        reliability: reliabilityFrom(source, result.status),
        status: result.status,
        httpStatus: result.httpStatus,
        errorMessage: result.errorMessage,
        lastCheckedAt: new Date(),
      },
    });
  }

  logger.info({ checked, failed }, 'Source health check completed');
  return { checked, failed };
}
