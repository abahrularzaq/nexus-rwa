import fs from 'node:fs';
import path from 'node:path';
import { Hono } from 'hono';
import { db } from '../lib/database.js';
import { buildAssetMonitoringScores } from '../lib/monitoring-score.js';
import { adminAuthMiddleware } from '../middleware/admin-auth.js';
import { ERROR_CODES } from '../shared/index.js';

export const adminMonitoringRouter = new Hono();

adminMonitoringRouter.use('*', adminAuthMiddleware());

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, '..', 'data', 'assets');
const MANUAL_REQUIRED_CHECKED_BY = new Set(['manual_required', 'manual-review-required']);
const SOURCE_STATUS_OPTIONS = new Set(['healthy', 'redirected', 'restricted', 'timeout', 'error', 'broken', 'deprecated']);

type QueryOptions = {
  limit: number;
  assetSlug?: string;
  status?: string;
};

type SourceHealthRow = {
  assetSlug: string;
  layer: string;
  field?: string | null;
  url: string;
  status: string;
  httpStatus?: number | null;
  errorMessage?: string | null;
  lastCheckedAt: Date;
};

function parseLimit(value: string | undefined, fallback = 50): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), 250);
}

function parseQuery(c: any): QueryOptions {
  return {
    limit: parseLimit(c.req.query('limit')),
    assetSlug: c.req.query('assetSlug') || undefined,
    status: c.req.query('status') || undefined,
  };
}

function countBy<T extends Record<string, unknown>>(items: T[], key: keyof T): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key] ?? 'unknown');
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function normalizeCheckedBy(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function isManualRequired(value: unknown): boolean {
  const checkedBy = normalizeCheckedBy(value);
  return Boolean(checkedBy && MANUAL_REQUIRED_CHECKED_BY.has(checkedBy));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function manualRequiredSourceKeys(assetSlug: string): Set<string> {
  const filePath = path.join(ASSETS_DIR, assetSlug, 'sources.json');
  if (!fs.existsSync(filePath)) return new Set();

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
    if (!Array.isArray(parsed)) return new Set();

    return parsed.filter(isRecord).reduce<Set<string>>((acc, source) => {
      const checkedBy = normalizeCheckedBy(source.checkedBy);
      const sourceUrl = typeof source.sourceUrl === 'string' ? source.sourceUrl : '';
      const layer = typeof source.layer === 'string' ? source.layer : 'unknown';
      const field = typeof source.field === 'string' ? source.field : '';

      if (sourceUrl.startsWith('http') && checkedBy && MANUAL_REQUIRED_CHECKED_BY.has(checkedBy)) {
        acc.add(`${assetSlug}::${layer}::${field}::${sourceUrl}`);
      }

      return acc;
    }, new Set());
  } catch {
    return new Set();
  }
}

function filterAutoCheckedSourceRows<T extends { assetSlug: string; layer: string; field?: string | null; url: string }>(rows: T[]): T[] {
  const cache = new Map<string, Set<string>>();

  return rows.filter((row) => {
    if (!cache.has(row.assetSlug)) {
      cache.set(row.assetSlug, manualRequiredSourceKeys(row.assetSlug));
    }

    const key = `${row.assetSlug}::${row.layer}::${row.field ?? ''}::${row.url}`;
    return !cache.get(row.assetSlug)!.has(key);
  });
}

function uniqueLatestSourceRows<T extends SourceHealthRow>(rows: T[]): T[] {
  const unique = new Map<string, T>();

  for (const row of rows) {
    const key = `${row.assetSlug}::${row.layer}::${row.field ?? ''}::${row.url}`;
    if (!unique.has(key)) {
      unique.set(key, row);
    }
  }

  return [...unique.values()];
}

function latestHealthMap(rows: SourceHealthRow[]): Map<string, SourceHealthRow> {
  const latest = new Map<string, SourceHealthRow>();

  for (const row of rows) {
    const key = `${row.assetSlug}::${row.layer}::${row.field ?? ''}::${row.url}`;
    if (!latest.has(key)) latest.set(key, row);
  }

  return latest;
}

function sourceTier(sourceType: string | null, sourceUrl: string): 'Tier 1' | 'Tier 2' | 'Tier 3' {
  const type = (sourceType ?? '').toLowerCase();
  const url = sourceUrl.toLowerCase();

  if (
    type.includes('official') ||
    type.includes('legal') ||
    type.includes('terms') ||
    type.includes('transparency') ||
    type.includes('audit') ||
    type.includes('sec') ||
    type.includes('block_explorer') ||
    url.includes('etherscan.io') ||
    url.includes('sec.gov')
  ) {
    return 'Tier 1';
  }

  if (
    type.includes('market') ||
    type.includes('aggregator') ||
    url.includes('rwa.xyz') ||
    url.includes('defillama') ||
    url.includes('coingecko') ||
    url.includes('coinmarketcap')
  ) {
    return 'Tier 2';
  }

  return 'Tier 3';
}

function internalError(c: any, err: unknown, fallback: string) {
  return c.json(
    {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: err instanceof Error ? err.message : fallback,
      },
    },
    500,
  );
}

