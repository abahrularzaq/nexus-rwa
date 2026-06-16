import { createHash } from 'node:crypto';
import type { Context, MiddlewareHandler } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';
import { redis as getRedisClient } from '../lib/redis.js';
import type { AccessTier } from './x402/pricer.js';
import { resolveApiKeyEntitlement } from '../lib/api-key-entitlement.js';
import { getActiveSession, normalizeWallet } from '../lib/x402-session.js';
import { recordRateLimitHitMetric } from '../lib/monitoring.js';

const WINDOW_MS = 60_000;
const REDIS_TTL_SECONDS = 120;

export const RATE_LIMITS_BY_TIER: Readonly<Record<AccessTier, number>> = {
  free: 200,
  pro: 2_000,
  enterprise: 20_000,
} as const;

const memoryStore = new Map<string, { count: number; resetAt: number }>();

type RateLimitOutcome = {
  allowed: boolean;
  count: number;
  resetAt: number;
  limit: number;
};

type RateLimitSubject = {
  tier: AccessTier;
  id: string;
  kind: 'api-key' | 'wallet' | 'ip';
};

function getClientIp(c: Context): string {
  const xff = c.req.header('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  const xRealIp = c.req.header('x-real-ip')?.trim();
  if (xRealIp) {
    return xRealIp;
  }
  try {
    const addr = getConnInfo(c).remote.address;
    if (addr) {
      return addr;
    }
  } catch {
    // not running on Node adapter / no socket
  }
  return 'unknown';
}

function hashSubject(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 24);
}

function memoryKey(subject: RateLimitSubject): string {
  return `${subject.tier}:${subject.kind}:${hashSubject(subject.id)}`;
}

function checkInMemory(subject: RateLimitSubject): RateLimitOutcome {
  const now = Date.now();
  const limit = RATE_LIMITS_BY_TIER[subject.tier];
  const key = memoryKey(subject);
  let entry = memoryStore.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    memoryStore.set(key, entry);
  }
  entry.count += 1;
  return {
    allowed: entry.count <= limit,
    count: entry.count,
    resetAt: entry.resetAt,
    limit,
  };
}

function redisKeyForSubject(subject: RateLimitSubject, windowMinute: number): string {
  return `nexus:rl:${subject.tier}:${subject.kind}:${hashSubject(subject.id)}:${windowMinute}`;
}

async function checkRedis(subject: RateLimitSubject): Promise<RateLimitOutcome | null> {
  try {
    const client = getRedisClient();
    const windowMinute = Math.floor(Date.now() / 60_000);
    const key = redisKeyForSubject(subject, windowMinute);
    const limit = RATE_LIMITS_BY_TIER[subject.tier];
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, REDIS_TTL_SECONDS);
    }
    const resetAt = (windowMinute + 1) * 60_000;
    return {
      allowed: count <= limit,
      count,
      resetAt,
      limit,
    };
  } catch {
    return null;
  }
}

async function resolveRateLimitSubject(c: Context): Promise<RateLimitSubject> {
  const apiKey = await resolveApiKeyEntitlement(c);
  if (apiKey) {
    return {
      tier: apiKey.accessTier,
      id: apiKey.id,
      kind: 'api-key',
    };
  }

  const walletHeader = c.req.header('X-Wallet-Address')?.trim();
  const wallet = walletHeader ? normalizeWallet(walletHeader) : null;
  if (wallet) {
    const session = await getActiveSession(wallet);
    if (session?.tier === 'enterprise' || session?.tier === 'pro') {
      return {
        tier: session.tier,
        id: wallet,
        kind: 'wallet',
      };
    }
  }

  return {
    tier: 'free',
    id: getClientIp(c),
    kind: 'ip',
  };
}

export function createRateLimiter(): MiddlewareHandler {
  return async (c, next) => {
    const subject = await resolveRateLimitSubject(c);
    const redisOutcome = await checkRedis(subject);
    const outcome = redisOutcome ?? checkInMemory(subject);

    c.header('X-RateLimit-Limit', String(outcome.limit));
    c.header('X-RateLimit-Tier', subject.tier);
    c.header('X-RateLimit-Subject', subject.kind);

    if (!outcome.allowed) {
      recordRateLimitHitMetric({
        method: c.req.method,
        endpoint: c.req.path,
        tier: subject.tier,
        subject: subject.kind,
      });
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', String(outcome.resetAt));
      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please slow down.',
          },
          meta: {
            tier: subject.tier,
            subject: subject.kind,
            limit: outcome.limit,
            resetAt: outcome.resetAt,
          },
        },
        429,
      );
    }

    c.header('X-RateLimit-Remaining', String(Math.max(0, outcome.limit - outcome.count)));
    c.header('X-RateLimit-Reset', String(outcome.resetAt));
    await next();
  };
}
