---
asset_id: maple-musdc
asset_name: Maple USDC Pool
symbol: mUSDC

aliases:
  - mUSDC
  - Maple Cash Management Pool
  - Maple Institutional USDC Pool

category:
  primary: private_credit
  secondary: institutional_cash_management

issuer:
  name: Maple Finance
  legal_entity: Maple Finance Group
  jurisdiction: Cayman Islands

protocol:
  name: Maple Finance
  website: https://maple.finance

pool:
  structure: institutional_credit_pool
  denomination: USDC
  yield_source:
    - institutional lending
    - treasury management
    - short-duration credit exposure

status:
  verification_level: pending_review
  research_stage: deep_research
  last_updated: YYYY-MM-DD
  reviewer: analyst_name

links:
  website: https://maple.finance
  docs: https://docs.maple.finance
  app: https://app.maple.finance
  governance: https://maple.finance/governance
  analytics: https://dune.com
  rwa_market: https://rwa.xyz

confidence:
  overall: medium_high

tags:
  - rwa
  - private-credit
  - institutional-lending
  - cash-management
  - musdc
  - yield-bearing
---

# ASSET OVERVIEW

## Summary

mUSDC is a yield-bearing institutional USDC pool operated by Maple Finance, designed to provide onchain access to institutional credit and cash management strategies. Deposited USDC is deployed into curated lending opportunities and treasury management structures to generate yield for pool participants.

---

## Key Notes

- Institutional-grade lending pool
- USDC-denominated yield product
- Credit-based yield generation
- Pool delegate underwriting model
- Combination of onchain and offchain risk management
- Redemption dependent on liquidity conditions

---

## Quick Classification

| Item | Value |
|---|---|
| Asset Type | Institutional Credit Pool |
| Underlying | Institutional Loans & Cash Strategies |
| Yield Bearing | yes |
| Redemption | Conditional |
| Investor Type | Institutional / Qualified |
| Structure | Lending Pool |
| Risk Type | Credit Exposure |

---

# LAYER 1 — IDENTITY

# Core Identity

## Issuer Information

| Field | Value |
|---|---|
| Protocol | Maple Finance |
| Legal Entity | Maple Finance Group |
| Jurisdiction | Cayman Islands |
| Website | https://maple.finance |
| Documentation | https://docs.maple.finance |

---

## Asset Metadata

| Field | Value |
|---|---|
| Asset Name | Maple USDC Pool |
| Symbol | mUSDC |
| Category | Private Credit |
| Subcategory | Institutional Cash Management |
| Denomination | USDC |
| Launch Date | TBD |

---

## Supported Chains

| Chain | Status | Notes |
|---|---|---|
| Ethereum | active | primary deployment |
| Base | active/pending | verify |
| Solana | pending | verify |

---

## Smart Contract Architecture

| Component | Status |
|---|---|
| Pool Contracts | yes |
| Withdrawal Queue | yes |
| Upgradeable Contracts | TBD |
| Permissioned Access | yes/no |
| Pool Delegate Controls | yes |
| Emergency Pause | TBD |

---

## Protocol Roles

| Role | Function |
|---|---|
| Pool Delegate | Underwriting & liquidity management |
| Lenders | Provide capital |
| Borrowers | Institutional loan recipients |
| Governance | Protocol oversight |

---

## Technical Notes

- Yield generated from institutional borrowing demand
- Pool liquidity dependent on loan maturity profile
- Smart contracts handle accounting and settlement
- Risk management partially offchain

---

## Source Links

### Official Sources
- https://maple.finance
- https://docs.maple.finance

### Technical Sources
- https://github.com/maple-labs
- https://etherscan.io

### Analytics Sources
- https://rwa.xyz
- https://defillama.com
- https://dune.com

---

## Confidence

| Item | Level | Reason |
|---|---|---|
| Protocol identity | high | Official documentation |
| Smart contract deployment | high | Onchain verification |
| Multi-chain deployment | medium | Partial verification |

---

## Unresolved Questions

- Exact upgrade authority structure
- Cross-chain liquidity architecture
- Emergency admin powers
- Offchain servicing arrangements

