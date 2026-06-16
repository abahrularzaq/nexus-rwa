import { randomUUID } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';
import { db } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { resolveApiKeyEntitlement } from '../lib/api-key-entitlement.js';

const MAX_ENDPOINT_LENGTH = 256;
const MAX_METHOD_LENGTH = 16;
const MAX_TIER_LENGTH = 32;

function safePath(path: string): string {
  const clean = path.split('?')[0] || '/';
  return clean.length > MAX_ENDPOINT_LENGTH ? clean.slice(0, MAX_ENDPOINT_LENGTH) : clean;
}

function safeMethod(method: string): string {
  return method.slice(0, MAX_METHOD_LENGTH).toUpperCase();
}

function safeTier(tier: string | undefined): string {
  const value = tier?.trim() || 'free';
  return value.length > MAX_TIER_LENGTH ? value.slice(0, MAX_TIER_LENGTH) : value;
}

export function usageTrackingMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const startedAt = Date.now();

    await next();

    if (c.req.method.toUpperCase() === 'OPTIONS') return;

    const durationMs = Math.max(0, Date.now() - startedAt);
    const endpoint = safePath(new URL(c.req.url).pathname);
    const method = safeMethod(c.req.method);
    const responseCode = c.res.status;
    const tier = safeTier(c.res.headers.get('X-RateLimit-Tier') ?? undefined);

    void (async () => {
      try {
        const entitlement = await resolveApiKeyEntitlement(c);
        await db.$executeRaw`
          INSERT INTO "UsageLog" ("id", "endpoint", "method", "responseCode", "durationMs", "apiKeyId", "tier", "timestamp")
          VALUES (${randomUUID()}, ${endpoint}, ${method}, ${responseCode}, ${durationMs}, ${entitlement?.id ?? null}, ${tier}, ${new Date()})
        `;
      } catch (err) {
        logger.warn({ err }, 'Failed to persist usage log');
      }
    })();
  };
}