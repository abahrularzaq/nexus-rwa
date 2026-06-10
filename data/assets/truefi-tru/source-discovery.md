# Source Discovery — TrueFi (TRU)

## Asset Slug

```text
truefi-tru
```

## Research Status

Deeper source discovery completed on **2026-06-10**.

TrueFi/TRU should be treated as a **migration-sensitive legacy private-credit / uncollateralized-lending protocol token**, not as a clean current institutional RWA asset yet. The most consistent source set shows:

- `truefi.io` redirects to the TrueFi community forum.
- `docs.truefi.io` redirects to Brila documentation.
- Brila documentation describes **BrilaRWA as formerly TrueFi**.
- Governance/forum materials describe a formal transition from **TRU to BRLA**.
- Market and TVL aggregators still track **TrueFi / TRU**, but those figures should be treated as time-sensitive and secondary.

Analyst conclusion for now: keep slug `truefi-tru`, but classify it as a **legacy / transition asset** until the full migration and canonical asset model are resolved.

---

## Primary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| identity, institutional, risk | Brila / TrueFi documentation | https://docs.truefi.io/ | Tier 1 | Redirects to `docs.brila.finance`. States that BrilaRWA was formerly TrueFi and says the protocol has originated more than $1.7bn in loans to more than 30 borrowers, with more than $40mm in interest paid to participants. Use as current canonical docs, but note this is now Brila-branded. |
| identity, institutional, risk | Brila official website | https://brila.finance/ | Tier 1 | Current Brila site. Describes Brila as a DeFi ecosystem with products including Brila RWA, an institutional-grade lending protocol enabling uncollateralized loans backed by real-world assets. Use to understand post-TrueFi operating model. |
| identity, governance, institutional, compliance, risk | TrueFi community forum | https://forum.truefi.io/ | Tier 1 | Main remaining TrueFi-branded public source. `truefi.io` redirects here. Contains migration, governance, legacy loan, and community communications. Must be reviewed for current status before grading. |
| institutional, governance, compliance, risk | TFIP-41: TrueFi Reconstitution and Transition to Brila | https://forum.truefi.io/t/tfip-41-truefi-reconstitution-and-transition-to-brila/2883 | Tier 1 | Core transition proposal. Describes reconstitution of TrueFi into Brila, wind-down of the TrueFi Foundation in the BVI, formation of Panama-based Brila entities, TRU-to-BRLA migration, and sunset of TRU governance. Essential for issuer/legal/status classification. |
| compliance, governance, blockchain, risk | TFIP-42: Timelock Migration to Gnosis Safe Multi-Sig | https://forum.truefi.io/t/tfip-42-timelock-migration-to-gnosis-safe-multi-sig-transition-period/2907 | Tier 1 | Governance/security proposal for transition period. Includes TrueFi Timelock address, Gnosis Safe admin address, 4-of-7 threshold, and notes that TRU is no longer the primary governance token while BRLA becomes the new governance instrument. |
| liquidity, compliance, blockchain, risk | How to Access BRLA: Step-by-Step Guide for TRU Holders | https://forum.truefi.io/t/how-to-access-brla-step-by-step-guide-for-tru-holders/2908 | Tier 1 | Official forum guide explaining TRU holders' access to BRLA through the official access portal. Important details: TRU must be on Ethereum; users swap TRU for BRLA through the portal; requires wallet/gas handling. Use for migration/liquidity notes, not as market pricing. |
| institutional, liquidity, risk | Brila Access Portal Update | https://brila.finance/blog/brila-access-portal-update | Tier 1 | States that the broader participation window concluded, BRLA is independently trading, and original participation ratios/distribution mechanics were finalized. Critical for determining whether TRU is now legacy after the access portal period. |
| compliance, liquidity, governance, risk | Brila Token: Community Questions Answered | https://brila.finance/blog/brila-token-community-questions | Tier 1 | Brila official Q&A covering BRLA, HyperEVM, HyperCore, the TRU access portal, HIP-1 deployment, and HIP-2 liquidity. Use to verify post-migration token mechanics and liquidity assumptions. |
| compliance, liquidity, governance, risk | Brila Access: Community Questions Answered | https://brila.finance/blog/brila-access-community-questions | Tier 1 | Brila official Q&A covering BRLA supply, allocations, vesting, TrueFi swap, launch liquidity, and admin rights ahead of TGE. Use for tokenomics, admin rights, and migration risk review. |
| blockchain | Etherscan — TRU ERC-20 token contract | https://etherscan.io/token/0x4c19596f5aaff459fa38b0f7ed92f11ae6543784 | Tier 1 | Official Ethereum block explorer source for TRU token contract. Use for contract address, transfers, holders, decimals, contract verification, and token activity. Cross-check against CoinGecko and official migration guide. |
| blockchain, governance | Tally governance page from Brila docs footer | https://www.tally.xyz/gov/eip155%3A1%3A0x585CcA060422ef1779Fb0Dd710A49e7C49A823C9 | Tier 2 | Linked from Brila docs governance section. Use to verify governance history, proposal execution, and whether TRU governance remains active. Fetching may require browser/manual access. |
| governance | Snapshot governance page from Brila docs footer | https://snapshot.org/ | Tier 2 | Linked from Brila docs governance section. Search manually for TrueFi/Brila space and use only if matching space/proposals are verified. |

---