---

# LAYER 2 — RESERVE

# Reserve Structure

## Backing Information

| Field | Value |
|---|---|
| Backing Type | Institutional Credit Exposure |
| Reserve Asset | USDC |
| Primary Assets | Loan Receivables |
| Treasury Allocation | possible |
| Custodian | TBD |
| Bankruptcy Remote | partial/unknown |

---

## Credit Structure

| Component | Notes |
|---|---|
| Borrower Type | Institutional |
| Loan Duration | TBD |
| Collateralization | Mixed |
| Yield Source | Borrower interest payments |

---

## Exposure Profile

| Exposure Type | Status |
|---|---|
| Institutional Loans | yes |
| Treasury Management | yes/no |
| Overcollateralized Lending | yes/no |
| Undersecured Credit | possible |

---

## Custody Structure

| Component | Provider |
|---|---|
| Stablecoin Custody | TBD |
| Treasury Banking | TBD |
| Loan Servicing | TBD |

---

## Reserve Verification

| Verification Type | Provider | Frequency |
|---|---|---|
| Onchain Pool Data | Maple Dashboard | Realtime |
| Financial Reporting | Maple | Periodic |
| Audit | External Auditor | Annual |
| Loan Reporting | Partial | Periodic |

---

## Transparency Mechanism

| Feature | Status |
|---|---|
| Onchain Assets | yes |
| Real-time Pool Metrics | yes |
| Loan-level Transparency | partial |
| Borrower Disclosure | limited |
| NAV Reporting | partial |

---

## Source Links

### Official
- https://maple.finance
- https://docs.maple.finance

### Analytics
- https://defillama.com
- https://rwa.xyz

---

## Notes

- Reserve quality depends heavily on borrower quality
- Transparency varies across pool structures
- Loan servicing partially offchain

---

## Confidence

| Item | Level | Reason |
|---|---|---|
| USDC reserve visibility | high | Onchain verification |
| Loan transparency | medium | Partial disclosures |
| Borrower quality visibility | low | Offchain dependency |
| Recovery structure | low | Legal enforcement complexity |

---

## Unresolved Questions

- Exact legal recovery process
- Borrower concentration exposure
- Custody segregation mechanics
- Default waterfall structure
- Cross-border enforceability

---

# LAYER 3 — MARKET

# Market Metrics

## Onchain Metrics

| Metric | Value | Date |
|---|---|---|
| TVL | TBD | YYYY-MM-DD |
| Utilization Rate | TBD | YYYY-MM-DD |
| Active Loans | TBD | YYYY-MM-DD |
| Pool Liquidity | TBD | YYYY-MM-DD |

---

## Yield Metrics

| Metric | Value |
|---|---|
| Current APY | TBD |
| Net Yield | TBD |
| Borrower Interest Rate | TBD |
| Default-adjusted Yield | TBD |

---

## Liquidity

| Feature | Status |
|---|---|
| Instant Redemption | no/partial |
| Withdrawal Queue | yes |
| Secondary Market | limited |
| Lockup Period | possible |

---

## Market Structure

| Component | Notes |
|---|---|
| Liquidity Source | Lender deposits |
| Yield Driver | Borrower demand |
| Redemption Dependency | Loan maturity profile |
| Market Makers | limited |

---

## Borrower Concentration

| Metric | Status |
|---|---|
| Top Borrower Exposure | TBD |
| Sector Diversification | TBD |
| Geographic Exposure | TBD |

---

## Integrations

- DAO treasury management
- Institutional treasury strategies
- Stablecoin yield management
- Onchain cash management

---

## Source Links

### Market Analytics
- https://defillama.com
- https://rwa.xyz
- https://dune.com

### Official
- https://app.maple.finance

---

## Notes

- Liquidity profile differs significantly from stablecoins
- Yields compensate for credit risk exposure
- Utilization rate strongly impacts returns

---

## Confidence

| Item | Level | Reason |
|---|---|---|
| TVL visibility | high | Onchain metrics |
| Yield reporting | medium | Dynamic conditions |
| Credit exposure visibility | medium | Partial transparency |
| Real liquidity | low | Stress uncertainty |

