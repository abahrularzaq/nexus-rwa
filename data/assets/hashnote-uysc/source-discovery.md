# Source Discovery — Hashnote UYSC

Asset slug: `hashnote-uysc`  
Asset name: Hashnote UYSC  
Official source name found: Circle USYC / USYC / US Yield Coin  
Symbol requested: UYSC  
Official symbol found: USYC  
Research date: 2026-06-07  
Status: source discovery completed with naming conflict

---

## 1. Research Summary

Official Hashnote and Circle sources were found for USYC, but no authoritative source was found using the exact ticker `UYSC`. All official and reliable secondary sources reviewed identify the asset as `USYC` / `US Yield Coin`, not `UYSC`. This should be resolved before production import to avoid storing the wrong symbol.

USYC-specific sources were found across Hashnote documentation, Circle product pages, RWA.xyz, official smart contract documentation, Ethereum/BSC/Solana explorers, and Hashnote's price-report API. Legal/compliance evidence is partial: Circle and Hashnote pages identify non-U.S. investor restrictions, Regulation S context, CIMA/Cayman fund structure, and Circle International Bermuda Limited's role, but a full prospectus/offering memorandum/legal opinion was not found publicly during this pass. Reserve/backing evidence is strong enough for source discovery: official sources state exposure to U.S. Treasury bills and reverse repos backed by short-term U.S. government securities. However, no explicit on-chain proof-of-reserves oracle or public reserve audit report was found.

Blockchain evidence is strong for Ethereum, BSC, and Solana because official docs provide contract addresses and explorers confirm token pages. Market/yield data sources are moderate-to-strong: RWA.xyz and Hashnote's API provide market/yield/price-report data, but production values should be refreshed at import time. Overall source quality: strong for identity/blockchain/product mechanics; moderate for market/yield/liquidity; partial for legal, reserve audit, and risk.

---

## 2. Primary Sources

