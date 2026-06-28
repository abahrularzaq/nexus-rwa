# Source Review — BlackRock BUIDL

## Review metadata

- Slug: blackrock-buidl
- Symbol: BUIDL
- Review date: 2026-06-28
- Scope: Source Verification Agent re-run after targeted Research Agent source repair
- Current active grade before review: analytics
- Current active score before review: 81
- Reviewed repaired files:
  - `data/assets/blackrock-buidl/source-discovery.md`
  - `data/assets/blackrock-buidl/market.json`
  - `data/assets/blackrock-buidl/yield.json`
  - `data/assets/blackrock-buidl/sources.json`
  - `docs/agent-runs/blackrock-buidl/workflow-status.md`

## Verdict

- safeToProceed: false
- Recommended next agent: Research Agent only if new primary documents become available; otherwise keep upgrade blocked
- Recommended sourceScore: 78-82
- Institutional-grade review may proceed: false

## Summary

Research Agent successfully refreshed dynamic market and yield data and documented source limitations more clearly. However, the targeted repair did not resolve the material primary-source gaps that caused the first Source Verification pass to block institutional-grade review.

The package remains usable for analytics-grade coverage, but it should not proceed to Risk & Grading for an institutional-grade upgrade.

## Resolved items from previous review

1. Dynamic market data is no longer stale.
   - `market.json.lastUpdated` is now `2026-06-28`.
   - `_meta.freshnessStatus` is now `current`.
   - Notes distinguish RWA.xyz Total Asset Value, DeFiLlama TVL, CoinGecko market cap, and Etherscan original-token supply/holders.

2. Dynamic yield data is no longer stale.
   - `yield.json` now records 2026-06-28 research notes.
   - Notes clearly state that RWA.xyz and DeFiLlama values are aggregator-reported yield observations, not official issuer SEC yield or official fund yield methodology.

3. Source discovery now clearly documents missing primary evidence.
   - It states that public legal/governing documents, prospectus/PPM/offering memorandum, official reserve report, PoR/attestation evidence, public audit/fund report, and primary provider confirmations were not found publicly.

4. `sources.json` now has better observation notes for dynamic values.
   - RWA.xyz, DeFiLlama, CoinGecko, and Etherscan observations are dated 2026-06-28.
   - Aggregator limitations are now clearer.

## Remaining blocking issues

1. Primary legal/governing document still missing.
   - `source-discovery.md` states public legal/governing document, prospectus, private placement memorandum, and offering memorandum were not found publicly.
   - SEC Form D is strong for issuer and exemption context, but not enough as full legal/governing documentation for institutional-grade review.

2. Primary reserve breakdown or official fund reporting still missing.
   - Current reserve support remains secondary/contextual.
   - `reserveBreakdown`, `lastAuditDate`, and `lastAuditUrl` remain null in the asset package.

3. Proof-of-reserves or public attestation evidence still missing.
   - The package correctly keeps `hasProofOfReserves` false.
   - No explicit PoR, reserve oracle, attestation cadence, or public reserve attestation source was added.

4. Public audit or fund report URL still missing.
   - Research repair did not find a public audit or fund report.
   - Auditor name from RWA.xyz remains secondary evidence and is not a substitute for audit evidence.

5. Primary service-provider confirmations remain incomplete.
   - RWA.xyz lists service-provider fields such as BNY Mellon and PwC, but current package still lacks primary confirmation from BlackRock, Securitize legal terms, BNY Mellon, PwC, offering documents, or fund reports.

6. BUIDL and BUIDL-I aggregation policy remains unresolved.
   - The package still says to keep original BUIDL and BUIDL-I separate unless a source explicitly supports aggregation.
   - This remains important for market, supply, holder, chain, and risk analysis.

## Non-blocking warnings

1. Market/yield values are current as of 2026-06-28 but remain aggregator-sourced.
2. RWA.xyz Total Asset Value, DeFiLlama TVL, CoinGecko market cap, and Etherscan original-token supply/holder count are different metrics and should not be merged.
3. Ethereum original BUIDL holder count differs from RWA.xyz asset-level holder count because they measure different scopes.
4. Several institutional claims are still acceptable only as analytics-grade observations, not institutional-grade primary evidence.
5. Source score should remain below institutional-grade range until legal, reserve, audit, PoR/attestation, and provider-source gaps are fixed.

## Required corrections

