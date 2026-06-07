# Source Discovery — Maple Cash Management Pool (USDC) / MPLcashUSDC

## Primary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| identity / reserve / yield / liquidity / institutional | Maple Cash Management Pool official docs | https://docs.maple.finance/cash-management-pool/overview | Tier 1 | Official product mechanics: Treasury-bill strategy, Room40 borrower SPV, SOFR target, withdrawal timing. |
| identity / institutional | Maple official website | https://maple.finance | Tier 1 | Official Maple platform site and institutional product context. |
| institutional / compliance | Cash Management Pool Terms & Conditions | https://downloads.eth.maple.finance/docs/legal/abe08ded-5d07-42cf-b435-a0d8d8156ca5/Cash_Mngt_T%26C.pdf | Tier 1 | Legal terms URL linked from Maple docs; must be manually reviewed before production-grade publication. |
| blockchain | Etherscan Ethereum token page | https://etherscan.io/token/0xfe119e9C24ab79F1bDd5dd884B86Ceea2eE75D92 | Tier 1 | Ethereum MPLcashUSDC token contract and verification reference. |
| blockchain | BaseScan Base token page | https://basescan.org/token/0xdd5bb9acf5e02089735a33344c6e3a8bb0d4075d | Tier 1 | Base MPLcashUSDC token contract reference; verification status still needs manual confirmation. |

## Secondary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| identity / market / blockchain / compliance / institutional | RWA.xyz asset page | https://app.rwa.xyz/assets/MPLcashUSDC | Tier 2 | Market values, token supply, holder count, token addresses, fee fields, minimum investment, issuer/regulatory summary. |
| reserve / institutional | J.P. Morgan official site | https://www.jpmorgan.com | Tier 2 | Custodian identity context only; RWA.xyz is the direct source for the custodian field captured in this dataset. |
| reserve / institutional | StoneX official site | https://www.stonex.com/en-us/business/securities/ | Tier 2 | Traditional broker context; RWA.xyz lists StoneX as traditional broker. |

## Data Gaps

- No public legal opinion URL found.
- No public on-chain proof-of-reserves oracle found.
- No public independent reserve audit / attestation found.
- No detailed official reserveBreakdown found.
- No current 7D/30D APY for MPLcashUSDC captured from RWA.xyz at check time.
- No reliable TVL, marketCap, 24h volume, bid/ask spread, or DEX liquidity captured.
- BaseScan verification status needs manual confirmation because the page did not parse reliably during this update.

## Notes for Analyst

- Treat this as **research-grade** until live market/yield and reserve/audit evidence improves.
- Do not treat Maple official docs or RWA.xyz market fields as on-chain proof-of-reserves.
- Keep `aumUsd` as `null` because RWA.xyz displays `$< 0.001`, which is not a valid numeric import value.
- `minimumInvestment` is stored as `100000` from RWA.xyz primary-market terms; `minRedemptionAmount` remains `null` because a minimum redemption amount was not found.