function notFound(c: any, message: string) {
  return c.json(
    {
      success: false,
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message,
      },
    },
    404,
  );
}

adminMonitoringRouter.get('/overview', async (c) => {
  try {
    const [healthChecks, sourceHealthRows, openReviewTasks, failedSyncLogs, assetSources] = await Promise.all([
      db.dataHealthCheck.findMany({
        orderBy: { lastCheckedAt: 'desc' },
        take: 5000,
        select: { status: true, severity: true, assetSlug: true, layer: true },
      }),
      db.sourceHealth.findMany({
        orderBy: { lastCheckedAt: 'desc' },
        take: 5000,
        select: { status: true, assetSlug: true, layer: true, field: true, url: true, httpStatus: true, errorMessage: true, lastCheckedAt: true },
      }),
      db.reviewTask.findMany({
        where: { status: 'open' },
        orderBy: { createdAt: 'desc' },
        take: 5000,
        select: { priority: true, assetSlug: true, layer: true, reason: true, createdAt: true },
      }),
      db.syncLog.findMany({
        where: { status: { not: 'success' } },
        orderBy: { startedAt: 'desc' },
        take: 5000,
        select: { status: true, assetSlug: true, layer: true, provider: true, errorMessage: true, startedAt: true },
      }),
      db.assetSource.findMany({
        orderBy: { checkedAt: 'desc' },
        take: 10000,
        include: { asset: { select: { slug: true } } },
      }),
    ]);

    const sourceHealth = uniqueLatestSourceRows(filterAutoCheckedSourceRows(sourceHealthRows));
    const sourceRowsByAsset = assetSources.reduce<Map<string, Array<{ sourceUrl?: string | null; reliability?: number | null }>>>((acc, source) => {
      const rows = acc.get(source.asset.slug) ?? [];
      rows.push({ sourceUrl: source.sourceUrl, reliability: source.reliability });
      acc.set(source.asset.slug, rows);
      return acc;
    }, new Map());
    const assetSummaries = buildAssetMonitoringScores(healthChecks, sourceHealth, { sourceRowsByAsset });
    const recentHealthIssues = await db.dataHealthCheck.findMany({
      where: { status: { not: 'current' } },
      orderBy: { lastCheckedAt: 'desc' },
      take: 10,
      select: { assetSlug: true, layer: true, status: true, severity: true, reason: true, lastCheckedAt: true },
    });
    const recentSourceIssues = sourceHealth.filter((row) => !['healthy', 'redirected'].includes(row.status)).slice(0, 10);

    return c.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        overview: {
          totalHealthChecks: healthChecks.length,
          totalSourceChecks: sourceHealth.length,
          openReviewTasks: openReviewTasks.length,
          failedOrNonSuccessSyncLogs: failedSyncLogs.length,
        },
        healthStatusSummary: countBy(healthChecks, 'status'),
        healthSeveritySummary: countBy(healthChecks, 'severity'),
        sourceStatusSummary: countBy(sourceHealth, 'status'),
        reviewPrioritySummary: countBy(openReviewTasks, 'priority'),
        assetStatusSummary: countBy(assetSummaries, 'status'),
        assetSummaries,
        recentHealthIssues,
        recentSourceIssues,
        recentReviewTasks: openReviewTasks.slice(0, 10),
        failedSyncLogs: failedSyncLogs.slice(0, 10),
      },
    });
  } catch (err) {
    return internalError(c, err, 'Monitoring overview failed');
  }
});

adminMonitoringRouter.get('/sources', async (c) => {
  try {
    const query = parseQuery(c);
    const [sources, healthRows] = await Promise.all([
      db.assetSource.findMany({
        where: {
          ...(query.assetSlug ? { asset: { slug: query.assetSlug } } : {}),
        },
        orderBy: { checkedAt: 'desc' },
        take: 5000,
        include: { asset: { select: { slug: true } } },
      }),
      db.sourceHealth.findMany({
        where: {
          ...(query.assetSlug ? { assetSlug: query.assetSlug } : {}),
        },
        orderBy: { lastCheckedAt: 'desc' },
        take: 10000,
        select: { status: true, assetSlug: true, layer: true, field: true, url: true, httpStatus: true, errorMessage: true, lastCheckedAt: true },
      }),
    ]);

    const latest = latestHealthMap(healthRows);
    const rows = sources.map((source) => {
      const assetSlug = source.asset.slug;
      const key = `${assetSlug}::${source.layer}::${source.field ?? ''}::${source.sourceUrl}`;
      const health = latest.get(key);
      const manualRequired = isManualRequired(source.checkedBy);

      return {
        id: source.id,
        assetSlug,
        layer: source.layer,
        field: source.field,
        value: source.value,
        sourceUrl: source.sourceUrl,
        sourceType: source.sourceType,
        tier: sourceTier(source.sourceType, source.sourceUrl),
        reliability: source.reliability,
        checkedBy: source.checkedBy ?? null,
        checkedAt: source.checkedAt,
        status: manualRequired ? 'manual_required' : health?.status ?? 'unchecked',
        httpStatus: health?.httpStatus ?? null,
        errorMessage: health?.errorMessage ?? null,
        lastCheckedAt: health?.lastCheckedAt ?? source.checkedAt,
        notes: source.notes ?? null,
      };
    });

    const filtered = query.status ? rows.filter((row) => row.status === query.status) : rows;
    return c.json({ success: true, data: filtered.slice(0, query.limit) });
  } catch (err) {
    return internalError(c, err, 'Source evidence library query failed');
  }
});

