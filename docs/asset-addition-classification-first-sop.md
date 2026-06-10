# Nexus RWA Asset Addition SOP — Classification-First Workflow

## Status

Active SOP for adding new assets to Nexus RWA after the classification and grading-profile restructuring.

Use this document together with:

- `docs/rwa-classification-standard.md`
- `rwa-asset-onboarding-guide.md`
- `api/src/scripts/validate-classification.ts`

---

## 1. Core Rule

Every new asset must be classified **before** layer research begins.

Do not start from reserve, market, or grading.

Start from:

```text
slug → assetClass → instrumentType → claimType → gradingProfile → field applicability
```

Then continue to source discovery and layer research.

This prevents protocol/governance tokens from being graded like direct asset-backed RWA claim tokens, and prevents direct RWA claim tokens from bypassing reserve/legal/custody requirements.

---

## 2. Target Output

A completed asset must end with:

```text
data/assets/{slug}/identity.json
data/assets/{slug}/market.json
data/assets/{slug}/risk.json
data/assets/{slug}/reserve.json
data/assets/{slug}/yield.json
data/assets/{slug}/institutional.json
data/assets/{slug}/blockchain.json
data/assets/{slug}/compliance.json
data/assets/{slug}/liquidity.json
data/assets/{slug}/sources.json
data/assets/{slug}/grade-baseline.json
```

The asset must also pass:

```bash
cd api
npm run validate:classification -- --slug={slug}
npm run build
npm run import:asset -- {slug}
```

---

## 3. Step-by-Step Workflow

### Step 1 — Determine Slug

Use a stable lowercase slug.

Examples:

```text
franklin-benji
ondo-ousg
ondo-usdy
superstate-ustb
paxos-paxg
maple-musdc
centrifuge-cfg
```

Rules:

- lowercase only
- use `-`, not spaces
- keep it short and stable
- do not rename after import unless necessary

---

### Step 2 — Determine Classification

Before research layers, decide:

```text
assetClass
instrumentType
claimType
gradingProfile
publicSegment
```

Allowed values are defined in:

```text
docs/rwa-classification-standard.md
```

#### Quick Mapping Guide

| Asset Type | assetClass | instrumentType | claimType | gradingProfile | publicSegment |
|---|---|---|---|---|---|
| Tokenized Treasury fund | `tokenized_treasury` | `fund_share_token` | `fund_share_claim` | `asset_backed` | `RWA Assets` |
| Tokenized Treasury note | `tokenized_treasury` | `yield_bearing_note` | `debt_or_note_claim` | `asset_backed` | `RWA Assets` |
| Gold-backed token | `tokenized_commodity` | `commodity_backed_token` | `commodity_redemption_claim` | `commodity_backed` | `RWA Assets` |
| Private credit pool | `tokenized_credit` | `pool_token` | `pool_or_tranche_exposure` | `credit_pool` | `RWA Credit Pools` |
| Tranche token | `tokenized_credit` | `tranche_token` | `pool_or_tranche_exposure` | `credit_pool` | `RWA Credit Pools` |
| Governance/protocol token | `rwa_infrastructure` | `governance_token` | `governance_right` | `governance_protocol` | `RWA Protocols` |
| Protocol utility token | `rwa_infrastructure` | `protocol_token` | `protocol_utility` | `governance_protocol` | `RWA Protocols` |

---

### Step 3 — Determine Applicability

For each asset, classify field applicability:

```text
available
missing
not_applicable
```

Applicability is not the same as evidence quality.

Examples:

```text
PAXG custodian missing = serious problem
CFG custodian missing = not_applicable
BENJI proof-of-reserves missing = warning, because fund reporting may exist but on-chain PoR may not
Maple borrower data missing = credit_pool warning/blocker depending on severity
```

Required applicability fields:

```text
reserveApplicability
custodyApplicability
redemptionApplicability
proofOfReservesApplicability
```

---

### Step 4 — Create Asset Folder

Create:

```text
data/assets/{slug}/
```

