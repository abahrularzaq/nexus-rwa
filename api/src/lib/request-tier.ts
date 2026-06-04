import type { Context } from 'hono';
import type { AccessTier } from '../middleware/x402/pricer.js';
import { getActiveSession } from './x402-session.js';

function normalizeWallet(header: string | undefined): string | null {
  const raw = header?.trim();
  return raw && raw.length > 0 ? raw : null;
}

/**
 * Resolve the effective API tier for a request.
 *
 * IMPORTANT: Do not trust client-provided X-Payment-Tier headers.
 * Premium access must come from a verified wallet session, verified payment,
 * API key entitlement, or another server-side authorization source.
 */
export async function resolveRequestTier(c: Context): Promise<AccessTier> {
  const wallet = normalizeWallet(c.req.header('X-Wallet-Address'));

  if (wallet) {
    const session = await getActiveSession(wallet);
    if (session?.tier === 'enterprise') return 'enterprise';
    if (session?.tier === 'pro') return 'pro';
  }

  return 'free';
}
