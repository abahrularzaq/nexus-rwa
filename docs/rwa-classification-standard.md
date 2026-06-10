# Nexus RWA Classification Standard

## Status

Active standard for Nexus RWA asset classification and grading-profile selection.

This document defines how Nexus RWA classifies assets before running the grading engine. It should be used before adding a new asset, regenerating a grade baseline, or changing the public frontend category of an asset.

---

## 1. Core Principle

Nexus RWA must separate:

1. What the asset is.
2. What economic or legal claim the token represents.
3. Which grading rubric should be used.
4. Which evidence fields are required, missing, or not applicable.

The asset category should **not** directly determine the grade.

Instead:

```text
assetClass + instrumentType + claimType → gradingProfile → profile-specific grade
```

This prevents governance/protocol tokens from being unfairly penalized for missing reserve fields that are not applicable, while still keeping direct RWA claim tokens accountable for reserve, custody, legal, and redemption evidence.

---

## 2. Classification Fields

Classification should be stored in each asset under:

```text
institutional.json → metadata → classification
```

Recommended JSON shape:

```json
{
  "metadata": {
    "classification": {
      "assetClass": "tokenized_treasury",
      "instrumentType": "fund_share_token",
      "claimType": "fund_share_claim",
      "gradingProfile": "asset_backed",
      "publicSegment": "RWA Assets",
      "reserveApplicability": "available",
      "classificationNote": "Short explanation of what the token represents and why this profile applies."
    }
  }
}
```

Legacy fields such as `metadata.assetClass`, `metadata.instrumentType`, and `metadata.gradingProfile` may be kept temporarily for backward compatibility, but new logic should prefer `metadata.classification`.

---

## 3. `assetClass`

`assetClass` is the broad user-facing category.

Allowed values:

| Value | Description | Example Assets |
|---|---|---|
| `tokenized_treasury` | Tokenized Treasury, money market, government securities, or Treasury-like yield exposure | OUSG, USDY, USTB, BENJI, BUIDL |
| `tokenized_credit` | Tokenized private credit, lending pool, receivables, or loan exposure | Maple pools, Centrifuge DROP, Goldfinch pools |
| `tokenized_commodity` | Token backed by physical or financial commodity exposure | PAXG, XAUT |
| `tokenized_real_estate` | Tokenized property, rent, mortgage, or real estate cash-flow exposure | RealT-style assets |
| `tokenized_fund` | Tokenized fund share or fund-like exposure that does not fit cleanly into Treasury only | Tokenized funds |
| `stablecoin_reserve` | Fiat, cash, Treasury, or reserve-backed payment/stablecoin asset | USDC-like or reserve-backed payment tokens |
| `rwa_infrastructure` | Protocol, network, governance, or infrastructure token serving the RWA ecosystem | CFG, GFI, CPOOL, TRU |
| `other` | Fallback for unclear or emerging categories | TBD |

---

## 4. `instrumentType`

`instrumentType` describes the actual financial or protocol instrument.

Allowed values:

| Value | Description | Reserve Required? | Example Assets |
|---|---|---:|---|
| `fund_share_token` | Tokenized fund share or fund-like claim | Yes | BENJI, USTB, BUIDL |
| `yield_bearing_note` | Yield-bearing token, note, or note-like instrument | Yes | OUSG, USDY |
| `commodity_backed_token` | Token redeemable for or backed by commodity reserves | Yes | PAXG, XAUT |
| `pool_token` | Token representing exposure to a lending or credit pool | Partial | Maple pool tokens |
| `tranche_token` | Token representing senior/junior tranche exposure | Partial | Centrifuge DROP/TIN-like structures |
| `real_estate_claim_token` | Token representing real-estate ownership, rent, or cash-flow exposure | Yes / Partial | Real estate RWA tokens |
| `reserve_backed_payment_token` | Payment/stablecoin token backed by reserve assets | Yes | Reserve-backed stablecoins |
| `governance_token` | Governance token for an RWA protocol or ecosystem | No | CFG, GFI, CPOOL |
| `protocol_token` | Protocol-native utility/infrastructure token | No | TRU |
| `infrastructure_network_token` | Network token supporting infrastructure, settlement, or protocol activity | No / Partial | Emerging RWA infrastructure tokens |
| `other` | Fallback for unclear structures | Depends | TBD |

