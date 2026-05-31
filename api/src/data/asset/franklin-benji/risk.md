---
overallLevel: LOW
assessmentMethod: ai-assisted
lastAssessed: 2026-05-31
riskFactors:
  - "No onchain proof-of-reserves mechanism — BENJI relies entirely on SEC regulatory filings (N-MFP2) for reserve verification, with no real-time onchain oracle attesting to collateral balances (reserve.md)"
  - "Reserve breakdown is null — specific portfolio composition (Treasury bills vs. agency securities vs. repurchase agreements) could not be verified from any provided source; investors cannot independently assess concentration risk without N-MFP2 filing access (reserve.md)"
  - "Custodian is null — the custodian bank holding the fund's underlying government securities is not disclosed in any provided source, creating a gap in counterparty chain transparency (reserve.md)"
  - "SEC EDGAR entity status flagged — Franklin Templeton Trust (CIK 0001786958) has its Exchange Act registration revoked and Municipal Advisor registration revoked and cancelled; while Investment Company Act registration remains separate, this indicates regulatory filing irregularities at the entity level (legal.md, identity.md)"
  - "No recent SEC filings detected — no 8-K, 10-K, 10-Q, or proxy filings in the last 365 days per EDGAR; fiscal year end is March 31, meaning the most recent annual report should have been filed by late May 2025 (identity.md)"
  - "Multi-chain deployment across 9 chains increases smart contract attack surface — each chain deployment is a separate contract instance requiring independent security validation (identity.md)"
  - "Smart contract auditors (Trail of Bits, Ancilia) are not financial auditors — no financial audit of reserve adequacy or NAV calculations is referenced in provided sources (reserve.md)"
  - "Management fee, minimum investment, and prospectus URL are all null — investors cannot fully evaluate cost structure or access the offering document from provided data (legal.md)"
mitigants:
  - "SEC-registered investment company under the Investment Company Act of 1940, classified under Rule 2a-7 — this is the strongest regulatory framework available for U.S. money market funds, mandating 99.5% minimum allocation to U.S. government securities, 60-day WAM limits, and daily/weekly liquidity minimums (legal.md, reserve.md)"
  - "Established institutional issuer — Franklin Templeton is a publicly traded, global asset management firm with $1.5T+ AUM; the fund is not issued by an opaque offshore entity (legal.md, identity.md)"
  - "KYC/AML required for all operations — minting, redeeming, transferring, and holding BENJI tokens require KYC/allowlist/whitelisting, significantly reducing illicit finance risk (identity.md, legal.md)"
  - "Retail-accessible but permissioned — on Stellar, retail investors can participate after KYC; on other 8 chains, access is restricted to institutional investors only, limiting retail counterparty exposure (identity.md)"
  - "USD redemption at $1.00 NAV — BENJI is redeemable 1:1 for USD directly from the issuer, not dependent on secondary market liquidity or AMM pricing (reserve.md)"
  - "Smart contract code audited by two independent security firms (Trail of Bits and Ancilia) — provides assurance against smart contract exploits, though not a substitute for financial auditing (reserve.md, identity.md)"
  - "Cross-chain architecture provides operational redundancy — if one chain experiences congestion or failure, BENJI tokens on other chains remain functional (identity.md)"
_lastUpdated: 2026-05-31
_source: manual
---

## Assessment Methodology

This risk assessment evaluates five dimensions based exclusively on data provided in the identity, reserve, and legal layers:

**Regulatory Risk (Weight: 30%):** Evaluated using the regulatory framework (Investment Company Act of 1940 / Rule 2a-7), primary regulator (SEC), registration status (registered), and entity-level flags (Exchange Act revocation). BENJI's registration under one of the most stringent mutual fund regulatory regimes globally drives this to LOW. The Exchange Act revocation for the trust entity is a material flag that prevents this from being rated below LOW.

**Reserve/Backing Risk (Weight: 25%):** Assessed against the backing type (US Treasury / government securities under Rule 2a-7), collateralization ratio (null — assumed compliant given registration), proof of reserves (false — no onchain PoR), and reserve breakdown (null). The regulatory mandate for 99.5% government securities is a strong structural mitigant, but the inability to verify current holdings from provided sources and the absence of onchain PoR are material gaps.

**Counterparty Risk (Weight: 20%):** Evaluated using issuer identity (Franklin Templeton Trust), custodian (null), fund manager (Franklin Templeton), and legal structure (FL registered investment company). Franklin Templeton's institutional standing as a global asset manager significantly reduces counterparty risk, but the unidentified custodian creates a gap in the counterparty chain.

**Smart Contract / Technical Risk (Weight: 15%):** Assessed using audit status (Trail of Bits, Ancilia), number of chain deployments (9), and cross-chain architecture. Dual audits by reputable firms provide strong assurance. However, 9 separate chain deployments multiply the attack surface, and no audit date was provided to assess recency.

**Liquidity/Operational Risk (Weight: 10%):** Evaluated using redemption asset (USD), NAV stability ($1.00 target), and onchain market cap ($794.16M). Direct USD redemption at NAV from the issuer eliminates secondary market liquidity dependency. The $794.16M onchain market cap indicates meaningful adoption.

