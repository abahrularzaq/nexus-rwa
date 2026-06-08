# Nexus RWA Payment Access Phase 1

Status: implemented as a thin API/access-contract layer without changing the stable x402 payment/session core.

## Goal

Phase 1 formalizes three payment/access paths:

1. Dashboard user -> x402 modal -> wallet session
2. AI agent crypto-native -> x402 auto-payment without modal
3. Developer / enterprise -> API key / prepaid access

The core x402 middleware order remains the source of truth:

```text
free endpoint -> API key bypass -> wallet session bypass -> x402 verify/settle -> 402 payment required
```

## New endpoints

### `GET /v1/me/access`

Returns the caller's current access status.

Supported auth inputs:

```http
X-Wallet-Address: 0x...
X-API-Key: nx_...
Authorization: Bearer nx_...
```

Response examples:

```json
{
  "success": true,
  "data": {
    "active": true,
    "authChannel": "wallet-session",
    "tier": "pro",
    "wallet": "0x0000000000000000000000000000000000000000",
    "apiKey": null,
    "expiresAt": "2026-06-09T12:00:00.000Z",
    "expiresInSeconds": 86400,
    "acceptedHeaders": ["X-Wallet-Address", "X-Payment"]
  }
}
```

```json
{
  "success": true,
  "data": {
    "active": true,
    "authChannel": "api-key",
    "tier": "enterprise",
    "apiKey": {
      "prefix": "nx_live_abcd",
      "name": "Enterprise client",
      "keyTier": "PREMIUM"
    },
    "wallet": null,
    "expiresAt": null,
    "expiresInSeconds": null,
    "acceptedHeaders": ["X-API-Key", "Authorization: Bearer"]
  }
}
```

Use cases:

- frontend Pro Active / Enterprise Active badge,
- account/access debug,
- developer dashboard access check,
- support debugging without exposing raw API keys.

### `GET /v1/x402/pricebook`

Returns the public access contract for humans, agents, and developers.

Includes:

- x402 network and chain id,
- settlement currency,
- accepted auth channels,
- Free / Pro / Enterprise plans,
- product pricing copy,
- endpoint pricing and tier map.

Use cases:

- frontend pricing CTA,
- AI agent route discovery,
- docs page,
- API client SDK generation.

## Standard response headers

Phase 1 exposes the following headers through CORS:

```http
X-Payment-Status
X-Payment-Verified
X-Payment-Tier
X-Payment-TxHash
X-Wallet-Address
X-Api-Key-Prefix
```

Meaning:

| Header | Meaning |
|---|---|
| `X-Payment-Status` | `api-key`, `session`, `settled`, `none`, `pricebook`, etc. |
| `X-Payment-Verified` | `true` when x402 payment was verified and settled. |
| `X-Payment-Tier` | Resolved access tier: `free`, `pro`, or `enterprise`. |
| `X-Payment-TxHash` | Settlement tx hash when available. |
| `X-Wallet-Address` | Normalized wallet used for wallet session access. |
| `X-Api-Key-Prefix` | Safe API key prefix for debugging, never the raw key. |

## Dashboard user path

```text
1. Frontend calls /v1/me/access with X-Wallet-Address.
2. If free/no active session, gated endpoint returns 402.
3. Frontend opens x402 modal using accepts[0].
4. User signs/pays.
5. Frontend retries with X-Wallet-Address + X-Payment.
6. Middleware verifies + settles x402 and grants wallet session.
7. Future requests only need X-Wallet-Address while session is active.
```

## AI agent path

```text
1. Agent calls /v1/x402/pricebook or a gated endpoint.
2. If endpoint returns 402, agent reads accepts[0].
3. Agent signs x402 payment payload programmatically.
4. Agent retries with X-Payment.
5. Middleware verifies + settles payment.
6. Wallet session is granted when payer wallet is resolved.
```

## Developer / enterprise path

```text
1. Developer receives or creates API key.
2. Client sends X-API-Key or Authorization: Bearer.
3. Middleware resolves API key by SHA-256 hash.
4. Access tier is mapped from KeyTier:
   FREE -> free
   STANDARD -> pro
   PREMIUM -> enterprise
```

## Non-goals in Phase 1

Not included yet:

- no PaymentLedger table,
- no prepaid credit balance,
- no self-serve API key checkout,
- no change to x402 session table,
- no change to facilitator verify/settle logic.

These belong to Phase 2+.
