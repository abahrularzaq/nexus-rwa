---

backingType: US Treasury
backingDescription: USTB is backed by a private fund portfolio invested in short-duration U.S. Treasury Bills, with fund shares represented as USTB tokens or book-entry shares.
collateralizationRatio: null
custodian: The Bank of New York Mellon
custodianUrl: [https://www.bny.com/corporate/global/en.html](https://www.bny.com/corporate/global/en.html)
hasProofOfReserves: false
porOracleAddress: null
porOracleChain: null
auditor: Ernst & Young LLP
lastAuditDate: null
lastAuditUrl: null
reserveBreakdown: null
redemptionAsset: USD or USDC
_lastUpdated: 2026-05-31
_source: manual
---------------

## Backing Analysis

USTB represents shares in the Superstate Short Duration US Government Securities Fund. The fund invests in short-duration U.S. Treasury Bills and targets returns in line with the federal funds rate. Ownership is represented either by USTB tokens on supported networks or by book-entry recordkeeping. Subscriptions and redemptions are facilitated through USD or USDC, with liquidity each market day.

The backing structure is relatively conservative because the stated underlying assets are short-duration U.S. Treasury Bills, and the fund has named institutional service providers including a custodian and auditor. However, this is not a fully on-chain reserve model. The underlying Treasury assets are held off-chain with custodians, while the tokens represent fund share ownership records rather than direct on-chain custody of the Treasury Bills.

The reserve breakdown is partially transparent through Superstate’s public holdings table, but the table is explicitly marked unaudited and the visible percentage figures do not cleanly support a normalized 100% reserveBreakdown field. For that reason, reserveBreakdown is set to null rather than inferred or normalized. No verifiable proof-of-reserves oracle address was found in the provided primary sources.

## Red Flags

Official Superstate sources conflict on the named custodian: the USTB asset page lists The Bank of New York Mellon, while Superstate’s security documentation lists UMB Bank, N.A. for USTB custody. The current USTB asset page was used as the higher-specificity source for the custodian field, but this conflict should be monitored.

The holdings table on Superstate’s USTB page is marked unaudited. No collateralization ratio, audited reserve breakdown, or on-chain proof-of-reserves mechanism was verified from the provided sources. USTB also depends on off-chain custody, fund administration, transfer-agent records, KYC/allowlist enforcement, and issuer-operated smart-contract controls.

---

## Source Table

| Field              | Value                                                                                                                                                        | Source URL                                                                                             | Confidence |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ---------- |
| backingType        | US Treasury                                                                                                                                                  | [https://docs.superstate.com/superstate-funds/ustb](https://docs.superstate.com/superstate-funds/ustb) | High       |
| backingDescription | USTB is backed by a private fund portfolio invested in short-duration U.S. Treasury Bills, with fund shares represented as USTB tokens or book-entry shares. | [https://docs.superstate.com/superstate-funds/ustb](https://docs.superstate.com/superstate-funds/ustb) | High       |
| custodian          | The Bank of New York Mellon                                                                                                                                  | [https://superstate.com/assets/ustb](https://superstate.com/assets/ustb)                               | Medium     |
| custodianUrl       | [https://www.bny.com/corporate/global/en.html](https://www.bny.com/corporate/global/en.html)                                                                 | [https://www.bny.com/corporate/global/en.html](https://www.bny.com/corporate/global/en.html)           | High       |
| hasProofOfReserves | false                                                                                                                                                        | [https://superstate.com/assets/ustb](https://superstate.com/assets/ustb)                               | Medium     |
| auditor            | Ernst & Young LLP                                                                                                                                            | [https://superstate.com/assets/ustb](https://superstate.com/assets/ustb)                               | High       |
| redemptionAsset    | USD or USDC                                                                                                                                                  | [https://superstate.com/assets/ustb](https://superstate.com/assets/ustb)                               | High       |
| _lastUpdated       | 2026-05-31                                                                                                                                                   | N/A — task metadata                                                                                    | High       |
| _source            | manual                                                                                                                                                       | N/A — task metadata                                                                                    | High       |
