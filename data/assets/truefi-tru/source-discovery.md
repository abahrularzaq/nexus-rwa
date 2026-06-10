# Source Discovery — TrueFi (TRU)

## Asset Slug

```text
truefi-tru
```

## Current Review Status

Initial scaffold only. TrueFi/TRU requires extra review because the current TrueFi documentation redirects to Brila documentation, and Brila docs describe BrilaRWA as formerly TrueFi. Treat this asset as a legacy / migration-sensitive private-credit RWA protocol until all fields are manually verified.

## Primary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| identity | TrueFi / Brila official site | https://truefi.io/ | Tier 1 | Currently redirects to the TrueFi community forum / Brila ecosystem context. Verify current canonical website before production. |
| identity,institutional,compliance | Brila / TrueFi documentation | https://docs.truefi.io/ | Tier 1 | Redirects to Brila docs. Docs state BrilaRWA was formerly TrueFi and describe protocol scope. |
| governance,compliance | TrueFi community forum | https://forum.truefi.io/ | Tier 1 | Governance proposals, migration discussions, and protocol transition notes. Review TFIP proposals before grading. |
| governance | Snapshot | https://snapshot.org/ | Tier 2 | Verify governance space and current voting history. |
| governance | Tally | https://www.tally.xyz/ | Tier 2 | Verify DAO governance contracts if still active. |
| blockchain | Etherscan token page | https://etherscan.io/token/0x4c19596f5aaff459fa38b0f7ed92f11ae6543784 | Tier 2 | Ethereum TRU token contract. Verify token status and contract verification manually. |
| market | CoinGecko TrueFi page | https://www.coingecko.com/en/coins/truefi | Tier 3 | Market price, supply, exchanges, categories, contract reference. Time-sensitive. |
| market | DeFiLlama protocol / TVL | https://defillama.com/protocol/truefi | Tier 3 | Protocol TVL and historical activity if available. Time-sensitive. |
| market | RWA.xyz | https://app.rwa.xyz/ | Tier 3 | Check whether TrueFi/TRU is tracked as an RWA protocol or asset. |
| security | Immunefi / CER / audit references | https://immunefi.com/ | Tier 3 | Verify current bug bounty or security references. Do not treat third-party security ratings as official audits. |

## Data Gaps To Resolve

- Confirm whether `TRU` should remain in Nexus RWA as a current RWA asset, a legacy RWA protocol token, or be replaced by Brila / BRLA.
- Confirm canonical issuer / protocol entity after TrueFi → Brila transition.
- Confirm whether TRU token remains active, migrated, deprecated, or only legacy governance token.
- Confirm current contract addresses across Ethereum and any other supported chains.
- Confirm whether there are live credit vaults, outstanding loans, or only historical loan activity.
- Confirm current TVL, market cap, circulating supply, volume, and holder count from reliable sources.
- Confirm whether there are public audits, legal documents, risk disclosures, or regulatory frameworks.
- Confirm redemption, liquidity, and token transfer constraints. TRU may be a protocol/governance token, not a tokenized claim on a specific loan pool.

## Import Notes

- Start with conservative nulls where verification is incomplete.
- Do not mark this as institutional-grade unless legal, reserve, and protocol status are verified.
- Do not claim proof-of-reserves.
- Use `risk.json` only after identity, blockchain, market, compliance, and liquidity fields are manually reviewed.

## Last Manual Scaffold

2026-06-10
