# Source Discovery — Tether Gold / XAUT / XAU₮

## Asset

- Asset: Tether Gold
- Symbol: XAUT / XAU₮
- Slug: `tether-gold-xaut`
- Category: Commodity
- Subcategory: Tokenized Gold
- Initial status: source discovery completed; field-level data extraction still pending
- Source review date: 2026-06-05

## Primary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| identity, reserve, liquidity | Tether Gold official website | https://gold.tether.to/ | Tier 1 | Official product website. Use for product identity, high-level backing claim, issuer context, and navigation to reports, FAQ, legal, and fees. The page is JavaScript-rendered, so browser/manual verification is required for final extraction. |
| reserve, institutional, risk | Tether Gold reserve reports | https://gold.tether.to/reports | Tier 1 | Official reserve report landing page. Candidate source for latest independent accountant report, reserve backing, report date, auditor/accountant, and gold reserve disclosures. Must open latest downloadable report manually before filling `lastAuditDate`, `lastAuditUrl`, `auditor`, and `reserveBreakdown`. |
| reserve, liquidity, compliance | Tether Gold FAQ | https://gold.tether.to/faq | Tier 1 | Official FAQ. Candidate source for ownership claim, gold allocation, redemption mechanics, account verification, physical delivery, cash settlement, and product limitations. JavaScript-rendered; verify in browser. |
| institutional, liquidity | Tether Gold fees | https://gold.tether.to/fees | Tier 1 | Official fee page. Candidate source for purchase/redemption fees, minimum purchase/redemption, and custody-fee claims. Verify in browser before using numeric fields. |
| compliance, institutional, risk | Tether Gold legal / terms | https://gold.tether.to/legal | Tier 1 | Official legal landing page. Candidate source for terms of service, issuer/legal entity, eligible users, restricted jurisdictions, AML/KYC obligations, redemption terms, and legal risk factors. JavaScript-rendered; verify in browser and use exact downloadable legal document URL if available. |
| blockchain, market, smart-contract risk | Etherscan — XAUT Ethereum token contract | https://etherscan.io/token/0x68749665ff8d2d112fa859aa293f07a622782f38 | Tier 1 | Official block explorer source for Ethereum contract. Etherscan identifies the token as Tether Gold (XAUt), shows ERC-20 proxy source code, implementation address, max total supply, holders, price, market cap, token decimals, and contract verification status. It also states no contract security audit is submitted on Etherscan. |
| identity, reserve, historical documentation | Tether official domain linked from Etherscan profile | https://tether.to/ | Tier 1 | Etherscan token profile links to Tether official domain and a whitepaper link. Treat as a navigation source only unless the exact current XAUT whitepaper/legal document URL is verified. |

## Secondary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| market, liquidity, institutional, blockchain, yield, risk | RWA.xyz — Tether Gold asset page | https://app.rwa.xyz/assets/XAUT | Tier 2 | Strong RWA-specific secondary source. Shows Tether Gold as a commodity asset, non-U.S. investor product, platform/manager, total asset value, NAV, holders, token supply, circulating supply, transfer volume, chains, and contract links. Also shows APY fields as blank/none, useful to confirm non-yield-bearing treatment. |
| liquidity, compliance, institutional | RWA.xyz — XAUT primary market section | https://app.rwa.xyz/assets/XAUT | Tier 2 | Secondary reference for eligible investors, minimum investment, subscription fee, redemption fee, redemption time, and redemption description. Final field values must be confirmed against official Tether Gold legal/FAQ/fees pages. |
| blockchain | RWA.xyz — XAUT token/chains table | https://app.rwa.xyz/assets/XAUT | Tier 2 | Secondary source for multi-chain presence, including Ethereum, BNB Chain, Arbitrum, and Avalanche entries. Include non-Ethereum deployments only after independent explorer and/or official confirmation. |
| market | CoinGecko — Tether Gold | https://www.coingecko.com/en/coins/tether-gold | Tier 2 | Market aggregator for price, market cap, volume, circulating supply, exchange venues, and third-party security ratings. Good for `market.json`, but values must be timestamped because they change frequently. |
| market, identity, liquidity | CoinMarketCap — Tether Gold | https://coinmarketcap.com/currencies/tether-gold/ | Tier 2 | Market aggregator for live price, volume, market cap, circulating supply, basic token description, and exchange liquidity. Use as secondary source, not primary evidence for reserve/legal/custody fields. |

