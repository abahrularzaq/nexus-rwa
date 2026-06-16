import { Hono } from 'hono';
import { db } from '../lib/database.js';
import { adminAuthMiddleware } from '../middleware/admin-auth.js';

const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

type CountRow = { count: bigint | number };
type UsageLogRow = {
  id: string;
  endpoint: string;
  method: string;
  responseCode: number;
  durationMs: number;
  apiKeyId: string | null;
  tier: string;
  timestamp: Date;
};
type EndpointSummaryRow = {
  endpoint: string;
  method: string;
  count: bigint | number;
  averageResponseTimeMs: number | null;
};
type TierSummaryRow = { tier: string; count: bigint | number };
type StatusSummaryRow = { statusCode: number; count: bigint | number };

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

function toNumber(value: bigint | number | null | undefined): number {
  if (typeof value === 'bigint') return Number(value);
  return value ?? 0;
}

function firstCount(rows: CountRow[]): number {
  return toNumber(rows[0]?.count);
}

export const usageRouter = new Hono();

usageRouter.use('*', adminAuthMiddleware());

usageRouter.get('/summary', async (c) => {
  const days = parsePositiveInt(c.req.query('days'), DEFAULT_DAYS, MAX_DAYS);
  const limit = parsePositiveInt(c.req.query('limit'), DEFAULT_LIMIT, MAX_LIMIT);
  const since = startDateForDays(days);

  const [totalRows, successRows, failureRows, logs, byEndpoint, byTier, byStatus] = await Promise.all([
    db.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS "count"
      FROM "UsageLog"
      WHERE "timestamp" >= ${since}
    `,
    db.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS "count"
      FROM "UsageLog"
      WHERE "timestamp" >= ${since} AND "responseCode" >= 200 AND "responseCode" < 400
    `,
    db.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS "count"
      FROM "UsageLog"
      WHERE "timestamp" >= ${since} AND "responseCode" >= 400
    `,
    db.$queryRaw<UsageLogRow[]>`
      SELECT "id", "endpoint", "method", "responseCode", "durationMs", "apiKeyId", "tier", "timestamp"
      FROM "UsageLog"
      WHERE "timestamp" >= ${since}
      ORDER BY "timestamp" DESC
      LIMIT 5000
    `,
    db.$queryRaw<EndpointSummaryRow[]>`
      SELECT
        "endpoint",
        "method",
        COUNT(*) AS "count",
        AVG("durationMs") AS "averageResponseTimeMs"
      FROM "UsageLog"
      WHERE "timestamp" >= ${since}
      GROUP BY "endpoint", "method"
      ORDER BY COUNT(*) DESC
      LIMIT ${limit}
    `,
    db.$queryRaw<TierSummaryRow[]>`
      SELECT "tier", COUNT(*) AS "count"
      FROM "UsageLog"
      WHERE "timestamp" >= ${since}
      GROUP BY "tier"
      ORDER BY COUNT(*) DESC
    `,
    db.$queryRaw<StatusSummaryRow[]>`
      SELECT "responseCode" AS "statusCode", COUNT(*) AS "count"
      FROM "UsageLog"
      WHERE "timestamp" >= ${since}
      GROUP BY "responseCode"
      ORDER BY "responseCode" ASC
    `,
  ]);

  const totalRequests = firstCount(totalRows);
  const successfulRequests = firstCount(successRows);
  const failedRequests = firstCount(failureRows);
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
        count: toNumber(row.count),
        averageResponseTimeMs: Math.round(row.averageResponseTimeMs ?? 0),
      })),
      byTier: byTier.map((row) => ({ tier: row.tier, count: toNumber(row.count) })),
      byStatus: byStatus.map((row) => ({ statusCode: row.statusCode, count: toNumber(row.count) })),
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
