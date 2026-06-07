import { getAddress } from 'viem';
import { redis } from './redis.js';
import { logger } from './logger.js';
import type { AccessTier } from '../middleware/x402/pricer.js';
import { TIER_PLANS } from '../middleware/x402/pricer.js';

export type StoredSession = {
  tier: 'pro' | 'enterprise';
  grantedAt: number;
  expiresAt: number;
};

const memorySessions = new Map<string, StoredSession>();

function sessionKey(tier: 'pro' | 'enterprise', wallet: string): string {
  return `session:${tier}:${getAddress(wallet)}`;
}

function writeMemorySession(
  tier: 'pro' | 'enterprise',
  wallet: string,
  session: StoredSession,
): void {
  memorySessions.set(sessionKey(tier, wallet), session);
}

function readMemorySession(
  tier: 'pro' | 'enterprise',
  wallet: string,
): StoredSession | null {
  const key = sessionKey(tier, wallet);
  const session = memorySessions.get(key);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    memorySessions.delete(key);
    return null;
  }
  return session;
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

  writeMemorySession(tier, addr, payload);

  try {
    const client = redis();
    await client.setex(sessionKey(tier, addr), plan.ttlSeconds, JSON.stringify(payload));
    logger.info({ wallet: addr, tier, expiresAt }, 'x402 tier session granted in Redis');
    return payload;
  } catch (err) {
    logger.warn(
      {
        wallet: addr,
        tier,
        expiresAt,
        error: err instanceof Error ? err.message : String(err),
      },
      'x402 Redis session grant failed; using in-memory fallback',
    );
    return payload;
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
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession;
      if (parsed?.tier && typeof parsed.expiresAt === 'number' && parsed.expiresAt > Date.now()) {
        return parsed;
      }
    }
  } catch (err) {
    logger.warn(
      {
        wallet: addr,
        tier,
        error: err instanceof Error ? err.message : String(err),
      },
      'x402 Redis session read failed; checking in-memory fallback',
    );
  }

  return readMemorySession(tier, addr);
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
