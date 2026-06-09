# Source Discovery — Goldfinch GFI

## Primary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| identity, institutional, reserve, compliance, liquidity | Goldfinch official website | https://www.goldfinch.finance/ | Tier 1 | Official Goldfinch website. Describes Goldfinch Prime as onchain private credit exposure and links to docs, governance, app, legal, CoinGecko, CoinMarketCap, DeFiLlama, Dune, and GitHub. |
| identity, institutional, compliance, liquidity | Goldfinch official docs — Introduction | https://docs.goldfinch.finance/goldfinch | Tier 1 | Official documentation describing Goldfinch Prime and its private credit positioning. |
| institutional, compliance, liquidity, risk | Goldfinch official docs — FAQ | https://docs.goldfinch.finance/goldfinch/faq | Tier 1 | Official FAQ covering eligibility, KYC, unsupported jurisdictions, private credit exposure, fees, liquidity, and redemption policy. |
| liquidity, market, risk | Goldfinch V1 app | https://app.goldfinch.finance/ | Tier 1 | Official legacy app for Goldfinch V1 pools/deals. Useful for checking active/closed deals, liquidity, loan status, and V1 migration context. |
| blockchain, market, risk | Etherscan — GFI token contract | https://etherscan.io/token/0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b | Tier 1 | Ethereum ERC-20 token contract page. Confirms contract address, symbol, decimals, verified source code status, and absence of submitted contract security audit on Etherscan. |
| governance, identity | Goldfinch governance | https://gov.goldfinch.finance/ | Tier 1 | Official governance forum. Useful for protocol governance context and proposal history. |
| code, blockchain, risk | Goldfinch GitHub | https://github.com/goldfinch-eng/mono | Tier 1 | Official protocol code repository linked from official site and market-data pages. Use for deeper contract and protocol research. |

## Secondary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| market, blockchain, liquidity | CoinGecko — Goldfinch | https://www.coingecko.com/en/coins/goldfinch | Tier 2 | Market data, contract address, circulating supply, total supply, exchanges, categories, and external links. Volatile market fields must be refreshed before production import. |
| market, liquidity, yield, protocol metrics | DeFiLlama — Goldfinch | https://defillama.com/protocol/goldfinch | Tier 2 | TVL, active loans, protocol fees/revenue, liquidity, and APY data. Useful for market and liquidity layers, but should be cross-checked with official app where possible. |
| market | CoinMarketCap — Goldfinch | https://coinmarketcap.com/currencies/goldfinch-protocol/ | Tier 2 | Secondary market-data reference for price, market cap, volume, and supply. |
| analytics | Dune — Goldfinch dashboards | https://dune.com/search?q=goldfinch | Tier 3 | Community/analyst dashboards. Use only as supporting analytics after validating methodology. |

## Data Gaps

- Public legal opinion URL for GFI token: not found in initial source pass.
- Public reserve or proof-of-reserves page for GFI token: not applicable / not found. GFI is a governance/protocol token, not a tokenized claim on a specific reserve asset.
- Official current holder concentration report: not found in initial source pass. Use Etherscan holder distribution or dedicated analytics later.
- Official smart-contract audit report for the GFI token contract: Etherscan page shows no submitted contract security audit; deeper repo/security review is still needed.
- Exact GFI launch date should be confirmed from official token launch/governance docs before promoting beyond research-grade.

## Analyst Notes

- Treat `goldfinch-gfi` as a **RWA protocol / private credit infrastructure token**, not as a direct tokenized private-credit fund share.
- Do not score GFI like OUSG, USDY, USTB, BENJI, or PAXG because it is not a redeemable asset backed by Treasuries/gold/fund shares.
- Market fields are volatile and should be refreshed before production import.
- Yield data from DeFiLlama appears tied to protocol pools, not native GFI token yield. Do not put pool APY into `yield.json` unless the product scope explicitly tracks protocol pool yield rather than GFI token yield.
- Liquidity and redemption fields should distinguish between trading GFI on exchanges/DEXs and redemption policy for Goldfinch Prime/V1 credit products.
