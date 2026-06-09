# Source Discovery — Goldfinch GFI

## Research Scope

This discovery file is scoped to **Goldfinch GFI** for Nexus RWA.

Important distinction:

- `GFI` is the Goldfinch protocol token on Ethereum.
- `Goldfinch Prime` is the current private-credit product experience promoted by Goldfinch.
- `Goldfinch V1` refers to the legacy lending-pool app.

For grading, do **not** treat GFI as a direct redeemable note, fund share, Treasury token, gold token, or collateralized reserve token. GFI should initially be classified as **RWA private-credit protocol infrastructure / governance token** until legal, reserve, liquidity, and risk layers prove otherwise.

---

## Primary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| identity, institutional, reserve, compliance, liquidity, yield, risk | Goldfinch official website | https://www.goldfinch.finance/ | Tier 1 | Official Goldfinch site. Describes Goldfinch Prime as onchain exposure to institutional private credit funds. It links to the Prime app, legacy app, governance, docs, GitHub, legal pages, CoinGecko, CoinMarketCap, DeFiLlama, Dune, X, Discord, and community channels. Use as the starting source map, not as the only evidence source. |
| identity, institutional, reserve, compliance, liquidity, yield, risk | Goldfinch Docs — Introduction and Overview | https://docs.goldfinch.finance/goldfinch | Tier 1 | Official docs. States Goldfinch Prime brings institutional private credit onchain and describes exposure to private credit managers through USDC/Base. Supports identity, product positioning, institutional structure, reserve/backing interpretation, and risk framing. |
| institutional, compliance, reserve, liquidity, yield, risk | Goldfinch Docs — FAQ | https://docs.goldfinch.finance/goldfinch/faq | Tier 1 | Official FAQ. Key source for Goldfinch Prime eligibility, KYC, unsupported jurisdictions, private credit exposure, Heron entities / contingent payment notes, fees, quarterly redemption process, no lockup, and private credit risks. Do not transfer these terms directly to GFI token without noting product scope. |
| compliance, institutional, risk | Goldfinch Prime Terms | https://prime.goldfinch.finance/terms | Tier 1 | Official Goldfinch Prime legal page. Access may be region-restricted; current page states Goldfinch Prime is offered only to individual purchasers outside the U.S. and other restricted jurisdictions. Use as compliance evidence and note access restrictions. |
| compliance, institutional, risk | Goldfinch V1 App Terms of Service | https://app.goldfinch.finance/terms | Tier 1 | Official legacy-app terms. Names Goldfinch Technology Company as the company behind the Website/Services, includes eligibility, risk disclaimers, California governing law, dispute resolution, and limitation of liability. Use for legacy protocol/legal context only. |
| liquidity, market, risk | Goldfinch V1 App | https://app.goldfinch.finance/ | Tier 1 | Official legacy app for pre-Goldfinch Prime pools. Use to verify legacy pool status, claim/payment interface, loan/pool maturity status, and V1 migration context. |
| blockchain, market, liquidity, risk | Etherscan — GFI ERC-20 token contract | https://etherscan.io/token/0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b | Tier 1 | Official Ethereum explorer page for GFI token. Supports contract address, token name/symbol, ERC-20 classification, transfers, holders, contract source-code status, exchange links, and token metadata. Use holder and transfer data for concentration/liquidity checks. |
| blockchain, code, risk | Goldfinch GitHub Monorepo | https://github.com/goldfinch-eng/mono | Tier 1 | Official Goldfinch monorepo containing smart contracts, frontends, and supporting code. Use for contract architecture, protocol code, historical development, security review, and risk evidence. |
| governance, institutional, risk | Goldfinch Governance Forum | https://gov.goldfinch.finance/ | Tier 1 | Official governance forum. Use for governance process, proposals, borrower updates, governance-risk context, and historical protocol decisions. |
| community, identity, risk | Goldfinch X / Twitter | https://x.com/goldfinch_fi | Tier 1 | Official social channel linked from Goldfinch docs/site. Use only for current announcements or pointers to official docs. Do not use as primary evidence for numeric or legal fields. |
| institutional, compliance, partner context, risk | Heron Finance | https://www.heronfinance.com/ | Tier 1 / Partner | Heron is referenced in Goldfinch Prime FAQ as the Manager issuing contingent payment notes backed by equity interests in third-party private credit funds. Use for partner/product context, but verify regulatory claims through SEC/IAPD before production grading. |
| regulatory, institutional, compliance | SEC Investment Adviser Public Disclosure Search — Heron Finance / Warbler Labs | https://adviserinfo.sec.gov/ | Tier 1 / Regulator | Use SEC IAPD to verify whether Heron Finance or related adviser entity is currently registered, exempt, withdrawn, or has Form ADV data. A direct firm result was not confirmed during this pass, so this remains a required manual verification step. |
| regulatory, institutional, compliance | SEC EDGAR Full Text Search — Goldfinch / Heron / Warbler | https://www.sec.gov/edgar/search/ | Tier 1 / Regulator | Use EDGAR to search for Goldfinch Technology Company, Warbler Labs, Heron Finance, relevant Heron entities, contingent payment note issuers, and underlying private-credit fund references. No direct GFI filing was confirmed during this pass. |

