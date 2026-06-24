# Source Verification Review — Backed bC3M

## Review metadata

- Asset: Backed GOVIES 0-6 Months Euro Investment Grade
- Symbol: bC3M
- Slug: `backed-bc3m`
- Branch: `pilot/backed-bc3m-research`
- Review date: 2026-06-24
- Agent: Source Verification Agent
- Scope: Independent verification of the refreshed research package only

## Overall verdict

- Verdict: `blocked`
- `safeToProceed: false`
- Recommended next action: `return_for_fix`

The Research Agent materially improved data honesty, especially in reserve, compliance, liquidity, and market fields. However, the package cannot advance to Risk & Grading because seven blockchain deployments retain non-null contract addresses that were not independently tied to official product-level evidence or verified chain explorer records during this review. Product-specific legal documentation is also incomplete, but that issue is recorded as a warning rather than the primary blocker because the official product page and current issuer-level prospectus support the core identity and general structure.

## Sources independently checked

### Strong official sources

1. Backed bC3M product page  
   https://assets.backed.fi/products/bc3m

2. Backed legal documentation  
   https://assets.backed.fi/legal-documentation

3. Backed product database  
   https://assets.backed.fi/legal-documentation/product-database

4. Ethereum explorer record  
   https://etherscan.io/address/0x2f123cf3f37ce3328cc9b5b8415f9ec5109b45e7

### Medium secondary source

5. CoinGecko bC3M page  
   https://www.coingecko.com/en/coins/backed-govies-0-6-months-euro

## Claims verified

### Identity and product structure

- The product name and symbol are supported by the official product page.
- The product ISIN `CH1173294286` is supported by the official product page.
- Backed Assets (JE) Limited is identified as issuer.
- bC3M is described as a tracker certificate issued as an ERC-20 token.
- The underlying is the Amundi ETF GOVIES 0-6 Months EUROMTS Investment Grade UCITS ETF, ISIN `FR0010754200`.
- The underlying seeks to track a short-duration Eurozone government-bill index with coupons reinvested.

### Issuance and redemption status

- The no-new-issuance notice is displayed directly on the bC3M product page, not only on a generic site page.
- The same notice states that redemption remains supported for existing holders.
- The official product page states `0.5% for Issuance and Redemption`.
- The Research Agent correctly removed the interpretation that this is an early-redemption fee.

### Legal and regulatory structure

- The legal documentation states that the Base Prospectus was approved in Liechtenstein by the FMA on 2026-05-08.
- The current Base Prospectus is stated to remain valid until 2027-05-07, subject to supplements.
- The legal category is a certificate tracking an underlying and the applicable law is Swiss law.
- The legal page identifies bToken support on Ethereum, Gnosis, Polygon, Arbitrum, Fantom, Avalanche, BNB Smart Chain, and Base.
- The legal page states that ERC-20 and Solana SPL tokens have no technical transfer restrictions.

### Service providers and reserve wording

- The official product page lists Alpaca Securities LLC, InCore Bank AG, and Maerki Baumann & Co. AG under both broker and custodian headings.
- Security Agent Services AG is listed as security agent.
- The corrected reserve description as Eurozone government-bill ETF exposure is materially accurate.
- `hasProofOfReserves: null`, `collateralizationRatio: null`, `reserveBreakdown: null`, `auditor: null`, and `redemptionAsset: null` are honest representations of the accessible evidence.

### Investor eligibility

- U.S. persons are explicitly excluded.
- Access is limited to professional or qualified investors, existing holders seeking redemption, or purchasers following an offer from a licensed institution.
- The Research Agent correctly avoided treating the UK as an unconditional blocked jurisdiction because the official text also provides for certain validated UK professional clients.
- `kycRequired: null` and `sanctionsScreening: null` are acceptable because the source states eligibility and sanctions conditions but does not document the operational controls used for bC3M.

### Market and liquidity

- CoinGecko reports that BC3M has stopped trading on all exchanges it lists and shows zero 24-hour volume.
- CoinGecko explicitly describes USD 146.75 as the last recorded price rather than a price established by current trading.
- Market cap of USD 10,041,676 and supply of approximately 68,426 are secondary-source observations.
- Removing market capitalization from `aumUsd` was required and correct.
- The market file appropriately uses low confidence and warns that the data needs synchronization.
- Direct redemption and active secondary-market liquidity are correctly treated as different concepts.

## Blocking issues

### B-001 — Seven chain contract deployments are not independently verified

Affected file: `data/assets/backed-bc3m/blockchain.json`

The package contains the same non-null contract address for Gnosis, Polygon, Arbitrum, Avalanche, Fantom, BNB Smart Chain, and Base. The official legal page confirms that bTokens may exist on these networks, but it does not expose the bC3M address in accessible text. CoinGecko is a secondary source and its chain listing is not sufficient by itself for a material contract-address claim.

