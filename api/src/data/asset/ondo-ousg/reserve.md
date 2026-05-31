---

backingType: US Treasury
backingDescription: OUSG is backed by short-term U.S. Treasury securities and related cash-equivalent money market instruments held through regulated institutional funds and custodial structures.
collateralizationRatio: null
custodian: Ankura Trust Company, LLC
custodianUrl: [https://www.ankura.com](https://www.ankura.com)
hasProofOfReserves: false
porOracleAddress: null
porOracleChain: null
auditor: null
lastAuditDate: null
lastAuditUrl: null
reserveBreakdown:
"BlackRock USD Institutional Digital Liquidity Fund (BUIDL)": 82.57
"WisdomTree Government Money Market Digital Fund (WTGXX)": 8.13
"Franklin OnChain U.S. Government Money Fund (BENJI)": 4.88
"Fundbridge Capital Institutional Funds ICAV (FBOXX)": 2.39
"Superstate Short Duration U.S. Government Securities Fund (USTB)": 2.03
redemptionAsset: USD
_lastUpdated: 2026-05-31
_source: manual
---------------

## Backing Analysis

OUSG is a tokenized treasury product issued by Ondo Finance that provides exposure to short-duration U.S. government securities through a portfolio of regulated institutional money market and treasury funds. According to Ondo’s transparency documentation and rwa.xyz disclosures, the reserve portfolio consists primarily of BlackRock’s BUIDL fund, alongside allocations to tokenized government money market funds from WisdomTree, Franklin Templeton, Superstate, and Fundbridge.

The structure relies on regulated off-chain custodial and fund infrastructure rather than fully on-chain collateral custody. Investor assets are administered through legal wrappers and custodial arrangements with Ankura Trust Company serving as a key trust and collateral administration provider. Reserve transparency is partially verifiable through published holdings dashboards and third-party analytics platforms, but there is no fully on-chain cryptographic proof-of-reserves oracle currently disclosed.

The reserve composition appears conservative relative to broader RWA products because assets are concentrated in U.S. Treasury-backed money market instruments with short duration exposure. However, investors remain exposed to operational dependencies on custodians, fund administrators, redemption infrastructure, and issuer compliance controls.

## Red Flags

OUSG reserve transparency depends heavily on issuer disclosures and third-party reporting platforms rather than fully on-chain attestations or automated proof-of-reserves systems.

The reserve portfolio is highly concentrated in BlackRock BUIDL exposure, representing more than 80% of disclosed reserves according to rwa.xyz data.

No publicly disclosed collateralization ratio was identified from official Ondo documentation. No independent reserve audit report specifically covering OUSG reserves was identified from the provided primary sources.

---

## Source Table

| Field              | Value                                                                      | Source URL                                                                                                                    | Confidence |
| ------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- |
| backingType        | US Treasury                                                                | [Ondo OUSG](https://ondo.finance/ousg?utm_source=chatgpt.com)                                                                 | High       |
| backingDescription | Backed by short-term U.S. Treasury securities and money market instruments | [Ondo Trust & Transparency Docs](https://docs.ondo.finance/ondo-global-markets/trust-and-transparency?utm_source=chatgpt.com) | High       |
| custodian          | Ankura Trust Company, LLC                                                  | [Ondo Trust & Security Docs](https://docs.ondo.finance/trust-and-security?utm_source=chatgpt.com)                             | High       |
| custodianUrl       | [https://www.ankura.com](https://www.ankura.com)                           | [Ankura Official Website](https://www.ankura.com?utm_source=chatgpt.com)                                                      | High       |
| hasProofOfReserves | false                                                                      | [Ondo Trust & Transparency Docs](https://docs.ondo.finance/ondo-global-markets/trust-and-transparency?utm_source=chatgpt.com) | Medium     |
| reserveBreakdown   | BlackRock USD Institutional Digital Liquidity Fund (BUIDL): 82.57          | [RWA.xyz Ondo Finance Page](https://app.rwa.xyz/protocols/ondo-finance?utm_source=chatgpt.com)                                | High       |
| reserveBreakdown   | WisdomTree Government Money Market Digital Fund (WTGXX): 8.13              | [RWA.xyz Ondo Finance Page](https://app.rwa.xyz/protocols/ondo-finance?utm_source=chatgpt.com)                                | High       |
| reserveBreakdown   | Franklin OnChain U.S. Government Money Fund (BENJI): 4.88                  | [RWA.xyz Ondo Finance Page](https://app.rwa.xyz/protocols/ondo-finance?utm_source=chatgpt.com)                                | High       |
| reserveBreakdown   | Fundbridge Capital Institutional Funds ICAV (FBOXX): 2.39                  | [RWA.xyz Ondo Finance Page](https://app.rwa.xyz/protocols/ondo-finance?utm_source=chatgpt.com)                                | High       |
| reserveBreakdown   | Superstate Short Duration U.S. Government Securities Fund (USTB): 2.03     | [RWA.xyz Ondo Finance Page](https://app.rwa.xyz/protocols/ondo-finance?utm_source=chatgpt.com)                                | High       |
| redemptionAsset    | USD                                                                        | [Ondo OUSG Subscription Documents](https://ondo.finance/ousg?utm_source=chatgpt.com)                                          | Medium     |
| _lastUpdated       | 2026-05-31                                                                 | Internal system date                                                                                                          | High       |
| _source            | manual                                                                     | User-provided instruction                                                                                                     | High       |
