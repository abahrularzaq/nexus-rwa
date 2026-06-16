# AI Agent Integration Guide

Nexus RWA exposes machine-readable endpoints for agents that need to retrieve tokenized RWA datasets, compare assets, and ask natural-language questions over the dataset.

## Access model

Agent workflows should use Enterprise access for the full dataset and AI workflow endpoints:

- `GET /v1/export` — full dataset export in JSON, CSV, or NDJSON.
- `GET /v1/analytics/bulk` — bulk analytics snapshot for all tracked assets.
- `POST /v1/ask` — natural-language Ask Nexus API over selected or broad asset context.
- `GET /v1/agent/manifest` — public machine-readable manifest describing agent-ready endpoints.

Authenticated Enterprise requests can send either:

- `X-API-Key: <API_KEY>` for an entitled API key, or
- `X-Wallet-Address: <WALLET_ADDRESS>` for an active x402 Enterprise wallet session.

If access is missing, gated endpoints return `402 Payment Required` with x402 payment metadata.

## Endpoint usage

### `GET /v1/export`

Use `/v1/export` when the agent needs a complete dataset snapshot for local ranking, retrieval, caching, or downstream tool calls.

Supported formats:

| Format | Query | Best for |
| --- | --- | --- |
| JSON | `?format=json` | General agent tool calls and structured parsing. |
| CSV | `?format=csv` | Spreadsheet pipelines and simple tabular comparisons. |
| NDJSON | `?format=ndjson` | Streaming ingestion, vectorization, and append-friendly logs. |

Example:

```bash
curl "$API_BASE_URL/v1/export?format=json" \
  -H "X-API-Key: $NEXUS_API_KEY"
```

JSON responses include an envelope with `data.kind`, `data.exportedAt`, and `data.assets`. CSV and NDJSON responses return the serialized dataset directly.

### `GET /v1/analytics/bulk`

Use `/v1/analytics/bulk` when the agent needs one normalized response for broad portfolio or screener-style analysis.

Example:

```bash
curl "$API_BASE_URL/v1/analytics/bulk" \
  -H "X-API-Key: $NEXUS_API_KEY"
```

The response includes `data.kind`, `data.count`, `data.items`, and a short `data.note`. Agents should use the `items` array as the comparison input.

### `POST /v1/ask`

Use `/v1/ask` after the agent has narrowed a question or selected asset context. The endpoint accepts a natural-language `question` and optional `context` asset identifiers.

Example:

```bash
curl -N -X POST "$API_BASE_URL/v1/ask" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $NEXUS_API_KEY" \
  -d '{
    "question": "Compare OUSG and BUIDL by reserve transparency and liquidity risk.",
    "context": ["ondo-ousg", "blackrock-buidl"]
  }'
```

Successful Ask Nexus responses stream server-sent events. Agents should concatenate `delta` event text until a `done` event arrives, then inspect the final metadata for `assetsUsed`, `sourceCount`, `confidence`, `generatedAt`, and the informational-only disclaimer.

## Example agent workflow

### 1. Fetch dataset

Start with either the full export or the bulk analytics snapshot:

```bash
export API_BASE_URL="https://api.nexus-rwa.com"

curl "$API_BASE_URL/v1/export?format=json" \
  -H "X-API-Key: $NEXUS_API_KEY" \
  -o nexus-rwa-export.json
```

Agent action:

1. Parse `data.assets`.
2. Normalize each asset into the agent's internal schema.
3. Cache the snapshot with `data.exportedAt` as the freshness marker.

### 2. Compare risk, yield, and source quality

Use the dataset fields to build a shortlist. A typical scoring pass can combine:

- **Risk:** risk level, risk score, monitoring warnings, liquidity constraints, and compliance/reserve gaps.
- **Yield:** current APY, yield history availability, and whether yield data is direct, synced, or estimated.
- **Source quality:** source tier, freshness, confidence, presence of primary documents, and missing evidence.

Pseudo-code:

```ts
const candidates = exportPayload.data.assets
  .map((asset) => ({
    slug: asset.slug,
    name: asset.name,
    riskScore: asset.risk?.score ?? null,
    riskLevel: asset.risk?.level ?? "unknown",
    apy: asset.yield?.apy ?? null,
    sourceConfidence: asset.meta?.confidence ?? asset.dataQuality?.confidence ?? "unknown",
  }))
  .sort((a, b) => {
    const riskDelta = (a.riskScore ?? 999) - (b.riskScore ?? 999);
    if (riskDelta !== 0) return riskDelta;
    return (b.apy ?? -1) - (a.apy ?? -1);
  });
```

Recommended agent behavior:

1. Exclude assets with missing critical fields unless the user's task is evidence-gap discovery.
2. Prefer assets with higher source confidence when risk/yield tradeoffs are similar.
3. Preserve source URLs and timestamps in the agent's reasoning trace.
4. Label outputs as informational only, not investment advice.

### 3. Ask a natural-language question

Once the agent selects assets, pass the shortlist into `/v1/ask`:

```bash
curl -N -X POST "$API_BASE_URL/v1/ask" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $NEXUS_API_KEY" \
  -d '{
    "question": "Which shortlisted asset has the strongest risk-adjusted yield based on current risk, yield, and source quality signals?",
    "context": ["ondo-ousg", "franklin-benji", "superstate-ustb"]
  }'
```

Agent action:

1. Stream the answer and capture final metadata.
2. Attach the dataset snapshot timestamp and Ask Nexus `generatedAt` timestamp to the final response.
3. Show any caveats from missing fields or low-confidence source quality.

## Tool manifest discovery

Agents can discover the supported workflow using:

```bash
curl "$API_BASE_URL/v1/agent/manifest"
```

The manifest is public and describes endpoint methods, paths, access tiers, supported formats, request bodies, and example workflow steps. Agents should treat it as discovery metadata; gated data still requires Enterprise access.
