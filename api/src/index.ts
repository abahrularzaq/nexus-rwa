import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestLogger } from './middleware/logger';
import { assetsRouter } from './routes/assets';
import { marketRouter } from './routes/market';
import { searchRouter } from './routes/search';
import { connectDatabase } from './lib/database';
import { logger } from './lib/logger';

const app = new Hono();
const PORT = Number(process.env.PORT) || 3001;

// Global middleware
app.use('*', cors({ origin: process.env.FRONTEND_URL ?? '*' }));
app.use('*', requestLogger);

// Health check — selalu gratis, tidak perlu X402
app.get('/health', (c) => c.json({ 
  status: 'ok', 
  version: process.env.API_VERSION,
  timestamp: new Date().toISOString() 
}));

// Routes
app.route('/v1/market', marketRouter);
app.route('/v1/assets', assetsRouter);
app.route('/v1/search', searchRouter);

// 404 handler
app.notFound((c) => c.json({
  success: false,
  error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan' },
}, 404));

// Start server
async function main(): Promise<void> {
  await connectDatabase();
  serve({ fetch: app.fetch, port: PORT }, () => {
    logger.info(`🚀 Nexus RWA API running on port ${PORT}`);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});