import { Hono } from 'hono';
import {
  getActiveSession,
  normalizeWallet,
} from '../lib/x402-session.js';
import { TIER_PLANS } from '../middleware/x402/pricer.js';

export const sessionRouter = new Hono();

sessionRouter.get('/verify', async (c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'USDC_X402_FACILITATOR_NOT_CONFIGURED',
        message:
          'Session verification has moved from native ETH tx checks to USDC x402 facilitator verification. Complete facilitator integration before enabling /session/verify.',
      },
    },
    501,
  );
});

sessionRouter.get('/', async (c) => {
  const wallet =
    c.req.header('X-Wallet-Address')?.trim() ||
    c.req.query('wallet')?.trim();

  if (!wallet) {
    return c.json(
      {
        success: false,
        error: {
          code: 'WALLET_REQUIRED',
          message: 'Provide X-Wallet-Address header or ?wallet= query param.',
        },
      },
      400,
    );
  }

  const addr = normalizeWallet(wallet);
  if (!addr) {
    return c.json(
      {
        success: false,
        error: { code: 'INVALID_WALLET', message: 'Invalid wallet address.' },
      },
      400,
    );
  }

  const active = await getActiveSession(addr);
  const plans = {
    pro: {
      price: TIER_PLANS.pro.priceUsdc,
      currency: 'USDC' as const,
      duration: TIER_PLANS.pro.duration,
    },
    enterprise: {
      price: TIER_PLANS.enterprise.priceUsdc,
      currency: 'USDC' as const,
      duration: TIER_PLANS.enterprise.duration,
    },
  };

  if (!active) {
    return c.json({
      success: true,
      data: {
        wallet: addr,
        tier: 'free' as const,
        active: false,
        expiresAt: null,
        expiresInSeconds: 0,
        plans,
      },
    });
  }

  return c.json({
    success: true,
    data: {
      wallet: addr,
      tier: active.tier,
      active: true,
      expiresAt: new Date(active.expiresAt).toISOString(),
      expiresInSeconds: active.expiresInSeconds,
      plans,
    },
  });
});
