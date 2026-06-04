# Source Discovery — Paxos Gold (PAXG)

## Asset Summary

- **Asset name:** Paxos Gold / Pax Gold
- **Symbol:** PAXG
- **Issuer:** Paxos Trust Company / Paxos Trust Company, N.A.
- **Asset category:** Commodity-backed RWA
- **Backing type:** Allocated physical gold / London Good Delivery gold
- **Nexus onboarding concern:** PAXG harus diperlakukan sebagai token komoditas berbasis emas fisik, bukan Treasury fund dan bukan yield-bearing asset.

PAXG adalah token ERC-20 yang merepresentasikan kepemilikan atas emas fisik. Fokus utama onboarding ke Nexus RWA adalah validasi issuer, struktur legal, cadangan emas, laporan attestation, status regulasi, kontrak token, redemption rules, dan likuiditas pasar sekunder.

---

## Primary Sources

| Layer | Source | URL | Tier | Reliability | Notes |
|---|---|---|---|---:|---|
| identity, reserve, institutional | Official Paxos PAXG product page | https://www.paxos.com/pax-gold | Tier 1 | 95 | Sumber utama untuk nama aset, issuer, deskripsi produk, backing emas, custody, dan positioning PAXG. |
| identity, institutional, compliance | Paxos PAXG launch announcement | https://www.paxos.com/newsroom/paxos-launches-pax-gold-physical-gold-on-the-blockchain | Tier 1 | 90 | Mendukung launch date, NYDFS approval at launch, ERC-20 design, dan konteks awal penerbitan PAXG. |
| reserve | PAXG Transparency / Attestation Reports | https://www.paxos.com/paxg-transparency | Tier 1 | 95 | Sumber utama untuk monthly attestation, reserve report, auditor/attestation provider, dan audit trail cadangan. |
| reserve, liquidity, institutional, compliance | PAX Gold Terms and Conditions | https://www.paxos.com/terms-and-conditions/pax-gold-terms-conditions | Tier 1 | 95 | Sumber utama untuk backing mechanics, ownership, custody, redemption, conversion, transferability, dan legal restrictions. |
| institutional, compliance | Paxos General Terms and Conditions | https://www.paxos.com/terms-and-conditions/general-terms-and-conditions | Tier 1 | 90 | Mendukung legal entity, user obligations, platform terms, dan compliance framework umum Paxos. |
| compliance, institutional | Paxos Company / Regulation Overview | https://www.paxos.com/company | Tier 1 | 90 | Mendukung status Paxos sebagai regulated entity, trust-company/national trust context, dan regulatory positioning. |
| compliance, regulatory | NYDFS PAXG Authorization | https://www.dfs.ny.gov/reports_and_publications/press_releases/pr1909051 | Tier 1 | 95 | Sumber regulator untuk approval awal PAXG dan standar AML, anti-fraud, consumer protection, serta cybersecurity. |
| compliance, regulatory | OCC Paxos Approval Announcement | https://www.occ.gov/news-issuances/news-releases/2025/nr-occ-2025-125.html | Tier 1 | 95 | Mendukung konteks federal charter / national trust bank conversion untuk Paxos. |
| compliance, regulatory | OCC Paxos Approval Letter PDF | https://www.occ.gov/news-issuances/news-releases/2025/nr-occ-2025-125e.pdf | Tier 1 | 95 | Sumber regulator untuk status legal/regulatory Paxos Trust Company, N.A. |
| blockchain, market, risk | Etherscan PAXG Contract | https://etherscan.io/address/0x45804880de22913dafe09f4980848ece6ecbaf78 | Tier 1 | 90 | Sumber utama untuk contract address, verified source code, proxy/implementation, token activity, dan smart contract review. |
| blockchain, market | Etherscan PAXG Token Tracker | https://etherscan.io/token/0x45804880de22913dafe09f4980848ece6ecbaf78 | Tier 1 / Tier 2 | 85 | Sumber untuk supply, holder count, transfer activity, dan token metadata on-chain. |

---

## Secondary Sources

