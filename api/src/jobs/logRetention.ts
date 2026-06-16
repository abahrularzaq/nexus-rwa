import cron from 'node-cron';
import { db } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { runSchedulerJob } from '../lib/scheduler.js';

const DEFAULT_LOG_RETENTION_DAYS = 60;
const MIN_LOG_RETENTION_DAYS = 1;
const DEFAULT_USAGE_ANALYTICS_RETENTION_MONTHS = 18;
const MIN_USAGE_ANALYTICS_RETENTION_MONTHS = 1;
const DAILY_CRON = '25 2 * * *';

export type LogRetentionResult = {
  rawRequestCutoff: Date;
  usageAnalyticsCutoff: Date;
  apiRequestsDeleted: number;
  usageLogsDeleted: number;
  usageDailyAggregatesDeleted: number;
};

function parsePositiveIntEnv(name: string, fallback: number, minimum: number): number {
  const value = process.env[name]?.trim();
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < minimum) {
    logger.warn({ name, value, fallback, minimum }, 'Invalid retention env value; using fallback');
    return fallback;
  }

  return parsed;
}

function daysAgo(days: number): Date {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff;
}

function monthsAgo(months: number): Date {
  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  return cutoff;
}

function deletedCount(result: number | { count: number }): number {
  return typeof result === 'number' ? result : result.count;
}

/**
 * Rolls UsageLog rows into daily aggregates before deleting raw request-level logs.
 */
async function aggregateUsageLogsBefore(cutoff: Date): Promise<void> {
  await db.$executeRaw`
    INSERT INTO "UsageDailyAggregate" (
      "id",
      "date",
      "endpoint",
      "method",
      "responseCode",
      "tier",
      "requestCount",
      "averageDurationMs",
      "createdAt",
      "updatedAt"
    )
    SELECT
      concat('usage_daily_', md5(concat_ws('|', date_trunc('day', "timestamp")::date::text, "endpoint", "method", "responseCode"::text, "tier"))) AS "id",
      date_trunc('day', "timestamp")::date AS "date",
      "endpoint",
      "method",
      "responseCode",
      "tier",
      COUNT(*)::integer AS "requestCount",
      ROUND(AVG("durationMs"))::integer AS "averageDurationMs",
      NOW() AS "createdAt",
      NOW() AS "updatedAt"
    FROM "UsageLog"
    WHERE "timestamp" < ${cutoff}
    GROUP BY date_trunc('day', "timestamp")::date, "endpoint", "method", "responseCode", "tier"
    ON CONFLICT ("date", "endpoint", "method", "responseCode", "tier")
    DO UPDATE SET
      "requestCount" = EXCLUDED."requestCount",
      "averageDurationMs" = EXCLUDED."averageDurationMs",
      "updatedAt" = NOW()
  `;
}

export async function cleanupOldLogs(): Promise<LogRetentionResult> {
  const logRetentionDays = parsePositiveIntEnv(
    'LOG_RETENTION_DAYS',
    DEFAULT_LOG_RETENTION_DAYS,
    MIN_LOG_RETENTION_DAYS,
  );
  const usageAnalyticsRetentionMonths = parsePositiveIntEnv(
    'USAGE_ANALYTICS_RETENTION_MONTHS',
    DEFAULT_USAGE_ANALYTICS_RETENTION_MONTHS,
    MIN_USAGE_ANALYTICS_RETENTION_MONTHS,
  );

  const rawRequestCutoff = daysAgo(logRetentionDays);
  const usageAnalyticsCutoff = monthsAgo(usageAnalyticsRetentionMonths);

  await aggregateUsageLogsBefore(rawRequestCutoff);

  const [apiRequestsDeleted, usageLogsDeleted, usageDailyAggregatesDeleted] = await db.$transaction([
    db.apiRequest.deleteMany({ where: { timestamp: { lt: rawRequestCutoff } } }),
    db.usageLog.deleteMany({ where: { timestamp: { lt: rawRequestCutoff } } }),
    db.usageDailyAggregate.deleteMany({ where: { date: { lt: usageAnalyticsCutoff } } }),
  ]);

  const result = {
    rawRequestCutoff,
    usageAnalyticsCutoff,
    apiRequestsDeleted: deletedCount(apiRequestsDeleted),
    usageLogsDeleted: deletedCount(usageLogsDeleted),
    usageDailyAggregatesDeleted: deletedCount(usageDailyAggregatesDeleted),
  };

  logger.info(result, 'Log retention cleanup completed');
  return result;
}

export function startLogRetentionScheduler(): void {
  cron.schedule(DAILY_CRON, () => {
    void runSchedulerJob('log-retention', cleanupOldLogs).catch((err) => {
      logger.error({ err }, 'Log retention cleanup failed (non-fatal)');
    });
  });

  logger.info(
    {
      schedule: DAILY_CRON,
      logRetentionDays: parsePositiveIntEnv('LOG_RETENTION_DAYS', DEFAULT_LOG_RETENTION_DAYS, MIN_LOG_RETENTION_DAYS),
      usageAnalyticsRetentionMonths: parsePositiveIntEnv(
        'USAGE_ANALYTICS_RETENTION_MONTHS',
        DEFAULT_USAGE_ANALYTICS_RETENTION_MONTHS,
        MIN_USAGE_ANALYTICS_RETENTION_MONTHS,
      ),
    },
    'Log retention cron registered',
  );
}
