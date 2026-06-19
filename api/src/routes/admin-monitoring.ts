import fs from 'node:fs';
import path from 'node:path';
import { Hono } from 'hono';
import { db } from '../lib/database.js';
import { buildAssetMonitoringScores } from '../lib/monitoring-score.js';
import { adminAuthMiddleware } from '../middleware/admin-auth.js';
import { ERROR_CODES } from '../shared/index.js';
import { getSourceReliabilitySummary, getSourceTrail, SOURCE_VERIFICATION_STATUSES } from '../services/source-reliability.service.js';

export const adminMonitoringRouter = new Hono();

adminMonitoringRouter.use('*', adminAuthMiddleware());

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, '..', 'data', 'assets');
const MANUAL_REQUIRED_CHECKED_BY = new Set(['manual_required', 'manual-review-required']);
const SOURCE_STATUS_OPTIONS = new Set([...SOURCE_VERIFICATION_STATUSES, 'healthy', 'redirected', 'restricted', 'timeout', 'error', 'broken', 'deprecated']);
const RESOLUTION_TYPES = new Set(['fixed_source', 'verified_manual', 'false_positive', 'accepted_risk', 'deferred', 'replaced_provider']);

type QueryOptions = {
  limit: number;
  assetSlug?: string;
  status?: string;
};

type ResolutionMetadata = {
  resolutionType: string;
  resolutionNote: string;
  evidenceUrl?: string | null;
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


async function parseResolutionMetadata(c: any): Promise<ResolutionMetadata | { error: string }> {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const resolutionType = typeof body.resolutionType === 'string' ? body.resolutionType.trim() : '';
  const resolutionNote = typeof body.resolutionNote === 'string' ? body.resolutionNote.trim() : '';
  const evidenceUrl = typeof body.evidenceUrl === 'string' ? body.evidenceUrl.trim() : '';

  if (!RESOLUTION_TYPES.has(resolutionType)) {
    return { error: `Invalid resolutionType. Use one of: ${[...RESOLUTION_TYPES].join(', ')}` };
  }

  if (!resolutionNote) {
    return { error: 'resolutionNote is required to close monitoring work.' };
  }

  if (evidenceUrl && !/^https?:\/\//i.test(evidenceUrl)) {
    return { error: 'evidenceUrl must start with http:// or https:// when provided.' };
  }

  return { resolutionType, resolutionNote, evidenceUrl: evidenceUrl || null };
}

function validationError(c: any, message: string) {
  return c.json(
    {
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message,
      },
    },
    400,
  );
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
    const rows = await getSourceTrail({ assetSlug: query.assetSlug, status: query.status, limit: query.limit });
    return c.json({ success: true, data: rows });
  } catch (err) {
    return internalError(c, err, 'Source evidence library query failed');
  }
});

adminMonitoringRouter.get('/source-reliability', async (c) => {
  try {
    const query = parseQuery(c);
    const rows = await getSourceReliabilitySummary(query.assetSlug);
    return c.json({ success: true, data: rows.slice(0, query.limit) });
  } catch (err) {
    return internalError(c, err, 'Source reliability query failed');
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
    const metadata = await parseResolutionMetadata(c);
    if ('error' in metadata) return validationError(c, metadata.error);

    const existing = await db.reviewTask.findUnique({ where: { id } });
    if (!existing) return notFound(c, `Review task not found: ${id}`);

    const task = await db.reviewTask.update({
      where: { id },
      data: {
        status: 'closed',
        resolvedAt: new Date(),
        resolutionType: metadata.resolutionType,
        resolutionNote: metadata.resolutionNote,
        evidenceUrl: metadata.evidenceUrl,
      },
    });

    return c.json({ success: true, data: task });
  } catch (err) {
    return internalError(c, err, 'Review task close failed');
  }
});

adminMonitoringRouter.patch('/health-checks/:id/close', async (c) => {
  try {
    const id = c.req.param('id');
    const metadata = await parseResolutionMetadata(c);
    if ('error' in metadata) return validationError(c, metadata.error);

    const existing = await db.dataHealthCheck.findUnique({ where: { id } });
    if (!existing) return notFound(c, `Health check not found: ${id}`);

    const check = await db.dataHealthCheck.update({
      where: { id },
      data: {
        status: 'current',
        severity: 'low',
        reason: metadata.resolutionNote,
        lastCheckedAt: new Date(),
        resolutionType: metadata.resolutionType,
        resolutionNote: metadata.resolutionNote,
        evidenceUrl: metadata.evidenceUrl,
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
