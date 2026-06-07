# Source Discovery — Maple USDC Pool / mUSDC

## Primary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| identity / institutional | Maple official website | https://maple.finance | Tier 1 | Official Maple platform site. Exact Maple USDC Pool product page still needs fresh mapping. |
| identity / technical / liquidity | Maple official docs | https://docs.maple.finance | Tier 1 | General Maple protocol documentation. Exact mUSDC pool documentation must be located before production-grade publication. |
| blockchain | Etherscan token page from legacy seed | https://etherscan.io/token/0x36d8c79B4c18D3b39d9aA27C7Fde5f04CeBc9D7 | Tier 1 | Ethereum contract URL from repo seed. Needs direct explorer confirmation and Maple source cross-check. |
| identity / legacy context | Legacy repo master file | asset/maple-usdc-pool/master.md | Internal | Existing repo file identifies `asset_id: maple-musdc`, `asset_name: Maple USDC Pool`, and `symbol: mUSDC`. |
| identity / seed context | Legacy Prisma seed | api/prisma/seed.ts | Internal | Existing rich seed defines `slug: maple-usdc`, name `Maple USDC Pool`, symbol `mUSDC`, category `Credit`, and Ethereum contract. |

## Secondary Sources To Re-map

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| market / yield / liquidity | Maple app | https://app.maple.finance | Tier 2 | Needed for current pool-level TVL, APY, liquidity, withdrawal, and borrower data. |
| market / yield | DeFiLlama | https://defillama.com | Tier 2 | Need exact Maple pool mapping before using metrics. |
| market / identity | RWA.xyz | https://rwa.xyz | Tier 2 | Need exact mUSDC / Maple USDC Pool page, not MPLcashUSDC. |
| analytics | Dune | https://dune.com | Tier 3 | Optional for holder, transfer, and pool activity analysis. |

## Data Gaps

- Exact current Maple USDC Pool / mUSDC source page needs to be located.
- Do not reuse `https://app.rwa.xyz/assets/MPLcashUSDC`; that is Maple Cash Management Pool, not mUSDC.
- Current TVL, APY, holder count, token supply, transfer volume, and on-chain liquidity are not verified after correction.
- Current borrower roster, pool delegate, loan maturity profile, and concentration are not verified.
- No public legal opinion URL mapped.
- No public proof-of-reserves oracle mapped.
- No current reserve breakdown or independent audit/report URL mapped.
- Ethereum contract address from legacy seed needs direct verification against Maple official app/docs.

## Notes for Analyst

- This folder `data/assets/maple-musdc/` now represents **Maple USDC Pool / mUSDC**.
- The previous update accidentally used **Maple Cash Management Pool / MPLcashUSDC** data and has been removed from active layer JSONs.
- Keep market/yield fields conservative/null until the exact mUSDC source mapping is verified.
- Do not create a new grade baseline until `npm run import:asset -- maple-musdc` is rerun against the corrected data.
