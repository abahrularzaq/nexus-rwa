# Source Discovery — Tether Gold / XAUT

## Asset

- Asset: Tether Gold
- Symbol: XAUT / XAU₮
- Slug: `tether-gold-xaut`
- Category: Commodity
- Subcategory: Tokenized Gold
- Initial status: source discovery baseline, pending full field-level verification

## Primary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| identity, reserve, liquidity | Tether Gold official website | https://gold.tether.to/ | Tier 1 | Official product website for Tether Gold / XAU₮. |
| reserve, institutional, risk | Tether Gold reserve reports | https://gold.tether.to/reports | Tier 1 | Candidate source for reserve backing, independent accountant reports, and gold reserve disclosures. Verify latest report manually before filling production data. |
| reserve, liquidity, compliance | Tether Gold FAQ | https://gold.tether.to/faq | Tier 1 | Candidate source for redemption, ownership claim, wallet/account requirements, and product mechanics. |
| institutional, liquidity | Tether Gold fees | https://gold.tether.to/fees | Tier 1 | Candidate source for purchase/redemption fee structure and minimums. |
| compliance, institutional | Tether Gold terms | https://gold.tether.to/legal | Tier 1 | Candidate source for legal structure, eligibility, restricted jurisdictions, and user terms. |
| blockchain | Etherscan XAUT token contract | https://etherscan.io/token/0x68749665ff8d2d112fa859aa293f07a622782f38 | Tier 1 | Ethereum token contract, supply, holders, transfers, verified contract status, and proxy implementation. |

## Secondary Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| market, liquidity, risk | RWA.xyz XAUT asset page | https://app.rwa.xyz/assets/XAUT | Tier 2 | Market value, RWA classification, holders, transfer metrics, and market-quality context. Use as secondary/aggregated source. |
| market | CoinGecko Tether Gold | https://www.coingecko.com/en/coins/tether-gold | Tier 2 | Price, market cap, volume, and exchange liquidity data. Aggregator only. |
| market | CoinMarketCap Tether Gold | https://coinmarketcap.com/currencies/tether-gold/ | Tier 2 | Market cap, price, volume, and exchange market data. Aggregator only. |

## Risk Context Sources

| Layer | Source | URL | Tier | Notes |
|---|---|---|---|---|
| risk | Reuters / reputable financial media | null | Tier 3 | Use only for context around gold-backed token market, custody, transparency, and legal-claim risks. Do not use as primary evidence for field values. |

## Data Gaps To Verify

- Latest independent accountant / attestation report URL and report date.
- Exact issuer legal entity and jurisdiction.
- Custodian / vault operator details and whether they are publicly disclosed.
- Whether XAUT has any on-chain proof-of-reserves oracle. Do not mark `hasProofOfReserves: true` unless explicitly confirmed.
- Exact redemption mechanics, minimum redemption amount, and gold bar delivery rules.
- Current blocked jurisdictions and KYC/AML requirements from legal terms.
- Whether the Ethereum proxy implementation is verified and whether any public smart-contract audit exists.
- Whether XAUT also has official deployments outside Ethereum; include only if verified from official source or official explorer.

## Notes for Analyst

- Treat XAUT as a commodity-backed RWA, not a Treasury/fund product.
- `yield.json` should remain mostly null unless a verified source explicitly states yield; XAUT is expected to be non-yield-bearing.
- `reserve.json` is the most important layer for this asset.
- Do not treat a reserve accountant report as an on-chain proof-of-reserves oracle.
- Do not treat market aggregator reserve descriptions as primary reserve evidence if official Tether reports are available.
- `grade-baseline.json` should be created only after import and grading are run successfully.
