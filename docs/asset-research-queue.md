# Nexus RWA Asset Research Queue

## Status

Active queue after the classification-first restructuring.

Use this document to resume adding new assets safely.

Before adding any asset, follow:

```text
docs/asset-addition-classification-first-sop.md
docs/rwa-classification-standard.md
```

Run validation before import:

```bash
cd api
npm run validate:classification -- --slug={slug}
npm run build
npm run import:asset -- {slug}
```

---

## 1. Current Pipeline Status

Classification and grading-profile restructuring is complete enough to resume adding new assets.

Completed foundations:

- classification standard document
- CFG governance profile migration
- profile-aware grade engine
- nullable reserveScore at engine level
- profileScores / applicability / gradeContext
- frontend grade profile display
- initial migration for BENJI, OUSG, USDY, USTB, PAXG, Maple mUSDC
- classification validator
- classification-first asset addition SOP

---

## 2. New Asset Intake Rule

Every new asset must begin with this pre-check:

```text
slug
assetClass
instrumentType
claimType
gradingProfile
publicSegment
reserveApplicability
custodyApplicability
redemptionApplicability
proofOfReservesApplicability
classificationNote
```

Do not proceed to source discovery or layer JSONs until the classification is agreed.

---

## 3. Recommended Next Assets

### Priority A — Institutional / High-Signal Direct RWA Claim Tokens

These are best for strengthening Nexus RWA credibility.

| Priority | Slug | Asset | Suggested Profile | Reason |
|---:|---|---|---|---|
| 1 | `blackrock-buidl` | BlackRock BUIDL | `asset_backed` | High institutional recognition and strong market attention |
| 2 | `backed-bc3m` | Backed bC3M | `asset_backed` | Tokenized ETF / treasury-like exposure with clear RWA relevance |
| 3 | `hashnote-usyc` | Hashnote USYC | `asset_backed` | Large tokenized Treasury / yield-bearing product |
| 4 | `tether-xaut` | Tether Gold XAUT | `commodity_backed` | Commodity-backed comparison asset for PAXG |
| 5 | `wisdomtree-wtgxx` | WisdomTree Government Money Market Digital Fund | `asset_backed` | Regulated fund-style RWA example |

---

### Priority B — Credit Pool / Private Credit Assets

These help Nexus cover non-Treasury RWA.

| Priority | Slug | Asset | Suggested Profile | Reason |
|---:|---|---|---|---|
| 1 | `centrifuge-drop` | Centrifuge DROP-style pool token | `credit_pool` | Complements CFG by covering actual credit-pool exposure |
| 2 | `goldfinch-pool` | Goldfinch credit pool | `credit_pool` | Private credit RWA exposure |
| 3 | `maple-high-yield-secured` | Maple credit pool variant | `credit_pool` | Expands Maple beyond mUSDC baseline |
| 4 | `credix-credit-pool` | Credix pool | `credit_pool` | Emerging-market private credit angle |

---

### Priority C — RWA Protocol / Infrastructure Tokens

These should be clearly separated from direct RWA claim tokens.

| Priority | Slug | Asset | Suggested Profile | Reason |
|---:|---|---|---|---|
| 1 | `goldfinch-gfi` | Goldfinch GFI | `governance_protocol` | RWA protocol/governance token |
| 2 | `clearpool-cpool` | Clearpool CPOOL | `governance_protocol` | RWA lending protocol token |
| 3 | `truefi-tru` | TrueFi TRU | `governance_protocol` | Credit protocol utility/governance token |
| 4 | `centrifuge-cfg-refresh` | CFG source refresh | `governance_protocol` | Improve CFG liquidity, holder, audit, and tokenomics data |

---

## 4. Recommended Next Asset: BlackRock BUIDL

Suggested first asset after restructuring:

```text
blackrock-buidl
```

Why:

- Strong institutional signal.
- Good test case for `asset_backed` profile.
- Useful benchmark against BENJI, USTB, OUSG, and USDY.
- Likely to improve Nexus RWA positioning as an institutional-grade dataset.

Initial classification proposal:

```json
{
  "assetClass": "tokenized_treasury",
  "instrumentType": "fund_share_token",
  "claimType": "fund_share_claim",
  "gradingProfile": "asset_backed",
  "publicSegment": "RWA Assets",
  "reserveApplicability": "available",
  "custodyApplicability": "available",
  "redemptionApplicability": "available",
  "proofOfReservesApplicability": "missing",
  "classificationNote": "BUIDL should be treated as a tokenized fund/share-style Treasury or money-market-like RWA exposure. It should be graded with the asset_backed profile because legal structure, fund holdings, custody, reporting, and redemption evidence are central."
}
```

Before finalizing BUIDL, verify:

- official product page
- issuer / fund entity
- legal structure
- SEC or regulatory filing if available
- transfer agent / administrator / custodian
- fund holdings or reserve report
- blockchain deployments and contract addresses
- redemption mechanics
- investor eligibility
- AUM / market data
- source trail

---

## 5. Asset Addition Checklist

For each new asset:

- [ ] choose slug
- [ ] write classification proposal
- [ ] confirm grading profile
- [ ] determine applicability
- [ ] create `source-discovery.md`
- [ ] create 10 layer JSON files
- [ ] fill `institutional.metadata.classification`
- [ ] fill source-backed fields only
- [ ] create `sources.json`
- [ ] create evidence-based `risk.json`
- [ ] run classification validator
- [ ] run API build
- [ ] import asset
- [ ] save `grade-baseline.json`
- [ ] verify frontend grade context
- [ ] commit and push

---

## 6. Guardrails

Do not:

- add direct reserve fields to governance/protocol tokens
- treat missing and not-applicable as the same thing
- classify protocol tokens as direct RWA claim tokens
- raise grades just because an asset is famous
- rely on aggregator data when official sources exist
- publish an asset without grade profile context

Always:

- show `gradeContext`
- preserve data gaps
- keep sources auditable
- use conservative risk scoring when evidence is incomplete
- validate classification before import
