import type { Context } from 'hono';
import { Hono } from 'hono';
import type { ApiSuccessResponse } from '@nexus-rwa/shared';
import { createMeta } from '@nexus-rwa/shared';
import { createFreePassMiddleware } from '../middleware/x402/index.js';
import * as marketService from '../services/market.service.js';

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
