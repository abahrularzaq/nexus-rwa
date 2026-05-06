import type { Context } from 'hono';
import { Hono } from 'hono';
import type { ApiSuccessResponse } from '../shared/index.js';
import { createMeta } from '../shared/index.js';
import { createFreePassMiddleware } from '../middleware/x402/index.js';
import * as marketService from '../services/market.service.js';
import { syncAllData } from '../services/sync.service.js';

const freePass = createFreePassMiddleware();

function ok<T>(data: T, cached: boolean): ApiSuccessResponse<T> {
  return { success: true, data, meta: createMeta(cached) };
}

export const marketRouter = new Hono();

async function getOverviewHandler(c: Context) {
  const { data, cached } = await marketService.getMarketOverview();
  c.header('X-Cache', cached ? 'HIT' : 'MISS');
  return c.json(ok(data, cached));
}

marketRouter.get('/overview', freePass, getOverviewHandler);

function getAdminApiKey(c: Context): string | undefined {
  const headerKey = c.req.header('x-api-key') ?? c.req.header('X-API-Key');
  if (headerKey) return headerKey.trim();
  const auth = c.req.header('Authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return undefined;
}

async function postSyncHandler(c: Context) {
  const expected = process.env.ADMIN_API_KEY?.trim();
  if (!expected) {
    return c.json(
      {
        success: false,
        error: {
          code: 'SYNC_DISABLED',
          message: 'ADMIN_API_KEY is not configured on the server',
        },
      },
      503,
    );
  }

  const provided = getAdminApiKey(c);
  if (!provided || provided !== expected) {
    return c.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key' },
      },
      401,
    );
  }

  const result = await syncAllData();
  return c.json(ok(result, false));
}

marketRouter.post('/sync', postSyncHandler);