| No. | Source Name | URL | Tier | Publisher | Supported Layers | Key Fields Supported | Usage Type | Access Date | Notes |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | Hashnote official website | https://www.hashnote.com/ | Tier 1 | Hashnote | identity, institutional, compliance, risk | websiteUrl, docsUrl, product family, regulated/licensed claims, non-U.S. restriction context | direct_field_source | 2026-06-07 | Official Hashnote website; confirms USYC product link and Hashnote positioning. |
| 2 | Circle USYC product page | https://www.circle.com/usyc | Tier 1 | Circle | identity, institutional, compliance, reserve, liquidity, market, yield, risk | name, description, legal structure, token administrator, backing description, redemption notes, networks, fees, AUM, inception date | direct_field_source | 2026-06-07 | Official Circle product page after acquisition; strongest single product overview source. |
| 3 | Hashnote USYC portal | https://usyc.hashnote.com/ | Tier 1 | Hashnote / Circle | market, yield, liquidity | live product portal, price/yield context, product access | cross_check_only | 2026-06-07 | The page loaded as a web app with limited text extraction; useful as official portal but not enough alone for field extraction. |
| 4 | USYC Docs — Introduction | https://usyc.docs.hashnote.com/getting-started/introduction | Tier 1 | Hashnote | identity, institutional | docsUrl, documentation index | direct_field_source | 2026-06-07 | Official docs landing page and navigation source. |
| 5 | USYC Docs — Investor Onboarding | https://usyc.docs.hashnote.com/overview/investor-onboarding | Tier 1 | Hashnote | institutional, compliance, liquidity | minimumInvestment, targetInvestors, kycRequired, amlPolicy, wallet whitelist process | direct_field_source | 2026-06-07 | States eligibility, US$100,000 minimum investment, onboarding, KYC/AML, and wallet screening. |
| 6 | USYC Docs — Subscription & Redemption | https://usyc.docs.hashnote.com/overview/subscription-and-redemption | Tier 1 | Hashnote | liquidity, market, yield | subscription method, redemptionType, redemptionAsset, private liquidity, 24/7/365 USDC flow | direct_field_source | 2026-06-07 | Official operational source for mint/redeem via Teller. |
| 7 | USYC Docs — Product Structuring | https://usyc.docs.hashnote.com/overview/product-structuring | Tier 1 | Hashnote | institutional, compliance, reserve, blockchain, liquidity, risk | issuerName, legalStructure, backingDescription, transfer restrictions, allowlist, sanctions screening, token standard | direct_field_source | 2026-06-07 | Key source for USYC structure: Circle International Bermuda Limited, Cayman mutual fund, ERC-20, allowlist, Chainalysis sanctions oracle. |
| 8 | USYC Docs — Token Price | https://usyc.docs.hashnote.com/overview/token-price | Tier 1 | Hashnote | market, yield, blockchain | price methodology, NAV calculation, USYC oracle, currentYield methodology inputs, API URL | direct_field_source | 2026-06-07 | Key source for price reporting, principal/interest fields, oracle/API references. |
| 9 | USYC Docs — Fees | https://usyc.docs.hashnote.com/overview/fees | Tier 1 | Hashnote | institutional, liquidity, yield | performanceFee, subscriptionFee, redemptionFee, fee notes | direct_field_source | 2026-06-07 | Official fee source. |
| 10 | USYC Docs — Smart Contracts | https://usyc.docs.hashnote.com/overview/smart-contracts | Tier 1 | Hashnote | blockchain, compliance, liquidity, risk | chain, chainId, contractAddress, tokenStandard, entitlements contract, teller/oracle addresses | direct_field_source | 2026-06-07 | Official contract-address source for Ethereum, BSC, Solana, plus testnets. |
| 11 | USYC Docs — Service Providers | https://usyc.docs.hashnote.com/overview/service-providers | Tier 1 | Hashnote | institutional, compliance, reserve, risk | prime broker, bank, auditor, fundAdmin, KYC/AML providers, MPC wallet | direct_field_source | 2026-06-07 | Official service-provider source. Needs cross-check because RWA.xyz shows a different auditor name. |
| 12 | Hashnote Terms and Conditions | https://www.hashnote.com/terms-and-conditions | Tier 1 | Hashnote / Circle International Bermuda Limited | compliance, risk | restrictions, no-offer language, CIBL site operator, legal disclaimers | direct_field_source | 2026-06-07 | Useful for compliance/legal disclaimers, not a fund prospectus. |
| 13 | Hashnote Legal Disclosures | https://www.hashnote.com/legal-disclosures | Tier 1 | Hashnote | compliance, risk | legalDisclosureUrl, risk disclaimers | direct_field_source | 2026-06-07 | Official legal disclosure page found; details should be reviewed further before filling legalOpinionUrl. |
| 14 | Circle press release — Acquisition of Hashnote and USYC | https://www.circle.com/pressroom/circle-announces-acquisition-of-hashnote-and-usyc-tokenized-money-market-fund-alongside-strategic-partnership-with-global-trading-firm-drw | Tier 1 | Circle | identity, institutional, market, liquidity, risk | acquisition, issuer context, AUM snapshot, USYC role as tokenized money market fund, DRW/Cumberland liquidity context | direct_field_source | 2026-06-07 | Official Circle source for acquisition context and USYC positioning. |
| 15 | Hashnote USYC price reports API | https://usyc.hashnote.com/api/price-reports | Tier 1 | Hashnote / Circle | market, yield | price, nextPrice, principal, interest, balance, totalSupply, fee, timestamp, txhash | direct_field_source | 2026-06-07 | Machine-readable official price-report data; values are time-sensitive and must be refreshed at import time. |
| 16 | Etherscan — USYC Ethereum token | https://etherscan.io/token/0x136471a34f6ef19fE571EFFC1CA711fdb8E49f2b | Tier 1 | Etherscan | blockchain, market, risk | Ethereum contractAddress, token standard, holders, supply, verified code, audit status | direct_field_source | 2026-06-07 | Official explorer verification for Ethereum token. Explorer notes no submitted contract security audit. |
| 17 | BscScan — USYC BSC token | https://bscscan.com/token/0x8D0fA28f221eB5735BC71d3a0Da67EE5bC821311 | Tier 1 | BscScan | blockchain, market, risk | BSC contractAddress, token standard, holders, supply, verified code, audit status | direct_field_source | 2026-06-07 | Official explorer verification for BSC token. Explorer notes no submitted contract security audit. |
| 18 | Solscan — USYC Solana account | https://solscan.io/account/7LWanZteUKtvFjv4MHYgKXXdAuCQYFPJysL9pxxdRQGn | Tier 1 | Solscan | blockchain | Solana token/account address | direct_field_source | 2026-06-07 | Official explorer link from RWA.xyz and consistent with Hashnote docs; detailed parsing was limited. |
| 19 | LEI Lookup — Circle International Bermuda Limited | https://www.lei-lookup.com/record/254900HOS8Z6JFRRCO30 | Tier 2 | LEI Lookup | institutional, compliance | issuer legal name, LEI, Bermuda address, entity status, legal form, related managed fund | cross_check_only | 2026-06-07 | Useful entity identity cross-check; not an official regulator page, but references LEI data. |

---

## 3. Secondary Sources

| No. | Source Name | URL | Tier | Publisher | Supported Layers | Key Fields Supported | Usage Type | Access Date | Notes |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | RWA.xyz — Circle USYC asset page | https://app.rwa.xyz/assets/USYC | Tier 2 | RWA.xyz | identity, institutional, compliance, reserve, blockchain, liquidity, market, yield | name, ticker, AUM/total value, NAV, APY, token supply, holders, chain deployments, contracts, fees, min investment, redemption notes | cross_check_only | 2026-06-07 | Strong secondary dashboard. Use for market/yield cross-check and field discovery; do not override official docs. |
| 2 | CoinGecko link from Etherscan | https://www.coingecko.com/ | Tier 2 | CoinGecko | market | price, market data, token info | cross_check_only | 2026-06-07 | Etherscan references CoinGecko as exchange-data source; exact USYC page should be verified before use. |
| 3 | DeFiLlama — Hashnote | Not found | Tier 2 | DeFiLlama | market | TVL if listed | cross_check_only | 2026-06-07 | No verified direct Hashnote/USYC DeFiLlama page found in this pass. |

