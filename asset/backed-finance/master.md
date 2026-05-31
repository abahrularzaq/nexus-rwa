---
asset_id: backed-bc3m
asset_name: Backed Coinbase 3M Treasury Bond ETF
symbol: bC3M

aliases:
  - bC3M
  - Backed C3M
  - Backed Treasury ETF Token

category:
  primary: tokenized_etf
  secondary: tokenized_treasury_etf

issuer:
  name: Backed Finance
  legal_entity: Backed Assets GmbH
  jurisdiction: Switzerland

fund:
  underlying_etf:
    name: Coinbase 3M Treasury Bond ETF
    isin: TBD
    issuer: TBD
  structure: tokenized_security

protocol:
  name: Backed Finance
  website: https://backed.fi

status:
  verification_level: pending_review
  research_stage: deep_research
  last_updated: YYYY-MM-DD
  reviewer: analyst_name

links:
  website: https://backed.fi
  docs: https://docs.backed.fi
  legal: https://backed.fi/legal
  transparency: https://backed.fi/transparency
  rwa_market: https://rwa.xyz

confidence:
  overall: medium_high

tags:
  - rwa
  - tokenized-etf
  - treasury-etf
  - short-duration-treasury
  - backed-finance
  - btoken
---

# ASSET OVERVIEW

## Summary

bC3M is a tokenized ETF product issued by Backed Finance that provides blockchain-based exposure to short-duration U.S. Treasury bond instruments through a regulated tokenized security structure. The token represents ownership exposure to an underlying treasury-focused ETF.

---

## Key Notes

- Tokenized ETF structure
- Backed 1:1 by underlying ETF shares
- Treasury-focused yield exposure
- Swiss-regulated issuance structure
- ERC-20 compatible tokenized security
- Permissioned compliance controls possible

---

## Quick Classification

| Item | Value |
|---|---|
| Asset Type | Tokenized ETF |
| Underlying | Treasury Bond ETF |
| Yield Bearing | yes |
| Redemption | Conditional |
| Investor Type | Eligible / Qualified |
| Structure | Tokenized Security |
| NAV Exposure | ETF-based |

---

# LAYER 1 — IDENTITY

# Core Identity

## Issuer Information

| Field | Value |
|---|---|
| Issuer | Backed Finance |
| Legal Entity | Backed Assets GmbH |
| Jurisdiction | Switzerland |
| Website | https://backed.fi |
| Documentation | https://docs.backed.fi |

---

## Asset Metadata

| Field | Value |
|---|---|
| Asset Name | Backed Coinbase 3M Treasury Bond ETF |
| Symbol | bC3M |
| Category | Tokenized ETF |
| Subcategory | Treasury Bond ETF |
| Denomination | USD |
| Launch Date | TBD |

---

## Underlying Exposure

| Item | Value |
|---|---|
| Underlying Asset | Treasury Bond ETF |
| ETF Issuer | TBD |
| ISIN | TBD |
| Duration Profile | Short Duration |
| Asset Exposure | U.S. Treasuries |

---

## Supported Chains

| Chain | Status | Notes |
|---|---|---|
| Ethereum | active | verify contract |
| Base | active/pending | verify |
| Polygon | pending | verify |

---

## Smart Contract Architecture

| Component | Status |
|---|---|
| ERC-20 Compatible | yes |
| Allowlist | yes/no |
| Compliance Controls | yes |
| Upgradeable Contracts | TBD |
| Redemption Module | yes |
| Transfer Restriction | possible |

---

## Technical Notes

- Tokenized representation of ETF exposure
- NAV linked to underlying ETF performance
- Redemption dependent on traditional finance settlement
- Permissioned compliance controls may apply

---

## Source Links

### Official Sources
- https://backed.fi
- https://docs.backed.fi

### Technical Sources
- https://github.com/backedfi
- https://etherscan.io

### Market Sources
- https://rwa.xyz
- https://defillama.com

---

## Confidence

| Item | Level | Reason |
|---|---|---|
| Issuer identity | high | Official documentation |
| ETF exposure | medium-high | Public disclosures |
| Smart contract verification | medium | Pending audit review |

---

## Unresolved Questions

