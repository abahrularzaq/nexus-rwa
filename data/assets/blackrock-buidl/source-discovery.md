# source-discovery.md

asset: BlackRock USD Institutional Digital Liquidity Fund
symbol: BUIDL
slug: blackrock-buidl
sourceDiscoveryDate: 2026-06-28
researchPurpose: Targeted source repair after Source Verification blocked institutional-grade upgrade

---

## Research Agent Repair Summary — 2026-06-28

Source Verification returned `safeToProceed: false` because the package is not yet strong enough for institutional-grade review. This Research Agent pass performed targeted source repair only.

### Outcome

- Primary legal/governing document URL: not found publicly.
- Public prospectus / private placement memorandum / offering memorandum: not found publicly.
- Primary reserve breakdown or official fund reporting source: not found publicly.
- Public proof-of-reserves / reserve oracle / attestation evidence: not found publicly.
- Public audit or fund report URL: not found publicly.
- Primary confirmation for custodian, auditor, fund administrator, paying agent roles: not found beyond RWA.xyz and existing secondary/contextual sources.
- Market/yield fields: refreshed using RWA.xyz, DeFiLlama, CoinGecko, and Etherscan with observation date 2026-06-28.

Research conclusion: source repair improved freshness and documentation, but did not resolve the institutional-grade source blockers. The next Source Verification pass should likely keep `safeToProceed: false` unless additional private/account-gated documents are provided.

---

## Primary Sources

| Source | URL | Tier | Supported Layers | Why It Matters |
|---|---|---:|---|---|
| SEC Form D — BlackRock USD Institutional Digital Liquidity Fund Ltd. | https://www.sec.gov/Archives/edgar/data/2013810/000201439024000001/xslFormDX01/primary_doc.xml | Tier 1 | identity, compliance, institutional, risk | Official SEC filing. Confirms issuer name, BVI jurisdiction, 2023 organization year, pooled investment fund category, Rule 506(c), Section 3(c)(7), minimum outside investment, and Securitize Markets sales compensation recipient. This is not a prospectus, PPM, legal opinion, reserve report, or audit report. |
| SEC EDGAR filing index — CIK 0002013810 | https://www.sec.gov/Archives/edgar/data/2013810/0002014390-24-000001-index.htm | Tier 1 | identity, compliance, institutional | Official filing index for BlackRock USD Institutional Digital Liquidity Fund Ltd.; useful as audit trail for the raw Form D submission. |
| Securitize official BUIDL product page | https://securitize.io/blackrock/buidl | Tier 1 | identity, institutional, compliance, liquidity | Official access page for BUIDL on Securitize. Public text is limited and does not expose full legal documents or fund reporting. |
| Securitize press release — BUIDL launch on Ethereum | https://securitize.io/learn/press/blackrock-launches-first-tokenized-fund-buidl-on-the-ethereum-network | Tier 1 | identity, institutional, reserve context, blockchain, compliance, liquidity | Official launch announcement. Supports launch context and BlackRock-Securitize relationship. Not a fund report, audit, attestation, or full reserve breakdown. |
| Securitize press release — new BUIDL share classes across multiple blockchains | https://securitize.io/learn/press/blackRock-launches-new-buidl-share-classes-across-multiple-blockchains | Tier 1 | blockchain, institutional, liquidity, market | Official source for multichain expansion. Use before adding chains beyond Ethereum. |
| Etherscan — BUIDL token contract | https://etherscan.io/token/0x7712c34205737192402172409a8f7ccef8aa2aec | Tier 1 | blockchain, market, liquidity, risk | Explorer page for original Ethereum BUIDL token. Confirms contract address, supply, holders, token metadata, and explorer-level status. |
| Etherscan — BUIDL-I token contract | https://etherscan.io/token/0x6a9da2d710bb9b700acde7cb81f10f1ff8c89041 | Tier 1 | blockchain, market, risk | Explorer page for BUIDL-I share-class token. Keep separate from original BUIDL unless aggregation is explicitly sourced. |

---

## Secondary Sources