Ethereum is independently supported: Etherscan labels the address as `Backed Finance: bC3M Token`, identifies the bC3M token tracker, and links the contract to Backed. Equivalent evidence was not established for the other seven chains in this review.

Required resolution:

- Obtain official product-level contract links or verified explorer records for each chain; or
- remove unsupported chain entries; or
- set unsupported contract addresses to `null` if the repository schema permits a chain record without an address.

Owner: Research Agent

Resume condition: Every retained non-null contract address is independently tied to bC3M on the stated chain.

## Required corrections

### RC-001 — Blockchain deployment evidence

File: `data/assets/backed-bc3m/blockchain.json`

- Ethereum may remain with the current address, and `isVerified` should be updated to `true` if that field represents explorer/source verification.
- Gnosis, Polygon, Arbitrum, Avalanche, Fantom, BNB Smart Chain, and Base must not retain non-null addresses without chain-specific official or verified-explorer evidence.
- Do not infer that deterministic same-address deployment proves that a contract exists on every supported network.

### RC-002 — Source map overstates contract support

File: `data/assets/backed-bc3m/sources.json`

Current contract-address mapping uses CoinGecko as evidence for the address across supported chains. Revise the entry so it supports Ethereum only unless chain-specific evidence is added. Record other chains as unresolved rather than verified.

### RC-003 — `hasWhitelist` is unsupported

File: `data/assets/backed-bc3m/blockchain.json`

All eight records currently use `hasWhitelist: false`. The legal documentation confirms no technical transfer restrictions but does not explicitly establish the absence of all whitelist logic or administrative eligibility controls in the contract architecture. If this field cannot be proven from verified contract behavior or documentation, change it to `null` where the schema permits.

## Non-blocking warnings

### W-001 — Product-specific legal documents are unavailable or broken

- The current product database does not expose a searchable bC3M entry by name or ISIN.
- The English KID link on the product page resolves through a placeholder-like ISIN `CH0000000000` and returned 404 during verification.
- A bC3M-specific current final terms document was not located.

The issuer-level Base Prospectus supports the general legal framework, but it should not be described as complete product-level documentation.

### W-002 — Issuance notice is current on-page but page content is dated

The no-new-issuance notice is live on the bC3M page, so the claim is supported. The page also carries a `Last updated on May 30, 2025` label. Preserve the verification date and avoid implying the underlying product details were comprehensively refreshed in 2026.

### W-003 — Custodian evidence is issuer-published only

The product page explicitly lists the three firms under custodian, so the field is supportable. No independent service-provider confirmation or product-specific custody report was reviewed. This limits source strength but does not require the field to be removed.

### W-004 — Market values are not active-market prices

The stored values are acceptable only with their warning, observation date, secondary-source attribution, and low confidence. They should not be used as evidence of current executable liquidity, NAV, AUM, or redemption value.

### W-005 — Redemption mechanics remain incomplete

The right of existing holders to redeem is supported. Settlement time, minimum redemption amount, settlement asset, processing steps, and suspension or gating conditions remain `null`, as required.

## Layer verdicts

| Layer | Verdict | Notes |
|---|---|---|
| Identity | pass | Core identity and description are officially supported |
| Blockchain | fail | Seven non-null chain addresses and whitelist booleans remain unsupported |
| Reserve | pass with warning | Wording is conservative; no PoR or ratio is claimed |
| Institutional | pass with warning | Issuer and structure supported; product-specific legal file missing |
| Compliance | pass with warning | Eligibility wording is conservative and UK conflict is handled |
| Liquidity | pass with warning | Redemption supported; mechanics remain incomplete |
| Market | pass with warning | Secondary, last-recorded values are clearly flagged |
| Yield | pass | No unsupported current yield is reported |
| Sources | needs fix | Contract evidence mapping must be narrowed or strengthened |

## Source quality assessment

- Official product and legal coverage: strong for identity, issuer, underlying, general legal structure, service providers, eligibility, and issuance/redemption status.
- Product-specific legal coverage: incomplete.
- Reserve and audit coverage: limited but represented honestly with `null` values.
- Blockchain evidence: strong for Ethereum, insufficient for seven other retained deployments.
- Market coverage: secondary and stale by market-activity standards, but transparently labeled.

Recommended source-score range for the later grading agent, after blockers are resolved: `68–76`. This is not a grade and should not be copied mechanically; the lower bound reflects missing product-specific legal documents and chain verification, while the upper bound reflects strong official issuer coverage for most non-market claims.

## Final decision

```text
safeToProceed: false
verdict: return_for_fix
```

The workflow must return to the Research Agent for narrowly scoped blockchain and source-map corrections. Do not begin Risk & Grading until B-001 and RC-001 through RC-003 are resolved and independently rechecked.