## Secondary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| market, liquidity, blockchain, risk | CoinGecko — TrueFi (TRU) | https://www.coingecko.com/en/coins/truefi | Tier 3 | Tracks TRU price, market cap, 24h volume, circulating supply, total supply, contract address, categories, exchange markets, and security references. Also categorizes TrueFi under RWA / RWA Protocol. Use for market fields only after timestamped refresh. |
| market, liquidity, yield, risk | DeFiLlama — TrueFi protocol | https://defillama.com/protocol/truefi | Tier 3 | Tracks TrueFi TVL, TVL by chain, staking, active loans, incentives, category, and methodology. Shows TrueFi under uncollateralized lending. Use for protocol TVL and active-loan context, but treat as aggregator data. |
| market, risk | RWA.xyz | https://app.rwa.xyz/ | Tier 3 | Search manually for TrueFi/TRU/Brila. Use only if a matching asset/protocol page exists. No reliable direct asset page was confirmed during this pass. |
| market | CoinMarketCap — TrueFi | https://coinmarketcap.com/currencies/truefi/ | Tier 3 | Backup market aggregator for TRU price, supply, market cap, and exchange pairs. Use only as secondary validation against CoinGecko. |
| security, risk | CER.live security profile via CoinGecko reference | https://cer.live/ | Tier 3 | CoinGecko links to CER security details. Useful only as contextual third-party security signal. Do not treat as an official smart contract audit. |
| security, risk | Immunefi | https://immunefi.com/ | Tier 3 | Check if there is a current TrueFi/Brila bug bounty. Use as secondary security evidence only if a direct active program page is found. |
| blockchain, risk | GitHub / DeFiLlama methodology code | https://github.com/DefiLlama/DefiLlama-Adapters | Tier 3 | Use to inspect how DeFiLlama computes TrueFi TVL and whether active loans are included or excluded. Important because DeFiLlama notes active loans are not included in default TVL unless toggled. |
| context, market, risk | Reputable financial / crypto media | N/A | Tier 3 | Use only for context such as exchange delisting, transition coverage, or legal/credit events. Do not use media as primary evidence for issuer, legal structure, reserve, or contract fields. |

---

## Data Gaps

- **Canonical asset question:** Confirm whether Nexus RWA should track `TRU` as a legacy protocol/governance token, or whether the production asset should shift to `BRLA` / Brila RWA.
- **Issuer/legal entity:** TFIP-41 mentions wind-down of the TrueFi Foundation in the BVI and creation of Panama-based Brila entities, but exact legal entity names and public registration documents still need verification.
- **SEC / regulator filings:** No SEC EDGAR filing or direct regulator filing was found for TRU/TrueFi in this pass. This may not be a registered securities/fund product. Keep `prospectusUrl` and legal filing fields null unless verified.
- **Transfer agent / custodian:** No official transfer agent, fund administrator, or custodian source was found for TRU. TRU appears to be a protocol/governance token, not a fund share or custody-backed tokenized asset.
- **Reserve/backing:** No reserve report, proof-of-reserves, custodian report, or asset-level collateral report was found for TRU. Do not mark TRU as reserve-backed.
- **Credit pool asset mapping:** Need to identify whether any current Brila/TrueFi credit vault tokens should be tracked separately from TRU/BRLA.
- **Active loan verification:** DeFiLlama shows active-loan data, but the underlying loans, borrowers, maturity, defaults, recovery status, and whether they are current/legacy need manual review from official docs/forum and on-chain contracts.
- **Audit reports:** DeFiLlama marks audits as yes and Brila docs have an audits section, but direct audit report URLs were not successfully fetched in this pass. Verify exact audit firms, dates, and report URLs before filling `lastAuditUrl` or `auditor`.
- **Governance execution:** Tally/Snapshot links are present in docs, but proposal execution and current admin state need manual verification.
- **Migration finality:** Brila official update says the broader participation window concluded and BRLA is independently trading. Confirm final TRU status: active, deprecated, non-converting after window, or residual market token.
- **Exchange status:** CoinGecko showed market activity and a note about a Binance delisting announcement, but delisting details need direct exchange/media verification before use.
- **RWA.xyz coverage:** No confirmed direct RWA.xyz asset page for TRU was identified. Search manually in the app before using RWA.xyz fields.

---

## Notes for Analyst

1. **Do not treat TRU like BENJI/OUSG/USTB.** TRU is not obviously a tokenized fund share or a direct claim on a reserve pool. It is best handled as a protocol/governance token tied historically to private credit / uncollateralized lending.
2. **Use Brila sources for current status, but preserve TrueFi lineage.** Current official docs and app redirect into Brila. Dataset should clearly note “formerly TrueFi” / migration context.
3. **Separate three concepts:**
   - TRU = legacy TrueFi token on Ethereum.
   - BRLA = new Brila governance/coordination token.
   - Brila RWA / credit vaults = underlying RWA lending product architecture.
4. **Risk scoring should be conservative.** Migration, governance transition, legacy credit/default matters, low TVL, and uncertain legal structure are material risks.
5. **Market numbers are highly time-sensitive.** Refresh CoinGecko and DeFiLlama immediately before filling `market.json`.
6. **Do not claim PoR or collateralization ratio.** No official proof-of-reserves or collateral report for TRU was found.
7. **Do not use community complaints as primary data**, but record them as qualitative risk context if they relate to migration confusion, claims, portal closure, or governance transparency.
8. **Recommended production classification:** `research-grade` or `legacy-transition-review`, not `institutional-grade`, until legal, audit, migration, and live credit exposure are resolved.

---

## Last Updated

2026-06-10
