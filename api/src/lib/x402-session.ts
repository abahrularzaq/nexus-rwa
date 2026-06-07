import { getAddress } from 'viem';
import { db } from './database.js';
import { redis, redisReady } from './redis.js';
import { logger } from './logger.js';
import type { AccessTier } from '../middleware/x402/pricer.js';
import { TIER_PLANS } from '../middleware/x402/pricer.js';

export type StoredSession = {
  tier: 'pro' | 'enterprise';
  grantedAt: number;
  expiresAt: number;
};

type SessionRow = {
  tier: string;
  granted_at: bigint | number;
  expires_at: bigint | number;
};

const memorySessions = new Map<string, StoredSession>();
let dbSessionTableReady: Promise<void> | null = null;

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

async function ensureDbSessionTable(): Promise<void> {
  if (!dbSessionTableReady) {
    dbSessionTableReady = db.$executeRaw`
      CREATE TABLE IF NOT EXISTS x402_sessions (
        wallet TEXT NOT NULL,
        tier TEXT NOT NULL,
        granted_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (wallet, tier)
      )
    `.then(() => undefined);
  }
  return dbSessionTableReady;
}

async function writeDbSession(
  wallet: string,
  tier: 'pro' | 'enterprise',
  session: StoredSession,
): Promise<boolean> {
  try {
    await ensureDbSessionTable();
    await db.$executeRaw`
      INSERT INTO x402_sessions (wallet, tier, granted_at, expires_at, updated_at)
      VALUES (${wallet}, ${tier}, ${session.grantedAt}, ${session.expiresAt}, NOW())
      ON CONFLICT (wallet, tier)
      DO UPDATE SET
        granted_at = EXCLUDED.granted_at,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
    `;
    logger.info(
      { wallet, tier, expiresAt: session.expiresAt },
      'x402 tier session granted in Postgres',
    );
    return true;
  } catch (err) {
    logger.warn(
      {
        wallet,
        tier,
        error: err instanceof Error ? err.message : String(err),
      },
      'x402 Postgres session grant failed; using fallback stores',
    );
    return false;
  }
}

async function readDbSession(
  wallet: string,
  tier: 'pro' | 'enterprise',
): Promise<StoredSession | null> {
  try {
    await ensureDbSessionTable();
    const rows = await db.$queryRaw<SessionRow[]>`
      SELECT tier, granted_at, expires_at
      FROM x402_sessions
      WHERE wallet = ${wallet}
        AND tier = ${tier}
        AND expires_at > ${Date.now()}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;

    const session: StoredSession = {
      tier: row.tier === 'enterprise' ? 'enterprise' : 'pro',
      grantedAt: Number(row.granted_at),
      expiresAt: Number(row.expires_at),
    };
    writeMemorySession(session.tier, wallet, session);
    return session;
  } catch (err) {
    logger.warn(
      {
        wallet,
        tier,
        error: err instanceof Error ? err.message : String(err),
      },
      'x402 Postgres session read failed; checking fallback stores',
    );
    return null;
  }
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
  await writeDbSession(addr, tier, payload);

  if (!redisReady()) {
    logger.warn(
      { wallet: addr, tier, expiresAt },
      'x402 Redis not ready during session grant; Postgres/memory session is active',
    );
    return payload;
  }

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
      'x402 Redis session grant failed; Postgres/memory session is active',
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

  const memorySession = readMemorySession(tier, addr);
  if (memorySession) return memorySession;

  const dbSession = await readDbSession(addr, tier);
  if (dbSession) return dbSession;

  if (!redisReady()) {
    return null;
  }

  try {
    const raw = await redis().get(sessionKey(tier, addr));
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession;
      if (parsed?.tier && typeof parsed.expiresAt === 'number' && parsed.expiresAt > Date.now()) {
        writeMemorySession(tier, addr, parsed);
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
      'x402 Redis session read failed; checking fallback stores',
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
