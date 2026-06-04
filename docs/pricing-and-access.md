# Nexus RWA Pricing and Access Model

This document defines the public, Pro, and Enterprise access model for Nexus RWA after the 12-layer asset architecture update.

The goal is to keep the public dashboard useful for discovery while preserving the highest-value institutional data for paid users, API consumers, and AI-agent workflows.

---

## 1. Product Principle

Nexus RWA uses three access levels:

```txt
Free       = public discovery
Pro        = analyst-grade asset intelligence
Enterprise = machine-readable institutional dataset
```

Free should help users understand the catalog and asset quality at a high level.

Pro should unlock the full analyst view for a single user or researcher.

Enterprise should support bulk data, raw API access, export, Ask Nexus, commercial workflows, and AI-agent use cases.

---

## 2. Access Tiers

| Tier | Purpose | Primary User |
|---|---|---|
| Free | Public discovery and trust-building | Public visitors, community, SEO traffic |
| Pro | Full institutional asset profile and analyst workflow | Analysts, researchers, investors, writers |
| Enterprise | Bulk, raw, commercial, and machine-readable access | Developers, funds, AI agents, data buyers |

---

## 3. Layer Access Matrix

| Layer / Feature | Free | Pro | Enterprise |
|---|---:|---:|---:|
| Asset list | ✅ | ✅ | ✅ |
| Identity | ✅ | ✅ | ✅ |
| Market summary | ✅ | ✅ | ✅ |
| Full market data | ❌ | ✅ | ✅ |
| Current yield summary | ✅ | ✅ | ✅ |
| Full yield intelligence | ❌ | ✅ | ✅ |
| Risk level | ✅ | ✅ | ✅ |
| Full risk breakdown | ❌ | ✅ | ✅ |
| Grade label + score | ✅ | ✅ | ✅ |
| Full grade breakdown | ❌ | ✅ | ✅ |
| Blockchain summary | ✅ | ✅ | ✅ |
| Full blockchain layer | ❌ | ✅ | ✅ |
| Reserve / backing | ❌ | ✅ | ✅ |
| Institutional profile | ❌ | ✅ | ✅ |
| Compliance profile | ❌ | ✅ | ✅ |
| Liquidity detail | ❌ | ✅ | ✅ |
| Field-level source trail | ❌ | ✅ | ✅ |
| Public events | ✅ | ✅ | ✅ |
| Full event timeline | Partial | ✅ | ✅ |
| Historical data | ❌ | ✅ | ✅ |
| AI narrative / insight | ❌ | ✅ | ✅ |
| Bulk analytics | ❌ | ❌ | ✅ |
| Full dataset export | ❌ | ❌ | ✅ |
| Ask Nexus | ❌ | ❌ | ✅ |
| Commercial API use | ❌ | Limited / manual approval | ✅ |

---

## 4. Free Tier

Free is designed for public discovery and early trust.

Free responses should include only public-safe summaries:

```txt
identity
market summary
yield summary
risk level only
blockchain summary
grade label + score
public events
```

Free responses should not expose:

```txt
reserve details
institutional details
compliance details
liquidity details
full risk breakdown
full grade blockers / warnings
field-level source trail
history
AI narrative
bulk export
```

### Free endpoints

| Endpoint | Description |
|---|---|
| `GET /health` | API health check |
| `GET /v1/market/overview` | Public market overview |
| `GET /v1/market/brief` | Public market brief |
| `GET /v1/assets` | Public asset catalog |
| `GET /v1/assets/:slug` | Public asset profile |
| `GET /v1/assets/:slug/events` | Public asset event timeline |
| `GET /v1/search` | Public catalog search |

---

## 5. Pro Tier

Pro is the analyst-grade tier.

Pro should unlock the full per-asset profile:

```txt
identity
market
risk
yield
reserve
institutional
blockchain
liquidity
compliance
grade
sources
events
history
aiNarrative
```

### Pro endpoints

| Endpoint | Description |
|---|---|
| `GET /v1/assets/:slug/full` | Full institutional asset profile |
| `GET /v1/assets/:slug/history` | Time-series history |
| `GET /v1/assets/:slug/risk` | Full risk breakdown and grade context |
| `GET /v1/assets/:slug/sources` | Field-level source trail |
| `GET /v1/assets/:slug/insight` | AI-generated asset insight |

### Pro 24h pass

Current x402 session configuration:

```txt
label: Pro 24h Pass
displayPrice: $3 / 24h
priceUsd: 3.00
priceEth: 0.001
duration: 24h
ttlSeconds: 86400
```

Product positioning:

```txt
Full analyst-grade access for individual asset research.
```

---

## 6. Enterprise Tier

Enterprise is for machine-readable data access and commercial workflows.

Enterprise should unlock:

```txt
full raw dataset
bulk analytics
full export
Ask Nexus
commercial API workflows
higher-rate integration path
AI-agent access
```

### Enterprise endpoints

