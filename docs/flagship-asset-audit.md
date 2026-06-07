# Nexus RWA Flagship Asset Audit

Date: 2026-06-07  
Scope: public-demo readiness audit for core Nexus RWA assets after x402 Pro paywall stabilization.

## Purpose

This audit identifies which assets are strong enough to become Nexus RWA flagship/demo assets. The goal is not to add more assets yet, but to make sure the first assets shown to users feel credible, complete, and commercially presentable.

A flagship asset should be:

- visible in the dashboard,
- backed by valid normalized JSON layers,
- supported by `sources.json`,
- assigned a `grade-baseline.json`,
- free of hard blockers,
- useful for demonstrating the 12-layer Nexus RWA model,
- credible enough for public demo, investor preview, or API walkthrough.

## Audit method

This is a structure and readiness audit, not a full re-research of each asset.

Checked signals:

1. Presence of `grade-baseline.json`.
2. Grade and score.
3. Completeness score.
4. Source score.
5. Blockers.
6. Warning severity.
7. Whether the asset is suitable for a public demo.
8. Whether the asset should be positioned as flagship, supporting, or not-ready.

Required normalized production files remain:

```text
identity.json
market.json
risk.json
reserve.json
yield.json
institutional.json
blockchain.json
compliance.json
liquidity.json
sources.json
grade-baseline.json
```

## Executive summary

Recommended public-demo set:

1. `franklin-benji` — strongest flagship asset.
2. `paxos-paxg` — strong commodity-backed comparison asset.
3. `ondo-usdy` — strong yield-bearing treasury/credit-like comparison asset.
4. `ondo-ousg` — strong tokenized treasury comparison asset.
5. `blackrock-buidl` — important brand asset, but should be framed as analytics-grade until reserve/audit gaps are improved.
6. `superstate-ustb` — useful comparison asset, but source score needs improvement.
7. `hashnote-usyc` — useful but not top flagship until custodian/reserve/legal evidence improves.

Do not lead the public demo with:

- `tether-gold-xaut` — has explicit blockers: missing legal structure and missing custodian.

## Readiness table

| Asset | Grade | Score | Completeness | Source Score | Blockers | Demo Status | Role |
|---|---:|---:|---:|---:|---|---|---|
| `franklin-benji` | institutional | 91 | 100 | 97 | None | Ready | Primary flagship |
| `paxos-paxg` | analytics | 85 | 85 | 97 | None | Ready | Commodity/gold comparison |
| `ondo-usdy` | analytics | 83 | 96 | 95 | None | Ready | Yield-bearing RWA comparison |
| `ondo-ousg` | analytics | 82 | 85 | 87 | None | Ready with caveats | Treasury comparison |
| `blackrock-buidl` | analytics | 81 | 96 | 81 | None | Ready with caveats | Brand/issuer flagship |
| `superstate-ustb` | analytics | 76 | 100 | 57 | None | Supporting only | Treasury comparison |
| `hashnote-usyc` | analytics | 76 | 81 | 81 | Missing custodian | Supporting / needs cleanup | Yield comparison |
| `tether-gold-xaut` | analytics | 67 | 81 | 69 | Missing legal structure; missing custodian | Not flagship-ready | Research backlog |

## Asset-by-asset notes

### 1. `franklin-benji`

Status: **Primary flagship-ready**

Why it is strong:

- Institutional grade baseline.
- Highest score in this audit group.
- Completeness score is 100.
- Source score is 97.
- No blockers.
- Strong official Franklin Templeton source trail.

Current warnings:

- Missing legal opinion or legal document URL.
- No proof-of-reserves confirmed.

Recommended positioning:

Use BENJI as the first flagship demo asset. It shows Nexus RWA can evaluate a real institutional tokenized fund with strong issuer credibility.

Demo angle:

> “How Nexus RWA evaluates a U.S.-registered tokenized government money market fund.”

Priority action:

- Confirm whether SEC registration/prospectus/fund literature should satisfy legal documentation requirements for grading so BENJI is not over-penalized for missing a separate legal opinion.

