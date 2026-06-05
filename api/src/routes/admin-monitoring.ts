import { Hono } from 'hono';
import { db } from '../lib/database.js';
import { adminAuthMiddleware } from '../middleware/admin-auth.js';
import { ERROR_CODES } from '../shared/index.js';

export const adminMonitoringRouter = new Hono();

adminMonitoringRouter.use('*', adminAuthMiddleware());

type QueryOptions = {
  limit: number;
  assetSlug?: string;
  status?: string;
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
    const [healthChecks, sourceHealth, openReviewTasks, failedSyncLogs, recentHealthIssues, recentSourceIssues] =
      await Promise.all([
        db.dataHealthCheck.findMany({
          orderBy: { lastCheckedAt: 'desc' },
          take: 5000,
          select: { status: true, severity: true, assetSlug: true, layer: true },
        }),
        db.sourceHealth.findMany({
          orderBy: { lastCheckedAt: 'desc' },
          take: 5000,
          select: { status: true, assetSlug: true, layer: true, field: true, url: true, httpStatus: true },
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
        db.dataHealthCheck.findMany({
          where: { status: { not: 'current' } },
          orderBy: { lastCheckedAt: 'desc' },
          take: 10,
          select: { assetSlug: true, layer: true, status: true, severity: true, reason: true, lastCheckedAt: true },
        }),
        db.sourceHealth.findMany({
          where: { status: { notIn: ['healthy', 'redirected'] } },
          orderBy: { lastCheckedAt: 'desc' },
          take: 10,
          select: { assetSlug: true, layer: true, field: true, status: true, httpStatus: true, url: true, errorMessage: true, lastCheckedAt: true },
        }),
      ]);

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
      take: query.limit,
    });

    return c.json({ success: true, data: rows });
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