---

## 4. Context Sources

| No. | Source Name | URL | Tier | Publisher | Context Provided | Usage Type | Access Date | Notes |
|---:|---|---|---|---|---|---|---|---|
| 1 | Circle acquisition press release | https://www.circle.com/pressroom/circle-announces-acquisition-of-hashnote-and-usyc-tokenized-money-market-fund-alongside-strategic-partnership-with-global-trading-firm-drw | Tier 1 | Circle | Acquisition context, DRW/Cumberland partnership, USYC market positioning | direct_field_source | 2026-06-07 | Also used as a primary source for institutional context. |
| 2 | RWA.xyz — Circle USYC | https://app.rwa.xyz/assets/USYC | Tier 2 | RWA.xyz | Market context and dashboard values | cross_check_only | 2026-06-07 | Useful for secondary market snapshot only. |
| 3 | Wikipedia — Circle Internet Group | https://en.wikipedia.org/wiki/Circle_Internet_Group | Tier 3 | Wikipedia | Broad background only | context_only | 2026-06-07 | Not suitable for production field extraction. |

---

## 5. Layer Coverage Matrix

| Layer | Coverage Status | Best Source(s) | Missing Evidence | Confidence |
|---|---|---|---|---|
| identity | Complete | Circle USYC page; Hashnote website; USYC docs; RWA.xyz | Resolve ticker conflict: requested UYSC vs official USYC | High |
| institutional | Partial | Circle USYC page; Product Structuring; Investor Onboarding; Service Providers; LEI Lookup | Full offering memorandum/prospectus; transfer agent details | Medium |
| compliance | Partial | Circle USYC page; Product Structuring; Investor Onboarding; Terms; Legal Disclosures | Public legal opinion; full jurisdiction restrictions; official AML policy document | Medium |
| reserve | Partial | Circle USYC page; Product Structuring; Service Providers; Token Price | Full reserve report, custodian breakdown, collateralization ratio, public audit/attestation | Medium |
| blockchain | Complete | Smart Contracts docs; Etherscan; BscScan; Solscan; RWA.xyz | Verify additional networks listed by Circle page: Base, Canton, NEAR | High for Ethereum/BSC/Solana; Medium overall |
| liquidity | Partial | Subscription & Redemption; Product Structuring; Circle USYC page; RWA.xyz | Exact liquidity thresholds and PLT terms; private liquidity fee tiers | Medium |
| market | Partial | RWA.xyz; Hashnote price API; Etherscan; BscScan | Refresh values at import; verify CoinGecko exact asset page | Medium |
| yield | Partial | Token Price docs; Hashnote price API; RWA.xyz; Circle USYC page | Historical APY fields beyond 7D/30D; 52-week range; std dev | Medium |
| risk | Partial | Product Structuring; explorer audit status; Terms; Legal Disclosures; Service Providers | Smart contract audit report; concentration breakdown; legal opinion; reserve audit | Medium-Low |

---

## 6. Field-Level Source Map

### 6.1 Identity

| Field | Source URL | Status | Notes |
|---|---|---|---|
| name | https://www.circle.com/usyc | Found | Official source uses USYC, not UYSC. |
| symbol | https://www.circle.com/usyc | Found | Official symbol found: USYC. Requested symbol UYSC should be corrected or explicitly aliased. |
| fullName | https://etherscan.io/token/0x136471a34f6ef19fE571EFFC1CA711fdb8E49f2b | Found | Explorer shows US Yield Coin (USYC). |
| description | https://www.circle.com/usyc | Found | Tokenized money market fund / onchain representation of Hashnote International Short Duration Yield Fund Ltd. |
| category | https://app.rwa.xyz/assets/USYC | Found | U.S. Treasuries / tokenized money market fund. |
| subcategory | https://www.circle.com/usyc | Found | Tokenized money market fund / short-duration U.S. government securities and reverse repo. |
| logoUrl | https://app.rwa.xyz/assets/USYC | Partial | RWA.xyz displays icon; production logo URL needs direct image URL. |
| websiteUrl | https://www.circle.com/usyc | Found | Circle product page is current product website. |
| docsUrl | https://usyc.docs.hashnote.com/getting-started/introduction | Found | Official docs. |
| twitterUrl | Not found | Not Found | Do not use unless official account is verified. |
| tags | https://www.circle.com/usyc | Partial | Suggested: tokenized treasury, money market fund, yield-bearing collateral, non-U.S. investor. |
| launchDate | https://app.rwa.xyz/assets/USYC | Partial | RWA.xyz lists inception date 05/01/2023; cross-check with official fund docs before production. |
| isin | https://app.rwa.xyz/assets/USYC | Not Found | RWA.xyz shows ISIN blank. |