adminMonitoringRouter.get('/review-tasks', async (c) => {
  try {
    const query = parseQuery(c);
    const tasks = await db.reviewTask.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.assetSlug ? { assetSlug: query.assetSlug } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
    });

    return c.json({ success: true, data: tasks });
  } catch (err) {
    return internalError(c, err, 'Review task query failed');
  }
});

adminMonitoringRouter.get('/source-health', async (c) => {
  try {
    const query = parseQuery(c);
    const rows = await db.sourceHealth.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.assetSlug ? { assetSlug: query.assetSlug } : {}),
      },
      orderBy: { lastCheckedAt: 'desc' },
      take: 5000,
    });

    const data = uniqueLatestSourceRows(filterAutoCheckedSourceRows(rows)).slice(0, query.limit);

    return c.json({ success: true, data });
  } catch (err) {
    return internalError(c, err, 'Source health query failed');
  }
});

adminMonitoringRouter.get('/health-checks', async (c) => {
  try {
    const query = parseQuery(c);
    const rows = await db.dataHealthCheck.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.assetSlug ? { assetSlug: query.assetSlug } : {}),
      },
      orderBy: { lastCheckedAt: 'desc' },
      take: query.limit,
    });

    return c.json({ success: true, data: rows });
  } catch (err) {
    return internalError(c, err, 'Health check query failed');
  }
});

adminMonitoringRouter.get('/sync-logs', async (c) => {
  try {
    const query = parseQuery(c);
    const rows = await db.syncLog.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.assetSlug ? { assetSlug: query.assetSlug } : {}),
      },
      orderBy: { startedAt: 'desc' },
      take: query.limit,
    });

    return c.json({ success: true, data: rows });
  } catch (err) {
    return internalError(c, err, 'Sync log query failed');
  }
});

adminMonitoringRouter.patch('/review-tasks/:id/close', async (c) => {
  try {
    const id = c.req.param('id');
    const existing = await db.reviewTask.findUnique({ where: { id } });
    if (!existing) return notFound(c, `Review task not found: ${id}`);

    const task = await db.reviewTask.update({
      where: { id },
      data: { status: 'closed', resolvedAt: new Date() },
    });

    return c.json({ success: true, data: task });
  } catch (err) {
    return internalError(c, err, 'Review task close failed');
  }
});

adminMonitoringRouter.patch('/health-checks/:id/close', async (c) => {
  try {
    const id = c.req.param('id');
    const existing = await db.dataHealthCheck.findUnique({ where: { id } });
    if (!existing) return notFound(c, `Health check not found: ${id}`);

    const check = await db.dataHealthCheck.update({
      where: { id },
      data: {
        status: 'current',
        severity: 'low',
        reason: 'Resolved from admin monitoring workbench',
        lastCheckedAt: new Date(),
      },
    });

    return c.json({ success: true, data: check });
  } catch (err) {
    return internalError(c, err, 'Health check close failed');
  }
});

adminMonitoringRouter.patch('/source-health/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const body = (await c.req.json().catch(() => ({}))) as { status?: unknown };
    const status = typeof body.status === 'string' ? body.status.trim() : '';

    if (!SOURCE_STATUS_OPTIONS.has(status)) {
      return c.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `Invalid source status. Use one of: ${[...SOURCE_STATUS_OPTIONS].join(', ')}`,
          },
        },
        400,
      );
    }

    const existing = await db.sourceHealth.findUnique({ where: { id } });
    if (!existing) return notFound(c, `Source health row not found: ${id}`);

    const row = await db.sourceHealth.update({
      where: { id },
      data: {
        status,
        lastCheckedAt: new Date(),
        ...(status === 'healthy' || status === 'redirected' || status === 'deprecated' ? { errorMessage: null } : {}),
      },
    });

    return c.json({ success: true, data: row });
  } catch (err) {
    return internalError(c, err, 'Source status update failed');
  }
});