Minimum required files:

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
```

`grade-baseline.json` is added after grading/import.

---

### Step 5 — Create `institutional.json` With Classification Block

Every new asset must include:

```json
{
  "issuerName": null,
  "issuerType": null,
  "issuerCountry": null,
  "fundManager": null,
  "legalStructure": null,
  "minimumInvestment": null,
  "managementFee": null,
  "performanceFee": null,
  "fundAdmin": null,
  "transferAgent": null,
  "targetInvestors": null,
  "prospectuUrl": null,
  "metadata": {
    "classification": {
      "assetClass": "tokenized_treasury",
      "instrumentType": "fund_share_token",
      "claimType": "fund_share_claim",
      "gradingProfile": "asset_backed",
      "publicSegment": "RWA Assets",
      "reserveApplicability": "missing",
      "custodyApplicability": "missing",
      "redemptionApplicability": "missing",
      "proofOfReservesApplicability": "missing",
      "classificationNote": "Explain what the token represents and why this grading profile applies."
    },
    "assetClass": "tokenized_treasury",
    "instrumentType": "fund_share_token",
    "claimType": "fund_share_claim",
    "gradingProfile": "asset_backed",
    "publicSegment": "RWA Assets"
  }
}
```

Legacy metadata fields are kept temporarily for backward compatibility:

```json
{
  "assetClass": "...",
  "instrumentType": "...",
  "claimType": "...",
  "gradingProfile": "...",
  "publicSegment": "..."
}
```

The canonical source is still:

```text
metadata.classification
```

---

## 4. Classification Templates

### 4.1 Asset-backed Treasury / Fund / Note

Use for assets like:

- BENJI
- USTB
- OUSG
- USDY
- BUIDL-like products

```json
{
  "classification": {
    "assetClass": "tokenized_treasury",
    "instrumentType": "fund_share_token",
    "claimType": "fund_share_claim",
    "gradingProfile": "asset_backed",
    "publicSegment": "RWA Assets",
    "reserveApplicability": "available",
    "custodyApplicability": "available",
    "redemptionApplicability": "available",
    "proofOfReservesApplicability": "missing",
    "classificationNote": "This token represents a fund/share-style Treasury RWA exposure. It should be graded with the asset_backed profile because legal structure, backing, custody, reporting, and redemption evidence are central."
  }
}
```

For note-style products, use:

```json
{
  "instrumentType": "yield_bearing_note",
  "claimType": "debt_or_note_claim"
}
```

---

### 4.2 Commodity-backed Token

Use for assets like:

- PAXG
- XAUT

```json
{
  "classification": {
    "assetClass": "tokenized_commodity",
    "instrumentType": "commodity_backed_token",
    "claimType": "commodity_redemption_claim",
    "gradingProfile": "commodity_backed",
    "publicSegment": "RWA Assets",
    "reserveApplicability": "available",
    "custodyApplicability": "available",
    "redemptionApplicability": "available",
    "proofOfReservesApplicability": "missing",
    "classificationNote": "This token is backed by a commodity reserve. It should be graded with the commodity_backed profile because custody, vaulting, reserve attestation, and redemption evidence are central."
  }
}
```

---

### 4.3 Credit Pool / Private Credit

Use for assets like:

- Maple pool tokens
- Centrifuge DROP/TIN-like structures
- Goldfinch pools
- receivables-backed pools

```json
{
  "classification": {
    "assetClass": "tokenized_credit",
    "instrumentType": "pool_token",
    "claimType": "pool_or_tranche_exposure",
    "gradingProfile": "credit_pool",
    "publicSegment": "RWA Credit Pools",
    "reserveApplicability": "available",
    "custodyApplicability": "missing",
    "redemptionApplicability": "available",
    "proofOfReservesApplicability": "not_applicable",
    "classificationNote": "This token represents exposure to a credit or lending pool. It should be graded with the credit_pool profile where pool composition, borrower/originator evidence, collateral, liquidity terms, and loss history matter more than generic reserve custody fields."
  }
}
```

For tranche tokens, use:

```json
{
  "instrumentType": "tranche_token",
  "claimType": "pool_or_tranche_exposure"
}
```

---

### 4.4 Governance / Protocol Token

Use for assets like:

- CFG
- GFI
- CPOOL
- TRU

```json
{
  "classification": {
    "assetClass": "rwa_infrastructure",
    "instrumentType": "governance_token",
    "claimType": "governance_right",
    "gradingProfile": "governance_protocol",
    "publicSegment": "RWA Protocols",
    "reserveApplicability": "not_applicable",
    "custodyApplicability": "not_applicable",
    "redemptionApplicability": "not_applicable",
    "proofOfReservesApplicability": "not_applicable",
    "classificationNote": "This token is a protocol governance or utility token for an RWA ecosystem. It is not a direct tokenized fund share, loan note, tranche, or reserve-backed instrument."
  }
}
```

Important:

- Do not invent `backingType`.
- Do not invent `custodian`.
- Do not invent `redemptionAsset`.
- Do not claim proof-of-reserves.
- Use protocol, tokenomics, governance, liquidity, adoption, and risk evidence instead.

---

## 5. Source Discovery Prompt

Before filling layers, create:

```text
data/assets/{slug}/source-discovery.md
```

Prompt template:

```text
CONTEXT:
You are a senior RWA source discovery analyst.

ASSET:
[{ASSET_NAME}]

CLASSIFICATION:
assetClass: [{assetClass}]
instrumentType: [{instrumentType}]
claimType: [{claimType}]
gradingProfile: [{gradingProfile}]
publicSegment: [{publicSegment}]

