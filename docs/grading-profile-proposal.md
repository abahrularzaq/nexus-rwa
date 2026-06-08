# Proposal: Grading Profile Classification for Nexus RWA

## Status

Draft proposal for future discussion.

This document does **not** change the current grading engine. It records the rationale and proposed direction after the `centrifuge-cfg` case showed that one universal grading rubric can create unfair or misleading results across different RWA asset types.

---

## 1. Background

The current Nexus RWA grading engine works well for direct asset-backed instruments such as tokenized Treasury products, tokenized funds, commodity-backed tokens, and yield-bearing RWA notes.

However, the same rubric becomes problematic for protocol or governance tokens such as:

- `centrifuge-cfg`
- `goldfinch-gfi`
- `clearpool-cpool`
- `truefi-tru`

These assets are related to the RWA ecosystem, but they are not direct claims on reserves, collateral pools, custodied assets, or redemption assets.

Example issue from `centrifuge-cfg`:

- CFG is a governance / utility token.
- It is not a direct asset-backed token.
- It does not have a reserve custodian in the same way PAXG, USTB, BENJI, or OUSG do.
- It should not be penalized as if missing reserve fields were failed evidence.

Current engine result for CFG:

```json
{
  "slug": "centrifuge-cfg",
  "grade": "research",
  "score": 46,
  "reserveScore": 0,
  "blockers": [
    "Missing backing type",
    "Missing backing description",
    "Missing custodian",
    "Missing redemption asset"
  ]
}
```

This result is technically consistent with the current engine, but conceptually incomplete because the engine does not yet distinguish between:

1. Missing evidence.
2. Not-applicable fields.
3. Wrong grading profile for the asset type.

---

## 2. Core Problem

A single grading rubric assumes every asset needs the same evidence structure:

- backing type
- backing description
- custodian
- reserve breakdown
- redemption asset
- proof of reserves
- legal opinion
- redemption period

This is suitable for asset-backed RWA tokens, but not suitable for governance/protocol tokens.

Without classification, the engine may produce misleading scores:

| Asset Type | Example | Problem if using universal reserve-heavy scoring |
|---|---|---|
| Tokenized Treasury | USTB, BENJI, OUSG | Works well |
| Commodity-backed token | PAXG, XAUT | Works well, reserve/custody very important |
| Credit pool token | Maple pool, Centrifuge DROP | Partially works, but borrower/collateral data should matter more |
| Governance token | CFG, GFI, CPOOL | Reserve checks become not applicable |
| Infrastructure protocol | Centrifuge, Goldfinch, Clearpool | Protocol adoption and governance should matter more |

---

## 3. Proposed Solution

Add a lightweight classification layer before grading.

Recommended fields:

```json
{
  "assetClass": "rwa_infrastructure",
  "instrumentType": "governance_token",
  "gradingProfile": "governance_protocol"
}
```

These fields can initially live inside `institutional.metadata` to avoid Prisma schema migration.

Example:

```json
{
  "metadata": {
    "assetClass": "rwa_infrastructure",
    "instrumentType": "governance_token",
    "gradingProfile": "governance_protocol"
  }
}
```

Later, after the model stabilizes, these can become first-class database fields.

---

## 4. Proposed Classification Fields

### 4.1 `assetClass`

`assetClass` is the broad user-facing category.

Initial options:

| assetClass | Description | Example Assets |
|---|---|---|
| `tokenized_treasury` | Tokenized Treasury, money market, or government-securities exposure | OUSG, USTB, BENJI, BUIDL |
| `tokenized_credit` | Tokenized private credit, lending pool, loan, or receivable exposure | Maple pools, Centrifuge DROP, Goldfinch pools |
| `tokenized_commodity` | Token backed by physical or financial commodity exposure | PAXG, XAUT |
| `tokenized_real_estate` | Tokenized property or real-estate cash-flow exposure | RealT-style assets |
| `rwa_infrastructure` | Protocol, governance, or infrastructure token serving the RWA ecosystem | CFG, GFI, CPOOL, TRU |
| `other` | Fallback for assets that do not fit cleanly yet | TBD |

---

### 4.2 `instrumentType`

`instrumentType` describes the actual financial or protocol instrument.

Initial options:

| instrumentType | Description | Reserve Required? | Example Assets |
|---|---|---:|---|
| `fund_share_token` | Tokenized fund share or fund-like claim | Yes | BENJI, USTB, BUIDL |
| `yield_bearing_note` | Yield-bearing token/note backed by financial assets | Yes | USDY, OUSG-like structures |
| `commodity_backed_token` | Token redeemable/backed by commodity reserves | Yes | PAXG, XAUT |
| `pool_token` | Token representing pool/tranche exposure | Partial | Maple pool tokens, Centrifuge DROP |
| `governance_token` | Governance or utility token for a protocol | No | CFG, GFI, CPOOL |
| `protocol_token` | Protocol-native infrastructure token | No | TRU, other RWA protocol tokens |
| `other` | Fallback | Depends | TBD |