### 6.2 Institutional

| Field | Source URL | Status | Notes |
|---|---|---|---|
| issuerName | https://www.circle.com/usyc | Found | Circle International Bermuda Limited / CIBL role appears in official source. |
| issuerType | https://www.circle.com/usyc | Partial | BMA-licensed digital asset business/token administrator; exact issuer vs token administrator should be modeled carefully. |
| issuerCountry | https://www.lei-lookup.com/record/254900HOS8Z6JFRRCO30 | Found | Bermuda for Circle International Bermuda Limited. |
| fundManager | https://www.circle.com/usyc | Partial | Circle/Hashnote context; exact fund manager should be confirmed from offering docs. |
| legalStructure | https://www.circle.com/usyc | Found | Digital representation of share of Hashnote International Short Duration Yield Fund Ltd., Cayman Islands registered mutual fund. |
| minimumInvestment | https://usyc.docs.hashnote.com/overview/investor-onboarding | Found | US$100,000 minimum investment in docs. RWA.xyz also shows 100,000 USDC. |
| managementFee | https://app.rwa.xyz/assets/USYC | Partial | RWA.xyz shows 0%; official Fees docs did not clearly list management fee. |
| performanceFee | https://usyc.docs.hashnote.com/overview/fees | Found | 10% of yield. |
| fundAdmin | https://usyc.docs.hashnote.com/overview/service-providers | Found | NAV Consulting. |
| transferAgent | Not found | Not Found | Product Structuring references transfer agent/share registry, but provider name was not found. |
| targetInvestors | https://www.circle.com/usyc | Found | Non-U.S. persons / eligible institutions. |
| prospectusUrl | Not found | Not Found | Offering document/prospectus not publicly found. |
| metadata | Multiple | Found | Store naming conflict, service providers, fee caveats, and supported chain caveats. |

### 6.3 Compliance

| Field | Source URL | Status | Notes |
|---|---|---|---|
| regulatoryStatus | https://www.circle.com/usyc | Partial | Fund described as Cayman Islands registered mutual fund; CIBL BMA-licensed digital asset business. |
| primaryRegulator | https://www.circle.com/usyc | Partial | BMA for CIBL; CIMA for Cayman mutual fund. Need exact production wording. |
| regulatoryFramework | https://www.circle.com/usyc | Partial | Regulation S / non-U.S. persons; Cayman mutual fund; Bermuda digital asset business licensing. |
| kycRequired | https://usyc.docs.hashnote.com/overview/investor-onboarding | Found | KYC/AML checks required. |
| accreditedOnly | https://www.circle.com/usyc | Partial | Non-U.S. persons; exact qualified/accredited investor criteria need fund documentation. |
| blockedJurisdictions | Not found | Not Found | Specific blocked jurisdictions not publicly found. |
| allowedJurisdictions | https://www.circle.com/usyc | Partial | Non-U.S. persons only; not a complete allowed jurisdiction list. |
| sanctionsScreening | https://usyc.docs.hashnote.com/overview/product-structuring | Found | Chainalysis onchain oracle sanctions checks. |
| amlPolicy | https://usyc.docs.hashnote.com/overview/investor-onboarding | Partial | KYC/AML process stated; formal policy not found. |
| lastComplianceCheck | Not applicable | Not Applicable | Internal field; set when analyst completes compliance review. |
| legalOpinionUrl | Not found | Not Found | Do not treat Terms/Legal Disclosures as legal opinion. |

### 6.4 Reserve

| Field | Source URL | Status | Notes |
|---|---|---|---|
| backingType | https://www.circle.com/usyc | Found | U.S. government securities / reverse repo; classify as US Treasury / Money Market Fund depending schema. |
| backingDescription | https://www.circle.com/usyc | Found | Invests in short-term, high-quality U.S. government securities and reverse repo. |
| collateralizationRatio | Not found | Not Found | Do not estimate. |
| custodian | Not found | Partial | Service Providers list prime broker/bank, not explicit custodian. RWA.xyz custodian field appears blank/locked. |
| custodianUrl | Not found | Not Found | Do not infer custodian from prime broker/bank. |
| hasProofOfReserves | Not found | Not Found | No explicit PoR source found; set false unless stronger source appears. |
| porOracleAddress | Not found | Not Found | USYC price oracle is not proof-of-reserves oracle. |
| porOracleChain | Not found | Not Found | Not applicable unless PoR oracle confirmed. |
| lastAuditDate | Not found | Not Found | Auditor listed, but public audit report/date not found. |
| lastAuditUrl | Not found | Not Found | No public audit/attestation report found. |
| auditor | https://usyc.docs.hashnote.com/overview/service-providers | Found | Hashnote docs list Cohen and Company. RWA.xyz shows Valaston International; source conflict. |
| reserveBreakdown | https://www.circle.com/usyc | Partial | Broad asset types only; no detailed breakdown found. |
| redemptionAsset | https://usyc.docs.hashnote.com/overview/subscription-and-redemption | Found | USDC. |

