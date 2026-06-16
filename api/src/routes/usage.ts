import { Hono } from 'hono';
import { db } from '../lib/database.js';
import { adminAuthMiddleware } from '../middleware/admin-auth.js';

const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function startDateForDays(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export const usageRouter = new Hono();

usageRouter.use('*', adminAuthMiddleware());

usageRouter.get('/summary', async (c) => {
  const days = parsePositiveInt(c.req.query('days'), DEFAULT_DAYS, MAX_DAYS);
  const limit = parsePositiveInt(c.req.query('limit'), DEFAULT_LIMIT, MAX_LIMIT);
  const since = startDateForDays(days);

  const where = { timestamp: { gte: since } };

  const [totalRequests, successfulRequests, failedRequests, logs, byEndpoint, byTier, byStatus] = await Promise.all([
    db.usageLog.count({ where }),
    db.usageLog.count({ where: { ...where, responseCode: { gte: 200, lt: 400 } } }),
    db.usageLog.count({ where: { ...where, responseCode: { gte: 400 } } }),
    db.usageLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 5000,
      select: {
        id: true,
        endpoint: true,
        method: true,
        responseCode: true,
        durationMs: true,
        apiKeyId: true,
        tier: true,
        timestamp: true,
      },
    }),
    db.usageLog.groupBy({
      by: ['endpoint', 'method'],
      where,
      _count: { _all: true },
      _avg: { durationMs: true },
      orderBy: { _count: { endpoint: 'desc' } },
      take: limit,
    }),
    db.usageLog.groupBy({
      by: ['tier'],
      where,
      _count: { _all: true },
      orderBy: { _count: { tier: 'desc' } },
    }),
    db.usageLog.groupBy({
      by: ['responseCode'],
      where,
      _count: { _all: true },
      orderBy: { responseCode: 'asc' },
    }),
  ]);

  const uniqueApiKeys = new Set(logs.map((log) => log.apiKeyId).filter(Boolean)).size;
  const averageResponseTimeMs = Math.round(average(logs.map((log) => log.durationMs)));

  return c.json({
    success: true,
    data: {
      generatedAt: new Date().toISOString(),
      window: {
        days,
        since: since.toISOString(),
      },
      totals: {
        totalRequests,
        successfulRequests,
        failedRequests,
        uniqueApiKeys,
        averageResponseTimeMs,
      },
      byEndpoint: byEndpoint.map((row) => ({
        endpoint: row.endpoint,
        method: row.method,
        count: row._count._all,
        averageResponseTimeMs: Math.round(row._avg.durationMs ?? 0),
      })),
      byTier: byTier.map((row) => ({ tier: row.tier, count: row._count._all })),
      byStatus: byStatus.map((row) => ({ statusCode: row.responseCode, count: row._count._all })),
      recent: logs.slice(0, limit).map((log) => ({
        id: log.id,
        endpoint: log.endpoint,
        method: log.method,
        statusCode: log.responseCode,
        responseTimeMs: log.durationMs,
        apiKeyId: log.apiKeyId,
        tier: log.tier,
        timestamp: log.timestamp.toISOString(),
      })),
    },
  });
});
