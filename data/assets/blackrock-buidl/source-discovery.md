# source-discovery.md

asset: BlackRock USD Institutional Digital Liquidity Fund
symbol: BUIDL
slug: blackrock-buidl
sourceDiscoveryDate: 2026-06-02
researchPurpose: Institutional-grade RWA source discovery for Nexus RWA

---

## Primary Sources

| Source | URL | Tier | Supported Layers | Why It Matters |
|---|---|---:|---|---|
| SEC Form D — BlackRock USD Institutional Digital Liquidity Fund Ltd. | https://www.sec.gov/Archives/edgar/data/2013810/000201439024000001/xslFormDX01/primary_doc.xml | Tier 1 | identity, compliance, institutional, risk | Official SEC filing. Confirms issuer name, jurisdiction, incorporation year, exemption type, issuer category, related persons, and Securitize Markets as sales compensation recipient. |
| SEC EDGAR filing index — CIK 0002013810 | https://www.sec.gov/Archives/edgar/data/2013810/0002014390-24-000001-index.htm | Tier 1 | identity, compliance, institutional | Official filing index for BlackRock USD Institutional Digital Liquidity Fund Ltd.; useful as audit trail for the raw Form D submission. |
| Securitize official BUIDL product page | https://securitize.io/blackrock/buidl | Tier 1 | identity, institutional, compliance, liquidity, yield | Official distribution and access page for BUIDL on Securitize. Use for product access, investor eligibility, subscription/redemption workflow, and official product positioning. |
| Securitize press release — BUIDL launch on Ethereum | https://securitize.io/learn/press/blackrock-launches-first-tokenized-fund-buidl-on-the-ethereum-network | Tier 1 | identity, institutional, reserve, blockchain, compliance, liquidity | Official launch announcement. Supports launch context, BlackRock–Securitize relationship, Ethereum launch, target investors, and high-level reserve description. |
| Securitize press release — new BUIDL share classes across multiple blockchains | https://securitize.io/learn/press/blackRock-launches-new-buidl-share-classes-across-multiple-blockchains | Tier 1 | blockchain, institutional, liquidity, market | Official source for multichain expansion. Use before adding chains beyond Ethereum. |
| Etherscan — BUIDL token contract | https://etherscan.io/token/0x7712c34205737192402172409a8f7ccef8aa2aec | Tier 1 | blockchain, market, liquidity, risk | Official Ethereum explorer page for BUIDL token. Confirms token contract, decimals, verified source code, supply, holder count, transfers, and proxy/implementation status. |
| Etherscan — BUIDL contract address page | https://etherscan.io/address/0x7712c34205737192402172409a8f7ccef8aa2aec | Tier 1 | blockchain, risk | Contract-level page for verified code, proxy pattern, read/write contract functions, deployer traces, and contract interactions. |
| Etherscan — BUIDL-I token contract | https://etherscan.io/token/0x6a9da2d710bb9b700acde7cb81f10f1ff8c89041 | Tier 1 | blockchain, market, risk | Explorer page for BUIDL-I share class token. Use separately from original BUIDL token to avoid mixing token classes. |
| RWA.xyz — BUIDL asset page | https://app.rwa.xyz/assets/BUIDL | Tier 2 | identity, market, yield, liquidity, institutional, risk | Aggregated RWA market source. Supports total asset value, NAV, holders, APY, management fee range, asset class, platform, manager, token supply, and market metrics. |
| DeFiLlama — BlackRock BUIDL protocol page | https://defillama.com/protocol/blackrock-buidl | Tier 2 | market, yield, liquidity, blockchain, risk | Aggregated TVL, chain distribution, fee/revenue metrics, yield section, market cap, price, DEX/CEX volume, and liquidity. Useful for time-series and monitoring. |
| DeFiLlama — BUIDL-I RWA asset page | https://defillama.com/rwa/asset/buidl-i | Tier 2 | market, yield, liquidity, identity | DeFiLlama RWA asset page specifically for BUIDL-I. Use separately if Nexus RWA models BUIDL-I as a distinct share class. |
| CoinGecko — BUIDL market page | https://www.coingecko.com/en/coins/blackrock-usd-institutional-digital-liquidity-fund | Tier 2 | market, liquidity, risk | Secondary market aggregator. Useful for cross-checking price, market cap, circulating supply, trading volume, and token contract address. |

