import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { createRateLimiter, RATE_LIMITS_BY_TIER } from './rate-limit.js';

describe('createRateLimiter', () => {
  it('adds free-tier rate limit headers without Redis or production DB', async () => {
    process.env.REDIS_ENABLED = 'false';
    const app = new Hono();
    app.use('*', createRateLimiter());
    app.get('/ping', (c) => c.json({ ok: true }));

    const res = await app.request('/ping', { headers: { 'x-forwarded-for': '203.0.113.10' } });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('X-RateLimit-Limit'), String(RATE_LIMITS_BY_TIER.free));
    assert.equal(res.headers.get('X-RateLimit-Tier'), 'free');
    assert.equal(res.headers.get('X-RateLimit-Subject'), 'ip');
    assert.deepEqual(await res.json(), { ok: true });
  });
});
