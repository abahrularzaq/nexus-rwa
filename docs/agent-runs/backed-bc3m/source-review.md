# Source Verification Review — Backed bC3M

## Review metadata

- Asset: Backed GOVIES 0-6 Months Euro Investment Grade
- Symbol: bC3M
- Slug: `backed-bc3m`
- Branch: `pilot/backed-bc3m-research`
- Initial review date: 2026-06-24
- Recheck date: 2026-06-24
- Agent: Source Verification Agent
- Scope: Independent verification plus narrow recheck of B-001 and RC-001 through RC-003

## Overall verdict

- Verdict: `advance`
- `safeToProceed: true`
- Recommended next action: Proceed to Risk & Grading Agent

The narrow correction package resolves the only blocking source-verification issue. The research package now retains only the independently verified Ethereum deployment, represents unsupported network deployments as unresolved rather than factual, uses `null` for the unsupported whitelist field, and maps the Ethereum address to a verified explorer instead of relying on CoinGecko as multi-chain evidence.

## Recheck findings

### B-001 — Seven unsupported non-Ethereum deployments

- Status: `resolved`
- Result: Gnosis, Polygon, Arbitrum, Avalanche, Fantom, BNB Smart Chain, and Base were removed from `blockchain.json`.
- The issuer's legal page remains recorded only as evidence of Backed's general bToken network scope.
- The removed networks remain visible as unresolved research gaps in `sources.json` and `source-discovery.md`.
- No unsupported product-level contract address remains for those networks.

### RC-001 — Blockchain deployment evidence

- Status: `resolved`
- `blockchain.json` contains one record only: Ethereum.
- Ethereum address: `0x2f123cf3f37ce3328cc9b5b8415f9ec5109b45e7`.
- Etherscan identifies the address as the Backed Finance bC3M token and exposes the bC3M token tracker.
- `isVerified: true` is therefore supported for the Ethereum record.
- No deterministic-address or general-network inference is used for other chains.

### RC-002 — Source map overstatement

- Status: `resolved`
- `sources.json` separates:
  - general issuer-level network scope from the Backed legal page;
  - product-level Ethereum deployment evidence from Etherscan;
  - unresolved non-Ethereum networks.
- CoinGecko is no longer used as final evidence for any contract deployment.
- CoinGecko remains limited to market observations.

### RC-003 — Unsupported whitelist value

- Status: `resolved`
- `hasWhitelist` is now `null`.
- The package no longer treats absence of technical transfer restrictions as proof that all whitelist or administrative eligibility logic is absent.

## Verified package findings

### Identity and structure

- Name, symbol, product ISIN, issuer, tracker-certificate structure, underlying ETF, and underlying ISIN are supported by the official product page.
- The reserve description correctly refers to Eurozone government-bill ETF exposure rather than U.S. Treasury backing.

### Issuance, redemption, and fee

- The bC3M product page displays the no-new-issuance notice.
- Redemption remains supported for existing holders.
- The official 0.5% figure is correctly represented as an issuance/redemption fee rather than an early-redemption penalty.
- Settlement time, minimum amount, settlement asset, and gating terms remain `null` because they were not verified.

### Legal and compliance

- The current issuer-level Base Prospectus is described as approved by the Liechtenstein FMA on 2026-05-08 and valid until 2027-05-07, subject to supplements.
- Swiss-law tracker-certificate wording is supported.
- U.S. exclusion and professional/qualified-investor access language are supported.
- The UK wording is correctly treated as conditional rather than an unconditional country block.
- Operational KYC and sanctions-screening fields remain `null` because the accessible evidence does not describe the specific controls.

### Reserve and service providers

- Custodian and broker names are explicitly listed by the issuer.
- No collateral ratio, reserve breakdown, reserve audit, attestation, auditor, redemption asset, or proof-of-reserves mechanism is claimed without evidence.

### Market and yield

- CoinGecko market values are clearly labeled as secondary, low-confidence, and last-recorded rather than active-market values.
- Market capitalization is not represented as AUM.
- No unsupported current yield is reported.

## Remaining non-blocking warnings

### W-001 — Product-specific legal documentation gap

A current bC3M-specific final terms document was not located, and the English KID link returned 404. The issuer-level prospectus supports the general framework but is not complete product-specific evidence.

### W-002 — Product page freshness

The live issuance/redemption notice is visible, but the product page carries a 2025-05-30 last-updated label. The package appropriately records the 2026-06-24 verification date without implying all underlying product details were refreshed in 2026.

### W-003 — Custodian evidence source concentration

Custodian relationships are supported by the issuer's product page but were not independently confirmed through service-provider documentation.

### W-004 — Inactive market data

The displayed price and market capitalization are last-recorded secondary-source values with zero active 24-hour trading volume. They must not be interpreted as executable price, NAV, AUM, redemption value, or active liquidity.

### W-005 — Incomplete redemption mechanics

The right to redeem is supported, but settlement and operational details remain unavailable.

### W-006 — Other network deployments unresolved

Backed generally lists seven additional EVM networks within its bToken scope. No product-level bC3M deployment is currently represented for them. They may be added later only with chain-specific evidence.

## Layer verdicts after recheck

| Layer | Verdict | Notes |
|---|---|---|
| Identity | pass | Core identity and description supported |
| Blockchain | pass with warning | Ethereum verified; seven other networks remain unresolved and omitted |
| Reserve | pass with warning | Conservative wording; no unsupported PoR or ratio |
| Institutional | pass with warning | Issuer and structure supported; product-specific legal document missing |
| Compliance | pass with warning | Eligibility wording is conservative and conflicts are visible |
| Liquidity | pass with warning | Redemption supported; mechanics incomplete |
| Market | pass with warning | Secondary last-recorded values are transparently labeled |
| Yield | pass | No unsupported current yield |
| Sources | pass | Product-level, issuer-level, unresolved, and secondary evidence are separated |

## Source quality assessment

- Strong official coverage exists for identity, issuer, underlying, legal framework, service-provider listing, eligibility, and issuance/redemption status.
- Ethereum contract evidence is independently verified.
- Product-specific legal, reserve-reporting, and active-market evidence remain incomplete but are represented honestly.
- Recommended source-score range for the later grading agent: `72–78`.
- This recommendation is not a grade and should be evaluated alongside the grading model.

## Final decision

```text
safeToProceed: true
verdict: advance
B-001: resolved
RC-001: resolved
RC-002: resolved
RC-003: resolved
```

The package is sufficiently honest and traceable to proceed to Risk & Grading. The remaining issues are explicit non-blocking warnings and must remain visible in blockers, warnings, and next actions generated by the grading stage.