---

## Secondary Sources

| Source | URL | Tier | Supported Layers | Why It Matters |
|---|---|---:|---|---|
| The Wall Street Journal — BlackRock launches first tokenized fund | https://www.wsj.com/livecoverage/fed-meeting-fomc-interest-rate-decision-march-2024/card/blackrock-launches-first-tokenized-fund-on-ethereum-blockchain-nzDSJjH5mEijUzKO24T4 | Tier 3 | institutional, reserve, market context | Reputable financial media. Useful only for context around launch, initial participants, token value, minimum investment, and reserve composition. Do not use as primary source if Securitize/SEC source is available. |
| Axios — BlackRock tokenized fund overtakes Franklin Templeton | https://www.axios.com/2024/05/01/blackrock-tokenized-treasury-fund-franklin-templeton | Tier 3 | market, institutional context | Context on early market adoption and comparison with Franklin Templeton. Use only for narrative/context, not canonical data. |
| The Block — BUIDL expansion to Aptos, Arbitrum, Avalanche, Optimism, Polygon | https://www.theblock.co/post/326288/blackrock-buidl-aptos-arbitrum-avalanche-optimism-polygon | Tier 3 | blockchain, market context | Useful confirmation of multichain expansion, but prefer Securitize press release as Tier 1. |
| Avalanche official blog — BUIDL on Avalanche via Securitize | https://www.avax.network/about/blog/blackrock-launches-digital-liquidity-fund-buidl-on-avalanche-via-securitize | Tier 2 | blockchain, institutional context | Official ecosystem source for Avalanche deployment context. Use only for Avalanche-specific chain support, not fund legal/compliance data. |
| CoinDesk — Moody's Aaa-mf assessment coverage | https://www.coindesk.com/markets/2026/05/14/moody-s-awards-top-rating-to-fidelity-and-blackrock-s-tokenized-money-market-funds | Tier 3 | institutional, risk, reserve context | Reputable crypto/finance media covering Moody's assessment. Use only as secondary context unless Moody's primary rating page/report is accessible. |
| Crane Data — Moody's rates BlackRock BUIDL and Fidelity USD Digital Funds | https://cranedata.com/archives/all-articles/11348/ | Tier 3 | institutional, risk, reserve context | Money-market industry source covering Moody's Aaa-mf assessment. Useful for context, but Moody's direct report should be preferred if available. |
| Financial Times — BlackRock BUIDL context | https://www.ft.com/content/58e3e9a1-ecf2-4a3a-b301-1cd4e6aeb330 | Tier 3 | institutional, market context | High-quality financial media for institutional narrative only. May be paywalled. Do not use for canonical field values. |

---

## Layer Coverage Map

| Layer | Best Sources |
|---|---|
| identity | SEC Form D, SEC EDGAR index, Securitize BUIDL page, RWA.xyz |
| institutional | SEC Form D, Securitize BUIDL page, Securitize launch press release, RWA.xyz |
| compliance | SEC Form D, Securitize BUIDL page, Securitize launch press release |
| reserve | Securitize launch press release, RWA.xyz, DeFiLlama, Moody's source if accessible |
| blockchain | Etherscan BUIDL contract, Etherscan BUIDL-I contract, Securitize multichain press release, DeFiLlama chain distribution |
| liquidity | Securitize product page, RWA.xyz, DeFiLlama, CoinGecko |
| market | RWA.xyz, DeFiLlama, CoinGecko, Etherscan |
| yield | RWA.xyz, DeFiLlama, Securitize product page |
| risk | SEC Form D, Etherscan verified contract, RWA.xyz holders/TVL/APY, DeFiLlama liquidity/volume/chain data, Moody's report if accessible |