TASK:
Find the strongest official, regulatory, legal, reserve, blockchain, market, yield, liquidity, and risk sources for this asset.

RULES:
- Prefer official issuer/protocol sources first.
- Prefer regulator filings, legal documents, prospectus, attestations, audit reports, and official docs.
- Do not treat aggregator data as primary evidence if official sources exist.
- Do not infer missing fields.
- Mark data gaps explicitly.
- For governance_protocol assets, do not search for direct reserve/custodian/redemption fields as if the token were asset-backed. Search for protocol docs, governance docs, tokenomics, contracts, adoption, TVL/AUM, audits, and liquidity.
- For commodity_backed assets, prioritize custody, vaulting, attestation, and redemption evidence.
- For credit_pool assets, prioritize pool composition, borrower/originator, collateral, loan book, liquidity terms, and loss/default history.

OUTPUT:
Create source-discovery.md with:
1. Classification summary
2. Primary sources table
3. Secondary sources table
4. Field-level data gaps
5. Notes for each layer
```

---

## 6. Layer Research Order

After classification and source discovery, fill layers in this order:

```text
1. identity.json
2. blockchain.json
3. institutional.json
4. compliance.json
5. reserve.json
6. liquidity.json
7. market.json
8. yield.json
9. sources.json
10. risk.json
```

Why this order:

- Identity/blockchain establish what the asset is.
- Institutional/compliance define issuer, legal, and investor access.
- Reserve/liquidity depend on profile applicability.
- Market/yield should be filled only after the asset identity is clear.
- Sources must trace every important non-null field.
- Risk must read all previous layers.

---

## 7. Profile-Specific Research Rules

### 7.1 `asset_backed`

Required evidence:

```text
issuer / fund manager
legal structure
prospectus, legal doc, or regulatory filing
backing type
reserve/collateral description
custodian or custody arrangement
fund report, audit, attestation, or reporting
redemption mechanics
market / yield / holder data
token contract verification
sources audit trail
```

Do not allow asset-backed assets to bypass reserve/legal/custody evidence.

---

### 7.2 `commodity_backed`

Required evidence:

```text
commodity reserve
vault/custodian arrangement
custodian URL
attestation/report/audit
redemption rules
regulator/trust status if applicable
token contract verification
secondary liquidity
```

Commodity-backed assets should be penalized heavily if custody or reserve evidence is weak.

---

### 7.3 `credit_pool`

Required evidence:

```text
pool structure
borrower/originator
loan book or pool composition
collateral type
collateral coverage
maturity profile
default/loss history if available
seniority/tranche structure
redemption/withdrawal terms
yield/performance
smart contract audit or review if available
```

Do not evaluate credit pools only with a generic reserve/custodian lens.

---

### 7.4 `governance_protocol`

Required evidence:

```text
official protocol docs
token contract verification
tokenomics and supply data
governance model
protocol adoption / TVL / AUM / usage metrics
protocol revenue or fees if available
audit/security documentation if available
holder count and concentration
token market liquidity
regulatory/compliance disclosures if available
```

Usually not applicable:

```text
direct backing type
direct custodian
reserve breakdown
redemption asset
proof of reserves
```

---

## 8. Sources Rule

`sources.json` is the audit trail.

Rules:

- Every important non-null field must be source-backed.
- Official sources first.
- Regulator/legal/audit sources are preferred for legal/reserve claims.
- Aggregators are acceptable for market/yield/liquidity support but should not replace official sources.
- Do not include stale or dead links as final evidence.
- If a field cannot be verified, set it to `null` and add a data gap.

Reliability guide:

| Source Type | Reliability Range |
|---|---:|
| Regulator / legal filing | 90-98 |
| Official issuer/protocol docs | 85-95 |
| Official app/dashboard | 80-92 |
| Audit / attestation / reserve report | 85-95 |
| Block explorer | 80-95 |
| Market aggregator | 60-80 |
| Internal analysis | 50-75 |

---

## 9. Risk Layer Rule

`risk.json` must be created last.

Risk must consider:

```text
smartContractRisk
counterpartyRisk
liquidityRisk
regulatoryRisk
marketRisk
concentrationRisk
```

Rules:

- Do not inflate risk score to improve grade.
- Missing audit → conservative smartContractRisk.
- Missing legal docs → conservative regulatory/counterparty risk.
- Missing holders/concentration → conservative concentrationRisk.
- Missing redemption/liquidity → conservative liquidityRisk.
- Missing pool composition for credit_pool → conservative counterparty/market risk.
- Governance/protocol tokens should be assessed on protocol/tokenomics/governance risk, not reserve risk.

---

## 10. Classification Validation

Before import or grading, run:

```bash
cd api
npm run validate:classification -- --slug={slug}
```

For all assets:

```bash
npm run validate:classification -- --all
```

After all assets are migrated:

```bash
npm run validate:classification -- --all --strict
```

The validator checks:

```text
metadata.classification exists
valid assetClass
valid instrumentType
valid claimType
valid gradingProfile
valid publicSegment
valid applicability values
profile consistency
not-applicable vs missing evidence
baseline gradeContext/applicability
```

---

## 11. Import and Grade

After JSON and classification validation pass:

```bash
cd api
npm run build
npm run import:asset -- {slug}
```

The grading output should include:

```json
{
  "gradingProfile": "asset_backed",
  "gradeContext": "Analytics — Asset-backed Profile",
  "profileScores": {},
  "applicability": {}
}
```

For governance/protocol tokens, the output should include:

```json
{
  "reserveScore": null,
  "applicability": {
    "reserve": "not_applicable",
    "custody": "not_applicable",
    "redemption": "not_applicable",
    "proofOfReserves": "not_applicable"
  }
}
```

Note:

The database may still store `reserveScore` as `0` temporarily for Prisma compatibility, but JSON baseline should preserve semantic accuracy with `null` when reserve is not applicable.

---

## 12. Grade Baseline Template

After import/grading, save:

```text
data/assets/{slug}/grade-baseline.json
```

Template:

```json
{
  "slug": "asset-slug",
  "grade": "analytics",
  "score": 80,
  "completenessScore": 90,
  "sourceScore": 85,
  "legalScore": 80,
  "reserveScore": 75,
  "liquidityScore": 70,
  "riskScore": 72,
  "gradingProfile": "asset_backed",
  "assetClass": "tokenized_treasury",
  "instrumentType": "fund_share_token",
  "claimType": "fund_share_claim",
  "publicSegment": "RWA Assets",
  "gradeContext": "Analytics — Asset-backed Profile",
  "profileScores": {
    "completenessScore": 90,
    "sourceScore": 85,
    "legalScore": 80,
    "reserveScore": 75,
    "liquidityScore": 70,
    "riskScore": 72
  },
  "applicability": {
    "reserve": "available",
    "custody": "available",
    "redemption": "available",
    "proofOfReserves": "missing"
  },
  "blockers": [],
  "warnings": [],
  "baselineDate": "YYYY-MM-DD",
  "status": "analytics-grade baseline under asset_backed profile",
  "nextActions": []
}
```

Governance/protocol example:

```json
{
  "slug": "centrifuge-cfg",
  "grade": "analytics",
  "score": 79,
  "reserveScore": null,
  "gradingProfile": "governance_protocol",
  "assetClass": "rwa_infrastructure",
  "instrumentType": "governance_token",
  "claimType": "governance_right",
  "publicSegment": "RWA Protocols",
  "gradeContext": "Analytics — Governance Protocol Profile",
  "applicability": {
    "reserve": "not_applicable",
    "custody": "not_applicable",
    "redemption": "not_applicable",
    "proofOfReserves": "not_applicable"
  }
}
```

---

## 13. Frontend QA

After deploy, check asset detail page.

Required display:

```text
Grade
Grading Profile
Claim Type
Public Segment
Reserve Applicability
```

Examples:

```text
Institutional — Asset-backed Profile
Analytics — Commodity-backed Profile
Research — Credit Pool Profile
Analytics — Governance Protocol Profile
```

For governance/protocol tokens, reserve section must show:

```text
Reserve: N/A
Not applicable for this profile
```

not:

```text
Reserve Score: 0 / 100
```

---

## 14. Final Checklist Before Adding Asset to Production

- [ ] Slug is stable.
- [ ] `metadata.classification` exists.
- [ ] `assetClass` is valid.
- [ ] `instrumentType` is valid.
- [ ] `claimType` is valid.
- [ ] `gradingProfile` is valid.
- [ ] Applicability is explicit.
- [ ] Source discovery completed.
- [ ] All layer JSON files are valid.
- [ ] `sources.json` supports important non-null fields.
- [ ] `risk.json` is evidence-based.
- [ ] `npm run validate:classification -- --slug={slug}` passes.
- [ ] `npm run build` passes.
- [ ] `npm run import:asset -- {slug}` works.
- [ ] `grade-baseline.json` includes `gradeContext`.
- [ ] Frontend displays grade with profile context.

---

## 15. Non-Negotiable Rules

1. Classification comes before research layers.
2. Do not invent reserve/custody/redemption fields.
3. Do not treat not-applicable fields as missing evidence.
4. Do not treat governance/protocol tokens as direct RWA claim tokens.
5. Do not allow direct RWA claim tokens to bypass reserve/legal/custody evidence.
6. Always show grading profile context in public display.
7. Every important non-null field must be source-backed.
8. Risk score must be conservative when evidence is missing.