---

### 4.3 `gradingProfile`

`gradingProfile` determines which scoring rubric the engine should use.

Initial profiles:

| gradingProfile | Best For | Reserve Weight |
|---|---|---:|
| `asset_backed` | Treasury, fund, note, reserve-backed assets | High |
| `credit_pool` | Lending pools, private credit pools, tranche tokens | Medium |
| `commodity_backed` | Gold or commodity-backed tokens | Very high |
| `governance_protocol` | Governance/protocol/infrastructure tokens | None or very low |

---

## 5. Proposed Grading Profiles

### 5.1 `asset_backed`

Use for:

- OUSG
- USDY
- USTB
- BENJI
- BUIDL
- similar tokenized Treasury/fund products

Suggested weights:

```text
completeness 20%
source        20%
legal         20%
reserve       20%
liquidity     10%
risk          10%
```

This is close to the current grading engine and should remain the default.

Key required evidence:

- issuer/fund manager
- legal structure
- legal document or prospectus
- backing type
- reserve/collateral description
- custodian
- reserve report / audit / attestation
- redemption mechanics
- market/yield data
- sources audit trail

---

### 5.2 `commodity_backed`

Use for:

- PAXG
- XAUT
- other gold or commodity-backed tokens

Suggested weights:

```text
source        20%
legal         20%
reserve       30%
custody       15%
liquidity     10%
risk           5%
```

Key required evidence:

- physical commodity backing
- custodian / vaulting arrangement
- attestation or reserve reports
- redemption rules
- regulator / trust company status if applicable
- token contract verification
- secondary liquidity

Notes:

Commodity-backed assets should be penalized heavily if reserve or custody evidence is weak.

---

### 5.3 `credit_pool`

Use for:

- Maple pool tokens
- Centrifuge DROP
- Goldfinch pools
- private credit pools
- receivables-backed pools

Suggested weights:

```text
source        20%
legal         15%
collateral    20%
borrower      15%
liquidity     15%
risk          15%
```

Key required evidence:

- pool structure
- borrower / originator information
- collateral type
- loan book or pool composition
- maturity profile
- default/loss history
- seniority/tranche structure
- redemption/withdrawal terms
- pool performance/yield
- audits or smart contract reviews

Notes:

For this profile, `reserve` should be interpreted as collateral/pool backing, not necessarily custodied Treasury or gold reserve.

---

### 5.4 `governance_protocol`

Use for:

- CFG
- GFI
- CPOOL
- TRU
- other protocol/governance tokens related to RWA infrastructure

Suggested weights:

```text
source        20%
protocol      20%
tokenomics    15%
governance    15%
liquidity     15%
risk          15%
```

Key required evidence:

- official protocol documentation
- token contract verification
- tokenomics and supply data
- governance model
- protocol TVL / adoption
- protocol revenue or fees if available
- audit / security documentation
- holder count and concentration
- token market liquidity
- regulatory/compliance disclosures

Fields that should be treated as not applicable or low-weight:

- `backingType`
- `custodian`
- `reserveBreakdown`
- `redemptionAsset`
- `hasProofOfReserves`

Important distinction:

A governance token can be important to the RWA ecosystem without being a direct RWA claim token.

Therefore, low reserve score should not automatically imply weak project quality. It may simply mean the asset is being graded under the wrong profile.

---

## 6. Proposed Implementation Path

### Phase 1 — Documentation Only

- Keep current engine unchanged.
- Add this document as conceptual reference.
- For new assets, manually record proposed profile in `institutional.metadata`.

Example for CFG:

```json
{
  "metadata": {
    "assetClass": "rwa_infrastructure",
    "instrumentType": "governance_token",
    "gradingProfile": "governance_protocol"
  }
}
```

### Phase 2 — Metadata Adoption

Update asset layer templates to include optional metadata classification.

No Prisma migration needed yet.

Recommended location:

```text
institutional.json → metadata
```

Reason:

- already supports flexible JSON
- does not break current import
- easy to migrate later

### Phase 3 — Engine Awareness

Modify the grading engine to detect profile:

```ts
const gradingProfile = input.institutional?.metadata?.gradingProfile ?? 'asset_backed';

if (gradingProfile === 'governance_protocol') {
  return calculateGovernanceProtocolGrade(input);
}

if (gradingProfile === 'credit_pool') {
  return calculateCreditPoolGrade(input);
}

if (gradingProfile === 'commodity_backed') {
  return calculateCommodityBackedGrade(input);
}

return calculateAssetBackedGrade(input);
```

