# Source Discovery — Janus Henderson Anemoy JAAA

## 1. Classification Summary

| Field | Value |
|---|---|
| slug | `janus-henderson-anemoy-jaaa` |
| assetClass | `tokenized_fund` |
| instrumentType | `fund_share_token` |
| claimType | `fund_share_claim` |
| gradingProfile | `asset_backed` |
| publicSegment | `RWA Assets` |
| reserveApplicability | `available` |
| custodyApplicability | `missing` |
| redemptionApplicability | `missing` |
| proofOfReservesApplicability | `missing` |

Classification note: JAAA is added as a tokenized fund/share-style RWA exposure referencing Janus Henderson, Anemoy, and the JAAA fund identity. This is a conservative research baseline because token-specific official legal, custody, contract, redemption, and market data were not found in this pass.

## 2. Primary Sources Table

| Source | URL | Use | Status | Notes |
|---|---|---|---|---|
| Janus Henderson official website | https://www.janushenderson.com/ | Issuer / manager verification | Needs deeper verification | Official JAAA product page or prospectus should be located before analytic grading. |
| Anemoy / Centrifuge app | https://app.centrifuge.io/pools | Tokenized pool discovery | Needs manual verification | Dynamic app page may require manual browser inspection; no token-specific data extracted in this pass. |
| Official token legal docs | null | Legal wrapper, issuer, redemption, investor eligibility | Missing | Required before institutional grading. |
| Official explorer/token contract | null | Blockchain layer | Missing | No contract address was inserted because Nexus SOP requires verified explorer/source evidence. |

## 3. Secondary Sources Table

| Source | URL | Evidence captured | Reliability | Notes |
|---|---|---|---:|---|
| Reuters — Fidelity joins CLO ETF market | https://www.reuters.com/business/fidelity-joins-roster-firms-offering-collateralized-loan-obligations-etfs-2026-02-12/ | Identifies Janus Henderson AAA CLO ETF as JAAA and reports large traditional ETF AUM. | 78 | Useful for traditional JAAA context; not token-specific proof. |
| Financial Times — Janus Henderson tokenisation / Anemoy | https://www.ft.com/content/648f2249-5783-4e98-8412-4056f56ad1b0 | Confirms Janus Henderson relationship with Anemoy tokenized fund initiative. | 76 | Supports Anemoy/JHA relationship but references Anemoy Liquid Treasury Fund, not token-specific JAAA details. |
| MarketWatch — private-credit ETF risks | https://www.marketwatch.com/story/private-credit-etfs-are-here-why-your-retirement-account-may-be-their-next-target-71a282be | Discusses JAAA outflows, NAV discount and private-credit/CLO ETF stress context. | 72 | Risk context only. |
| Financial Times — CLO ETF stress test | https://www.ft.com/content/42a7bacb-05f3-4c04-80eb-c29b9f720d8d | Discusses CLO ETF liquidity stress and JAAA outflows. | 74 | Risk context only. |

## 4. Data Gaps / Next Research

1. Find the official Janus Henderson Anemoy JAAA product page, factsheet, offering memorandum, or prospectus.
2. Confirm whether JAAA is a direct tokenized share, feeder fund interest, note, or another claim type.
3. Verify issuer entity, domicile, regulator, fund administrator, transfer agent, custodian, auditor, and investor eligibility.
4. Verify chain, contract address, token standard, source-code verification, transfer restrictions and explorer URL.
5. Verify subscription/redemption terms, settlement period, minimum investment, fees, NAV cadence, and reporting cadence.
6. Confirm token-specific AUM/TVL, holders, price/NAV, liquidity venues, and market maker data.

## 5. Research Decision

This asset should stay `research` grade until official token-specific sources are found. The traditional Janus Henderson JAAA ETF has strong market presence, but Nexus RWA should not treat ETF AUM, ETF liquidity, or ETF regulatory status as token-specific evidence without explicit Anemoy/Janus Henderson documentation.
