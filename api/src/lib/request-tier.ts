import type { Context } from 'hono';
import type { AccessTier } from '../middleware/x402/pricer.js';
import { getActiveSession } from './x402-session.js';
import { maxAccessTier, resolveApiKeyEntitlement } from './api-key-entitlement.js';

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
  let resolvedTier: AccessTier = 'free';

  const entitlement = await resolveApiKeyEntitlement(c);
  if (entitlement) {
    resolvedTier = maxAccessTier(resolvedTier, entitlement.accessTier);
  }

  const wallet = normalizeWallet(c.req.header('X-Wallet-Address'));

  if (wallet) {
    const session = await getActiveSession(wallet);
    if (session?.tier === 'enterprise') resolvedTier = maxAccessTier(resolvedTier, 'enterprise');
    if (session?.tier === 'pro') resolvedTier = maxAccessTier(resolvedTier, 'pro');
  }

  return resolvedTier;
}