### 6.5 Blockchain

| Field | Source URL | Status | Notes |
|---|---|---|---|
| chain | https://usyc.docs.hashnote.com/overview/smart-contracts | Found | Ethereum, BSC, Solana in official docs. Circle page also lists Base, Canton, Ethereum, NEAR, Solana; needs further verification. |
| chainId | https://chainlist.org/ | Partial | Ethereum 1, BSC 56 are standard; Solana has no EVM chainId. Add only per schema rules. |
| contractAddress | https://usyc.docs.hashnote.com/overview/smart-contracts | Found | Ethereum: 0x136471a34f6ef19fE571EFFC1CA711fdb8E49f2b; BSC: 0x8D0fA28f221eB5735BC71d3a0Da67EE5bC821311; Solana: 7LWanZteUKtvFjv4MHYgKXXdAuCQYFPJysL9pxxdRQGn. |
| tokenStandard | https://usyc.docs.hashnote.com/overview/smart-contracts | Found | ERC-20, BEP-20, SPL22/token-2022. |
| isTransferable | https://usyc.docs.hashnote.com/overview/product-structuring | Found | Transferable only with permissions/allowlist; model as true with transfer restrictions. |
| hasWhitelist | https://usyc.docs.hashnote.com/overview/product-structuring | Found | Allowlist/Entitlements required. |
| hasTransferRestrictions | https://usyc.docs.hashnote.com/overview/product-structuring | Found | Entitlements contract checks sender/receiver permissions. |
| explorerUrl | Etherscan/BscScan/Solscan URLs above | Found | Use official explorer URLs. |
| deployedAt | Explorers | Partial | Not extracted in this pass; can be checked from contract creation tx. |
| isVerified | Etherscan/BscScan | Found | Code visible on explorers for Ethereum/BSC; Solana verification model differs. |

### 6.6 Liquidity

| Field | Source URL | Status | Notes |
|---|---|---|---|
| redemptionType | https://usyc.docs.hashnote.com/overview/subscription-and-redemption | Found | Onchain redemption via USYC Teller into USDC. |
| redemptionPeriodDays | https://www.circle.com/usyc | Partial | Below instant-redemption capacity settles in one block; above threshold T+0/T+1. Need production convention. |
| lockupPeriodDays | Not found | Not Found | No lockup found in public docs; do not set 0 unless confirmed. |
| earlyRedemptionFee | https://usyc.docs.hashnote.com/overview/fees | Found | Redemption fee listed as 3 bps in docs, with Circle page showing waiver conditions. |
| minRedemptionAmount | https://app.rwa.xyz/assets/USYC | Partial | RWA.xyz shows 0 USDC; cross-check with official docs before production. |
| dexPairs | Not found | Not Found | Not identified; token appears permissioned/institutional. |
| onchainLiquidity | https://www.circle.com/usyc | Partial | Circle describes instant/liquidity capacity; exact capacity not extracted. |
| bidAskSpread | Not found | Not Found | Not available. |
| liquidityScore | Derived later | Not Applicable | Score after evidence review. |
| liquidityNotes | Multiple | Found | Include instant capacity caveat, T+0/T+1 above threshold, PLT/private liquidity option. |

### 6.7 Market

| Field | Source URL | Status | Notes |
|---|---|---|---|
| tvl | https://app.rwa.xyz/assets/USYC | Found | Use Total Asset Value/AUM equivalent; refresh before import. |
| tvl7dChange | https://app.rwa.xyz/assets/USYC | Partial | Not clearly visible in extracted page. |
| tvl30dChange | https://app.rwa.xyz/assets/USYC | Found | RWA.xyz shows 30d change for total asset value in page snapshot. Refresh before import. |
| price | https://usyc.hashnote.com/api/price-reports | Found | Use latest API price; refresh before import. |
| priceChange24h | Not found | Not Found | May require API computation or secondary market data. |
| marketCap | https://app.rwa.xyz/assets/USYC | Partial | RWA.xyz provides total value; Etherscan provides Ethereum-only onchain market cap. |
| volume24h | Not found | Not Found | Not reliably found. |
| circulatingSupply | https://app.rwa.xyz/assets/USYC | Found | RWA.xyz provides aggregate and per-network supply; refresh before import. |
| totalSupply | https://usyc.hashnote.com/api/price-reports | Found | API includes totalSupply; RWA.xyz provides token supply. |
| holderCount | https://app.rwa.xyz/assets/USYC | Found | RWA.xyz aggregate holders; explorers per-chain. |
| holderChange7d | Not found | Not Found | Not extracted. |
| aumUsd | https://app.rwa.xyz/assets/USYC | Found | Use Total Asset Value/AUM; refresh before import. |
| lastUpdated | Source timestamp | Partial | Use API timestamp for price reports and research/import date for dashboard values. |
| sources | sources.json | Not Applicable | Populate after layer values are finalized. |
| confidence | Analyst assessment | Not Applicable | Populate after source-to-field mapping. |