| Layer | Source | URL | Tier | Reliability | Notes |
|---|---|---|---|---:|---|
| market, liquidity | CoinGecko PAXG | https://www.coingecko.com/en/coins/pax-gold | Tier 2 | 80 | Untuk price, market cap, volume, circulating supply, exchange markets, dan historical price. |
| market, liquidity | CoinMarketCap PAXG | https://coinmarketcap.com/currencies/pax-gold | Tier 2 | 80 | Untuk price, market cap, volume 24h, supply, ranking, dan market pairs. |
| market, RWA context | DeFiLlama Paxos Gold | https://defillama.com/protocol/paxos-gold | Tier 2 | 75 | Untuk RWA/protocol context jika tersedia. Jangan dipakai sebagai sumber legal/reserve utama. |
| market context, risk context | Reuters tokenized gold market coverage | https://www.reuters.com/business/finance/precious-metal-price-fluctuations-could-test-fast-growing-gold-token-market-2026-02-03/ | Tier 3 | 70 | Hanya untuk konteks pasar tokenized gold. Tidak dipakai untuk field struktural utama. |
| market context | CoinDesk PAXG inflow article | https://www.coindesk.com/markets/2026/01/28/paxos-gold-token-rakes-in-record-inflows-as-crypto-investors-turn-to-the-yellow-metal | Tier 3 | 65 | Hanya untuk konteks adopsi/market narrative. |
| regulatory context | Reuters OCC / Paxos national trust bank article | https://www.reuters.com/sustainability/boards-policy-regulation/us-regulator-grants-crypto-firms-initial-approval-launch-trust-banks-2025-12-12/ | Tier 3 | 75 | Hanya sebagai konteks sekunder karena sumber primer OCC tersedia. |

---

## Source-to-Layer Mapping

### identity.json

Use primary sources:

- https://www.paxos.com/pax-gold
- https://www.paxos.com/newsroom/paxos-launches-pax-gold-physical-gold-on-the-blockchain
- https://www.paxos.com/terms-and-conditions/pax-gold-terms-conditions

Fields supported:

- name
- symbol
- fullName
- category
- subcategory
- description
- websiteUrl
- launchDate
- tags

Notes:

- `category` should be `Commodities` or `Commodity`.
- `subcategory` should be `Tokenized Gold` or `Gold-backed Token`.
- Do not classify PAXG as Treasury, money-market fund, private credit, or yield-bearing fund.

---

### blockchain.json

Use primary sources:

- https://etherscan.io/address/0x45804880de22913dafe09f4980848ece6ecbaf78
- https://etherscan.io/token/0x45804880de22913dafe09f4980848ece6ecbaf78
- https://www.paxos.com/terms-and-conditions/pax-gold-terms-conditions
- https://www.paxos.com/newsroom/paxos-launches-pax-gold-physical-gold-on-the-blockchain

Fields supported:

- chain
- chainId
- contractAddress
- tokenStandard
- explorerUrl
- isVerified
- transferability
- transfer restrictions

Known reference:

- Ethereum contract address: `0x45804880De22913dAFE09f4980848ECE6EcbAf78`
- Token standard: ERC-20
- Chain: Ethereum mainnet
- Chain ID: 1

Important:

- Manual contract review is still required before setting:
  - `hasWhitelist`
  - `hasBlacklist`
  - `hasPause`
  - `isUpgradeable`
  - `transferRestrictions`

---

### reserve.json

Use primary sources:

- https://www.paxos.com/pax-gold
- https://www.paxos.com/paxg-transparency
- https://www.paxos.com/terms-and-conditions/pax-gold-terms-conditions

Fields supported:

- backingType
- backingDescription
- collateralizationRatio
- custodian
- custodianUrl
- hasProofOfReserves
- porOracleAddress
- lastAuditDate
- lastAuditUrl
- auditor
- reserveBreakdown
- redemptionAsset

Important:

- PAXG is backed by physical gold, specifically London Good Delivery gold.
- Each PAXG represents one fine troy ounce of gold according to Paxos disclosures.
- Monthly attestation reports are available from Paxos.
- Monthly attestations are **not** on-chain proof-of-reserves.
- Do not set `hasProofOfReserves: true` unless an explicit on-chain PoR oracle is found.
- Recommended handling:
  - `hasProofOfReserves`: false
  - `porOracleAddress`: null
  - `porOracleChain`: null
  - `hasAttestation`: true, if schema supports this field.

---

### institutional.json

Use primary sources:

- https://www.paxos.com/pax-gold
- https://www.paxos.com/company
- https://www.paxos.com/terms-and-conditions/pax-gold-terms-conditions
- https://www.paxos.com/terms-and-conditions/general-terms-and-conditions
- https://www.occ.gov/news-issuances/news-releases/2025/nr-occ-2025-125.html
- https://www.occ.gov/news-issuances/news-releases/2025/nr-occ-2025-125e.pdf

Fields supported:

- issuerName
- issuerType
- issuerCountry
- legalStructure
- fundManager
- minimumInvestment
- fees
- targetInvestors
- prospectus or legal documents

Notes:

- `fundManager`: not applicable.
- PAXG is not a fund.
- Use PAX Gold Terms and Conditions as the primary legal document, not a prospectus.
- Current fees/minimums should be verified from current Paxos fee schedule or customer terms before final layer JSON.

---

### compliance.json

Use primary sources:

- https://www.dfs.ny.gov/reports_and_publications/press_releases/pr1909051
- https://www.paxos.com/company
- https://www.paxos.com/terms-and-conditions/pax-gold-terms-conditions
- https://www.paxos.com/terms-and-conditions/general-terms-and-conditions
- https://www.occ.gov/news-issuances/news-releases/2025/nr-occ-2025-125.html
- https://www.occ.gov/news-issuances/news-releases/2025/nr-occ-2025-125e.pdf

Fields supported:

- regulatoryStatus
- primaryRegulator
- regulatoryFramework
- kycRequired
- accreditedOnly
- blockedJurisdictions
- sanctionsScreening
- amlPolicy
- legalOpinionUrl

Important:

- NYDFS approved/authorized Paxos to offer PAXG at launch.
- Paxos regulatory status should be reviewed carefully because Paxos has state trust and OCC/national trust bank context.
- Direct purchase, conversion, and redemption through Paxos require verified customer status.
- Do not claim `accreditedOnly: true` unless an official source confirms it.
- No public legal opinion URL was found in this discovery pass.

---

### market.json

Use primary and secondary sources:

- https://etherscan.io/token/0x45804880de22913dafe09f4980848ece6ecbaf78
- https://www.coingecko.com/en/coins/pax-gold
- https://coinmarketcap.com/currencies/pax-gold
- https://defillama.com/protocol/paxos-gold

Fields supported:

- price
- marketCap
- volume24h
- circulatingSupply
- totalSupply
- holderCount
- lastUpdated

Recommended source usage:

- Use Etherscan for:
  - totalSupply
  - holderCount
  - token activity
  - contract metadata
- Use CoinGecko / CoinMarketCap for:
  - price
  - marketCap
  - volume24h
  - circulatingSupply
  - exchange liquidity
- Use DeFiLlama only if relevant protocol/RWA context exists.

Important:

- `lastUpdated` should be ingestion timestamp from Nexus pipeline.
- Do not treat market cap as reserve value without reconciliation against official reserve attestations.

---

### yield.json

Use primary sources:

- https://www.paxos.com/pax-gold
- https://www.paxos.com/terms-and-conditions/pax-gold-terms-conditions

Conclusion:

PAXG does not appear to generate native yield. It is a tokenized physical gold asset, not a Treasury fund, credit product, money-market product, or yield-bearing vault.

Recommended handling:

- `currentYield`: null
- `yieldType`: null or `not_applicable`
- `yieldFrequency`: null
- `yieldBenchmark`: null
- `yieldVsBenchmark`: null
- `yieldAvg7d`: null
- `yieldAvg30d`: null
- `yieldAvg90d`: null
- `nextYieldDate`: null
- `yieldCurrency`: null

Important:

- If PAXG is used inside a DeFi lending protocol, that yield belongs to the DeFi strategy, not to native PAXG.

---

### liquidity.json

Use sources:

- https://www.paxos.com/terms-and-conditions/pax-gold-terms-conditions
- https://www.coingecko.com/en/coins/pax-gold
- https://coinmarketcap.com/currencies/pax-gold
- https://etherscan.io/token/0x45804880de22913dafe09f4980848ece6ecbaf78

Fields supported:

- redemptionType
- redemptionPeriodDays
- lockupPeriodDays
- earlyRedemptionFee
- minRedemptionAmount
- dexPairs
- onchainLiquidity
- bidAskSpread
- liquidityNotes

Notes:

- Direct redemption/conversion is governed by Paxos terms.
- Secondary market transferability exists, but direct mint/redeem with Paxos requires verified customer status.
- DEX pairs, CEX pairs, volume, and liquidity depth should be sourced from market aggregators or exchange/order-book data.
- `bidAskSpread` likely requires exchange-level or order-book source.

---

### risk.json

Use sources:

- https://www.paxos.com/pax-gold
- https://www.paxos.com/paxg-transparency
- https://www.paxos.com/terms-and-conditions/pax-gold-terms-conditions
- https://www.dfs.ny.gov/reports_and_publications/press_releases/pr1909051
- https://www.occ.gov/news-issuances/news-releases/2025/nr-occ-2025-125.html
- https://www.occ.gov/news-issuances/news-releases/2025/nr-occ-2025-125e.pdf
- https://etherscan.io/address/0x45804880de22913dafe09f4980848ece6ecbaf78
- https://etherscan.io/token/0x45804880de22913dafe09f4980848ece6ecbaf78
- https://www.coingecko.com/en/coins/pax-gold
- https://coinmarketcap.com/currencies/pax-gold

Risk categories supported:

- smartContractRisk
- counterpartyRisk
- reserveRisk
- liquidityRisk
- regulatoryRisk
- marketRisk
- concentrationRisk

Notes:

- `smartContractRisk` requires manual review of verified Etherscan source code and any proxy/admin privileges.
- `counterpartyRisk` should reflect dependence on Paxos as issuer/custodian/operator.
- `reserveRisk` should distinguish physical gold backing and attestation cadence from on-chain PoR.
- `marketRisk` should reflect exposure to gold price volatility.
- `concentrationRisk` requires top-holder analysis from Etherscan or indexed holder data.

---

## Data Gaps

- `reserve.hasProofOfReserves`: No explicit on-chain PoR oracle found.
- `reserve.porOracleAddress`: No official PoR oracle address found.
- `reserve.porOracleChain`: Not applicable unless an official PoR oracle is found.
- `reserve.lastAuditUrl`: Latest exact monthly attestation PDF/report must be pinned during reserve layer work.
- `reserve.reserveBreakdown`: Exact latest bar/ounce allocation requires latest attestation and/or Paxos allocation source.
- `institutional.fundManager`: Not applicable because PAXG is not a fund.
- `institutional.prospectusUrl`: No fund prospectus found; use PAXG Terms instead.
- `institutional.minimumInvestment`: Current minimum purchase/redemption amount needs confirmation from current Paxos source.
- `institutional.fees`: Current fee schedule needs confirmation from current Paxos source.
- `compliance.primaryRegulator`: Needs careful current-date treatment because NYDFS and OCC/national trust context both exist.
- `compliance.accreditedOnly`: No official source found confirming accredited-investor-only status.
- `compliance.blockedJurisdictions`: Needs extraction from current Paxos terms.
- `compliance.amlPolicy`: AML requirements are referenced, but a dedicated public AML policy URL was not identified in this pass.
- `compliance.legalOpinionUrl`: No public legal opinion URL found.
- `blockchain.hasWhitelist`: Not confirmed; requires contract review.
- `blockchain.hasBlacklist`: Not confirmed; requires contract review.
- `blockchain.hasPause`: Not confirmed; requires contract review.
- `blockchain.isUpgradeable`: Needs Etherscan proxy/implementation review.
- `blockchain.transferRestrictions`: Legal restrictions are known, but smart-contract-level restrictions require review.
- `market.tvl`: Not directly applicable unless using DeFiLlama protocol data; should not be confused with reserve value.
- `market.holderChange7d`: Requires indexed historical holder snapshots.
- `liquidity.redemptionPeriodDays`: No verified public source found in this pass.
- `liquidity.lockupPeriodDays`: No verified public source found in this pass.
- `liquidity.earlyRedemptionFee`: No verified public source found in this pass.
- `liquidity.minRedemptionAmount`: Needs current official confirmation.
- `liquidity.bidAskSpread`: Requires exchange/order-book source.
- `yield.currentYield`: Not applicable unless official Paxos yield source exists.
- `yield.yieldAvg7d`: Not applicable.
- `yield.yieldAvg30d`: Not applicable.
- `yield.yieldAvg90d`: Not applicable.
- `risk.smartContractAuditUrl`: No official smart-contract audit URL found in this pass.
- `risk.concentrationRisk`: Needs top-holder distribution analysis.

---

## Analyst Notes

- PAXG should be treated as a **commodity-backed token**, not a Treasury RWA.
- PAXG should not be forced into fund-style fields such as fund manager, management fee, performance fee, prospectus, or yield.
- Monthly attestations are useful reserve evidence but are **not** on-chain proof-of-reserves.
- `yield.json` should mostly contain null or not-applicable values unless Paxos publishes an official native yield mechanism.
- Direct mint/redeem with Paxos appears to require verified customer status.
- Secondary market transferability should be separated from direct Paxos redemption eligibility.
- Risk scoring should be conservative until the following are reviewed:
  - latest attestation report
  - contract admin controls
  - blacklist/whitelist/pause/upgrade functions
  - top-holder concentration
  - current redemption rules
  - current Paxos regulatory status
  - legal opinion availability

---

## Recommended Next Step

1. Create `identity.json` from Paxos product page, launch announcement, and PAXG terms.
2. Create `blockchain.json` from Etherscan and manual contract review.
3. Create `reserve.json` from PAXG terms and latest monthly attestation.
4. Create `institutional.json` from Paxos company page, general terms, PAXG terms, NYDFS, and OCC sources.
5. Create `compliance.json` from NYDFS, OCC, Paxos terms, and Paxos regulatory disclosures.
6. Create `market.json` from Etherscan, CoinGecko, and CoinMarketCap.
7. Create `yield.json` as non-yield-bearing / not applicable.
8. Create `liquidity.json` from Paxos redemption terms and market liquidity sources.
9. Create `sources.json` from this source-discovery file.
10. Create `risk.json` after reserve, contract, liquidity, compliance, and concentration review.
