import { getAddress } from 'viem';
import { redis } from './redis.js';
import type { AccessTier } from '../middleware/x402/pricer.js';
import { TIER_PLANS } from '../middleware/x402/pricer.js';

export type StoredSession = {
  tier: 'pro' | 'enterprise';
  grantedAt: number;
  expiresAt: number;
};

function sessionKey(tier: 'pro' | 'enterprise', wallet: string): string {
  return `session:${tier}:${getAddress(wallet)}`;
}

export function normalizeWallet(wallet: string): string | null {
  try {
    return getAddress(wallet.trim());
  } catch {
    return null;
  }
}

export async function grantTierSession(
  wallet: string,
  tier: 'pro' | 'enterprise',
): Promise<StoredSession | null> {
  const addr = normalizeWallet(wallet);
  if (!addr) return null;

  const plan = TIER_PLANS[tier];
  const grantedAt = Date.now();
  const expiresAt = grantedAt + plan.ttlSeconds * 1000;
  const payload: StoredSession = { tier, grantedAt, expiresAt };

  try {
    const client = redis();
    await client.setex(sessionKey(tier, addr), plan.ttlSeconds, JSON.stringify(payload));
    return payload;
  } catch {
    return null;
  }
}

async function readSession(
  tier: 'pro' | 'enterprise',
  wallet: string,
): Promise<StoredSession | null> {
  const addr = normalizeWallet(wallet);
  if (!addr) return null;

  try {
    const raw = await redis().get(sessionKey(tier, addr));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.tier || typeof parsed.expiresAt !== 'number') return null;
    if (parsed.expiresAt <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Enterprise session also satisfies pro-gated endpoints. */
export async function hasTierAccess(
  wallet: string,
  requiredTier: AccessTier,
): Promise<boolean> {
  if (requiredTier === 'free') return true;

  const addr = normalizeWallet(wallet);
  if (!addr) return false;

  if (requiredTier === 'enterprise') {
    return (await readSession('enterprise', addr)) !== null;
  }

  const [pro, enterprise] = await Promise.all([
    readSession('pro', addr),
    readSession('enterprise', addr),
  ]);
  return pro !== null || enterprise !== null;
}

export type ActiveSessionInfo = {
  tier: 'pro' | 'enterprise';
  expiresAt: number;
  expiresInSeconds: number;
};

/** Highest active paid tier for a wallet (enterprise wins over pro). */
export async function getActiveSession(
  wallet: string,
): Promise<ActiveSessionInfo | null> {
  const addr = normalizeWallet(wallet);
  if (!addr) return null;

  const enterprise = await readSession('enterprise', addr);
  if (enterprise) {
    return {
      tier: 'enterprise',
      expiresAt: enterprise.expiresAt,
      expiresInSeconds: Math.max(0, Math.floor((enterprise.expiresAt - Date.now()) / 1000)),
    };
  }

  const pro = await readSession('pro', addr);
  if (pro) {
    return {
      tier: 'pro',
      expiresAt: pro.expiresAt,
      expiresInSeconds: Math.max(0, Math.floor((pro.expiresAt - Date.now()) / 1000)),
    };
  }

  return null;
}