---

## Unresolved Questions

- Institutional withdrawal behavior
- Real borrower concentration
- Secondary market depth
- Redemption performance during stress

---

# LAYER 4 — LEGAL

# Jurisdiction & Legal Structure

## Entity Structure

| Item | Value |
|---|---|
| Jurisdiction | Cayman Islands |
| Legal Structure | Lending protocol + pool entities |
| Regulatory Status | TBD |
| Securities Classification | Possible |

---

## Compliance Requirements

| Requirement | Status |
|---|---|
| KYC | Possible/Required |
| AML | Required |
| Institutional Verification | yes |
| Wallet Screening | partial |

---

## Regulatory Framework

| Area | Notes |
|---|---|
| Lending Regulation | applicable |
| Securities Laws | possible applicability |
| Stablecoin Regulation | relevant |
| Cross-border Lending | relevant |

---

## Legal Documents

| Document | Available |
|---|---|
| Terms of Service | yes |
| Risk Disclosure | yes |
| Pool Agreements | partial |
| Borrower Agreements | limited |

---

## Geographic Restrictions

| Region | Status |
|---|---|
| United States | restricted/partial |
| EU | TBD |
| Offshore Entities | common |

---

## Source Links

### Official Legal Sources
- https://maple.finance
- https://docs.maple.finance

### Regulatory References
- Cayman legal filings
- Pool disclosures
- Lending agreements

---

## Notes

- Credit enforceability central to risk profile
- Offshore lending structures introduce complexity
- Regulatory interpretation still evolving

---

## Confidence

| Item | Level | Reason |
|---|---|---|
| Protocol legality | medium | Jurisdiction dependent |
| Loan enforceability | low | Cross-border complexity |
| Securities classification | low | Unclear regulatory status |

---

## Unresolved Questions

- Default litigation framework
- Securities law interpretation
- Institutional investor protections
- Bankruptcy treatment
- Cross-border enforcement

---

# LAYER 5 — RISK ANALYSIS

# Risk Matrix

| Risk Category | Level | Notes |
|---|---|---|
| Smart Contract Risk | Medium | Onchain infrastructure dependency |
| Credit Risk | High | Institutional borrower exposure |
| Liquidity Risk | High | Withdrawal dependency |
| Regulatory Risk | Medium-High | Lending regulation uncertainty |
| Counterparty Risk | High | Borrower & servicing dependency |
| Stablecoin Risk | Medium | USDC exposure |

---

# Stress Scenarios

## Scenario Analysis

| Scenario | Impact |
|---|---|
| Borrower default | High |
| Mass withdrawals | High |
| USDC depeg | High |
| Regulatory crackdown | Medium-High |
| Smart contract exploit | High |

---

# FINAL ANALYST SUMMARY

# Strengths

- Institutional lending exposure
- Higher yield potential
- Established RWA credit protocol
- Transparent onchain accounting

---

# Weaknesses

- Significant credit risk
- Limited liquidity during stress
- Offchain legal dependency
- Complex recovery mechanics

---

# Research Priorities

1. Analyze borrower concentration
2. Review default history
3. Verify legal enforceability
4. Assess withdrawal liquidity
5. Audit smart contract permissions

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

- pool_terms.pdf
- borrower_risk_framework.pdf
- smart_contract_audit.pdf
- withdrawal_policy.pdf

---

# Explorer Links

- Ethereum:
- Base:
- Etherscan Pool Contract:

---

# Research Articles

- Maple institutional lending analysis
- RWA.xyz pool profile
- Institutional credit market reports

---

# Screenshots

- pool_dashboard.png
- utilization_chart.png
- withdrawal_queue.png

---

# Internal Research Notes

## Manual Verification Tasks

- Verify borrower concentration exposure
- Analyze delegate authority structure
- Confirm custody arrangements
- Review default recovery framework

---

## Pending Deep Research

- Loan underwriting methodology
- Historical default rates
- Legal recovery enforceability
- Stress liquidity mechanics
- Institutional redemption behavior
