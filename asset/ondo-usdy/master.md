---
asset_id: ondo-usdy
asset_name: Ondo USDY
symbol: USDY

category:
  primary: tokenized_treasury
  secondary: yield_bearing_stablecoin

issuer:
  name: Ondo Finance
  legal_entity: Ondo USDY LLC
  jurisdiction: United States

chains:
  - Ethereum
  - Solana
  - Aptos
  - Sui

status:
  verification_level: partial_verified
  last_updated: 2026-05-29
  reviewer: manual_research

confidence:
  overall: high
---

# ASSET OVERVIEW

## Summary
USDY is a tokenized US Treasury-backed yield-bearing asset issued by Ondo Finance.

## Key Notes
- Non-US product focus
- Treasury-backed
- Bankruptcy remote structure
- KYC onboarding required

---

# LAYER 1 — IDENTITY

## Core Identity

| Field | Value |
|---|---|
| Issuer | Ondo Finance |
| Legal Entity | Ondo USDY LLC |
| Category | Tokenized Treasury |
| Website | https://ondo.finance |
| Documentation | https://docs.ondo.finance |

---

## Supported Chains

| Chain | Contract | Verified |
|---|---|---|
| Ethereum | 0x... | yes |
| Solana | ... | yes |
| Aptos | ... | pending |

---

## Source Links

### Official
- https://ondo.finance/usdy
- https://docs.ondo.finance

### Verification
- https://defillama.com
- https://rwa.xyz

---

## Notes
- Multi-chain deployment
- Transfer restriction exists
- Allowlist system implemented

---

## Confidence

| Item | Level | Reason |
|---|---|---|
| Issuer | very_high | Official source |
| Contracts | high | Explorer verified |
| Chain data | high | Cross-validated |

---

## Unresolved Questions
- Exact Aptos deployment verification pending
- Final bridge architecture unclear

---

# LAYER 2 — RESERVE

## Reserve Structure

| Field | Value |
|---|---|
| Backing Asset | US Treasuries |
| Additional Backing | Bank deposits |
| Custodian | Pending verification |
| Structure | Bankruptcy remote SPV |

---

## Attestation

| Provider | Frequency | Public |
|---|---|---|
| Pending | Monthly | Partial |

---

## Source Links

### Official
- https://docs.ondo.finance/usdy/trust-and-security

### Secondary
- https://rwa.xyz
- https://defillama.com

---

## Notes
- Treasury maturity ladder not fully disclosed
- Reserve composition may vary

---

## Confidence

| Item | Level | Reason |
|---|---|---|
| Treasury backing | very_high | Official documentation |
| Custodian identity | medium | Secondary references only |
| Attestation quality | medium | Limited disclosures |

---

## Unresolved Questions
- Exact custodian legal entity
- Independent reserve auditor
- Intraday liquidity coverage

---

# LAYER 3 — MARKET

## Market Metrics

| Metric | Value | Date |
|---|---|---|
| TVL | $XXX | YYYY-MM-DD |
| APY | X% | YYYY-MM-DD |
| Circulating Supply | XXX | YYYY-MM-DD |

---

## Liquidity

| Venue | Pair | Liquidity |
|---|---|---|
| Curve | USDY/USDC | High |
| Orca | USDY/USDC | Medium |

---

## Integrations
- Flux Finance
- Lending protocols
- Treasury management protocols

---

## Source Links
- https://defillama.com
- https://rwa.xyz

---

## Notes
- Liquidity fragmented across chains
- Yield fluctuates with treasury rates

---

## Confidence

| Item | Level | Reason |
|---|---|---|
| TVL | high | DefiLlama verified |
| APY | medium | Dynamic yield |
| Liquidity depth | medium | Changes rapidly |

---

## Unresolved Questions
- Real redemption liquidity
- Institutional OTC volume
- Market maker concentration

---

# LAYER 4 — LEGAL

## Jurisdiction

| Item | Value |
|---|---|
| Issuer Country | United States |
| Legal Structure | LLC |
| Investor Restriction | Non-US focus |

---

## Compliance

| Requirement | Status |
|---|---|
| KYC | Required |
| AML | Required |
| Sanctions Screening | Enabled |

---

## Regulatory Notes
- Potential securities classification risk
- Reg S style distribution model
- Restricted transfer model

---

## Source Links

### Official
- https://docs.ondo.finance/general-access-products/usdy/important-notes

---

## Confidence

| Item | Level | Reason |
|---|---|---|
| KYC requirement | very_high | Official docs |
| Regulatory classification | medium | Interpretation dependent |

---

## Unresolved Questions
- EU regulatory treatment
- Asian jurisdiction classification
- Future SEC interpretation

---

# FINAL RISK SUMMARY

| Risk Category | Level |
|---|---|
| Smart Contract | Medium |
| Custodial | Medium |
| Regulatory | High |
| Liquidity | Medium |

---

# FINAL ANALYST NOTES

## Key Strengths
- Strong issuer branding
- Institutional-grade structure
- Treasury-backed yield

## Key Risks
- Regulatory uncertainty
- Centralized reserve dependency
- Redemption opacity

---

# RAW RESEARCH REFERENCES

## PDFs
- reserve_report_may_2026.pdf
- attestation_april_2026.pdf

## Articles
- ...

## Explorer Links
- ...

## Screenshots
- ...
