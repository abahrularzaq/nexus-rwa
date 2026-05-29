import type { Context } from 'hono';
import type { AccessTier } from '../middleware/x402/pricer.js';
import { getActiveSession } from './x402-session.js';

function normalizeWallet(header: string | undefined): string | null {
  const raw = header?.trim();
  return raw && raw.length > 0 ? raw : null;
}

/** Effective API tier: endpoint requirement, payment header, or wallet session. */
export async function resolveRequestTier(c: Context): Promise<AccessTier> {
  const headerTier = c.req.header('X-Payment-Tier')?.trim().toLowerCase();
  if (headerTier === 'enterprise' || headerTier === 'pro' || headerTier === 'free') {
    return headerTier;
  }

  const wallet = normalizeWallet(c.req.header('X-Wallet-Address'));
  if (wallet) {
    const session = await getActiveSession(wallet);
    if (session?.tier === 'enterprise') return 'enterprise';
    if (session?.tier === 'pro') return 'pro';
  }

  return 'free';
}