### 6.8 Yield

| Field | Source URL | Status | Notes |
|---|---|---|---|
| currentYield | https://app.rwa.xyz/assets/USYC | Found | RWA.xyz shows 7D APY; official API supports interest/principal calculations. |
| yieldType | https://www.circle.com/usyc | Found | Yield-bearing collateral / money market fund exposure. |
| yieldFrequency | https://usyc.docs.hashnote.com/overview/token-price | Partial | Price reported once per business day; yield accrues through fund activity. |
| yieldBenchmark | Not found | Partial | Likely short-term U.S. Treasury/repo rate, but do not infer without methodology. |
| yieldVsBenchmark | Not found | Not Found | Not available. |
| yieldAvg7d | https://app.rwa.xyz/assets/USYC | Found | RWA.xyz 7D APY. |
| yieldAvg30d | https://app.rwa.xyz/assets/USYC | Found | RWA.xyz 30D APY. |
| yieldAvg90d | Not found | Not Found | Not extracted. |
| yieldMin52w | Not found | Not Found | Not extracted. |
| yieldMax52w | Not found | Not Found | Not extracted. |
| yieldStdDev30d | Not found | Not Found | Requires calculation or provider data; do not invent. |
| nextYieldDate | Not found | Partial | Token price reports occur business days; no explicit next yield date. |
| yieldCurrency | https://usyc.docs.hashnote.com/overview/subscription-and-redemption | Found | USDC/USD context. |

### 6.9 Risk

| Field | Source URL | Status | Notes |
|---|---|---|---|
| smartContractRisk evidence | https://etherscan.io/token/0x136471a34f6ef19fE571EFFC1CA711fdb8E49f2b | Partial | Explorer code available but Etherscan says no submitted contract security audit. |
| counterpartyRisk evidence | https://usyc.docs.hashnote.com/overview/service-providers | Partial | Prime broker, bank, fund administrator, KYC providers, MPC wallet listed. |
| liquidityRisk evidence | https://www.circle.com/usyc | Partial | Instant/T+0/T+1 liquidity claims; exact capacity and private liquidity terms not fully public. |
| regulatoryRisk evidence | https://www.circle.com/usyc | Partial | Non-U.S. persons, Reg S, Cayman mutual fund, BMA-licensed CIBL; no public legal opinion. |
| marketRisk evidence | https://app.rwa.xyz/assets/USYC | Partial | Market dashboard values, holders, active addresses, transfer volume. |
| concentrationRisk evidence | https://app.rwa.xyz/assets/USYC | Partial | Holder count exists but holder breakdown locked; use conservative scoring. |
| riskFactors | Multiple | Partial | Permissioned token, regulatory restriction, oracle dependency, service provider dependency, lack of public audit/PoR. |
| mitigants | Multiple | Partial | Official docs, regulated entities, transparent price API/oracle, allowlist/sanctions controls, institutional service providers. |

---

## 7. Data Gaps

### Identity

- [ ] Missing item: Confirm whether internal asset should be renamed from `Hashnote UYSC` to `Circle USYC` or `Hashnote USYC`.
  - Why it matters: Official sources consistently use `USYC`, not `UYSC`.
  - Suggested next source to check: Circle USYC page and Hashnote docs.
- [ ] Missing item: Direct logo URL.
  - Why it matters: Needed for frontend asset display.
  - Suggested next source to check: RWA.xyz image assets or Circle media kit.
- [ ] Missing item: Official social URL.
  - Why it matters: Avoid linking unofficial accounts.
  - Suggested next source to check: Circle/Hashnote footer and official media kit.

### Institutional

- [ ] Missing item: Public offering memorandum/prospectus.
  - Why it matters: Needed for institutional-grade legal structure verification.
  - Suggested next source to check: Investor portal, Circle customer support, fund documentation request.
- [ ] Missing item: Exact fund manager / investment manager legal name.
  - Why it matters: Avoid conflating token administrator, issuer, fund, and manager.
  - Suggested next source to check: Offering memorandum or CIMA fund record.
- [ ] Missing item: Transfer agent name.
  - Why it matters: Product Structuring references share registry but provider name was not found.
  - Suggested next source to check: Fund documents or service provider schedule.

### Compliance

- [ ] Missing item: Public legal opinion.
  - Why it matters: Institutional-grade legal scoring should not treat marketing/terms as legal opinion.
  - Suggested next source to check: Circle/Hashnote legal docs, investor portal, issuer support.
- [ ] Missing item: Full blocked/allowed jurisdiction list.
  - Why it matters: Compliance restrictions affect distribution and transferability.
  - Suggested next source to check: Offering memorandum or onboarding docs.
- [ ] Missing item: Formal AML/sanctions policy document.
  - Why it matters: KYC/AML process is described, but formal policy was not public.
  - Suggested next source to check: Investor onboarding package.

### Reserve

