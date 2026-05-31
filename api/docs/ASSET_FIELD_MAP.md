# Asset Field Map — Ideal → Prisma

Maps your 10-layer ideal schema to the Nexus **12-layer** Prisma models (`schema.prisma`).
Extra layers in DB: **compliance**, **liquidity** (split from market/institutional in the ideal list).

**Legend — source**

| Source | Meaning |
|--------|---------|
| `manual` | Curated in seed / admin PATCH |
| `sync` | DeFiLlama, on-chain, or `SyncService` cron |
| `ai` | Claude / `AssetAiNarrative` |
| `gap` | Not in schema yet — use `metadata` Json or backlog |

---

## 1. Identity Layer

| Ideal field | Prisma | Model | Source |
|-------------|--------|-------|--------|
| asset_name | `name` | `AssetIdentity` | manual |
| ticker | `symbol` | `AssetIdentity` | manual |
| issuer | `issuerName` | `AssetInstitutional` | manual |
| category | `category` | `AssetIdentity` | manual |
| chain | `chain` (per row) | `AssetBlockchain[]` | manual |
| launch_date | `launchDate` | `AssetIdentity` | manual |
| jurisdiction | `issuerCountry` | `AssetInstitutional` | manual |
| website | `websiteUrl` | `AssetIdentity` | manual |
| custodian | `custodian` | `AssetReserve` | manual |
| auditor | `auditor` | `AssetReserve` | manual |

Also available: `fullName`, `subcategory`, `description`, `logoUrl`, `docsUrl`, `twitterUrl`, `tags`, `isin`.

---

## 2. Market Layer

| Ideal field | Prisma | Model | Source |
|-------------|--------|-------|--------|
| price | `price` | `AssetMarket` | sync |
| market_cap | `marketCap` | `AssetMarket` | sync / gap |
| TVL | `tvl` | `AssetMarket` | sync |
| volume | `volume24h` | `AssetMarket` | sync / gap |
| holders | `holderCount` | `AssetMarket` | sync / gap |
| liquidity | `liquidityScore`, `onchainLiquidity`, `dexPairs` | `AssetLiquidity` | manual + sync |
| redemption_flow | `redemptionType`, `redemptionPeriodDays` | `AssetLiquidity` | manual |
| mint_flow | — | — | **gap** |
| yield | `currentYield` | `AssetYield` | sync |

Also: `tvl7dChange`, `tvl30dChange`, `circulatingSupply`, `totalSupply`, `aumUsd`, `sources`, `confidence`.

---

## 3. Risk Layer

| Ideal field | Prisma | Model | Source |
|-------------|--------|-------|--------|
| counterparty_risk | `counterpartyRisk` | `AssetRisk` | sync + manual review |
| custody_risk | — | — | **gap** (proxy: `counterpartyRisk`) |
| liquidity_risk | `liquidityRisk` | `AssetRisk` | sync |
| depeg_risk | — | — | **gap** |
| oracle_risk | — | — | **gap** (proxy: `smartContractRisk`) |
| regulatory_risk | `regulatoryRisk` | `AssetRisk` | sync |
| concentration_risk | `concentrationRisk` | `AssetRisk` | sync |

Also: `overallScore`, `overallLevel`, `marketRisk`, `smartContractRisk`, `riskFactors[]`, `mitigants[]`.

---

## 4. Reserve / Backing Layer

| Ideal field | Prisma | Model | Source |
|-------------|--------|-------|--------|
| reserve_breakdown | `reserveBreakdown` (Json) | `AssetReserve` | manual |
| proof_of_reserve | `hasProofOfReserves` | `AssetReserve` | manual |
| reserve_frequency | — | — | **gap** |
| attestation_provider | — | — | **gap** (proxy: `porOracleAddress`) |
| reserve_quality | — | — | **gap** |
| backing_ratio | `collateralizationRatio` | `AssetReserve` | manual |

