import type { Context, MiddlewareHandler } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';
import { redis as getRedisClient } from '../lib/redis.js';

const MEMORY_WINDOW_MS = 60_000;
const MEMORY_LIMIT = 200;

const REDIS_LIMIT = 200;
const REDIS_TTL_SECONDS = 120;

const memoryStore = new Map<string, { count: number; resetAt: number }>();

type RateLimitOutcome = {
  allowed: boolean;
  count: number;
  resetAt: number;
  limit: number;
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

function checkInMemory(ip: string): RateLimitOutcome {
  const now = Date.now();
  let entry = memoryStore.get(ip);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + MEMORY_WINDOW_MS };
    memoryStore.set(ip, entry);
  }
  entry.count += 1;
  return {
    allowed: entry.count <= MEMORY_LIMIT,
    count: entry.count,
    resetAt: entry.resetAt,
    limit: MEMORY_LIMIT,
  };
}

function redisKeyForIp(ip: string, windowMinute: number): string {
  const safeIp = ip.replace(/:/g, '-');
  return `nexus:rl:${safeIp}:${windowMinute}`;
}

async function checkRedis(ip: string): Promise<RateLimitOutcome | null> {
  try {
    const client = getRedisClient();
    const windowMinute = Math.floor(Date.now() / 60_000);
    const key = redisKeyForIp(ip, windowMinute);
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, REDIS_TTL_SECONDS);
    }
    const resetAt = (windowMinute + 1) * 60_000;
    return {
      allowed: count <= REDIS_LIMIT,
      count,
      resetAt,
      limit: REDIS_LIMIT,
    };
  } catch {
    return null;
  }
}

export function createRateLimiter(): MiddlewareHandler {
  return async (c, next) => {
    const ip = getClientIp(c);
    const redisOutcome = await checkRedis(ip);
    const outcome = redisOutcome ?? checkInMemory(ip);

    c.header('X-RateLimit-Limit', String(outcome.limit));

    if (!outcome.allowed) {
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', String(outcome.resetAt));
      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please slow down.',
          },
        },
        429,
      );
    }

    c.header('X-RateLimit-Remaining', String(Math.max(0, outcome.limit - outcome.count)));
    await next();
  };
}
