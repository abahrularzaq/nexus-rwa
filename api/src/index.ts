import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestLogger } from './middleware/logger.js';
import { createRateLimiter } from './middleware/rate-limit.js';
import { assetsRouter } from './routes/assets.js';
import { marketRouter } from './routes/market.js';
import { searchRouter } from './routes/search.js';
import { connectDatabase } from './lib/database.js';
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
import { assertX402Env } from './middleware/x402/index.js';

const app = new Hono();
const PORT = Number(process.env.PORT) || 3001;
const rateLimiter = createRateLimiter();

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

function allowedOrigins(): Set<string> {
  const env = (process.env.FRONTEND_URL ?? '').trim();
  if (env === '') return new Set();

  // Support comma-separated list: "https://a.com,https://b.com"
  const parts = env.split(',').map((s) => s.trim()).filter(Boolean);
  const set = new Set<string>();
  for (const p of parts) {
    const o = normalizeOrigin(p);
    if (o) set.add(o);
  }
  return set;
}

const CUSTOM_ALLOWED_ORIGINS = allowedOrigins();

// Global middleware
app.use('*', cors({
  origin: (origin) => {
    // Izinkan tanpa origin (curl, server-to-server)
    if (!origin) return '*';

    // Izinkan localhost development
    if (origin.includes('localhost')) return origin;

    // Izinkan Vercel deployments
    if (origin.includes('vercel.app')) return origin;

    // Izinkan domain custom jika ada
    const reqOrigin = normalizeOrigin(origin);
    if (reqOrigin && CUSTOM_ALLOWED_ORIGINS.has(reqOrigin)) return reqOrigin;

    return '';
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'X-API-Key',
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
app.use('*', requestLogger);
app.use('*', rateLimiter);

// Health check — selalu gratis, tidak perlu X402
app.get('/health', (c) => c.json({ 
  status: 'ok', 
  version: process.env.API_VERSION,
  timestamp: new Date().toISOString(),
  dataSync: 'active',
}));

// Routes
app.route('/v1/market', marketRouter);
app.route('/v1/assets', assetsRouter);
app.route('/v1/search', searchRouter);
app.route('/v1/gated', gatedRouter);
app.route('/v1/session', sessionRouter);
app.route('/v1/analytics', analyticsRouter);
app.route('/v1/export', exportRouter);
app.route('/v1/ask', askRouter);
app.route('/v1/admin', adminRouter);

// 404 handler
app.notFound((c) => c.json({
  success: false,
  error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan' },
}, 404));

setupErrorHandlers(app);

// Start server
async function main(): Promise<void> {
  assertX402Env();
  await connectDatabase();
  startSyncCron();
  logger.info('Data sync cron started (6h full, 1h top-5 market, 24h blockchain)');
  startRiskScoreScheduler();
  logger.info('Risk score scheduler started (every 6h)');
  startYieldHistoryScheduler();
  logger.info('Yield history scheduler started (every 6h)');
  serve({ fetch: app.fetch, port: PORT }, () => {
    logger.info(`🚀 Nexus RWA API running on port ${PORT}`);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