---

## Secondary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| market, liquidity, yield, risk | DeFiLlama — Goldfinch | https://defillama.com/protocol/goldfinch | Tier 2 | Protocol metrics source. Supports TVL, chain exposure, fees/revenue, active loans, GFI price, volume, liquidity, and methodology. Good for market/liquidity/yield context, but should be cross-checked against official app and explorer data before production import. |
| market, blockchain, liquidity, risk | CoinGecko — Goldfinch | https://www.coingecko.com/en/coins/goldfinch | Tier 2 | Market data source. Supports GFI contract address, price, market cap, volume, exchange markets, categories, security-provider links, external links, and API ID `goldfinch`. Volatile fields must be refreshed close to import time. |
| market, liquidity | CoinMarketCap — Goldfinch Protocol | https://coinmarketcap.com/currencies/goldfinch-protocol/ | Tier 2 | Secondary market-data source for price, market cap, volume, supply, and exchange listings. Use to cross-check CoinGecko and DeFiLlama values. |
| market, liquidity | GeckoTerminal — GFI trading pools | https://www.geckoterminal.com/ | Tier 2 | Use by searching the GFI contract or GFI/WETH pool. Supports DEX liquidity, pair-level volume, and price impact context. Must capture specific pair URL when used in market/liquidity layer. |
| analytics, liquidity, market, risk | Dune — Goldfinch dashboards | https://dune.com/search?q=goldfinch | Tier 3 | Community and analyst dashboards. Useful for onchain trends, but only after validating query methodology and update time. Do not use as sole source for production fields. |
| security, smart-contract risk | CertiK Skynet / CoinGecko linked security data | https://coingecko.certik-skynet.com/ | Tier 3 | CoinGecko links to third-party security information. Use only as supporting security context; obtain actual audit reports or official security docs before scoring smart-contract risk. |
| security, smart-contract risk | CER.live security profile | https://cer.live/ | Tier 3 | CoinGecko links to CER.live security details. Use only as supporting context, not as primary audit evidence. |
| news, institutional, regulatory context | Axios — Warbler Labs launches SEC-registered robo-adviser on a blockchain | https://www.axios.com/2023/12/05/exclusive-robo-advisor-blockchain-heron-goldfinch | Tier 3 | Reputable media context that reports Warbler Labs / Goldfinch founders launched Heron Finance and describes it as SEC-registered as of 2023. Must be verified against SEC IAPD before used as regulatory evidence. |
| context, historical protocol narrative | Goldfinch Medium | https://medium.com/goldfinch-fi | Tier 3 | Historical announcements and protocol narrative. Use only for context and to locate primary sources. Not sufficient for legal, reserve, or production-grade financial fields. |
| context, updates | Goldfinch Substack | https://goldfinch.substack.com/ | Tier 3 | Community/newsletter context. Use only for narrative, launch history, and pointers to primary sources. |
| academic/contextual RWA liquidity risk | RWA liquidity research using RWA.xyz / Etherscan observations | https://arxiv.org/abs/2606.01131 | Tier 3 | Contextual academic paper on RWA liquidity. Not asset-primary evidence. Can support generic liquidity-risk framework only, not Goldfinch-specific fields. |

---

## Data Gaps

