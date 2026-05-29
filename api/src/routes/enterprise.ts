import { Hono } from 'hono';
import { createNexusX402Middleware } from '../middleware/x402/index.js';
import { getAssetList } from '../services/asset.service.js';
import { createMeta } from '../shared/index.js';

const x402 = createNexusX402Middleware();

export const analyticsRouter = new Hono();
export const exportRouter = new Hono();

analyticsRouter.get('/bulk', (c, next) => x402(c, next), async (c) => {
  const result = await getAssetList({ tier: 'enterprise', limit: 100 });
  return c.json({
    success: true,
    data: {
      kind: 'bulk',
      count: result.data.length,
      items: result.data,
      note: 'Enterprise bulk snapshot — all assets in one response.',
    },
    meta: createMeta(false),
  });
});

exportRouter.get('/', (c, next) => x402(c, next), async (c) => {
  const result = await getAssetList({ tier: 'enterprise', limit: 100 });
  return c.json({
    success: true,
    data: {
      kind: 'export',
      exportedAt: new Date().toISOString(),
      assets: result.data,
    },
    meta: createMeta(false),
  });
});
