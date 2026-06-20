import { createHash, timingSafeEqual } from 'node:crypto';
import type { Context, MiddlewareHandler } from 'hono';
import { logger } from '../lib/logger.js';

function parseAdminApiKeys(): string[] {
  const keys = [process.env.ADMIN_API_KEYS, process.env.ADMIN_API_KEY]
    .flatMap((value) => value?.split(',') ?? [])
    .map((value) => value.trim())
    .filter((value): value is string => value.length > 0);

  return Array.from(new Set(keys));
}

function toComparableDigest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function timingSafeStringEqual(a: string, b: string): boolean {
  return timingSafeEqual(toComparableDigest(a), toComparableDigest(b));
}

export function isAdminApiKeyConfigured(): boolean {
  return parseAdminApiKeys().length > 0;
}

export function isValidAdminApiKey(provided: string | undefined): boolean {
  if (!provided) return false;
  const candidate = provided.trim();
  if (!candidate) return false;

  return parseAdminApiKeys().some((expected) => timingSafeStringEqual(candidate, expected));
}

function getAdminAuditDetails(c: Context) {
  return {
    method: c.req.method,
    path: c.req.path,
    ip:
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      undefined,
    userAgent: c.req.header('user-agent'),
  };
}

function logAdminAudit(c: Context, result: 'success' | 'failure', reason?: string) {
  logger.info(
    {
      event: 'admin_auth',
      result,
      reason,
      ...getAdminAuditDetails(c),
    },
    `Admin authentication ${result}`,
  );
}

export function adminAuthMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    if (!isAdminApiKeyConfigured()) {
      logAdminAudit(c, 'failure', 'admin_keys_not_configured');
      return c.json(
        {
          success: false,
          error: {
            code: 'ADMIN_DISABLED',
            message: 'ADMIN_API_KEY or ADMIN_API_KEYS is not configured on the server',
          },
        },
        503,
      );
    }

    const provided =
      c.req.header('X-Admin-Key')?.trim() ?? c.req.header('x-admin-key')?.trim();

    if (!isValidAdminApiKey(provided)) {
      logAdminAudit(c, 'failure', provided ? 'invalid_admin_key' : 'missing_admin_key');
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or missing X-Admin-Key header',
          },
        },
        401,
      );
    }

    c.set('adminActor', 'admin');
    logAdminAudit(c, 'success');
    await next();
  };
}
