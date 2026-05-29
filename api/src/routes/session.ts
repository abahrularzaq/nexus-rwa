import { parseEther } from 'viem';
import { Hono } from 'hono';
import {
  getActiveSession,
  grantTierSession,
  normalizeWallet,
} from '../lib/x402-session.js';
import { verifyPayment } from '../middleware/x402/index.js';
import { TIER_PLANS, type AccessTier } from '../middleware/x402/pricer.js';

function paymentRecipient(): string {
  return (
    process.env.PAYMENT_RECIPIENT?.trim() ||
    process.env.X402_RECEIVING_ADDRESS?.trim() ||
    ''
  );
}

export const sessionRouter = new Hono();

sessionRouter.get('/verify', async (c) => {
  const txHash = c.req.header('X-Payment-Tx')?.trim();
  const tierParam = (c.req.query('tier') ?? 'pro').toLowerCase();
  const tier: AccessTier =
    tierParam === 'enterprise' ? 'enterprise' : 'pro';

  if (!txHash) {
    return c.json(
      {
        success: false,
        error: { code: 'TX_REQUIRED', message: 'X-Payment-Tx header required.' },
      },
      400,
    );
  }

  const recipient = paymentRecipient();
  if (!recipient) {
    return c.json(
      {
        success: false,
        error: { code: 'CONFIG_ERROR', message: 'Payment recipient not configured.' },
      },
      500,
    );
  }

  const plan = TIER_PLANS[tier];
  const expectedWei = parseEther(plan.priceEth).toString();
  const verified = await verifyPayment(txHash, expectedWei, recipient);

  if (!verified.verified) {
    return c.json({
      success: true,
      data: { verified: false, tier },
    });
  }

  const wallet =
    normalizeWallet(c.req.header('X-Wallet-Address')?.trim() ?? '') ??
    (verified.from ? normalizeWallet(verified.from) : null);

  if (wallet && (tier === 'pro' || tier === 'enterprise')) {
    await grantTierSession(wallet, tier);
  }

  return c.json({
    success: true,
    data: {
      verified: true,
      tier,
      wallet,
      blockNumber: verified.blockNumber,
    },
  });
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

  if (!active) {
    return c.json({
      success: true,
      data: {
        wallet: addr,
        tier: 'free' as const,
        active: false,
        expiresAt: null,
        expiresInSeconds: 0,
        plans: {
          pro: {
            price: TIER_PLANS.pro.priceEth,
            duration: TIER_PLANS.pro.duration,
          },
          enterprise: {
            price: TIER_PLANS.enterprise.priceEth,
            duration: TIER_PLANS.enterprise.duration,
          },
        },
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
      plans: {
        pro: {
          price: TIER_PLANS.pro.priceEth,
          duration: TIER_PLANS.pro.duration,
        },
        enterprise: {
          price: TIER_PLANS.enterprise.priceEth,
          duration: TIER_PLANS.enterprise.duration,
        },
      },
    },
  });
});