---

## 5. `claimType`

`claimType` describes the economic or legal claim represented by the token.

This is the most important classification field because it prevents protocol tokens from being treated as direct RWA claim tokens.

Allowed values:

| Value | Description | Example Assets |
|---|---|---|
| `direct_asset_claim` | Direct claim or exposure to a specific underlying off-chain asset | Asset-backed claim token |
| `fund_share_claim` | Claim or interest in a fund/share structure | BENJI, USTB, BUIDL |
| `debt_or_note_claim` | Claim based on a debt, note, or yield-bearing instrument | OUSG, USDY |
| `pool_or_tranche_exposure` | Exposure to a credit pool, collateral pool, or tranche | Maple pool tokens, Centrifuge DROP |
| `commodity_redemption_claim` | Commodity-backed or commodity-redeemable claim | PAXG, XAUT |
| `protocol_utility` | Utility or protocol-native value capture, not a direct asset claim | TRU-like assets |
| `governance_right` | Governance right or ecosystem participation token, not a direct asset claim | CFG, GFI, CPOOL |
| `no_asset_claim` | Token does not represent claim to an off-chain RWA asset | Infrastructure-only tokens |
| `unclear` | Claim structure is unclear or insufficiently documented | Research-stage assets |

---

## 6. `gradingProfile`

`gradingProfile` determines which scoring rubric the grading engine uses.

Allowed values:

| Value | Best For | Reserve Weight | Notes |
|---|---|---:|---|
| `asset_backed` | Treasury, fund, note, reserve-backed claim tokens | High | Default for BENJI, USTB, OUSG, USDY |
| `commodity_backed` | Gold or commodity-backed tokens | Very high | Custody/vaulting evidence is critical |
| `credit_pool` | Lending pools, private credit pools, tranche tokens | Medium | Collateral, borrower, pool performance matter more |
| `real_estate_claim` | Tokenized property or real-estate cash-flow claims | Medium / High | To be implemented when needed |
| `governance_protocol` | Governance, protocol, or RWA infrastructure tokens | None / very low | Reserve, custodian, redemption asset, and PoR are usually not applicable |

Backward compatibility note:

- `asset_backed` remains the default profile if no classification is found.
- New assets should explicitly set `gradingProfile`.

---

## 7. `applicability`

Nexus RWA must distinguish three states:

```text
available
missing
not_applicable
```

### 7.1 Definitions

| State | Meaning |
|---|---|
| `available` | Evidence exists and is supported by sources |
| `missing` | Evidence should exist for this profile, but has not been found or verified |
| `not_applicable` | Field does not apply to this asset type or grading profile |

### 7.2 Why this matters

A missing custodian for a commodity-backed token is a serious weakness.

A missing custodian for a governance token is usually not a weakness because governance tokens are not direct reserve-backed claim instruments.

Therefore:

```text
commodity_backed + missing custodian = blocker
governance_protocol + missing custodian = not_applicable
asset_backed + missing reserve description = blocker
credit_pool + missing pool composition = warning or blocker depending on severity
```

---

## 8. Recommended Public Segments

Frontend display should avoid mixing direct RWA claim tokens with protocol/governance tokens without context.

Allowed values:

| Value | Description |
|---|---|
| `RWA Assets` | Direct asset-backed, fund, note, Treasury, commodity, or reserve-backed claim tokens |
| `RWA Credit Pools` | Credit pools, tranche tokens, loan pools, receivables, and structured credit exposure |
| `RWA Protocols` | Protocols, governance tokens, and infrastructure tokens serving the RWA ecosystem |
| `Other` | Fallback |

Frontend should show grade with profile context:

```text
Analytics — Governance Protocol Profile
```

not only:

```text
Analytics
```

---

## 9. Profile-Specific Required Evidence

### 9.1 `asset_backed`

Best for:

- OUSG
- USDY
- USTB
- BENJI
- BUIDL

Required evidence:

- issuer / fund manager
- legal structure
- prospectus, legal document, or regulatory filing
- backing type
- reserve/collateral description
- custodian or fund custody arrangement
- audit, report, attestation, or fund reporting
- redemption mechanics
- market/yield data
- token contract verification
- sources audit trail

### 9.2 `commodity_backed`

Best for:

- PAXG
- XAUT

Required evidence:

- physical commodity backing
- vault/custodian arrangement
- custodian URL
- reserve attestation/report
- auditor if available
- redemption rules
- regulator or trust-company status if applicable
- token contract verification
- secondary liquidity

### 9.3 `credit_pool`

Best for:

- Maple pools
- Centrifuge DROP/TIN-like structures
- Goldfinch pools
- receivables-backed pools
- private credit pools

Required evidence:

- pool structure
- borrower/originator information
- collateral type
- loan book or pool composition
- maturity profile
- default/loss history if available
- seniority/tranche structure
- redemption/withdrawal terms
- pool performance/yield
- smart contract audit or review if available

### 9.4 `real_estate_claim`

Best for:

- real estate ownership tokens
- rent cash-flow tokens
- property-backed tokens
- mortgage-backed RWA tokens

Required evidence:

- property or asset description
- ownership or SPV structure
- legal claim documentation
- valuation/appraisal data
- custodian/trustee/administrator if applicable
- income distribution rules
- transfer restrictions
- redemption or secondary-market mechanics
- risk disclosures

### 9.5 `governance_protocol`

Best for:

- CFG
- GFI
- CPOOL
- TRU
- other RWA protocol/governance tokens

Required evidence:

- official protocol documentation
- token contract verification
- tokenomics and supply data
- governance model
- protocol adoption / TVL / AUM / usage metrics
- protocol revenue or fees if available
- audit / security documentation if available
- holder count and concentration
- token market liquidity
- regulatory/compliance disclosures if available

Usually not applicable:

- direct backing type
- direct custodian
- reserve breakdown
- redemption asset
- proof of reserves

Important distinction:

A governance or protocol token can be important to the RWA ecosystem without being a direct RWA claim token.

---

## 10. Initial Asset Mapping

| Slug | assetClass | instrumentType | claimType | gradingProfile | publicSegment |
|---|---|---|---|---|---|
| `ondo-ousg` | `tokenized_treasury` | `yield_bearing_note` | `debt_or_note_claim` | `asset_backed` | `RWA Assets` |
| `ondo-usdy` | `tokenized_treasury` | `yield_bearing_note` | `debt_or_note_claim` | `asset_backed` | `RWA Assets` |
| `superstate-ustb` | `tokenized_treasury` | `fund_share_token` | `fund_share_claim` | `asset_backed` | `RWA Assets` |
| `franklin-benji` | `tokenized_treasury` | `fund_share_token` | `fund_share_claim` | `asset_backed` | `RWA Assets` |
| `paxos-paxg` | `tokenized_commodity` | `commodity_backed_token` | `commodity_redemption_claim` | `commodity_backed` | `RWA Assets` |
| `tether-xaut` | `tokenized_commodity` | `commodity_backed_token` | `commodity_redemption_claim` | `commodity_backed` | `RWA Assets` |
| `maple-musdc` | `tokenized_credit` | `pool_token` | `pool_or_tranche_exposure` | `credit_pool` | `RWA Credit Pools` |
| `centrifuge-cfg` | `rwa_infrastructure` | `governance_token` | `governance_right` | `governance_protocol` | `RWA Protocols` |
| `goldfinch-gfi` | `rwa_infrastructure` | `governance_token` | `governance_right` | `governance_protocol` | `RWA Protocols` |
| `clearpool-cpool` | `rwa_infrastructure` | `governance_token` | `governance_right` | `governance_protocol` | `RWA Protocols` |
| `truefi-tru` | `rwa_infrastructure` | `protocol_token` | `protocol_utility` | `governance_protocol` | `RWA Protocols` |

This mapping is an initial baseline and should be reviewed asset by asset.

---

## 11. Validation Rules

The validator should eventually enforce:

1. Every asset must have `metadata.classification`.
2. `assetClass` must use an allowed enum value.
3. `instrumentType` must use an allowed enum value.
4. `claimType` must use an allowed enum value.
5. `gradingProfile` must use an allowed enum value.
6. `publicSegment` must use an allowed enum value.
7. `governance_protocol` assets should not fill reserve/custody/redemption fields artificially.
8. `asset_backed` assets should have reserve/custody/redemption evidence or valid blockers.
9. `commodity_backed` assets should have commodity reserve and custody evidence.
10. `credit_pool` assets should have pool/collateral/borrower evidence.
11. `claimType` and `gradingProfile` must be logically consistent.

Examples of invalid combinations:

```text
claimType = governance_right + gradingProfile = asset_backed
instrumentType = commodity_backed_token + gradingProfile = governance_protocol
assetClass = rwa_infrastructure + claimType = commodity_redemption_claim
```

---

## 12. Grade Display Rules

The public frontend should always show grade with profile context.

Recommended display:

```text
Grade: Analytics
Profile: Governance Protocol
Claim Type: Governance Right
Reserve: Not Applicable
```

For direct RWA claim tokens:

```text
Grade: Institutional
Profile: Asset-backed
Claim Type: Fund Share Claim
Reserve: Required / Available
```

This avoids misleading users into thinking all RWA-related tokens represent the same kind of economic claim.

---

## 13. Migration Strategy

Migration should be done in this order:

1. `centrifuge-cfg`
2. `franklin-benji`
3. `ondo-ousg`
4. `ondo-usdy`
5. `superstate-ustb`
6. `paxos-paxg`
7. `maple-musdc`
8. `goldfinch-gfi`
9. `clearpool-cpool`
10. `truefi-tru`

Do not run Prisma migration yet.

Keep classification in JSON metadata until at least 10–20 assets are classified and the model is stable.

Potential future Prisma fields:

```prisma
assetClass String?
instrumentType String?
claimType String?
gradingProfile String?
publicSegment String?
```

---

## 14. New Asset Workflow

Every new asset must follow this order:

1. Determine slug.
2. Determine `assetClass`.
3. Determine `instrumentType`.
4. Determine `claimType`.
5. Determine `gradingProfile`.
6. Determine field applicability.
7. Run source discovery.
8. Research identity layer.
9. Research blockchain layer.
10. Research reserve/collateral layer.
11. Research institutional layer.
12. Research compliance layer.
13. Research market layer.
14. Research yield layer.
15. Research liquidity layer.
16. Build `sources.json` audit trail.
17. Build `risk.json`.
18. Run import/build validation.
19. Run grading.
20. Generate `grade-baseline.json`.
21. Verify frontend display.

Classification must happen before layer research, not after a grading result looks wrong.

---

## 15. Non-Negotiable Rules

1. Do not invent reserve, custodian, or redemption fields to improve grade.
2. Do not treat not-applicable fields as missing evidence.
3. Do not treat governance/protocol tokens as direct RWA claim tokens.
4. Do not allow direct asset-backed tokens to bypass reserve/legal/custody evidence.
5. Always show grading profile context in public grade display.
6. Always preserve source-backed evidence discipline.

---

## 16. Implementation Milestones

Recommended implementation order:

```text
Step 1  — Create classification standard doc
Step 2  — Update CFG classification block
Step 3  — Update assetGradeEngine result type
Step 4  — Fix governance_protocol output
Step 5  — Add profileScores + applicability + gradeContext
Step 6  — Regenerate CFG baseline
Step 7  — Update frontend display for grade profile
Step 8  — Migrate BENJI/OUSG/USDY/USTB/PAXG/Maple
Step 9  — Add validation rules
Step 10 — Update asset addition SOP/template
Step 11 — Resume adding new assets
```

---

## 17. Acceptance Criteria

The restructuring is considered successful when:

- All existing assets have classification metadata.
- CFG and similar governance tokens no longer receive reserve/custody/redemption blockers.
- Direct RWA claim tokens still require reserve/legal/custody evidence.
- Grade output clearly shows grading profile.
- Frontend does not visually mix direct RWA assets and governance/protocol tokens without context.
- New asset SOP requires classification before layer research.