- **Direct legal opinion for GFI token:** Not found. Do not mark `legalOpinionUrl` as available unless a public legal opinion is found.
- **SEC EDGAR filing directly for GFI:** Not confirmed. EDGAR should be searched manually for Goldfinch Technology Company, Warbler Labs, Heron Finance, Heron entities, and any note issuer names.
- **SEC/IAPD direct adviser profile for Heron Finance / Warbler Labs:** Not confirmed in this pass. Axios reports SEC registration for Heron Finance, but production data must verify through SEC IAPD or Form ADV.
- **Transfer agent:** Not found for GFI. Goldfinch Prime may have product-level service providers, but none should be inferred for GFI.
- **Custodian:** Not found for GFI. Goldfinch Prime underlying exposure may involve fund/custody arrangements, but these are product-level and require separate verification.
- **Reserve / proof-of-reserves:** No public onchain PoR or reserve oracle found for GFI. GFI is a protocol token, not a tokenized claim on a specific reserve asset.
- **Collateralization ratio:** Not applicable / not found for GFI. Do not estimate.
- **Auditor / formal smart-contract audit report:** Not confirmed from official source during this pass. Etherscan and GitHub are available for code verification, but an actual audit report must be found separately before scoring audit coverage.
- **Holder concentration report:** No official concentration report found. Use Etherscan holders and possibly Dune/Nansen/Arkham-style analytics later, with methodology notes.
- **GFI launch date:** Needs confirmation from official token launch announcement, governance documentation, or contract deployment history before filling `launchDate`.
- **Current market fields:** Price, market cap, volume, liquidity, TVL, and active-loan metrics are volatile. Refresh from CoinGecko, DeFiLlama, CoinMarketCap, and Etherscan close to import time.
- **Yield field scope:** Goldfinch Prime / protocol pool yields are not native GFI token yield. Do not place pool APY in `yield.json` unless Nexus RWA explicitly models Goldfinch Prime or pool products separately.
- **RWA.xyz profile:** A reliable direct RWA.xyz Goldfinch profile URL was not confirmed during this pass. Search RWA.xyz manually before final production grading.

---

## Notes for Analyst

- Use **source hierarchy strictly**: official Goldfinch / Heron / regulator / explorer first; market aggregators second; media and analytics third.
- The cleanest Nexus classification for now is: `Private Credit` category, `RWA protocol governance token` subcategory, `research-grade` until legal/regulatory and risk gaps are closed.
- Consider whether Nexus RWA should create separate entries later:
  - `goldfinch-gfi` — protocol/governance token.
  - `goldfinch-prime` — private-credit product / portfolio exposure.
  - Individual Goldfinch V1 pools — legacy private-credit deals, if data remains accessible.
- For `reserve.json`, write clearly that GFI itself is **not** a direct reserve-backed asset. Any discussion of contingent payment notes, BDC exposure, underlying private-credit funds, quarterly redemption, and management/withdrawal fees belongs to Goldfinch Prime product research, not raw GFI token backing.
- For `compliance.json`, the Goldfinch Prime FAQ says participation requires KYC and excludes Cuba, North Korea, Iran, Sudan, Syria, Ukraine, Russia, United Kingdom, and United States. This should be treated as product-level compliance evidence, not necessarily a transfer restriction on GFI token.
- For `liquidity.json`, separate two kinds of liquidity:
  - GFI token liquidity: DEX/CEX trading, holders, transfer activity, exchange depth.
  - Goldfinch Prime liquidity: quarterly best-effort withdrawals, no lockup, no redemption penalty per FAQ.
- For `yield.json`, GFI token yield should remain `null` unless an official staking/reward mechanism is verified. Goldfinch Prime/private-credit yield should be tracked only if a separate product asset is modeled.
- For `risk.json`, initial risk should remain conservative because this is not a simple tokenized asset with clear NAV, custodian, legal opinion, audit, and redemption mechanics.
- Recommended next research order:
  1. Verify GFI contract details and holders on Etherscan.
  2. Verify Heron/Warbler regulatory status in SEC IAPD and EDGAR.
  3. Search official docs/governance for GFI token launch and tokenomics.
  4. Search official GitHub/security pages for audit reports.
  5. Refresh market/liquidity metrics from DeFiLlama, CoinGecko, CoinMarketCap, and DEX pool pages.
  6. Decide whether Goldfinch Prime deserves a separate Nexus RWA asset entry.
