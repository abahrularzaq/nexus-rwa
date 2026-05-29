import { redis } from './redis.js';
import { ERROR_CODES } from '../shared/index.js';
import { normalizeWallet } from './x402-session.js';

const ASK_DAILY_LIMIT = 10;

function dayKey(wallet: string): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `ask:ratelimit:${wallet}:${y}-${m}-${day}`;
}

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return Math.max(60, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

export type AskRateLimitResult =
  | { allowed: true; remaining: number }
  | {
      allowed: false;
      remaining: 0;
      code: typeof ERROR_CODES.RATE_LIMITED | typeof ERROR_CODES.UNAUTHORIZED;
    };

/** 10 NLQ requests per wallet per UTC day (Redis). Fails open if Redis unavailable. */
export async function checkAskRateLimit(
  walletHeader: string | undefined,
): Promise<AskRateLimitResult> {
  const wallet = walletHeader ? normalizeWallet(walletHeader) : null;
  if (!wallet) {
    return { allowed: false, remaining: 0, code: ERROR_CODES.UNAUTHORIZED };
  }

  try {
    const client = redis();
    const key = dayKey(wallet);
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, secondsUntilUtcMidnight());
    }
    if (count > ASK_DAILY_LIMIT) {
      return { allowed: false, remaining: 0, code: ERROR_CODES.RATE_LIMITED };
    }
    return { allowed: true, remaining: ASK_DAILY_LIMIT - count };
  } catch {
    return { allowed: true, remaining: ASK_DAILY_LIMIT };
  }
}