| Source | URL | Tier | Supported Layers | Why It Matters |
|---|---|---:|---|---|
| RWA.xyz — BUIDL asset page | https://app.rwa.xyz/assets/BUIDL | Tier 2 | identity, market, yield, liquidity, institutional, reserve context, risk | Aggregated RWA market source. Current 2026-06-28 observation: Total Asset Value 2,234,682,194 USD, NAV 1.00 USD, holders 110, 7D APY 3.40%, 30D APY 2.49%, management fee range 0.20-0.50%, platform Securitize, manager BlackRock, service-provider fields including BNY Mellon and PwC. Treat as secondary for legal/reserve/provider claims. |
| DeFiLlama — BlackRock BUIDL protocol page | https://defillama.com/protocol/blackrock-buidl | Tier 2 | market, yield, liquidity, blockchain, risk | Current 2026-06-28 observation: TVL 3.054b USD, chain TVL breakdown, BUIDL liquidity 320,081 USD on Raydium AMM, average APY 3.34%. Use for monitoring, not as official fund reporting. |
| CoinGecko — BUIDL market page | https://www.coingecko.com/en/coins/blackrock-usd-institutional-digital-liquidity-fund | Tier 2 | market, liquidity, risk | Current 2026-06-28 observation: price 1.00 USD, market cap 2,248,639,185 USD, and no trading in the last 24h. Use for market cross-check only. |
| The Wall Street Journal — BlackRock launches first tokenized fund | https://www.wsj.com/livecoverage/fed-meeting-fomc-interest-rate-decision-march-2024/card/blackrock-launches-first-tokenized-fund-on-ethereum-blockchain-nzDSJjH5mEijUzKO24T4 | Tier 3 | institutional, reserve, market context | Reputable financial media. Useful for context around launch, qualified purchasers, minimum investment discussion, and reserve composition. Do not use as primary reserve/legal evidence. |
| Axios — BlackRock tokenized fund coverage | https://www.axios.com/newsletters/axios-crypto-95c95d60-b5a6-4087-a264-4c8b7d0c3718 | Tier 3 | liquidity, operational context | Context-only source that discusses qualified purchasers, Securitize role, wallet/transfer-agent recovery flow, and minimum investment context. Not a primary source. |

---

## Layer Coverage Map

| Layer | Best Sources |
|---|---|
| identity | SEC Form D, SEC EDGAR index, Securitize BUIDL page, RWA.xyz |
| institutional | SEC Form D, Securitize BUIDL page, Securitize launch press release, RWA.xyz |
| compliance | SEC Form D, Securitize BUIDL page |
| reserve | Securitize launch press release for broad reserve context; RWA.xyz and WSJ for secondary/context only. No primary reserve report found. |
| blockchain | Etherscan BUIDL contract, Etherscan BUIDL-I contract, Securitize multichain press release, RWA.xyz token/network table, DeFiLlama chain distribution |
| liquidity | RWA.xyz primary-market section, Securitize access page, DeFiLlama liquidity, CoinGecko no-trading note |
| market | RWA.xyz, DeFiLlama, CoinGecko, Etherscan |
| yield | RWA.xyz, DeFiLlama. No official issuer yield methodology found. |
| risk | SEC Form D, Etherscan, RWA.xyz, DeFiLlama, source-review blockers |

---

## Data Gaps After Targeted Repair

| Gap | Status | Needed For | Notes |
|---|---|---|---|
| BlackRock-hosted official BUIDL product page | Not found | identity, institutional, reserve | The strongest accessible official product source remains Securitize. |
| Public prospectus / private placement memorandum / offering memorandum | Not found | compliance, reserve, liquidity, risk | SEC Form D confirms exempt offering details but not full investor terms. |
| Full audited financial statements or fund report | Not found | reserve, institutional, risk | Needed to verify asset composition, custody, NAV controls, and reporting cadence. |
| Complete holdings / portfolio composition | Not found as primary source | reserve, yield, risk | Current reserve composition remains secondary/contextual. |
| Primary custodian / auditor / fund administrator confirmation | Not found | institutional, reserve, compliance | RWA.xyz lists BNY Mellon and PwC; primary confirmation remains missing. |
| Redemption terms and settlement SLA from official legal terms | Partially found through RWA.xyz | liquidity | RWA.xyz provides detailed subscription/redemption descriptions, but official legal terms are preferred. |
| Public smart-contract audit report | Not found | blockchain, risk | Verified explorer code is not the same as a third-party audit. |
| BUIDL versus BUIDL-I aggregation rule | Not found | market, blockchain, risk | Keep separate unless a source explicitly supports aggregation. |
| Moody's primary rating / assessment report | Not found in open search | risk, reserve, institutional | RWA.xyz displays Moody's Aaa-mf, but a primary Moody's report/page was not found in open search. |

---

## Notes for Next Source Verification

1. This repair did not resolve institutional-grade blockers; it refreshed dynamic data and documented missing primary sources.
2. Treat RWA.xyz provider fields as secondary evidence for service-provider roles.
3. Keep `hasProofOfReserves` false unless explicit PoR or public attestation evidence is found.
4. Keep `prospectuUrl`, `legalOpinionUrl`, `reserveBreakdown`, `lastAuditDate`, and `lastAuditUrl` null unless public primary evidence is provided.
5. Re-run Source Verification before Risk & Grading.