- [ ] Missing item: Public reserve/holdings report.
  - Why it matters: Needed for backing verification beyond high-level description.
  - Suggested next source to check: Investor portal, monthly fund report, administrator reports.
- [ ] Missing item: Custodian name and custody arrangement.
  - Why it matters: Prime broker/bank is not necessarily custodian.
  - Suggested next source to check: Fund documents and service provider schedule.
- [ ] Missing item: Collateralization ratio.
  - Why it matters: Should remain null unless explicitly stated.
  - Suggested next source to check: Fund report or NAV statement.
- [ ] Missing item: Public audit/attestation report and date.
  - Why it matters: Needed for reserveScore and institutional-grade audit trail.
  - Suggested next source to check: Auditor page, fund reports, investor portal.
- [ ] Missing item: Proof-of-reserves confirmation.
  - Why it matters: Price/NAV oracle is not automatically PoR.
  - Suggested next source to check: Official PoR documentation if any.

### Blockchain

- [ ] Missing item: Verify Base, Canton, and NEAR deployments.
  - Why it matters: Circle page lists these networks, while Hashnote docs currently list Ethereum, BSC, and Solana mainnet addresses.
  - Suggested next source to check: Updated smart-contract docs, Circle docs, official explorers.
- [ ] Missing item: Deployment dates.
  - Why it matters: Useful for historical context and risk review.
  - Suggested next source to check: Explorer contract creation transactions.
- [ ] Missing item: Independent smart contract audit report.
  - Why it matters: Explorers show no submitted audit; risk scoring should be conservative.
  - Suggested next source to check: Hashnote/Circle security docs, audit firm disclosures.

### Liquidity

- [ ] Missing item: Exact instant redemption capacity and thresholds.
  - Why it matters: Liquidity score depends on redemption speed and capacity.
  - Suggested next source to check: Circle product page, investor portal, private liquidity docs.
- [ ] Missing item: Private Liquidity Teller fee tiers.
  - Why it matters: Fees affect liquidity quality.
  - Suggested next source to check: Circle BD / investor docs.
- [ ] Missing item: Confirm minimum redemption amount from official source.
  - Why it matters: RWA.xyz shows 0 USDC, but official docs should be preferred.
  - Suggested next source to check: Subscription & Redemption docs or investor portal.

### Market

- [ ] Missing item: 24h volume and price change.
  - Why it matters: Needed for market.json completeness.
  - Suggested next source to check: CoinGecko exact USYC page, RWA.xyz API, explorers.
- [ ] Missing item: Holder change 7d.
  - Why it matters: Needed for market trend fields.
  - Suggested next source to check: RWA.xyz API or explorer analytics.
- [ ] Missing item: Exact DeFiLlama coverage.
  - Why it matters: Useful for automated TVL refresh if listed.
  - Suggested next source to check: DeFiLlama protocol/asset search.

### Yield

- [ ] Missing item: 90d APY, 52w min/max, 30d standard deviation.
  - Why it matters: Needed for complete yield.json.
  - Suggested next source to check: RWA.xyz API, Hashnote API historical data, internal calculation methodology.
- [ ] Missing item: Explicit benchmark.
  - Why it matters: Yield-vs-benchmark should not be inferred.
  - Suggested next source to check: USYC methodology docs or monthly reports.
- [ ] Missing item: Next yield date.
  - Why it matters: Docs describe business-day price reporting, but no explicit next yield date.
  - Suggested next source to check: API schedule or portal.

### Risk

- [ ] Missing item: Smart contract audit report.
  - Why it matters: Smart contract risk should remain conservative without it.
  - Suggested next source to check: Circle/Hashnote security disclosures.
- [ ] Missing item: Holder concentration breakdown.
  - Why it matters: RWA.xyz holder breakdown is locked; concentration risk cannot be measured fully.
  - Suggested next source to check: RWA.xyz account/API, explorer holder pages.
- [ ] Missing item: Public reserve/audit documentation.
  - Why it matters: Reserve/counterparty risk scoring needs evidence.
  - Suggested next source to check: Investor reports and auditor disclosures.

---

## 8. Source Conflicts

| Conflict | Source A | Source B | Preferred Source | Reason |
|---|---|---|---|---|
| Requested symbol/name `UYSC` vs official symbol `USYC` | User request / folder slug `hashnote-uysc` | Circle, Hashnote docs, RWA.xyz, Etherscan all use `USYC` | Official sources: `USYC` | No verified source found for `UYSC`; likely typo. |
| Available networks | Circle USYC page lists Base, Canton, Ethereum, NEAR, Solana | Hashnote Smart Contracts docs list Ethereum, BSC, Solana mainnet addresses | Use Hashnote Smart Contracts docs for contractAddress fields; track Circle list as partial | Contract addresses must not be inferred; only addresses from official docs/explorers should enter blockchain.json. |
| Auditor | Hashnote Service Providers lists Cohen and Company | RWA.xyz shows Valaston International | Prefer Hashnote Service Providers until confirmed | Official docs are Tier 1; RWA.xyz is Tier 2. Add note and verify from public audit/fund docs. |
| Fees | Hashnote Fees docs show subscription 4 bps and redemption 3 bps | RWA.xyz shows 0% subscription/redemption; Circle page notes waiver up to first $1M daily volume for eligible investors | Use Hashnote/Circle official docs with fee waiver caveat | RWA.xyz may show effective/summary fees; official docs explain standard fees and waiver conditions. |
| AUM/Total Value | Circle page displays one AUM figure; RWA.xyz and API/dashboard display different time-sensitive values | Multiple current dashboards | Use freshest source at import time and record timestamp | AUM is time-sensitive and must be refreshed, not hardcoded from source discovery. |