- Exact underlying ETF mapping
- Contract upgrade authority
- Cross-chain deployment architecture
- Emergency admin permissions

---

# LAYER 2 — RESERVE

# Reserve Structure

## Backing Information

| Field | Value |
|---|---|
| Backing Type | ETF Share Backing |
| Primary Reserve Asset | Treasury ETF Shares |
| Reserve Currency | USD |
| Custodian | TBD |
| Trustee | TBD |
| Bankruptcy Remote | partial/unknown |

---

## Portfolio Composition

| Asset Type | Allocation |
|---|---|
| Treasury ETF Shares | TBD |
| Cash Buffer | TBD |
| Settlement Assets | TBD |

---

## Custody Structure

| Component | Provider |
|---|---|
| ETF Custodian | TBD |
| Banking Partner | TBD |
| Fund Administrator | TBD |
| Auditor | TBD |

---

## Reserve Verification

| Verification Type | Provider | Frequency |
|---|---|---|
| NAV Reporting | Backed Finance | Daily |
| Attestation | TBD | Monthly |
| Audit | External Auditor | Annual |
| Holdings Disclosure | TBD | Periodic |

---

## Transparency Mechanism

| Feature | Status |
|---|---|
| Daily NAV | yes |
| Reserve Reporting | partial |
| Third-party Audit | yes/no |
| Real-time Holdings | no |
| Public Attestation | partial |

---

## Source Links

### Official
- https://backed.fi/transparency
- https://backed.fi/legal

### Verification
- https://rwa.xyz
- https://defillama.com

---

## Notes

- Reserve structure depends on ETF custody chain
- ETF shares held offchain
- Treasury yield linked to ETF performance

---

## Confidence

| Item | Level | Reason |
|---|---|---|
| ETF reserve backing | high | Official disclosures |
| NAV reporting | medium-high | Public reporting |
| Custodian transparency | medium | Partial detail |
| Real-time reserve visibility | low | Delayed reporting |

---

## Unresolved Questions

- Exact ETF custodian structure
- Segregation mechanics
- Intraday reserve transparency
- Bankruptcy remoteness
- Securities lending exposure

---

# LAYER 3 — MARKET

# Market Metrics

## Onchain Metrics

| Metric | Value | Date |
|---|---|---|
| TVL | TBD | YYYY-MM-DD |
| Market Cap | TBD | YYYY-MM-DD |
| Holders | TBD | YYYY-MM-DD |
| Circulating Supply | TBD | YYYY-MM-DD |

---

## Yield Metrics

| Metric | Value |
|---|---|
| Current Yield | TBD |
| Net Yield | TBD |
| Yield Source | Treasury ETF |
| Distribution Method | NAV Appreciation |

---

## Liquidity

| Feature | Status |
|---|---|
| Instant Redemption | no/partial |
| Secondary Market | limited |
| DEX Trading | possible |
| OTC Liquidity | yes |

---

## Market Structure

| Component | Notes |
|---|---|
| Liquidity Source | ETF reserve backing |
| Yield Driver | Treasury interest rates |
| Redemption Timing | Market-hours dependent |
| Trading Venue | DEX / OTC |

---

## Integrations

- DAO treasury diversification
- Onchain treasury allocation
- Stable reserve management
- Institutional cash strategies

---

## Source Links

### Market Analytics
- https://defillama.com
- https://rwa.xyz

### Official
- https://backed.fi

---

## Notes

- Liquidity profile differs from stablecoins
- ETF market hours affect settlement
- Secondary liquidity may be fragmented

---

## Confidence

| Item | Level | Reason |
|---|---|---|
| TVL visibility | medium-high | Onchain analytics |
| Yield reporting | medium | ETF dependent |
| Secondary liquidity | low | Limited market depth |

---

## Unresolved Questions

- Real redemption liquidity
- Institutional concentration risk
- Cross-chain liquidity fragmentation
- OTC settlement scale

---

# LAYER 4 — LEGAL

# Jurisdiction & Legal Structure

## Entity Structure

| Item | Value |
|---|---|
| Issuer Jurisdiction | Switzerland |
| Legal Structure | GmbH |
| Securities Classification | Likely Security |
| Investor Restrictions | yes |

