# Source Discovery — Hashnote UYSC

Asset slug: `hashnote-uysc`
Asset name: Hashnote UYSC
Symbol: UYSC
Status: source discovery pending

---

## Objective

This document is the initial source-discovery workspace for researching Hashnote UYSC before filling the production JSON layers in Nexus RWA.

Target layers:

- identity
- institutional
- compliance
- reserve
- blockchain
- liquidity
- market
- yield
- risk

---

## Source Priority

1. Hashnote official website, product pages, docs, disclosures, reports, and legal documents
2. Official issuer / fund / manager documents
3. Official token contract explorers
4. Official transparency, reserve, audit, or reporting pages
5. RWA data aggregators such as rwa.xyz or DeFiLlama
6. Reputable financial or crypto media only for context

---

## Primary Sources

| Source | URL | Tier | Supported Layers | Notes |
|---|---|---:|---|---|
| Hashnote official website | TBD | Tier 1 | identity, institutional | To be verified |
| Hashnote product page for UYSC | TBD | Tier 1 | identity, reserve, liquidity, yield | To be verified |
| Official docs / disclosures | TBD | Tier 1 | compliance, institutional, reserve | To be verified |
| Official contract explorer | TBD | Tier 1 | blockchain | Contract address must not be guessed |
| Official fund / reserve report | TBD | Tier 1 | reserve, yield, market | To be verified |

---

## Secondary Sources

| Source | URL | Tier | Supported Layers | Notes |
|---|---|---:|---|---|
| rwa.xyz asset / protocol page | TBD | Tier 2 | market, TVL, AUM, category | Use only after cross-checking official sources |
| DeFiLlama page / API | TBD | Tier 2 | market, TVL | Use only if asset is listed |
| Reputable media coverage | TBD | Tier 3 | context only | Do not use for core factual fields unless no better source exists |

---

## Data Gaps To Resolve

### Identity

- Official full asset name
- Official symbol confirmation
- Official category and subcategory
- Official website URL
- Official docs URL
- Logo URL
- Launch date
- ISIN, if applicable

### Institutional

- Issuer name
- Issuer type
- Issuer country
- Fund manager
- Legal structure
- Minimum investment
- Fees
- Fund administrator
- Transfer agent
- Target investors
- Prospectus / offering document URL

### Compliance

- Regulatory status
- Primary regulator
- Regulatory framework
- KYC requirement
- Accredited / qualified investor restriction
- Blocked and allowed jurisdictions
- Sanctions screening / AML policy
- Legal opinion URL, if publicly available

### Reserve

- Backing type
- Backing description
- Collateralization ratio, only if explicitly published
- Custodian
- Proof-of-reserves status
- Audit / attestation report
- Auditor
- Reserve breakdown
- Redemption asset

### Blockchain

- Supported chains
- Contract addresses
- Token standards
- Transferability
- Whitelist / transfer restrictions
- Explorer URLs
- Deployment dates
- Verified contract status

### Liquidity

- Redemption type
- Redemption period
- Lockup period
- Early redemption fee
- Minimum redemption amount
- DEX pairs, if any
- On-chain liquidity
- Bid-ask spread
- Liquidity score basis

### Market

- TVL
- AUM
- Price
- Market cap
- Volume
- Circulating supply
- Total supply
- Holder count
- Latest update timestamp

### Yield

- Current yield
- Yield type
- Yield frequency
- Yield benchmark
- Historical yield range
- Next yield date
- Yield currency

### Risk

- Smart contract audit evidence
- Counterparty risk evidence
- Liquidity risk evidence
- Regulatory risk evidence
- Market risk evidence
- Concentration risk evidence
- Known blockers or warnings

---

## Analyst Notes

- Do not fill JSON layer fields from memory.
- Do not guess contract addresses.
- Do not infer collateralization ratio unless the source explicitly states it.
- Do not claim proof-of-reserves unless a source explicitly confirms on-chain PoR or a clearly defined PoR mechanism.
- Marketing pages are not legal opinions.
- `risk.json` should be completed after all other layers have source-backed evidence.

---

## Next Actions

1. Verify official Hashnote UYSC product/source URLs.
2. Classify each source by tier and supported layer.
3. Fill `sources.json` as the audit trail.
4. Complete layer JSON files one by one.
5. Run validation/import after all required data is filled.