| File | Field | Status after repair | Required action | Reason |
|---|---|---|---|---|
| `institutional.json` | `prospectuUrl` | Still null | Keep null unless public primary document is found. | Public PPM/prospectus/offering memorandum not found. |
| `compliance.json` | `legalOpinionUrl` | Still null | Keep null unless public legal opinion or equivalent document is found. | SEC Form D is not legal opinion. |
| `reserve.json` | `reserveBreakdown` | Still null | Keep null unless official fund/reserve reporting is found. | No primary reserve breakdown found. |
| `reserve.json` | `hasProofOfReserves` | false | Keep false. | No explicit PoR or public attestation evidence. |
| `reserve.json` | `lastAuditDate` / `lastAuditUrl` | Still null | Keep null unless public audit/report URL is found. | Auditor name from aggregator is not audit evidence. |
| `sources.json` | dynamic source notes | Improved | Keep observation dates and metric-definition warnings. | Repair improved traceability. |
| `market.json` | market values | Refreshed | Accept as current aggregator snapshot. | Values are current enough for analytics-grade review. |
| `yield.json` | yield values | Refreshed | Accept as current aggregator snapshot. | Values are not official issuer yield methodology. |

## Source quality summary

### Strong sources

- SEC Form D: strong for issuer, exemption framework, pooled investment fund status, and minimum outside investment.
- SEC EDGAR index: strong filing audit trail.
- Securitize official product and press pages: strong for product identity, access context, launch context, and high-level multichain/product announcements.
- Etherscan pages: strong for explorer-level Ethereum token facts.

### Medium sources

- RWA.xyz: useful for Total Asset Value, NAV, holders, APY, management fee range, service-provider fields, and primary-market terms. Still secondary for legal/reserve/provider claims.
- DeFiLlama: useful for TVL, chain distribution, liquidity, and average APY monitoring. Not official fund reporting.
- CoinGecko: useful market cross-check only.

### Context-only sources

- Financial media and ecosystem coverage may support background context, but should not be sole evidence for legal, reserve, audit, attestation, or institutional claims.

## Layer findings after repair

### Identity

Pass for analytics. Identity remains well supported by Securitize and SEC Form D.

### Blockchain

Partially pass. Ethereum token evidence is good. Multichain coverage exists at high level through Securitize and RWA.xyz/DeFiLlama, but per-chain verification should remain visible for institutional-grade movement.

### Reserve

Blocked for institutional-grade review. Reserve composition, reserve breakdown, public report, public attestation, public audit, and PoR evidence remain missing or secondary/contextual.

### Institutional

Blocked for institutional-grade review. Issuer identity and exemption context are supported, but public governing documents and primary service-provider confirmations remain missing.

### Compliance

Pass for analytics. SEC Form D supports exempt-offering framing. Do not describe this as regulatory approval. Legal opinion remains missing.

### Liquidity

Pass for analytics with warning. RWA.xyz provides operational redemption terms, but official legal terms are still preferred for institutional-grade review.

### Market

Pass for analytics after refresh. Dynamic values are current as of 2026-06-28 and source notes now distinguish TVL, Total Asset Value, market cap, supply, and holder scopes.

### Yield

Pass for analytics after refresh. Yield values are current aggregator snapshots, not official issuer yield methodology.

### Sources

Improved, but still not institutional-grade. Source traceability and freshness improved, but core legal/reserve/audit/PoR gaps remain.

## Conflicts and freshness

### Conflicts / metric distinctions

- RWA.xyz Total Asset Value is not the same as DeFiLlama TVL.
- CoinGecko market cap is not the same as issuer AUM or RWA.xyz Total Asset Value.
- Etherscan original Ethereum token supply/holders are not the same as RWA.xyz asset-level supply/holders.
- BUIDL and BUIDL-I should not be aggregated unless explicitly sourced.

### Freshness

- Market and yield values were refreshed to 2026-06-28.
- Dynamic values remain dependent on aggregators and should be refreshed again before any future baseline update.

## Source score rationale

Recommended sourceScore range: 78-82.

Rationale:

- Freshness improved materially after Research Agent repair.
- Claim-to-source notes improved, especially for market and yield data.
- Strong primary sources still cover identity and exemption context.
- Institutional-grade blockers remain unresolved for legal documentation, reserve reporting, audit/report, public attestation/PoR, and primary provider confirmation.
- Therefore the score can remain around the current analytics-grade level but should not increase into institutional-grade source quality.

## Final action

- Final action: Keep institutional-grade upgrade blocked.
- Recommended next agent: Research Agent only if new primary documents become available; otherwise stop this upgrade path.
- Reason: The repaired package still does not meet Source Verification requirements for `safeToProceed: true`.

Do not modify `risk.json` or `grade-baseline.json`. Risk & Grading Agent must not begin until a future Source Verification pass explicitly returns `safeToProceed: true`.
