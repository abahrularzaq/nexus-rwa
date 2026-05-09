import { Hono } from 'hono';
import { createGatedTxPaymentMiddleware } from '../middleware/x402/index.js';

export const gatedRouter = new Hono();

gatedRouter.use('*', createGatedTxPaymentMiddleware());

gatedRouter.get('/data', (c) =>
  c.json({
    success: true,
    data: {
      message: 'Gated resource — payment verified via X-Payment-Tx',
    },
  }),
);