---

## Data Gaps

| Gap | Status | Needed For | Notes |
|---|---|---|---|
| BlackRock-hosted official BUIDL product page | Not found in open search | identity, institutional, reserve | The strongest accessible official product source appears to be Securitize. BlackRock's own public site did not surface a dedicated BUIDL product page in the searched results. |
| Full prospectus / private placement memorandum | Not found publicly | compliance, reserve, liquidity, risk | SEC Form D confirms private offering details, but not the full fund documentation. Likely available only to eligible investors through Securitize onboarding. |
| Full audited financial statements | Not found publicly | reserve, institutional, risk | Need official financial statements or audited fund report to verify asset composition, custody, NAV controls, and expense structure. |
| Complete holdings / portfolio composition | Not found publicly as machine-readable source | reserve, yield, risk | Some sources describe cash, U.S. Treasury bills, and repo exposure, but exact current portfolio breakdown needs official fund reporting. |
| Custodian / administrator / transfer agent details | Partially found | institutional, reserve, compliance | Securitize role is clear as tokenization/distribution infrastructure, but full legal roles should be verified from offering documents or official fund docs. |
| Redemption terms and settlement SLA | Partially found | liquidity | Need direct official terms for redemption window, minimum redemption, fees, cut-off times, and eligible investors. |
| Official audit report for smart contracts | Not found | blockchain, risk | Etherscan confirms verified source code, but verified code is not equivalent to third-party security audit. |
| Complete official token address registry across all chains | Partially found | blockchain, risk | Securitize confirms multichain expansion, DeFiLlama shows chain distribution, but each contract address should be verified from official explorer pages or Securitize registry before adding to production. |
| Moody's primary rating / assessment report | Search result found, but primary Moody's page may require login | risk, reserve, institutional | Use Moody's direct source if accessible. Otherwise keep rating field sourced as secondary and mark confidence lower. |
| Historical APY / NAV time series from primary source | Partially available through aggregators | yield, market, risk | RWA.xyz and DeFiLlama provide current and historical market/yield data, but primary fund-level historical data would be stronger. |

---

## Notes for Analyst

1. Treat BUIDL and BUIDL-I carefully. They may represent different token/share-class structures. Do not merge contract supply, holder count, or chain-level market data unless the source explicitly aggregates them.

2. For production dataset, use SEC Form D as the legal identity anchor:
   - issuer: BlackRock USD Institutional Digital Liquidity Fund Ltd.
   - jurisdiction: British Virgin Islands
   - incorporation year: 2023
   - exemption: Rule 506(c)
   - investment company registration: not registered under the Investment Company Act of 1940

3. Use Securitize as the primary operational/product access source, not as a substitute for SEC filings.

4. Use Etherscan only for Ethereum on-chain facts: contract address, source-code verification, token supply, holder count, transfer activity, proxy implementation, and contract interactions.

5. Use RWA.xyz and DeFiLlama for market/yield monitoring, but classify them as Tier 2 because they are aggregators, not issuer filings.

6. Use CoinGecko only as a market cross-check. Do not rely on it for legal, reserve, compliance, or institutional fields.

7. For risk scoring:
   - legal/compliance risk should be grounded in SEC Form D and investor eligibility.
   - smart-contract risk should be grounded in verified source code plus audit availability.
   - market risk should use TVL/AUM, APY stability, NAV, transfer volume, and liquidity.
   - concentration risk should use holder count and holder distribution from explorers/RWA.xyz.

8. Current priority before layer research:
   - Download/archive SEC filing.
   - Save Securitize product and press pages.
   - Verify all contract addresses per chain.
   - Check whether Securitize account-gated documents include offering memorandum, subscription terms, redemption terms, and fund disclosures.