### Phase 4 — Schema Migration

Only after profiles are stable, consider adding first-class fields to Prisma:

```prisma
assetClass      String?
instrumentType  String?
gradingProfile  String?
```

Potential model location:

- `AssetIdentity`, or
- new `AssetClassification`, or
- directly on `Asset`

Recommendation: delay this until at least 10–20 assets have been classified manually.

---

## 7. Migration Strategy for Existing Assets

Suggested initial mapping:

| Slug | assetClass | instrumentType | gradingProfile |
|---|---|---|---|
| `ondo-ousg` | `tokenized_treasury` | `yield_bearing_note` | `asset_backed` |
| `ondo-usdy` | `tokenized_treasury` | `yield_bearing_note` | `asset_backed` |
| `superstate-ustb` | `tokenized_treasury` | `fund_share_token` | `asset_backed` |
| `franklin-benji` | `tokenized_treasury` | `fund_share_token` | `asset_backed` |
| `paxos-paxg` | `tokenized_commodity` | `commodity_backed_token` | `commodity_backed` |
| `tether-xaut` | `tokenized_commodity` | `commodity_backed_token` | `commodity_backed` |
| `maple-musdc` | `tokenized_credit` | `pool_token` | `credit_pool` |
| `centrifuge-cfg` | `rwa_infrastructure` | `governance_token` | `governance_protocol` |
| `goldfinch-gfi` | `rwa_infrastructure` | `governance_token` | `governance_protocol` |
| `clearpool-cpool` | `rwa_infrastructure` | `governance_token` | `governance_protocol` |
| `truefi-tru` | `rwa_infrastructure` | `protocol_token` | `governance_protocol` |

This table is only a starting point and should be reviewed asset by asset.

---

## 8. Design Principles

### 8.1 Do not force completeness by inventing fields

If reserve fields are not applicable, they should remain null.

Do not fill fields like `custodian`, `redemptionAsset`, or `reserveBreakdown` only to improve score.

### 8.2 Distinguish missing evidence from not applicable evidence

Future grading should support three states:

```text
available
missing
not_applicable
```

Current JSON only uses `null`, which cannot distinguish missing from not applicable.

A future improvement could add field-level notes or classification-aware scoring.

### 8.3 Keep grading explainable

Every score should explain why an asset is research, analytics, or institutional grade.

For example:

```text
CFG remains research-grade under the current asset-backed grading engine because reserve fields are not applicable. Under a governance_protocol profile, its score should depend more on tokenomics, governance, protocol adoption, liquidity, and smart-contract evidence.
```

### 8.4 Avoid overengineering too early

Start with 4 profiles only:

1. `asset_backed`
2. `credit_pool`
3. `commodity_backed`
4. `governance_protocol`

Do not create too many categories before the dataset has enough assets.

---

## 9. Open Questions

1. Should governance/protocol tokens remain in the same public table as direct RWA assets?
2. Should Nexus RWA show separate tabs for:
   - RWA Assets
   - RWA Protocols
   - RWA Infrastructure Tokens
3. Should `grade` labels remain the same across profiles?
   - research
   - analytics
   - institutional
4. Or should governance/protocol tokens use separate labels?
   - tracked
   - research
   - protocol-grade
5. Should reserve-related fields support `notApplicable: true` metadata?
6. Should the frontend explain when an asset is graded with a non-default profile?
7. Should a governance token ever be eligible for `institutional`, or should it have a different top grade?

---

## 10. Recommendation

For now:

1. Keep the current grading engine unchanged.
2. Keep CFG as `research-grade baseline`.
3. Do not artificially fill reserve fields for CFG.
4. Add optional `gradingProfile` metadata for future assets.
5. Use `asset_backed` as the default profile.
6. Use `governance_protocol` for CFG-like assets.
7. Revisit the engine after 3–5 governance/protocol tokens have been added.

This keeps the system simple today while preserving a clear path toward more accurate category-aware grading later.

---

## 11. Example: CFG Metadata Update Proposal

Potential future update for `data/assets/centrifuge-cfg/institutional.json`:

```json
{
  "metadata": {
    "classificationNote": "CFG is a protocol governance and utility token for the Centrifuge ecosystem. It is not a direct tokenized fund share, loan note, senior tranche, or reserve-backed instrument.",
    "assetClass": "rwa_infrastructure",
    "instrumentType": "governance_token",
    "gradingProfile": "governance_protocol"
  }
}
```

This should be discussed before implementation.