## Risk Context Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| risk, market, reserve context | Reuters — Tether slows gold purchases for USDT reserves in first quarter, data shows | https://www.reuters.com/world/americas/tether-slows-gold-purchases-usdt-reserves-first-quarter-data-shows-2026-05-01/ | Tier 3 | Risk/market context only. Reuters reports Tether gold purchasing activity and states XAUT is backed by physical gold; do not use as primary source for reserve, custody, legal, or contract fields. Useful for market-scale/context notes. |
| risk, market, reserve context | Reuters — Tether says it bought 27 tons of gold in fourth quarter | https://www.reuters.com/technology/tether-says-it-bought-27-tons-gold-fourth-quarter-2026-01-26/ | Tier 3 | Risk/market context only. Discusses Tether gold purchases, XAUT scale, and gold stored in Switzerland. Do not use as primary field evidence. |
| risk, market context | Reuters — Has gold been Tethered? | https://www.reuters.com/markets/europe/has-gold-been-tethered-2025-11-25/ | Tier 3 | Commentary/risk context about Tether's influence on gold markets and concerns around crypto-linked gold demand. Do not use for field values. |
| risk, market context | Financial Times — Tether, the gold whale | https://www.ft.com/content/37f80249-2ca0-4369-9898-bde2689d443a | Tier 3 | Context on Tether's gold buying, XAUT reserves, warehouse/custody transparency concerns, and market impact. Paywalled/secondary; not for primary fields. |
| risk, product context | Financial Times — Tether's new take on the gold standard | https://www.ft.com/content/859e5155-b69c-4037-9f9d-8e902b25cdc6 | Tier 3 | Context on XAUT as collateral for Alloy/aUSDt and broader product risk. Use only for risk narrative. |

## Source Classification By Layer

| Layer | Best Sources | Notes |
|---|---|---|
| identity | Tether Gold official site; RWA.xyz; CoinGecko; CoinMarketCap | Use official site for name/symbol/category where possible. RWA.xyz and aggregators support cross-checking. |
| institutional | Tether Gold legal; Tether Gold fees; Tether Gold reports; RWA.xyz | Need exact issuer/legal entity from official legal docs before filling `issuerName`, `issuerCountry`, `legalStructure`, and `targetInvestors`. |
| compliance | Tether Gold legal; Tether Gold FAQ; Tether Gold fees | Need official legal terms for KYC, sanctions, jurisdiction restrictions, eligible investors, and AML policy. Do not use aggregators as primary compliance source. |
| reserve | Tether Gold reports; Tether Gold FAQ; official website | Use latest independent accountant report for backing, report date, auditor, reserve amount, and collateralization. Do not use media or aggregators as primary reserve proof. |
| blockchain | Etherscan token contract; chain explorers linked by RWA.xyz | Ethereum contract is verified from Etherscan. Other chains need full-address verification before inclusion. |
| liquidity | Tether Gold FAQ; Tether Gold fees; RWA.xyz; CoinGecko/CMC exchange markets | Official FAQ/fees should control redemption fields. Aggregators help with exchange liquidity and market venues. |
| market | RWA.xyz; CoinGecko; CoinMarketCap; Etherscan | Use fresh timestamped values. Do not hardcode stale market figures without `lastUpdated`. |
| yield | RWA.xyz; official Tether Gold product/FAQ | XAUT appears non-yield-bearing. Keep yield values null unless an official source explicitly states otherwise. |
| risk | Official legal/reports; Etherscan; RWA.xyz; Reuters/FT context | Risk scoring should be built after reserve, legal, liquidity, holder distribution, chain deployments, and audit evidence are reviewed. |

## Data Gaps

- Latest Tether Gold reserve / independent accountant report direct PDF URL.
- Latest reserve report date.
- Exact auditor/accountant name for the latest XAUT-specific reserve report.
- Exact issuer legal entity and jurisdiction for XAUT from official legal terms.
- Exact custodian / vault operator and whether the vault identity is publicly disclosed.
- Exact vault location details beyond broad Switzerland references.
- Whether XAUT has an explicit on-chain proof-of-reserves oracle. Do not set `hasProofOfReserves: true` unless an official source confirms an oracle/address.
- Exact physical redemption mechanics from official FAQ/legal/fees pages, including minimum physical delivery amount, cash settlement option, fees, delivery restrictions, and timing.
- Current restricted jurisdictions and eligible investor rules from official legal terms.
- Public smart-contract audit report URL, if any. Etherscan currently shows no contract security audit submitted for the Ethereum proxy page.
- Full verified contract addresses for BNB Chain, Arbitrum, and Avalanche entries. RWA.xyz displays truncated links; verify on each explorer before adding to `blockchain.json`.
- Holder concentration/top-wallet distribution source suitable for `concentrationRisk`.
- Whether management/custody fees are truly zero and whether any purchase/redemption/spread fees apply, using official Tether Gold fees page.

## Notes for Analyst

- Treat XAUT as a commodity-backed RWA, not a Treasury/fund product.
- `reserve.json` is the most important layer for this asset. Prioritize reserve reports, accountant reports, gold allocation, custody/vault disclosures, and redemption mechanics.
- Keep `yield.json` mostly null. RWA.xyz shows APY fields as blank/none; XAUT should not be treated as yield-bearing unless a primary source states otherwise.
- Do not treat an independent reserve/accountant report as an on-chain proof-of-reserves oracle. `hasProofOfReserves` should remain `false` unless an explicit oracle/address is found.
- Do not use Reuters, FT, CoinGecko, CoinMarketCap, or RWA.xyz as primary evidence for legal, reserve, custody, or compliance fields when official Tether Gold sources are available.
- Use Etherscan as primary evidence for Ethereum contract metadata, proxy type, holders, supply, token decimals, and the absence/presence of submitted contract audit metadata.
- Because official Tether Gold pages are JavaScript-rendered in automated fetches, final field extraction should be manually checked in a browser or through downloadable PDFs from the official site.
- `grade-baseline.json` should be created only after import and grading are run successfully.