| Endpoint | Description |
|---|---|
| `GET /v1/analytics/bulk` | Bulk analytics snapshot |
| `GET /v1/export` | Full dataset export |
| `POST /v1/ask` | Ask Nexus natural-language API |

### Enterprise 7d pass

Current x402 session configuration:

```txt
label: Enterprise 7d Pass
displayPrice: $29 / 7d
priceUsd: 29.00
priceEth: 0.01
duration: 7d
ttlSeconds: 604800
```

Product positioning:

```txt
Machine-readable RWA dataset access for builders, funds, and AI agents.
```

---

## 7. Product Pricing Model

Nexus RWA should separate product pricing from payment-rail settlement.

Recommended product pricing:

| Product | Price | Cadence | Purpose |
|---|---:|---|---|
| Free | $0 | Forever | Public discovery dashboard |
| Asset Report | $1 | One-time | Unlock one full institutional asset report |
| Pro 24h Pass | $3 | 24h | Short-term analyst access |
| Pro Early Access | $9 | Monthly | Individual researcher subscription |
| API Starter | $99 | Monthly | Builder / AI-agent dataset access |
| Enterprise | Custom | Contract | Data licensing, higher limits, custom coverage |

Current implementation exposes `PRODUCT_PRICING` for future frontend or payment-page copy.

---

## 8. x402 Settlement vs Product Pricing

Important distinction:

```txt
Product pricing = user-facing USD copy
x402 settlement = current on-chain payment configuration
```

Current implementation keeps existing x402 settlement behavior:

```txt
Pro:        0.001 ETH for 24h
Enterprise: 0.01 ETH for 7d
```

The API also exposes user-facing metadata in 402 responses:

```json
{
  "pricing": {
    "tier": "pro",
    "label": "Pro 24h Pass",
    "displayPrice": "$3 / 24h",
    "priceUsd": "3.00",
    "priceEth": "0.001",
    "duration": "24h"
  }
}
```

This lets the frontend show clear USD-based pricing while preserving the current x402 mechanism.

Future improvement:

```txt
Move settlement from ETH-native payment to stable USDC-denominated payment.
```

Do not make that migration until payment verification and session grant logic are updated end-to-end.

---

## 9. Security Rules

The backend must not trust client-provided tier headers.

Do not grant Pro or Enterprise access from:

```txt
X-Payment-Tier: pro
X-Payment-Tier: enterprise
```

Valid premium access should come only from:

```txt
verified wallet session
verified payment transaction
valid API key entitlement
server-side/admin entitlement
```

Current tier resolution defaults unauthenticated requests to Free.

---

## 10. Manual Test Checklist

Run build:

```bash
npm run build --workspace=api
```

Test Free asset detail:

```bash
curl "http://localhost:3001/v1/assets/ondo-ousg"
```

Expected:

```txt
Includes public-safe profile fields.
Does not include reserve, institutional, liquidity, compliance, sources, history, or aiNarrative.
```

Test Pro endpoint without payment:

```bash
curl "http://localhost:3001/v1/assets/ondo-ousg/sources"
```

Expected:

```txt
402 Payment Required
tier = pro
pricing.displayPrice = $3 / 24h
pricing.priceUsd = 3.00
```

Test Enterprise endpoint without payment:

```bash
curl "http://localhost:3001/v1/export"
```

Expected:

```txt
402 Payment Required
tier = enterprise
pricing.displayPrice = $29 / 7d
pricing.priceUsd = 29.00
```

Test spoofing:

```bash
curl "http://localhost:3001/v1/assets/ondo-ousg/full" -H "X-Payment-Tier: enterprise"
```

Expected:

```txt
402 Payment Required
```

---

## 11. Implementation Reference

Relevant files:

| File | Purpose |
|---|---|
| `api/src/lib/request-tier.ts` | Resolves effective Free / Pro / Enterprise tier |
| `api/src/services/asset.service.ts` | Maps asset layers by tier |
| `api/src/routes/assets.ts` | Asset routes and Pro endpoint handlers |
| `api/src/middleware/x402/pricer.ts` | Endpoint tier and pricing catalog |
| `api/src/middleware/x402.ts` | x402 payment-required response and session bypass logic |
| `api/src/routes/enterprise.ts` | Bulk analytics and export endpoints |
| `api/src/routes/ask.ts` | Ask Nexus endpoint |

---

## 12. Current Batch Status

| Batch | Status | Description |
|---|---:|---|
| Batch 1 | ✅ Done | Harden tier access against header spoofing |
| Batch 2 | ✅ Done | Remap Free / Pro / Enterprise layer access |
| Batch 3 | ✅ Done | Add Pro modular endpoints |
| Batch 4 | ✅ Done | Add pricing metadata while preserving x402 settlement |
| Batch 5 | ✅ Done | Document pricing and access matrix |

---

## 13. Next Recommended Work

Recommended next steps:

```txt
Batch 6: Frontend UI gating and pricing cards
Batch 7: API key entitlement model
Batch 8: Stablecoin-denominated settlement cleanup
Batch 9: Rate limits by tier
Batch 10: Usage analytics and audit logs
```
