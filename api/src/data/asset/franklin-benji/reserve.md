---
backingType: US Treasury
backingDescription: SEC-registered U.S. government money market fund (FOBXX) investing in U.S. government securities, cash, and repurchase agreements collateralized by U.S. government securities, as required under SEC Rule 2a-7 for government money market funds.
collateralizationRatio: null
custodian: null
custodianUrl: null
hasProofOfReserves: false
porOracleAddress: null
porOracleChain: null
auditor: Trail of Bits; Ancilia
lastAuditDate: null
lastAuditUrl: null
reserveBreakdown: null
redemptionAsset: USD
_lastUpdated: 2026-05-31
_source: manual
---

## Backing Analysis

The Franklin OnChain U.S. Government Money Fund (FOBXX) is a SEC-registered government money market fund. Under SEC Rule 2a-7, government money market funds are required to invest at least 99.5% of total assets in U.S. government securities, cash, and repurchase agreements fully collateralized by U.S. government securities. Each BENJI token represents one share of FOBXX at a target NAV of $1.00. The fund's transfer agent maintains the official record of share ownership via the proprietary Benji platform, which utilizes public blockchain networks for transaction activity. Yield accrues daily through newly minted BENJI tokens distributed to shareholders.

As a regulated money market fund, FOBXX operates under the SEC's investment company framework (CIK 0001786958), which mandates regular portfolio disclosures, liquidity requirements, weighted average maturity limits (60 days), and daily and weekly liquidity minimums. This regulatory structure provides a high degree of reserve safety relative to unregulated or synthetic RWA products. However, the specific current portfolio composition — the percentage held in Treasuries vs. agency securities vs. repurchase agreements — is not available from the provided sources and would require the fund's latest N-MFP2 filing or fact sheet.

Reserve transparency at the onchain level is limited. The smart contract code has been audited by Trail of Bits and Ancilia, but there is no onchain proof-of-reserves oracle that independently verifies the underlying portfolio in real time. Investors must rely on the SEC regulatory framework and the fund's official filings for reserve verification, rather than onchain attestation.

## Red Flags

- **Reserve breakdown not available from provided sources.** The specific portfolio composition (Treasury bills, agency debt, repo agreements) could not be verified from the five primary URLs. The Franklin Templeton product page returned only disclaimers and legal boilerplate, not current holdings data. The app.rwa.xyz page failed to load. Investors should consult the fund's latest N-MFP2 filing on SEC EDGAR for current portfolio composition.

- **No onchain proof-of-reserves mechanism.** Unlike some RWA protocols that publish real-time reserve attestations onchain, BENJI relies entirely on the SEC regulatory framework and traditional audits. There is no onchain oracle verifying collateral balances in real time.

- **Smart contract auditor ≠ financial auditor.** Trail of Bits and Ancilia audit smart contract code security, not the fund's financial statements or reserve adequacy. The financial auditor of the fund is not identified in the provided sources.

- **SEC EDGAR entity status flagged.** The SEC EDGAR page for Franklin Templeton Trust (CIK 0001786958) states that the entity's Exchange Act registration has been revoked and its Municipal Advisor registration has been revoked and cancelled. This applies to the trust entity's Exchange Act registration status; the fund itself is registered as an investment company under the Investment Company Act. The implications for ongoing filings should be monitored.

- **Custodian not identified.** The custodian bank holding the fund's underlying government securities is not disclosed in any of the provided sources.

---

## Source Table

| Field | Value | Source URL | Confidence |
|-------|-------|------------|------------|
| backingType | US Treasury | https://digitalassets.franklintempleton.com/benji/ (states "U.S. Government Money Fund"); https://defillama.com/rwa/asset/BENJI (ISIN and fund name confirm) | High |
| backingDescription | SEC-registered U.S. government money market fund (FOBXX) investing in U.S. government securities, cash, and repurchase agreements collateralized by U.S. government securities | https://digitalassets.franklintempleton.com/benji/ ("U.S. Government Money Fund"); SEC Rule 2a-7 classification standard for government money market funds | High |
| collateralizationRatio | null | N/A — no source provides this figure | N/A |
| custodian | null | N/A — not disclosed in any provided source | N/A |
| custodianUrl | null | N/A | N/A |
| hasProofOfReserves | false | https://digitalassets.franklintempleton.com/benji/ (auditors are smart contract auditors, not PoR oracle providers); no onchain PoR oracle referenced in any source | High |
| porOracleAddress | null | N/A — no PoR oracle referenced | N/A |
| porOracleChain | null | N/A — no PoR oracle referenced | N/A |
| auditor | Trail of Bits; Ancilia | https://digitalassets.franklintempleton.com/benji/ ("We work with notable third-party security firms for smart contract code auditing" — lists Trail of Bits and Ancilia) | High |
| lastAuditDate | null | N/A — audit date not provided in sources | N/A |
| lastAuditUrl | null | N/A — no audit report URL provided | N/A |
| reserveBreakdown | null | N/A — portfolio composition not available from provided sources; would require N-MFP2 or fund fact sheet | N/A |
| redemptionAsset | USD | https://digitalassets.franklintempleton.com/benji/ (money market fund, NAV $1.00 per share); https://defillama.com/rwa/asset/BENJI (BENJI Price: $1; Redeemable: yes) | High |
| lastUpdated | 2026-05-31 | N/A | N/A |
| _source | manual | N/A | N/A |