**Composite Score:** LOW — the combination of SEC registration, Rule 2a-7 compliance, institutional issuer, KYC-gated access, and direct USD redemption creates a risk profile comparable to traditional government money market funds. The identified gaps (no PoR, null custodian, entity-level EDGAR flags, null reserve breakdown) are material but are mitigated by the regulatory framework that already mandates these protections through traditional channels.

## Risk Factors (Detail

**1. No onchain proof-of-reserves mechanism.** BENJI does not publish real-time reserve attestations onchain. Unlike some RWA protocols (e.g., Ondo's USDY uses Chainlink attestations), BENJI relies entirely on SEC regulatory filings for reserve transparency. This is not unusual for registered mutual funds, but it means onchain-native investors cannot independently verify collateral without accessing SEC EDGAR. Materiality: MODERATE — mitigated by regulatory framework but relevant for DeFi composability use cases.

**2. Reserve breakdown is null.** The specific portfolio composition — what percentage is held in Treasury bills, agency securities, or repo agreements — is not available from any provided source. Under Rule 2a-7, all of these are permissible and considered extremely low-risk, but the exact mix affects yield and could reveal concentration in repo agreements (counterparty exposure to broker-dealers) vs. direct Treasury holdings. Materiality: LOW-MODERATE — Rule 2a-7 limits repo counterparty risk, but exact composition would improve assessment precision.

**3. Custodian is null.** The custodian bank holding the fund's underlying government securities is not disclosed. For a traditional money market fund, the custodian is typically a major bank (e.g., State Street, BNY Mellon), but this cannot be verified from provided data. The custodian represents a critical link in the chain of custody for the underlying assets. Materiality: LOW-MODERATE — Franklin Templeton's institutional stature suggests a reputable custodian, but the gap should be closed.

**4. SEC EDGAR entity-level flags.** Franklin Templeton Trust (CIK 0001786958) has its Exchange Act registration revoked and its Municipal Advisor registration revoked and cancelled. The fund's Investment Company Act registration is separately governed and not affected by these flags. However, this is the same legal entity, and the revocations indicate that the trust is no longer filing Exchange Act reports (10-K, 10-Q, 8-K) as a reporting company. Materiality: MODERATE — the Investment Company Act registration (which governs the fund) is distinct, but the entity-level status warrants monitoring for any downstream regulatory impacts.

**5. No recent SEC filings detected.** The EDGAR page shows 158 filings since September 3, 2019, but the provided data notes no recent 8-K, 10-K, 10-Q, or proxy filings in the last 365 days. The fund's fiscal year ends March 31, meaning a N-CSR (annual report) or N-MFP2 filing should exist. This may reflect incomplete data in the provided sources rather than an actual filing gap, but it cannot be verified. Materiality: LOW — likely a data retrieval issue rather than a regulatory concern, but worth confirming.

**6. Multi-chain smart contract exposure.** BENJI is deployed across 9 blockchain networks (Stellar, Polygon, Arbitrum, Avalanche, Aptos, Ethereum, Base, Solana, Canton). Each deployment is an independent smart contract instance. While the core logic may be identical, each chain has different security properties, consensus mechanisms, and bridge vulnerabilities. A compromised contract on one chain could affect confidence across all chains. Materiality: LOW — audited by Trail of Bits and Ancilia, and the permissioned nature of the token limits exploit damage, but 9 surfaces is meaningfully more than 1.

**7. Financial audit gap.** Trail of Bits and Ancilia audit smart contract code security, not the fund's financial statements, NAV calculations, or reserve adequacy. No financial auditor is identified in the provided sources. For a SEC-registered investment company, financial statements are audited as part of the N-CSR filing, but the specific auditor is not named. Materiality: LOW — SEC registration implies financial auditing is occurring, but the identity of the financial auditor is not confirmed.

**8. Cost structure opacity.** Management fee, minimum investment, and prospectus URL are all null. Investors cannot evaluate the fee structure or access the formal offering document from the provided data. Materiality: LOW — standard money market fund fees are typically 10-50 bps, and the prospectus is publicly available through Franklin Templeton, but the gap prevents full due diligence from the provided sources.

## Mitigants (Detail

**1. SEC registration under Investment Company Act of 1940 / Rule 2a-7.** This is the single most important risk mitigant. Rule 2a-7 imposes: (a) minimum 99.5% allocation to U.S. government securities, cash, and government-collateralized repos; (b) 60-day weighted average maturity limit; (c) daily minimum 10% liquidity and weekly minimum 30% liquidity; (d) credit quality standards; (e) portfolio diversification requirements. Effectiveness: HIGH — these constraints structurally eliminate the types of risks that have caused RWA failures in crypto (e.g., Terra/Luna, USDC depeg). Gap: Rule 2a-7 is enforced through SEC oversight, not onchain mechanisms, so compliance verification depends on traditional regulatory channels.

**2. Institutional issuer with global scale.** Franklin Templeton is one of the world's largest independent asset management firms, publicly traded on the NYSE (BEN), managing over $1.5 trillion in AUM. This is not a startup or offshore SPV — it is a deeply regulated, publicly audited financial institution. Effectiveness: HIGH — institutional failure risk is minimal for an entity of this scale and regulatory profile. Gap: institutional size does not eliminate operational errors or fraud risk, though it significantly reduces it.

**3. KYC/AML-gated access.** All BENJI operations — minting, redeeming, transferring, and holding — require KYC/allowlist/whitelisting. This prevents anonymous accumulation of tokens and ensures regulatory compliance at the token level. Effectiveness: HIGH — materially reduces illicit finance risk and regulatory enforcement risk. Gap: the specific KYC provider is not identified, and no details on sanctions screening or blocked jurisdictions are available.

**4. USD redemption at par.** BENJI tokens are redeemable for USD at $1.00 per share directly from the issuer, not dependent on secondary market liquidity, AMM pools, or DEX pricing. Effectiveness: HIGH — eliminates the liquidity spiral risk that affects secondary-market-dependent RWA tokens. Gap: redemption requires KYC compliance; investors who cannot complete KYC may be forced to sell on secondary markets at a discount.

**5. Dual smart contract audits.** Trail of Bits and Ancilia are both well-regarded security firms in the blockchain space. Effectiveness: MODERATE-HIGH — significantly reduces the probability of smart contract exploits, but does not eliminate it. Gap: audit dates are not provided (recency unknown), and audits are point-in-time assessments that do not cover subsequent code changes or chain-specific deployment risks.

**6. Cross-chain operational redundancy.** Deployment across 9 chains provides resilience against single-chain failures, congestion, or regulatory actions targeting a specific chain. Effectiveness: MODERATE — if one chain is compromised or shut down, BENJI holders on other chains are unaffected. Gap: cross-chain architecture also increases the total attack surface and requires maintaining 9 separate contract deployments.

## Risk Conclusion

BENJI is suitable for both retail and institutional investors seeking low-risk, yield-bearing exposure to U.S. government securities in a tokenized format. The SEC registration under the Investment Company Act of 1940 and Rule 2a-7 classification makes this one of the lowest-risk RWA tokens available, comparable to holding shares in a traditional government money market fund.

**Risk level could increase under the following conditions:**
- If the SEC were to reclassify or deregister Franklin Templeton Trust, the Investment Company Act protections would be at risk
- If a smart contract vulnerability were exploited on any of the 9 chains, confidence across all chains could be affected
- If U.S. government debt faced a technical default or severe downgrade, the underlying portfolio would be directly impacted (though this is a systemic risk shared by all government money market funds)
- If Franklin Templeton's broader corporate health deteriorated, institutional counterparty risk could increase

**Comparison to closest competitors:**
- **Ondo USDY** (Treasury-backed yield token): higher yield but structured as a Reg S exempt security, not SEC-registered; available to non-U.S. persons; uses offchain trust structure
- **BlackRock BUIDL** (tokenized Treasury fund): SEC-registered, institutional-only, Ethereum-native; comparable regulatory profile but more limited chain deployment
- **Circle USDC yield products**: not a direct Treasury fund; synthetic yield mechanisms carry additional counterparty layers

BENJI's differentiator is its retail accessibility (on Stellar) combined with SEC registration and the Franklin Templeton institutional brand. For risk-adjusted yield, the regulatory framework provides superior investor protection compared to offshore or exempt competitors, though the yield may be lower due to compliance costs.

## Data Gaps

The following null fields materially affect the quality of this risk assessment:

| Null Field | Impact on Risk Assessment | Priority |
|---|---|---|
| reserveBreakdown | Cannot assess concentration risk (Treasuries vs. repos vs. agency securities) | HIGH |
| custodian | Cannot evaluate counterparty chain completeness | HIGH |
| collateralizationRatio | Cannot confirm whether fund is over-collateralized; assumed compliant at 1.0 given Rule 2a-7 | MEDIUM |
| lastAuditDate | Cannot assess audit recency; smart contract code may have changed since last audit | MEDIUM |
| managementFee | Cannot evaluate cost competitiveness or fee-related NAV erosion | MEDIUM |
| prospectusUrl | Cannot verify offering terms, investor eligibility, or fee structure | MEDIUM |
| launchDate | Cannot assess track record duration or operational maturity | LOW |
| blockedJurisdictions | Cannot assess regulatory access restrictions beyond U.S. | LOW |
| sanctionsScreening | Cannot confirm sanctions compliance procedures | LOW |
| amlPolicy | Cannot identify KYC provider or AML program specifics | LOW |
| financialAuditor | Cannot identify the fund's financial statement auditor | LOW |

**Recommendation:** Before finalizing this risk assessment for the institutional platform, the following data should be sourced: (1) current reserve breakdown from the fund's latest N-MFP2 filing on SEC EDGAR; (2) custodian identity from the fund's SAI or prospectus; (3) management fee from the fund's prospectus; (4) last smart contract audit date from Trail of Bits or Ancilia directly.