---

## Compliance Requirements

| Requirement | Status |
|---|---|
| KYC | Required |
| AML | Required |
| Sanctions Screening | Enabled |
| Accredited Investor Rules | TBD |

---

## Regulatory Framework

| Area | Notes |
|---|---|
| Swiss Regulation | applicable |
| Securities Regulation | applicable |
| Tokenized Security Rules | applicable |
| ETF Exposure Regulation | applicable |

---

## Transfer Restrictions

| Restriction | Status |
|---|---|
| Geographic Restrictions | yes |
| Wallet Screening | yes/no |
| Allowlist Enforcement | yes/no |

---

## Legal Documents

| Document | Available |
|---|---|
| Prospectus | yes/no |
| Terms of Service | yes |
| Risk Disclosure | yes |
| Compliance Policies | partial |

---

## Geographic Restrictions

| Region | Status |
|---|---|
| United States | restricted |
| EU | TBD |
| Offshore Users | possible |

---

## Source Links

### Official Legal Sources
- https://backed.fi/legal
- https://docs.backed.fi

### Regulatory References
- Swiss disclosures
- Tokenized security framework

---

## Notes

- Tokenized ETF likely classified as regulated security
- Cross-border offering restrictions apply
- Jurisdictional interpretation varies

---

## Confidence

| Item | Level | Reason |
|---|---|---|
| Swiss structure | high | Official disclosures |
| Securities classification | high | ETF exposure structure |
| Cross-border legality | medium | Jurisdiction dependent |

---

## Unresolved Questions

- MiCA treatment
- U.S. securities implications
- International distribution restrictions
- Bankruptcy treatment
- Secondary trading legality

---

# LAYER 5 — RISK ANALYSIS

# Risk Matrix

| Risk Category | Level | Notes |
|---|---|---|
| Smart Contract Risk | Medium | Blockchain infrastructure dependency |
| Custodial Risk | Medium | ETF custody dependency |
| Regulatory Risk | Medium-High | Tokenized security exposure |
| Liquidity Risk | Medium | Secondary market dependency |
| Counterparty Risk | Medium | Custodian & ETF dependency |
| Interest Rate Risk | Low-Medium | Treasury duration exposure |

---

# Stress Scenarios

## Scenario Analysis

| Scenario | Impact |
|---|---|
| Treasury market shock | Medium |
| ETF liquidity disruption | Medium |
| Smart contract exploit | High |
| Regulatory crackdown | Medium-High |
| Custodian failure | High |

---

# FINAL ANALYST SUMMARY

# Strengths

- Treasury-backed ETF exposure
- Swiss-regulated issuance framework
- Suitable for onchain treasury diversification
- Familiar ETF investment structure

---

# Weaknesses

- Centralized reserve dependency
- Limited real-time reserve transparency
- Regulatory uncertainty
- Redemption dependent on traditional market infrastructure

---

# Research Priorities

1. Verify underlying ETF structure
2. Analyze smart contract permissions
3. Confirm reserve custody chain
4. Review legal prospectus
5. Understand redemption workflow

---

# FINAL CONFIDENCE SCORE

| Layer | Score |
|---|---|
| Identity | TBD |
| Reserve | TBD |
| Market | TBD |
| Legal | TBD |
| Overall | TBD |

---

# RAW RESEARCH REFERENCES

# Official Documents

- prospectus.pdf
- reserve_report.pdf
- attestation.pdf
- compliance_policy.pdf

---

# Explorer Links

- Ethereum:
- Base:
- Polygon:

---

# Research Articles

- Backed Finance analysis
- tokenized ETF market research
- treasury ETF tokenization reports

---

# Screenshots

- dashboard_capture.png
- reserve_reporting.png
- nav_chart.png

---

# Internal Research Notes

## Manual Verification Tasks

- Verify underlying ETF ISIN
- Confirm treasury custodian
- Review smart contract admin roles
- Analyze redemption mechanics

---

## Pending Deep Research

- Bankruptcy remoteness
- ETF securities lending exposure
- Intraday liquidity support
- Cross-chain settlement model
- Regulatory interpretation across jurisdictions
