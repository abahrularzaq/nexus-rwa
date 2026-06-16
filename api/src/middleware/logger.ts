import { randomUUID } from 'node:crypto';
import type { Context, MiddlewareHandler } from 'hono';
import { logger } from '../lib/logger.js';
import { recordHttpRequestMetric } from '../lib/monitoring.js';

const REQUEST_ID_HEADER = 'X-Request-Id';
const REQUEST_ID_MAX_LENGTH = 128;

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
  }
}

function generateRequestId(): string {
  return `req_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

function normalizeRequestId(value: string | undefined): string | null {
  const requestId = value?.trim();
  if (!requestId) return null;

  // Keep caller-provided IDs log/header-safe and bounded.
  const safeRequestId = requestId.replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, REQUEST_ID_MAX_LENGTH);
  return safeRequestId.length > 0 ? safeRequestId : null;
}

export function getRequestId(c: Context): string {
  const requestId = c.get('requestId');
  if (requestId) return requestId;

  const fallback = normalizeRequestId(c.req.header(REQUEST_ID_HEADER)) ?? generateRequestId();
  c.set('requestId', fallback);
  c.header(REQUEST_ID_HEADER, fallback);
  return fallback;
}

async function attachRequestIdToErrorResponse(c: Context, requestId: string): Promise<void> {
  if (c.res.status < 400) return;
  if (!c.res.headers.get('content-type')?.toLowerCase().includes('application/json')) return;

  try {
    const body = await c.res.clone().json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return;

    const responseBody = body as Record<string, unknown>;
    responseBody.requestId = requestId;

    if (responseBody.error && typeof responseBody.error === 'object' && !Array.isArray(responseBody.error)) {
      responseBody.error = { ...responseBody.error, requestId };
    }

    if (responseBody.meta && typeof responseBody.meta === 'object' && !Array.isArray(responseBody.meta)) {
      responseBody.meta = { ...responseBody.meta, requestId };
    } else {
      responseBody.meta = { requestId };
    }

    c.res = new Response(JSON.stringify(responseBody), {
      status: c.res.status,
      statusText: c.res.statusText,
      headers: c.res.headers,
    });
    c.res.headers.set('content-type', 'application/json; charset=UTF-8');
    c.res.headers.set(REQUEST_ID_HEADER, requestId);
  } catch {
    // Non-JSON or streaming error responses should keep their original body.
  }
}

// Log setiap incoming request. Only safe metadata is logged; raw API keys,
// wallet secrets, payment headers, and request/response payloads are excluded.
export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  const requestId = normalizeRequestId(c.req.header(REQUEST_ID_HEADER)) ?? generateRequestId();
  c.set('requestId', requestId);
  c.header(REQUEST_ID_HEADER, requestId);

  try {
    await next();
  } finally {
    const durationMs = Date.now() - start;
    const tier = c.res.headers.get('X-RateLimit-Tier') ?? c.res.headers.get('X-Payment-Tier') ?? 'unknown';

    await attachRequestIdToErrorResponse(c, requestId);

    recordHttpRequestMetric({
      method: c.req.method,
      endpoint: c.req.path,
      status: c.res.status,
      durationMs,
      tier,
      requestId,
    });

    logger.info({
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration: `${durationMs}ms`,
      tier,
      requestId,
    });
  }
};
