import { Hono, type Context } from 'hono';
import { resolveApiKeyEntitlement } from '../lib/api-key-entitlement.js';
import { getActiveSession, normalizeWallet } from '../lib/x402-session.js';
import { TIER_PLANS, type AccessTier } from '../middleware/x402/index.js';
import { createMeta } from '../shared/index.js';

export const accessRouter = new Hono();

function planSummary() {
  return {
    free: {
      tier: 'free' as const,
      label: TIER_PLANS.free.label,
      price: TIER_PLANS.free.displayPrice,
      duration: TIER_PLANS.free.duration || 'forever',
    },
    pro: {
      tier: 'pro' as const,
      label: TIER_PLANS.pro.label,
      price: TIER_PLANS.pro.displayPrice,
      duration: TIER_PLANS.pro.duration,
    },
    enterprise: {
      tier: 'enterprise' as const,
      label: TIER_PLANS.enterprise.label,
      price: TIER_PLANS.enterprise.displayPrice,
      duration: TIER_PLANS.enterprise.duration,
    },
  };
}

function accessHeaders(c: Context, status: string, tier: AccessTier): void {
  c.header('X-Payment-Status', status);
  c.header('X-Payment-Tier', tier);
}

accessRouter.get('/access', async (c) => {
  const apiKey = await resolveApiKeyEntitlement(c);
  if (apiKey) {
    accessHeaders(c, 'api-key', apiKey.accessTier);
    c.header('X-Api-Key-Prefix', apiKey.prefix);

    return c.json({
      success: true,
      data: {
        active: apiKey.accessTier !== 'free',
        authChannel: 'api-key' as const,
        tier: apiKey.accessTier,
        apiKey: {
          prefix: apiKey.prefix,
          name: apiKey.name,
          keyTier: apiKey.keyTier,
        },
        wallet: null,
        expiresAt: null,
        expiresInSeconds: null,
        plans: planSummary(),
        acceptedHeaders: ['X-API-Key', 'Authorization: Bearer'],
      },
      meta: createMeta(false),
    });
  }

  const walletInput =
    c.req.header('X-Wallet-Address')?.trim() ||
    c.req.query('wallet')?.trim() ||
    null;

  if (walletInput) {
    const wallet = normalizeWallet(walletInput);
    if (!wallet) {
      accessHeaders(c, 'invalid-wallet', 'free');
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_WALLET',
            message: 'Invalid wallet address. Use a valid EVM wallet in X-Wallet-Address or ?wallet=.',
          },
          meta: createMeta(false),
        },
        400,
      );
    }

    const active = await getActiveSession(wallet);
    if (active) {
      accessHeaders(c, 'session', active.tier);
      c.header('X-Wallet-Address', wallet);

      return c.json({
        success: true,
        data: {
          active: true,
          authChannel: 'wallet-session' as const,
          tier: active.tier,
          wallet,
          apiKey: null,
          expiresAt: new Date(active.expiresAt).toISOString(),
          expiresInSeconds: active.expiresInSeconds,
          plans: planSummary(),
          acceptedHeaders: ['X-Wallet-Address', 'X-Payment'],
        },
        meta: createMeta(false),
      });
    }

    accessHeaders(c, 'none', 'free');
    c.header('X-Wallet-Address', wallet);

    return c.json({
      success: true,
      data: {
        active: false,
        authChannel: 'wallet' as const,
        tier: 'free' as const,
        wallet,
        apiKey: null,
        expiresAt: null,
        expiresInSeconds: 0,
        plans: planSummary(),
        acceptedHeaders: ['X-Wallet-Address', 'X-Payment'],
      },
      meta: createMeta(false),
    });
  }

  accessHeaders(c, 'none', 'free');
  return c.json({
    success: true,
    data: {
      active: false,
      authChannel: 'public' as const,
      tier: 'free' as const,
      wallet: null,
      apiKey: null,
      expiresAt: null,
      expiresInSeconds: 0,
      plans: planSummary(),
      acceptedHeaders: ['X-Wallet-Address', 'X-Payment', 'X-API-Key', 'Authorization: Bearer'],
    },
    meta: createMeta(false),
  });
});
