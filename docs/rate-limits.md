# Nexus RWA Tiered Rate Limits

This document defines the initial tier-aware API rate limit policy.

## Purpose

Rate limits protect the public API, keep infrastructure costs predictable, and make paid tiers meaningfully different from free access.

Nexus RWA currently supports three entitlement paths:

```txt
Free public access
x402 wallet/session access
API key entitlement access
```

Rate limiting should respect the effective tier instead of applying the same limit to every request.

---

## Current Limits

Limits are applied per 60-second window.

| Tier | Limit | Subject |
|---|---:|---|
| Free | 200 requests / minute | IP address |
| Pro | 2,000 requests / minute | API key or wallet |
| Enterprise | 20,000 requests / minute | API key or wallet |

Implementation constant:

```ts
RATE_LIMITS_BY_TIER = {
  free: 200,
  pro: 2_000,
  enterprise: 20_000,
}
```

---

## Subject Resolution

The rate limiter resolves the subject in this order:

```txt
1. Valid API key entitlement
2. Active wallet session
3. IP address fallback
```

### API key subject

If `X-API-Key` or `Authorization: Bearer <key>` is valid, the limiter uses:

```txt
subject.kind = api-key
subject.id   = ApiKey.id
subject.tier = free | pro | enterprise
```

### Wallet subject

If `X-Wallet-Address` has an active x402 session, the limiter uses:

```txt
subject.kind = wallet
subject.id   = normalized wallet address
subject.tier = pro | enterprise
```

### IP subject

If there is no valid API key or wallet session, the limiter uses:

```txt
subject.kind = ip
subject.id   = client IP
subject.tier = free
```

---

## Response Headers

Every response includes rate-limit headers:

```txt
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
X-RateLimit-Tier
X-RateLimit-Subject
```

Example Free response:

```txt
X-RateLimit-Limit: 200
X-RateLimit-Tier: free
X-RateLimit-Subject: ip
```

Example Pro API key response:

```txt
X-RateLimit-Limit: 2000
X-RateLimit-Tier: pro
X-RateLimit-Subject: api-key
```

Example Enterprise API key response:

```txt
X-RateLimit-Limit: 20000
X-RateLimit-Tier: enterprise
X-RateLimit-Subject: api-key
```

---

## Storage

The limiter prefers Redis when available.

Redis key format:

```txt
nexus:rl:<tier>:<subject-kind>:<subject-hash>:<window-minute>
```

If Redis is unavailable, the limiter falls back to in-memory rate limiting.

The subject ID is hashed before being used in Redis or memory keys.

---

## Manual Test Checklist

Build API:

```bash
npm run build --workspace=api
```

Restart API server:

```bash
cd api
npm run dev
```

### Test Free limit header

```bash
curl -i "http://localhost:3001/v1/assets/ondo-ousg"
```

Expected headers:

```txt
X-RateLimit-Limit: 200
X-RateLimit-Tier: free
X-RateLimit-Subject: ip
```

### Test Pro API key limit header

```bash
curl -i "http://localhost:3001/v1/assets/ondo-ousg/sources" \
  -H "X-API-Key: <standard-key>"
```

Expected headers:

```txt
HTTP/1.1 200 OK
X-Payment-Status: api-key
X-Payment-Tier: pro
X-RateLimit-Limit: 2000
X-RateLimit-Tier: pro
X-RateLimit-Subject: api-key
```

### Test Enterprise API key limit header

```bash
curl -i "http://localhost:3001/v1/export" \
  -H "X-API-Key: <premium-key>"
```

Expected headers:

```txt
HTTP/1.1 200 OK
X-Payment-Status: api-key
X-Payment-Tier: enterprise
X-RateLimit-Limit: 20000
X-RateLimit-Tier: enterprise
X-RateLimit-Subject: api-key
```

### Test spoofing still fails

```bash
curl -i "http://localhost:3001/v1/assets/ondo-ousg/sources" \
  -H "X-Payment-Tier: enterprise"
```

Expected:

```txt
HTTP/1.1 402 Payment Required
X-RateLimit-Tier: free
X-RateLimit-Subject: ip
```

---

## Notes

This batch does not add per-endpoint cost weights yet.

Future improvements:

```txt
Higher cost weight for AI/Ask endpoints
Daily or monthly quota by API key
Separate write/admin limits
Usage analytics by API key
Alerting for abnormal API key usage
```
