# Nexus RWA API Quickstart

This quickstart shows the core Nexus RWA API calls for local development and production-style integrations.

## Base URL

Use an environment variable so the same commands work locally and in production.

```bash
# Local development
export API_BASE_URL="http://localhost:3001"

# Production placeholder
export API_BASE_URL="<API_BASE_URL>"
```

> Replace `<API_BASE_URL>` with the deployed API origin, for example an API gateway or custom domain.

## Authentication notes

Some endpoints are public/free-pass, while Pro and Enterprise endpoints may require the configured Nexus x402/API access flow. When using an API key or wallet session, include the headers your deployment expects, for example:

```bash
-H "X-API-Key: <API_KEY>"
-H "X-Wallet-Address: <WALLET_ADDRESS>"
```

## 1. Health check

Use the health check to confirm that the API process is reachable, whether the database is reachable, whether schedulers have been registered, which environment mode is active, and which API version is deployed.

```bash
curl "$API_BASE_URL/health"
```

Example response:

```json
{
  "status": "ok",
  "timestamp": "2026-06-14T00:00:00.000Z",
  "api": {
    "status": "ok"
  },
  "database": {
    "status": "ok"
  },
  "scheduler": {
    "status": "active",
    "jobs": {
      "dataSync": "active",
      "riskScore": "active",
      "yieldHistory": "active"
    }
  },
  "environment": {
    "mode": "production"
  },
  "version": "1.0.0"
}
```

### Response fields

| Field | Description |
| --- | --- |
| `status` | Overall API health. Returns `ok` when required checks pass and `degraded` when the database probe fails. |
| `timestamp` | ISO-8601 timestamp generated when the health response is returned. |
| `api.status` | API process status. A returned response means the HTTP process is available, so this should be `ok`. |
| `database.status` | Database reachability from a minimal `SELECT 1` probe. The response intentionally exposes only `ok` or `unavailable` and never returns the connection string, host, username, password, or other credentials. |
| `scheduler.status` | Aggregate scheduler status. Returns `active` after all registered scheduler jobs are started; otherwise returns `starting`. |
| `scheduler.jobs` | Per-job status for data sync, risk scoring, and yield history schedulers. |
| `environment.mode` | Runtime mode from `NODE_ENV`, defaulting to `development` when unset. |
| `version` | Runtime API version from `API_VERSION`, defaulting to `1.0.0` when unset. |

The health endpoint is public and does not require X402 payment headers or an API key. Because it is suitable for load balancers and uptime checks, it avoids returning sensitive database details even when the database is unavailable.

## 2. Market overview

Fetch the high-level RWA market overview.

```bash
curl "$API_BASE_URL/v1/market/overview"
```

Example response:

```json
{
  "success": true,
  "data": {
    "totalAssets": 42,
    "totalTvl": 1250000000,
    "averageYield": 4.8,
    "categories": [
      { "name": "Treasury", "count": 18, "tvl": 900000000 }
    ]
  },
  "meta": {
    "cached": false,
    "timestamp": "2026-06-14T00:00:00.000Z"
  }
}
```

## 3. Asset list

List RWA assets with optional pagination and filters.

```bash
curl "$API_BASE_URL/v1/assets?page=1&limit=10"
```

Example response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "slug": "ondo-usdy",
        "name": "Ondo US Dollar Yield",
        "symbol": "USDY",
        "category": "Treasury",
        "grade": { "grade": "analytics", "score": 78 }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  },
  "meta": { "cached": false }
}
```

## 4. Asset detail

Fetch the free-tier detail profile for one asset by slug.

```bash
curl "$API_BASE_URL/v1/assets/ondo-usdy"
```

Example response:

```json
{
  "success": true,
  "data": {
    "slug": "ondo-usdy",
    "name": "Ondo US Dollar Yield",
    "symbol": "USDY",
    "identity": {
      "issuer": "Ondo Finance",
      "assetClass": "tokenized_treasury"
    },
    "market": {
      "tvl": 350000000,
      "apy": 5.1
    },
    "grade": {
      "grade": "analytics",
      "score": 78,
      "gradingProfile": "asset_backed"
    }
  },
  "meta": { "cached": false }
}
```

## 5. Pro full asset profile

Fetch the Pro full profile for one asset. Enterprise access may receive the enterprise-scoped profile from the same endpoint.

```bash
curl "$API_BASE_URL/v1/assets/ondo-usdy/full" \
  -H "X-API-Key: <API_KEY>"
```

Example response:

```json
{
  "success": true,
  "data": {
    "slug": "ondo-usdy",
    "name": "Ondo US Dollar Yield",
    "layers": {
      "identity": { "issuer": "Ondo Finance" },
      "reserve": { "collateralType": "short-duration treasuries" },
      "compliance": { "kycRequired": true },
      "risk": { "riskLevel": "MEDIUM" },
      "sources": [{ "label": "Issuer documentation", "url": "https://example.com" }]
    },
    "grade": {
      "grade": "analytics",
      "score": 78,
      "profileScores": { "reserve": 74, "compliance": 82 }
    }
  },
  "meta": { "cached": false }
}
```

## 6. Enterprise export

Export the enterprise bulk dataset snapshot.

```bash
curl "$API_BASE_URL/v1/export" \
  -H "X-API-Key: <ENTERPRISE_API_KEY>"
```

Example response:

```json
{
  "success": true,
  "data": {
    "kind": "export",
    "exportedAt": "2026-06-14T00:00:00.000Z",
    "assets": [
      {
        "slug": "ondo-usdy",
        "name": "Ondo US Dollar Yield",
        "symbol": "USDY",
        "grade": { "grade": "analytics", "score": 78 }
      }
    ]
  },
  "meta": { "cached": false }
}
```

## 7. Ask Nexus

Ask Nexus streams an answer over Server-Sent Events (SSE). Include a wallet header for Ask Nexus rate limiting and the access header required by your deployment. The `question` field is required, trimmed, and limited to 3-500 characters; `context` can include up to 8 asset slugs. Answers include an informational-only disclaimer and are not investment advice.

```bash
curl -N "$API_BASE_URL/v1/ask" \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: <WALLET_ADDRESS>" \
  -H "X-API-Key: <API_KEY>" \
  -d '{
    "question": "Compare USDY and OUSG on reserve transparency and liquidity.",
    "context": ["ondo-usdy", "openeden-ousg"]
  }'
```

Example SSE response:

```txt
event: delta
data: {"text":"USDY and OUSG both provide tokenized Treasury exposure..."}

event: delta
data: {"text":" The main differences are reserve reporting cadence and liquidity mechanics."}

event: done
data: {"ok":true,"metadata":{"assetsUsed":["ondo-usdy","openeden-ousg"],"sourceCount":4,"generatedAt":"2026-06-16T00:00:00.000Z","confidence":"medium","disclaimer":"This response is for informational purposes only and is not investment advice.","fallback":false}}
```

If the body is invalid, Ask Nexus returns JSON instead of a stream:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Body must include { question: string (3-500 chars), context?: string[] }",
    "details": ["question must be 500 characters or fewer"]
  }
}
```


If the upstream AI provider is temporarily unavailable after the stream starts, Ask Nexus gracefully emits a dataset-based fallback `delta` and completes with `metadata.fallback: true` and `metadata.confidence: "low"` instead of failing the whole SSE response.
