# Nexus RWA Enterprise MVP Status

This document defines the honest current state of the Nexus RWA Enterprise tier.

Enterprise is not yet a fully self-serve enterprise product. It is currently an MVP / API preview built on top of the existing Nexus RWA dataset, x402 access middleware, and API-key entitlement system.

---

## Current Positioning

```txt
Enterprise API Preview = early machine-readable access to Nexus RWA data
```

Use this wording in product copy until the full enterprise workflow is ready:

> Enterprise Preview gives early access to bulk RWA data, JSON export, and Ask Nexus beta for builders and AI-agent experiments.

Avoid implying that Nexus RWA already has a complete enterprise sales workflow, production SLA, SDK, self-serve API key dashboard, or autonomous AI-agent platform.

---

## What Is Available Now

| Capability | Status | Notes |
|---|---:|---|
| Enterprise tier detection | Available | Enterprise routes are mapped separately from Pro routes. |
| x402 402 pricing response | Available | Enterprise responses expose USDC pricing metadata. |
| API-key bypass | Available | Premium API keys map to Enterprise access. |
| `GET /v1/analytics/bulk` | MVP | Returns a bulk asset snapshot. Not yet a deep analytics engine. |
| `GET /v1/export` | MVP | Returns a JSON dataset export. No CSV/NDJSON/download format yet. |
| `POST /v1/ask` | Beta | Streams Ask Nexus responses over dataset context. Requires wallet header/rate-limit handling. |
| AI-agent-ready JSON data | MVP | Data is machine-readable, but no agent manifest or SDK yet. |
| Commercial integration path | Manual | Should be handled manually until onboarding and billing are built. |

---

## What Is Not Ready Yet

These items should be treated as roadmap, not current product claims:

```txt
self-serve API key dashboard
full enterprise onboarding
usage analytics dashboard
rate limits by tier
API usage audit logs
OpenAPI documentation page
SDK or client package
agent manifest / MCP server
custom data licensing workflow
SLA / uptime commitment
CSV, NDJSON, or scheduled export delivery
```

---

## Recommended Public Copy

### Pricing card title

```txt
Enterprise API Preview
```

### Pricing card subtitle

```txt
MVP access target: 29.00 USDC
```

### Feature bullets

```txt
Everything in Pro
Bulk asset snapshot endpoint
JSON dataset export
Ask Nexus API beta
AI-agent-ready data blocks
Self-serve enterprise onboarding — in development
```

### CTA

```txt
Explore API Docs
```

### Helper text

```txt
Enterprise is in MVP: core API routes exist, full onboarding is still being built.
```

---

## AI Agent Concept

The AI-agent concept means Nexus RWA can act as a structured data layer for external agents.

Example workflow:

```txt
1. Agent calls /v1/export or /v1/analytics/bulk
2. Agent receives structured RWA dataset
3. Agent compares assets by risk, reserve, liquidity, compliance, yield, and source quality
4. Agent uses /v1/ask for natural-language Q&A over Nexus RWA data
```

Current reality:

```txt
Available now: API endpoints and Ask Nexus beta
Not yet ready: full autonomous agent platform, SDK, manifest, or MCP integration
```

---

## Next Build Priorities

1. Build a real `/dashboard/api-docs` page with endpoint list, auth examples, and response examples.
2. Add OpenAPI-style documentation for Free, Pro, and Enterprise endpoints.
3. Add clear `Available now` vs `In development` labels on API docs.
4. Add rate limits by tier.
5. Add usage analytics and API audit logs.
6. Add export formats: JSON first, then CSV/NDJSON later.
7. Add a manual enterprise contact/apply flow before building full self-serve onboarding.

---

## Product Rule

Enterprise copy must stay aligned with infrastructure readiness.

Do not describe Enterprise as fully production-ready until the following are done:

```txt
API docs are public
API key onboarding exists
rate limits are enforced
usage logs are available
export format is stable
Ask Nexus has stable error handling
commercial path is documented
```
