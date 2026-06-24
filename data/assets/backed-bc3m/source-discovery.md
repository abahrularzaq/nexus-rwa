# Source Discovery — Backed GOVIES 0-6 Months Euro Investment Grade (bC3M)

## Review metadata

- Review type: Existing asset refresh
- Reviewed: 2026-06-24
- Slug: `backed-bc3m`
- Symbol: `bC3M`
- Issuer: Backed Assets (JE) Limited
- Product ISIN: CH1173294286
- Official product page last-updated label: 2025-05-30

## Confirmed asset identity

- Product: Backed GOVIES 0-6 Months Euro Investment Grade
- Instrument: Tracker certificate issued as an ERC-20 token
- Underlying: Amundi ETF GOVIES 0-6 Months EUROMTS Investment Grade UCITS ETF
- Underlying ISIN: FR0010754200
- Underlying symbol: C3M
- Underlying objective: Replicate the FTSE Eurozone Government Bill 0-6 Month Capped Index, with coupons reinvested / total-return exposure
- Category used by Nexus RWA: Treasury

## Primary official sources

1. Official bC3M product page  
   https://assets.backed.fi/products/bc3m

   Supports asset identity, issuer, product ISIN, underlying, issuance/redemption fee, supported bToken networks, service providers, investor restrictions, and the live notice that new bToken issuance is closed while redemption remains supported for existing holders.

2. Official legal documentation hub  
   https://assets.backed.fi/legal-documentation

   Supports issuer-level regulatory status, the 2026 Base Prospectus, Swiss-law tracker-certificate classification, supported bToken networks, absence of technical transfer restrictions, and investor eligibility language.

3. Official product database  
   https://assets.backed.fi/legal-documentation/product-database

   The currently accessible database did not expose a searchable bC3M entry or working bC3M-specific final terms during this refresh.

4. Backed Assets home  
   https://assets.backed.fi/

5. Backed Finance website  
   https://backed.fi/

## Secondary sources

1. CoinGecko — Backed GOVIES 0-6 months EURO  
   https://www.coingecko.com/en/coins/backed-govies-0-6-months-euro

   Used only for time-sensitive market observations and the full EVM contract address. On 2026-06-24 it displayed a last-recorded price of USD 146.75, market capitalization of USD 10,041,676, circulating and total supply of 68,426, zero 24-hour trading volume, and a notice that BC3M had stopped trading on listed exchanges.

## Confirmed findings

- New issuance of bTokens is no longer available.
- Redemption remains supported for existing bToken holders.
- The product page describes a 0.5% issuance/redemption fee; this is not evidence of an early-redemption fee.
- The legal documentation lists bToken support on Ethereum, Gnosis, Polygon, Arbitrum, Fantom, Avalanche, BNB Smart Chain, and Base.
- The legal documentation describes ERC-20 tokens without technical transfer restrictions.
- The product page lists Backed Assets (JE) Limited as issuer.
- The product page lists Backed Finance AG as tokenizer.
- The product page lists Alpaca Securities LLC, InCore Bank AG, and Maerki Baumann & Co. AG as broker and custodian service providers.
- The product page lists Security Agent Services AG as security agent.
- The legal documentation states the Base Prospectus was approved in Liechtenstein by the FMA on 2026-05-08 and is valid until 2027-05-07, subject to supplements.
- The legal category is a certificate tracking an underlying, governed by Swiss law.
- U.S. persons are excluded. The website also says products are not promoted or offered to UK clients, while separately allowing that certain products may be available to validated UK professional clients; the UK restriction therefore should not be represented as an unconditional country block without product-specific evidence.

## Corrections required by this refresh

- Replace the incorrect reserve classification `US Treasury`; bC3M tracks a Eurozone government-bill ETF.
- Replace unsupported `hasProofOfReserves: false` with `null`; no explicit bC3M proof-of-reserves statement was found.
- Remove the inferred redemption asset description because the accessible sources do not specify the settlement asset.
- Remove `earlyRedemptionFee: 0.5`; the official source describes a general issuance/redemption fee, not an early-redemption penalty.
- Remove the existing research-generated liquidity score and leave scoring to the designated grading stage.
- Do not represent the UK as unconditionally blocked.
- Neutralize KYC and sanctions-screening booleans where the accessible evidence supports eligibility restrictions but does not explicitly describe the operational control.

## Unresolved research gaps

- A working bC3M-specific final terms document was not located in the currently accessible product database.
- The English KID link exposed by the product page returned an invalid placeholder-style identifier during this review.
- The exact direct-redemption process, settlement asset, settlement period, minimum redemption amount, and suspension/gating terms were not verified.
- No bC3M-specific reserve report, collateral statement, attestation, audit report, or explicit proof-of-reserves mechanism was located.
- The same EVM address is listed by CoinGecko across supported networks, but each chain deployment still requires independent verification by the Source Verification Agent.
- No current official bC3M yield metric was found.
- Market figures are secondary-source observations and may represent the last recorded price rather than an actively traded market price.
