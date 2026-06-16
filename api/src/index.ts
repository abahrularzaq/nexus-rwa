import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestLogger } from './middleware/logger.js';
import { createRateLimiter } from './middleware/rate-limit.js';
import { assetsRouter } from './routes/assets.js';
import { marketRouter } from './routes/market.js';
import { searchRouter } from './routes/search.js';
import { connectDatabase, db, disconnectDatabase } from './lib/database.js';
import { logger } from './lib/logger.js';
import { setupErrorHandlers } from './middleware/error-handler.js';
import { startYieldHistoryScheduler } from './jobs/captureYieldHistory.js';
import { startRiskScoreScheduler } from './jobs/updateRiskScores.js';
import { startSyncCron } from './jobs/cron.js';
import { gatedRouter } from './routes/gated.js';
import { sessionRouter } from './routes/session.js';
import { analyticsRouter, exportRouter } from './routes/enterprise.js';
import { askRouter } from './routes/ask.js';
import { adminRouter } from './routes/admin.js';
import { adminMonitoringRouter } from './routes/admin-monitoring.js';
import { usageRouter } from './routes/usage.js';
import { agentRouter } from './routes/agent.js';
import { usageTrackingMiddleware } from './middleware/usage-tracking.js';
import { assertX402Env } from './middleware/x402/index.js';

const PORT = Number(process.env.PORT) || 3001;
const API_VERSION = process.env.API_VERSION ?? '1.0.0';
const ENVIRONMENT_MODE = process.env.NODE_ENV ?? 'development';
const schedulerStatus: Record<string, 'starting' | 'active'> = {
  dataSync: 'starting',
  riskScore: 'starting',
  yieldHistory: 'starting',
};

const API_SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), clipboard-read=(), clipboard-write=()',
  'X-Content-Type-Options': 'nosniff',
} as const;

function normalizeOrigin(input: string): string | null {
  const raw = input.trim();
  if (raw === '') return null;
  try {
    // If user passes full URL, take its origin.
    if (raw.includes('://')) return new URL(raw).origin;
    // Otherwise assume https for domain-only values.
    return new URL(`https://${raw}`).origin;
  } catch {
    return null;
  }
}

function parseAllowedOrigins(...values: Array<string | undefined>): Set<string> {
  const set = new Set<string>();

  for (const value of values) {
    const parts = (value ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      const origin = normalizeOrigin(part);
      if (origin) set.add(origin);
    }
  }

  return set;
}

const CUSTOM_ALLOWED_ORIGINS = parseAllowedOrigins(
  process.env.FRONTEND_URL,
  process.env.ALLOWED_ORIGINS,
);
const IS_PRODUCTION = ENVIRONMENT_MODE === 'production';

function isDevelopmentOrigin(origin: string): boolean {
  const reqOrigin = normalizeOrigin(origin);
  if (!reqOrigin) return false;

  const { hostname } = new URL(reqOrigin);
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.vercel.app');
}

function resolveCorsOrigin(origin: string | undefined): string {
  // Izinkan tanpa origin (curl, server-to-server)
  if (!origin) return '*';

  const reqOrigin = normalizeOrigin(origin);
  if (reqOrigin && CUSTOM_ALLOWED_ORIGINS.has(reqOrigin)) return reqOrigin;

  if (!IS_PRODUCTION && isDevelopmentOrigin(origin)) return reqOrigin ?? origin;

  return '';
}

export type CreateAppOptions = {
  rateLimiter?: ReturnType<typeof createRateLimiter>;
  getDatabaseStatus?: () => Promise<'ok' | 'unavailable'>;
  usageTracking?: boolean;
};

function registerGlobalMiddleware(app: Hono, options: CreateAppOptions = {}): void {
  app.use('*', async (c, next) => {
    for (const [key, value] of Object.entries(API_SECURITY_HEADERS)) {
      c.header(key, value);
    }
    await next();
  });
  app.use('*', cors({
    origin: resolveCorsOrigin,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'X-API-Key',
      'X-Admin-Key',
      'X-Payment',
      'X-Payment-Tx',
      'X-Wallet-Address',
      'Authorization',
    ],
    exposeHeaders: [
      'X-Payment-Status',
      'X-Payment-Verified',
      'X-Request-Id',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-RateLimit-Tier',
      'X-RateLimit-Subject',
    ],
    credentials: false,
    maxAge: 86400,
  }));
  if (options.usageTracking !== false) {
    app.use('*', usageTrackingMiddleware());
  }
  app.use('*', requestLogger);
  app.use('*', options.rateLimiter ?? createRateLimiter());
}

async function getDatabaseStatus(): Promise<'ok' | 'unavailable'> {
  try {
    await db.$queryRaw`SELECT 1`;
    return 'ok';
  } catch {
    logger.warn('Health check database probe failed');
    return 'unavailable';
  }
}

export function createApp(options: CreateAppOptions = {}): Hono {
  const app = new Hono();
  const healthDatabaseStatus = options.getDatabaseStatus ?? getDatabaseStatus;

  registerGlobalMiddleware(app, options);

  // Health check — selalu gratis, tidak perlu X402
  app.get('/health', async (c) => {
    const databaseStatus = await healthDatabaseStatus();
    const status = databaseStatus === 'ok' ? 'ok' : 'degraded';

    return c.json({
      status,
      timestamp: new Date().toISOString(),
      api: {
        status: 'ok',
      },
      database: {
        status: databaseStatus,
      },
      scheduler: {
        status: Object.values(schedulerStatus).every((value) => value === 'active')
          ? 'active'
          : 'starting',
        jobs: schedulerStatus,
      },
      environment: {
        mode: ENVIRONMENT_MODE,
      },
      version: API_VERSION,
    });
  });

  // Routes
  app.route('/v1/market', marketRouter);
  app.route('/v1/assets', assetsRouter);
  app.route('/v1/search', searchRouter);
  app.route('/v1/gated', gatedRouter);
  app.route('/v1/session', sessionRouter);
  app.route('/v1/analytics', analyticsRouter);
  app.route('/v1/export', exportRouter);
  app.route('/v1/ask', askRouter);
  app.route('/v1/agent', agentRouter);
  app.route('/v1/admin', adminRouter);
  app.route('/v1/admin/monitoring', adminMonitoringRouter);
  app.route('/v1/admin/usage', usageRouter);

  // 404 handler
  app.notFound((c) => c.json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan' },
  }, 404));

  setupErrorHandlers(app);

  return app;
}

export const app = createApp();

function registerGracefulShutdown(): void {
  let isShuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info({ signal }, 'Shutting down server');
    try {
      await disconnectDatabase();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Failed to close database connection during shutdown');
      process.exit(1);
    }
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

// Start server
async function main(): Promise<void> {
  assertX402Env();
  registerGracefulShutdown();
  await connectDatabase();
  startSyncCron();
  schedulerStatus.dataSync = 'active';
  logger.info('Data sync cron started (6h full, 1h top-5 market, 24h blockchain)');
  startRiskScoreScheduler();
  schedulerStatus.riskScore = 'active';
  logger.info('Risk score scheduler started (every 6h)');
  startYieldHistoryScheduler();
  schedulerStatus.yieldHistory = 'active';
  logger.info('Yield history scheduler started (every 6h)');
  serve({ fetch: app.fetch, port: PORT }, () => {
    logger.info(`🚀 Nexus RWA API running on port ${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  main().catch((err) => {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  });
}