Also: `backingType`, `backingDescription`, `custodian`, `lastAuditDate`, `lastAuditUrl`, `redemptionAsset`.

---

## 5. Yield Intelligence Layer

| Ideal field | Prisma | Model | Source |
|-------------|--------|-------|--------|
| yield_source | — | — | **gap** |
| yield_sustainability | — | — | **gap** |
| historical_yield | `history.yield`, `yieldAvg7d/30d/90d` | `AssetHistory`, `AssetYield` | sync |
| yield_volatility | `yieldStdDev30d` | `AssetYield` | sync |
| real_yield | — | — | **gap** |
| yield_comparison | `yieldVsBenchmark`, `yieldBenchmark` | `AssetYield` | manual + sync |

---

## 6. Institutional Layer

| Ideal field | Prisma | Model | Source |
|-------------|--------|-------|--------|
| issuer_reputation | — | — | **gap** (`metadata` Json) |
| aum | `aumUsd` | `AssetMarket` | sync |
| institutional_backers | — | — | **gap** (`metadata`) |
| partnerships | — | — | **gap** (use `AssetEvent` type `partnership`) |
| compliance_status | `regulatoryStatus` | `AssetCompliance` | manual |

Also: `issuerName`, `issuerType`, `fundManager`, `legalStructure`, fees, `targetInvestors`.

---

## 7. Blockchain Layer

| Ideal field | Prisma | Model | Source |
|-------------|--------|-------|--------|
| smart_contracts | `contractAddress`, `tokenStandard` | `AssetBlockchain[]` | manual |
| chains | `chain` (multiple rows) | `AssetBlockchain[]` | manual |
| bridge_risk | — | — | **gap** |
| wallet_distribution | — | — | **gap** |
| whale_concentration | — | — | **gap** (proxy: `concentrationRisk`) |

---

## 8. Historical Layer

| Ideal field | Prisma | Model | Source |
|-------------|--------|-------|--------|
| historical_tvl | `tvl` | `AssetHistory` | sync (`appendHistorySnapshot`) |
| historical_yield | `yield` | `AssetHistory` | sync |
| historical_price | `price` | `AssetHistory` | sync |
| historical_holders | `holderCount` | `AssetHistory` | sync |
| historical_risk_score | `riskScore` | `AssetHistory` | sync |

---

## 9. AI Narrative Layer

| Ideal field | Prisma | Model | Source |
|-------------|--------|-------|--------|
| summary, opportunities, risks, outlook | `summary`, `opportunities[]`, `risks[]`, `outlook` | `AssetAiNarrative` | ai / seed |
| — | `keyMetrics`, `compareTo`, `modelVersion` | `AssetAiNarrative` | ai |

Runtime insights: `api/src/lib/aiInsights.ts` (not persisted unless written to `AssetAiNarrative`).

---

## 10. Event Layer

| Ideal event | `eventType` suggestion | Model |
|-------------|------------------------|-------|
| reserve_update | `reserve_update` | `AssetEvent` |
| attestation_release | `audit` | `AssetEvent` |
| yield_change | `yield_change` | `AssetEvent` |
| whale_movement | `whale_movement` | `AssetEvent` |
| depeg_alert | `incident` | `AssetEvent` |
| governance_change | `governance` | `AssetEvent` |

Admin: `POST /admin/assets/:slug/events`

---

## Workflow per asset

1. **Identity + Blockchain** — manual (explorer + issuer docs)
2. **Institutional + Compliance + Reserve + Liquidity** — manual
3. **Market + Yield + History** — `POST /admin/assets/:slug/sync`
4. **Risk** — sync then refine `riskFactors` / `mitigants`
5. **Events** — manual as news occurs
6. **AI narrative** — after layers 1–4 are stable

**Gold standard:** `ondo-ousg` in `prisma/seed.ts` (`RICH_ASSETS`).

**Completeness report:** `npm run report:completeness` (from `api/`).
