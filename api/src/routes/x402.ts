import { Hono } from 'hono';
import {
  ENDPOINT_PRICING,
  ENDPOINT_TIERS,
  PRODUCT_PRICING,
  TIER_PLANS,
  getX402Network,
  type AccessTier,
} from '../middleware/x402/index.js';
import { createMeta } from '../shared/index.js';

export const x402Router = new Hono();

function chainId() {
  return getX402Network() === 'base' ? 8453 : 84532;
}

function endpointRows() {
  return Object.entries(ENDPOINT_PRICING).map(([key, pricing]) => {
    const [method, path] = key.split(':', 2) as [string, string];
    const tier: AccessTier = ENDPOINT_TIERS[key] ?? 'free';
    return {
      method,
      path,
      tier,
      price: pricing.price,
      isFree: pricing.isFree,
      description: pricing.description,
    };
  });
}

x402Router.get('/pricebook', (c) => {
  return c.json({
    success: true,
    data: {
      network: getX402Network(),
      chainId: chainId(),
      settlement: {
        currency: 'USDC' as const,
        decimals: 6,
      },
      acceptedAuthChannels: [
        {
          channel: 'dashboard-wallet-session',
          headers: ['X-Wallet-Address', 'X-Payment'],
          description: 'Human dashboard checkout via x402 modal, then wallet session reuse.',
        },
        {
          channel: 'agent-x402-auto-payment',
          headers: ['X-Payment', 'X-Wallet-Address optional'],
          description: 'Crypto-native AI agent or script sends an x402 payment payload directly without modal UI.',
        },
        {
          channel: 'developer-api-key',
          headers: ['X-API-Key', 'Authorization: Bearer'],
          description: 'Developer or enterprise access using a provisioned API key.',
        },
      ],
      plans: {
        free: TIER_PLANS.free,
        pro: TIER_PLANS.pro,
        enterprise: TIER_PLANS.enterprise,
      },
      productPricing: PRODUCT_PRICING,
      endpoints: endpointRows(),
    },
    meta: createMeta(false),
  });
});
