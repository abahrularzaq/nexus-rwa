import fs from 'node:fs';
import path from 'node:path';
import { Hono } from 'hono';
import { db } from '../lib/database.js';
import { adminAuthMiddleware } from '../middleware/admin-auth.js';
import { ERROR_CODES } from '../shared/index.js';

export const adminMonitoringRouter = new Hono();

adminMonitoringRouter.use('*', adminAuthMiddleware());

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, '..', 'data', 'assets');
const MANUAL_REQUIRED_CHECKED_BY = new Set(['manual_required', 'manual-review-required']);

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

adminMonitoringRouter.get('/overview', async (c) => {
  try {
    const [healthChecks, sourceHealthRows, openReviewTasks, failedSyncLogs] = await Promise.all([
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
    ]);

    const sourceHealth = uniqueLatestSourceRows(filterAutoCheckedSourceRows(sourceHealthRows));
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
