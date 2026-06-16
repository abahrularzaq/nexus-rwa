import { logger } from './logger.js';

export type MonitoringMetric = {
  name: string;
  value: number;
  unit?: 'count' | 'milliseconds' | 'ratio' | 'status';
  tags?: Record<string, string | number | boolean>;
  timestamp?: string;
};

type ErrorBucket = { total: number; errors: number; resetAt: number; alerted: boolean };

const ERROR_RATE_WINDOW_MS = Number(process.env.MONITORING_ERROR_RATE_WINDOW_MS ?? 5 * 60 * 1000);
const ERROR_RATE_ALERT_THRESHOLD = Number(process.env.MONITORING_ERROR_RATE_ALERT_THRESHOLD ?? 0.05);
const ERROR_RATE_ALERT_MIN_REQUESTS = Number(process.env.MONITORING_ERROR_RATE_ALERT_MIN_REQUESTS ?? 20);
const errorBuckets = new Map<string, ErrorBucket>();

function monitoringPlatform(): string {
  return process.env.MONITORING_PLATFORM?.trim() || 'log';
}

function emitMetric(metric: MonitoringMetric): void {
  logger.info(
    {
      monitoring: {
        platform: monitoringPlatform(),
        type: 'metric',
        ...metric,
        timestamp: metric.timestamp ?? new Date().toISOString(),
      },
    },
    `monitoring metric: ${metric.name}`,
  );
}

function emitAlert(name: string, severity: 'warning' | 'critical', details: Record<string, unknown>): void {
  logger.error(
    {
      monitoring: {
        platform: monitoringPlatform(),
        type: 'alert',
        name,
        severity,
        timestamp: new Date().toISOString(),
        details,
      },
    },
    `monitoring alert: ${name}`,
  );
}

function endpointKey(method: string, endpoint: string): string {
  return `${method.toUpperCase()} ${endpoint}`;
}

function updateErrorRate(method: string, endpoint: string, status: number): void {
  const now = Date.now();
  const key = endpointKey(method, endpoint);
  let bucket = errorBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { total: 0, errors: 0, resetAt: now + ERROR_RATE_WINDOW_MS, alerted: false };
    errorBuckets.set(key, bucket);
  }

  bucket.total += 1;
  if (status >= 500) bucket.errors += 1;

  const errorRate = bucket.total === 0 ? 0 : bucket.errors / bucket.total;
  emitMetric({
    name: 'http.error_rate',
    value: errorRate,
    unit: 'ratio',
    tags: { method, endpoint, windowMs: ERROR_RATE_WINDOW_MS },
  });

  if (
    !bucket.alerted &&
    bucket.total >= ERROR_RATE_ALERT_MIN_REQUESTS &&
    errorRate >= ERROR_RATE_ALERT_THRESHOLD
  ) {
    bucket.alerted = true;
    emitAlert('high_error_rate', 'critical', {
      method,
      endpoint,
      errorRate,
      errors: bucket.errors,
      total: bucket.total,
      threshold: ERROR_RATE_ALERT_THRESHOLD,
      windowMs: ERROR_RATE_WINDOW_MS,
    });
  }
}

export function recordHttpRequestMetric(input: {
  method: string;
  endpoint: string;
  status: number;
  durationMs: number;
  tier?: string;
  requestId?: string;
}): void {
  const tags = {
    method: input.method,
    endpoint: input.endpoint,
    status: input.status,
    tier: input.tier ?? 'unknown',
    ...(input.requestId ? { requestId: input.requestId } : {}),
  };

  emitMetric({ name: 'http.request_count', value: 1, unit: 'count', tags });
  emitMetric({ name: 'http.request_latency', value: input.durationMs, unit: 'milliseconds', tags });
  updateErrorRate(input.method, input.endpoint, input.status);
}

export function recordRateLimitHitMetric(input: { method: string; endpoint: string; tier: string; subject: string }): void {
  emitMetric({
    name: 'rate_limit.hit',
    value: 1,
    unit: 'count',
    tags: input,
  });
}

export function recordPaymentFailureMetric(input: { method: string; endpoint: string; reason: string; tier?: string }): void {
  emitMetric({
    name: 'payment.failure',
    value: 1,
    unit: 'count',
    tags: input,
  });
}

export function recordDbHealthMetric(status: 'ok' | 'unavailable'): void {
  emitMetric({
    name: 'db.health',
    value: status === 'ok' ? 1 : 0,
    unit: 'status',
    tags: { status },
  });
  if (status !== 'ok') {
    emitAlert('db_degraded', 'critical', { status });
  }
}

export function recordSyncJobMetric(input: {
  job: string;
  status: 'started' | 'success' | 'failure' | 'skipped';
  durationMs?: number;
  lockAcquired?: boolean;
}): void {
  emitMetric({
    name: 'sync_job.status',
    value: input.status === 'success' ? 1 : input.status === 'failure' ? 0 : input.status === 'skipped' ? 2 : 3,
    unit: 'status',
    tags: {
      job: input.job,
      status: input.status,
      ...(input.durationMs === undefined ? {} : { durationMs: input.durationMs }),
      ...(input.lockAcquired === undefined ? {} : { lockAcquired: input.lockAcquired }),
    },
  });

  if (input.status === 'failure') {
    emitAlert('sync_job_failure', 'critical', input);
  }
}
