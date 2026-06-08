# Source Discovery — Centrifuge CFG

## Primary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| identity / institutional | Centrifuge official website | https://centrifuge.io/ | Tier 1 | Official Centrifuge website. Describes Centrifuge as infrastructure for onchain asset management and tokenized real-world assets. |
| identity / governance / tokenomics | Centrifuge docs — The CFG Token | https://docs.centrifuge.io/getting-started/token-summary/ | Tier 1 | Official tokenomics, V3 CFG migration, V3 token contract, supply, allocation, and emissions reference. |
| governance / institutional | Centrifuge docs — Governance | https://docs.centrifuge.io/getting-started/cfg-governance/ | Tier 1 | Official governance structure; active DAO governance paused and supervision shifted to Centrifuge Network Foundation. |
| blockchain | Etherscan — V3 CFG token | https://etherscan.io/token/0xcccCCCcCCC33D538DBC2EE4fEab0a7A1FF4e8A94 | Tier 1 | Official docs link to this V3 CFG contract. Use this instead of the deprecated legacy/wCFG address. |
| market / TVL | DeFiLlama — Centrifuge | https://defillama.com/protocol/centrifuge | Tier 2 | Protocol-level TVL, chain breakdown, fees/revenue, average APY, active loans, and token liquidity metrics. |
| market / token liquidity | CoinGecko — Centrifuge CFG | https://www.coingecko.com/en/coins/centrifuge | Tier 2 | Current token price, market cap, volume, circulating supply, exchange markets, API ID, and migration notice. |

## Secondary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| source code / development | Centrifuge GitHub | https://github.com/centrifuge | Tier 2 | Open-source development reference. Needs exact contract repository mapping before using for smart-contract risk scoring. |
| governance proposals | Centrifuge governance proposals | https://github.com/centrifuge/cps | Tier 2 | Official proposal repository referenced by Centrifuge docs for CP149, CP141, and CP171. |
| foundation | Centrifuge Network Foundation | https://www.centrifuge.foundation | Tier 2 | Transparency and governance follow-up reference mentioned in the official docs. |

## Data Gaps

- No public legal opinion URL found for CFG as a token.
- No public on-chain proof-of-reserves oracle found; CFG is a governance/protocol token, not a direct asset-backed claim token.
- No issuer-level SEC/EDGAR filing mapped for CFG.
- No independent token-specific smart-contract audit URL mapped yet; Centrifuge docs mention platform audits, but this needs exact report mapping before raising smartContractRisk.
- Official docs state total supply as of June 2026, while market aggregators may show different total supply figures. Treat this as a source conflict and prefer official docs for tokenomics narrative.
- Current holder concentration / top-wallet distribution is not yet mapped beyond holder count from Etherscan.

## Notes for Analyst

- Existing Prisma seed uses deprecated CFG/wCFG address `0xA1c931D64dBA96fa7393F896faC34f6d18515e4C`; replace with V3 CFG contract `0xcccCCCcCCC33D538DBC2EE4fEab0a7A1FF4e8A94`.
- Classify this asset as a protocol governance / RWA infrastructure token, not a tokenized credit note, fund share, or reserve-backed RWA.
- `reserve.json` should stay mostly `null` because CFG does not represent a direct claim on reserves, collateral, or redemption assets.
- `yield.json` should not use Centrifuge pool APYs as CFG token yield. Protocol/pool yields and governance-token holder yield are different.
- Do not create `grade-baseline.json` until `npm run import:asset -- centrifuge-cfg` has been run and grading output is captured.