---

### 2. `paxos-paxg`

Status: **Flagship-ready as commodity-backed comparison**

Why it is strong:

- Score 85.
- Source score 97.
- Reserve score 90.
- No blockers.
- Familiar gold-backed RWA asset.

Current warnings:

- Missing legal opinion or legal document URL.
- No proof-of-reserves confirmed.
- Missing redemption period.
- Missing on-chain liquidity.

Recommended positioning:

Use PAXG as the commodity-backed flagship comparison next to treasury/yield products.

Demo angle:

> “Treasury RWA vs gold-backed RWA: how reserve, liquidity, and compliance differ.”

Priority action:

- Add verified redemption-period evidence if publicly available.
- Add verified DEX/on-chain liquidity evidence if Nexus wants stronger liquidity analytics.

---

### 3. `ondo-usdy`

Status: **Flagship-ready with caveats**

Why it is strong:

- Score 83.
- Completeness score 96.
- Source score 95.
- No blockers.
- Useful yield-bearing product for comparison.

Current warnings:

- Missing primary regulator.
- Missing legal opinion or legal document URL.
- Missing reserve breakdown.
- Missing audit/report URL.

Recommended positioning:

Use USDY as a yield-bearing RWA comparison asset, but avoid presenting it as institutional-grade until legal/reserve/audit gaps are tightened.

Demo angle:

> “Why high yield is not enough: comparing yield, reserve evidence, and compliance restrictions.”

Priority action:

- Clarify regulator/legal framework fields.
- Add reserve breakdown or official collateral reporting source.

---

### 4. `ondo-ousg`

Status: **Demo-ready with caveats**

Why it is useful:

- Score 82.
- Source score 87.
- No blockers.
- Strong treasury-token comparison asset.

Current warnings:

- Missing legal opinion or legal document URL.
- No proof-of-reserves confirmed.
- Missing audit/report URL.
- Missing on-chain liquidity.

Recommended positioning:

Use OUSG as a treasury-focused comparison asset, especially next to BENJI, BUIDL, and USTB.

Demo angle:

> “Comparing tokenized treasury products beyond yield.”

Priority action:

- Improve audit/report evidence.
- Verify issuer redemption/on-chain liquidity assumptions.

---

### 5. `blackrock-buidl`

Status: **Brand flagship, analytics-grade only**

Why it matters:

- BlackRock/BUIDL has strong public recognition.
- Completeness score 96.
- No blockers.
- Good asset for landing-page/demo credibility.

Current constraints:

- Grade is analytics, not institutional.
- Source score 81.
- Reserve score 65.
- Warnings include missing legal opinion, missing reserve breakdown, no proof-of-reserves, and missing audit/report URL.

Recommended positioning:

Use BUIDL prominently because of brand recognition, but be careful with wording. Present it as an analytics-grade baseline until reserve/audit/legal evidence is improved.

Demo angle:

> “Even famous institutional RWA products still need structured evidence scoring.”

Priority action:

- Improve reserve breakdown.
- Add public audit/report evidence if available.
- Clarify legal document/prospectus/private placement evidence.

---

### 6. `superstate-ustb`

Status: **Supporting demo asset**

Why it is useful:

- Completeness score 100.
- No blockers.
- Good treasury comparison asset.

Current constraints:

- Score 76.
- Source score only 57.
- Warnings include legal document, reserve breakdown, proof-of-reserves, audit/report, and on-chain liquidity gaps.

Recommended positioning:

Use USTB as a secondary comparison asset, not the primary landing-page proof point.

Demo angle:

> “How two treasury products with similar category exposure can differ by evidence quality.”

Priority action:

- Improve `sources.json` reliability and coverage.
- Add official reports or source trail for reserve and audit fields.

---

### 7. `hashnote-usyc`

Status: **Supporting / needs cleanup**

Why it is useful:

- Score 76.
- Recently refreshed market, yield, and liquidity layers.
- Good yield comparison asset.

Current blocker:

- Missing custodian.

Current warnings:

- Missing legal opinion or legal document URL.
- No proof-of-reserves confirmed.
- Missing audit/report URL.
- Missing on-chain liquidity.

Recommended positioning:

Use USYC only as a supporting asset until custody/reserve/legal evidence improves.

Demo angle:

> “How Nexus flags evidence gaps even when market and yield data are refreshed.”

Priority action:

- Find and verify custodian/custody arrangement from official Hashnote/Circle/fund documents.
- Verify public fund report, audit, attestation, or reserve report availability.

---

### 8. `tether-gold-xaut`

Status: **Not flagship-ready**

Why it should not lead the demo:

- Score 67.
- Source score 69.
- Reserve score 60.
- Liquidity score 48.
- Has hard blockers: missing legal structure and missing custodian.

Current warnings:

- Missing legal opinion or legal document URL.
- No proof-of-reserves confirmed.
- Missing audit/report URL.
- Missing redemption period.
- Missing on-chain liquidity.

Recommended positioning:

Keep XAUT in research backlog until legal/custody/reserve evidence is fixed. Do not use it as a public flagship asset.

Demo angle after cleanup:

> “Comparing two gold-backed tokens: PAXG vs XAUT.”

Priority action:

- Verify official Tether Gold legal documents.
- Confirm custodian/vault operator.
- Add latest reserve report URL/date/auditor.
- Clarify redemption mechanics and liquidity evidence.

## Recommended flagship demo order

For public demo or investor preview, use this order:

1. `franklin-benji`
2. `blackrock-buidl`
3. `paxos-paxg`
4. `ondo-usdy`
5. `ondo-ousg`
6. `superstate-ustb`

Optional supporting assets:

7. `hashnote-usyc`

Avoid for first demo:

8. `tether-gold-xaut`

## Demo narrative recommendation

Use a comparison story rather than a generic asset catalog.

Suggested demo title:

> Compare institutional RWA products beyond yield: BENJI vs BUIDL vs OUSG vs PAXG.

Suggested flow:

1. Open `franklin-benji` as the strongest institutional example.
2. Show its grade, score, sources, reserve/legal/compliance layers.
3. Compare with `blackrock-buidl` to show that brand strength does not automatically mean perfect evidence completeness.
4. Compare with `paxos-paxg` to show commodity-backed RWA differences.
5. Open Risk & Grade to show factor-level scoring.
6. Open Sources to show evidence trail.
7. Trigger x402 paywall and show Pro unlock flow.

## Immediate next actions

### Product/demo

- Use `franklin-benji` as the default showcase asset when possible.
- Keep `blackrock-buidl` in Pro CTA because brand recognition is high, but label it analytics-grade if discussed publicly.
- Use `paxos-paxg` as the gold-backed comparison asset.
- Do not promote `tether-gold-xaut` until blockers are resolved.

### Data quality

Highest-impact cleanup order:

1. Improve `blackrock-buidl` reserve/audit/legal evidence.
2. Improve `superstate-ustb` source score.
3. Improve `hashnote-usyc` custodian/reserve/legal evidence.
4. Improve `tether-gold-xaut` legal structure and custodian before demo usage.
5. Refresh market/yield/liquidity values for all public-demo assets before external launch.

### Engineering

- Consider adding a `flagship: true` or `demoPriority` field later if the frontend needs to feature selected assets.
- Consider creating a dashboard filter: `Flagship`, `Institutional`, `Analytics`, `Research`.
- Consider hiding or de-emphasizing assets with blockers from landing-page previews.

## Current conclusion

Nexus RWA is ready to demonstrate the product using a curated set of assets, but the demo should be selective. The strongest current public-demo path is:

```text
franklin-benji → blackrock-buidl → paxos-paxg → ondo-usdy → ondo-ousg
```

The dataset should not yet be marketed as uniformly institutional-grade across all assets. A more accurate claim is:

> Nexus RWA provides evidence-based RWA intelligence with institutional, analytics, and research-grade classifications.