---

## 9. Reliability Assessment

| Area | Reliability Score | Reason |
|---|---:|---|
| Official source availability | 90 | Official Circle/Hashnote product pages, docs, legal pages, API, and contract docs were found. Main issue is UYSC vs USYC naming conflict. |
| Legal/compliance evidence | 65 | Non-U.S./Reg S/Cayman/BMA/CIMA/KYC evidence found, but no public legal opinion or prospectus found. |
| Reserve/backing evidence | 70 | Official sources state U.S. government securities and reverse repo, but no detailed public holdings report, custodian details, collateralization ratio, or reserve audit was found. |
| Blockchain evidence | 85 | Official contract docs and explorers found for Ethereum, BSC, and Solana. Additional networks from Circle page need address verification. |
| Market/yield evidence | 75 | RWA.xyz and official API provide strong data points, but values are time-sensitive and some historical fields require API/provider access. |
| Liquidity evidence | 75 | Official docs describe subscription/redemption and instant/T+0/T+1 mechanics, but exact capacity/thresholds and private liquidity terms remain incomplete. |
| Overall source quality | 78 | Strong foundation for analytic-grade dataset; institutional-grade requires prospectus/legal opinion, reserve reports, audit reports, and full concentration data. |

---

## 10. Analyst Notes

- First decision: correct the asset from `Hashnote UYSC` to `USYC` before production import, or store `UYSC` only as an internal typo/alias. All verified sources use `USYC`.
- Use Circle USYC page and Hashnote docs as Tier 1 sources for identity, structure, compliance, reserve description, liquidity, fees, and token mechanics.
- Use Hashnote Smart Contracts docs as the primary contract-address source. Do not infer Base, Canton, or NEAR contracts from Circle's network list until official addresses are found.
- Use the Hashnote price-reports API for price, principal, interest, balance, totalSupply, and timestamp fields. Refresh this data at import time.
- Use RWA.xyz as a secondary source for total asset value, APY, holders, chain supply, and market analytics. Do not override official docs with RWA.xyz where they conflict.
- `hasProofOfReserves` should remain `false` unless a source explicitly identifies a PoR mechanism. The USYC price/NAV oracle should not be treated as proof-of-reserves.
- `legalOpinionUrl`, `prospectusUrl`, `collateralizationRatio`, `lastAuditUrl`, `lastAuditDate`, and detailed `reserveBreakdown` should remain `null` until stronger evidence is found.
- Risk scoring should be conservative because public audit, reserve report, legal opinion, and concentration breakdown are incomplete.

---

## 11. Recommended Next Actions

1. Rename or normalize the asset identity from `Hashnote UYSC` to official `USYC` / `US Yield Coin` before filling production JSON.
2. Update `identity.json` with official name, symbol, category, description, websiteUrl, docsUrl, and naming-conflict note.
3. Fill `blockchain.json` first using only officially documented Ethereum, BSC, and Solana addresses.
4. Fill `institutional.json` and `compliance.json` from Circle USYC page, Product Structuring, Investor Onboarding, Terms, Legal Disclosures, and LEI data.
5. Fill `reserve.json` conservatively: backing type/description can be populated, but PoR, collateralization ratio, audit URL/date, and custodian should remain null/false unless stronger sources are found.
6. Fill `liquidity.json` from Subscription & Redemption, Circle FAQ, and Fees docs; include caveats around instant capacity and T+0/T+1 thresholds.
7. Refresh market/yield values from RWA.xyz and Hashnote price API immediately before import.
8. Build `sources.json` after all JSON fields are filled, linking each non-null field to its direct source URL.
9. Create `risk.json` last, using conservative scoring because public legal opinion, reserve audit, smart contract audit, and holder concentration evidence are incomplete.
10. Run validation/import scripts only after symbol conflict is resolved.

---

## Quality Check

- Direct official URLs found: yes.
- Source tiers assigned: yes.
- Usage types assigned: yes.
- All Nexus RWA layers covered: yes.
- Data gaps explicit: yes.
- Unsupported claims avoided: yes.
- Contract addresses guessed: no.
- Legal/compliance claim based only on marketing text: no; legal sources remain partial and flagged.
- Proof-of-reserves claimed: no.
- Output format: valid Markdown.
