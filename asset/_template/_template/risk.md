```
---
overallLevel: MEDIUM
assessmentMethod: ai-assisted
lastAssessed: 2026-05-31
riskFactors:
  - "SEC EDGAR page (CIK 1982577) states Exchange Act registration 'has been revoked' and Municipal Advisor registration revoked/cancelled — relationship to the fund's active N-1A filing (333-272932 / 811-23886) is unclear from available data"
  - "Reserve composition (specific holdings breakdown between T-bills, repos, notes) is not disclosed in any source — duration and credit exposure cannot be independently verified"
  - "No auditor name, audit firm, or audit date is publicly available despite Superstate claiming audits have been conducted"
  - "Protocol Redeem liquidity pool is $10M USDC against $770.5M onchain market cap — 1.3% coverage creates potential redemption bottleneck under stress"
  - "DeFi Active TVL of $190.8M concentrated ~65% across Aave Horizon RWA (~$66.6M) and Frax/Frax USD (~$57.5M) — protocol-level failures could trigger correlated outflows"
  - "Prospectus filed with SEC is dated April 30, 2025 and marked 'SUBJECT TO COMPLETION' and 'Preliminary' — registration may not yet be effective"
mitigants:
  - "Fund invests in short-duration U.S. government securities — among the lowest credit risk asset classes available"
  - "SEC registered as open-end management investment company under the Investment Company Act of 1940 with formal N-1A prospectus filing"
  - "Assets custodied at Anchorage Digital Bank N.A. (qualified custodian) with redundant ownership records at fund calculation agent, internally, and onchain"
  - "Token-level compliance enforcement: KYC/AML required to mint/redeem and wallet allowlisting required to hold/transfer, enforced at smart contract level"
  - "Multi-oracle architecture (USTB Oracle, Chainlink, Chronicle) provides pricing redundancy for continuous NAV updates"
  - "Redemption available via both Protocol Redeem (onchain, USDC) and traditional offchain subscribe/redeem workflows, providing fallback pathways"
_lastUpdated: 2026-05-31
_source: manual
---

## Assessment Methodology

This risk assessment evaluates six dimensions using only data from the identity, reserve, and legal layers provided, supplemented by the primary source search results. Each dimension was scored based on the specificity and verifiability of available data.

**Credit Risk:** Evaluated from reserve.md backingType (US Treasury) and backingDescription (short-duration U.S. government securities). The underlying credit quality is assessed as very strong given U.S. government backing. However, the absence of a reserveBreakdown prevents granular assessment of duration risk or repo counterparty exposure.

**Regulatory Risk:** Evaluated from legal.md regulatoryStatus (registered), SEC EDGAR data (Exchange Act registration revoked), and the preliminary prospectus found in search results. The fund claims '40 Act registration, but the EDGAR revocation notice creates unresolved ambiguity. The preliminary prospectus status adds uncertainty.

**Operational Risk:** Evaluated from reserve.md (multi-chain deployment, auditor = null, custodian = Anchorage), identity.md (DeFi TVL concentration data), and security documentation (Turnkey for private key management). Multi-chain compliance enforcement and unaudited claims are key concerns.

**Transparency Risk:** Evaluated from the frequency of null fields across all three data layers. Fields including reserveBreakdown, auditor, lastAuditDate, managementFee, performanceFee, minimumInvestment, fundManager, amlPolicy, and porOracleAddress are all null — representing significant gaps for institutional due diligence.

**Liquidity Risk:** Evaluated from the Protocol Mint and Redeem newsroom article ($10M initial redemption liquidity), identity.md ($770.5M onchain market cap), and DeFi TVL concentration data (~$190.8M with ~65% in two protocols).

**Technology Risk:** Evaluated from identity.md (USTB Oracle, Chainlink, Chronicle integrations) and legal.md (multi-chain deployment across Ethereum, Solana, Plume). Oracle dependency and cross-chain compliance are assessed.

## Risk Factors (Detail)

**1. SEC Registration Ambiguity (HIGH materiality):** The SEC EDGAR entity page for Superstate Trust (CIK 1982577) explicitly states "This company's Exchange Act registration has been revoked" and its Municipal Advisor registration is both revoked and cancelled. Simultaneously, the fund claims registration under the Investment Company Act of 1940 (File No. 811-23886) and Securities Act of 1933 (File No. 333-272932), with an N-1A prospectus filed on April 30, 2025. Exchange Act registration and Investment Company Act registration are distinct legal categories, but the coexistence of a revocation notice alongside active '40 Act claims creates a due diligence red flag. The prospectus is marked "Preliminary" and "SUBJECT TO COMPLETION," indicating the registration statement may not yet be effective. Investors cannot verify from available sources whether the fund is currently authorized to publicly offer shares. This is triggered in any jurisdiction where SEC registration status determines whether the instrument can be legally offered to investors.

**2. Undisclosed Reserve Composition (MEDIUM materiality):** The fund targets "short-duration U.S. government securities," but no percentage breakdown is available. Money market funds can hold Treasury bills (very short duration, ~0-3 months), Treasury notes (longer duration), agency securities, repurchase agreements (which introduce counterparty risk), and cash. Each of these carries different duration and credit risk profiles. A fund weighted toward overnight repos vs. 3-month T-bills has meaningfully different risk characteristics. Without this data, investors cannot model interest rate sensitivity or assess counterparty exposure from repo counterparties.

**3. No Named Auditor or Audit Date (MEDIUM materiality):** Superstate's security documentation states "Each core component of our platform has been audited," but no auditor name, audit firm, or audit date appears in any source. For a registered investment company subject to '40 Act requirements, this absence is a transparency concern. It prevents investors from evaluating audit quality, scope, or timeliness. This is material for any institutional investor whose compliance requirements mandate audited financial statements with identified Big 4 or recognized firms.

**4. Redemption Liquidity Mismatch (MEDIUM materiality):** The Protocol Redeem contract provides $10M in initial USDC liquidity against $770.5M onchain market cap — a 1.3% coverage ratio. While the source states this is "replenished regularly," a sudden redemption wave (e.g., triggered by a rate change, stablecoin depeg event, or DeFi liquidation cascade) could exhaust the pool. Traditional offchain redemption provides a fallback, but settlement timing differs. This risk is triggered during market stress events when multiple DeFi protocols holding USTB (Aave, Frax) face simultaneous liquidation or withdrawal demands.

**5. DeFi Protocol Concentration (MEDIUM materiality):** Of ~$190.8M DeFi Active TVL, approximately $124M (~65%) is concentrated in two protocols: Aave Horizon RWA (~$66.6M) and Frax/Frax USD (~$57.5M). A smart contract exploit, governance attack, or parameter change in either protocol could trigger rapid USTB redemptions, impacting the fund's onchain liquidity dynamics. This concentration also means USTB's DeFi utility is disproportionately dependent on the continued operation and solvency of two counterparty protocols.

**6. Preliminary Prospectus Status (LOW-MEDIUM materiality):** The SEC filing (tm2513524d1_n1a.htm) is explicitly marked as a "Preliminary prospectus dated April 30, 2025" with "SUBJECT TO COMPLETION" and the disclaimer "We may not sell these securities until the registration statement filed with the Securities and Exchange Commission is effective." If the registration statement has not been declared effective, the fund's public offering status may be incomplete. This would affect the legality of secondary market trading and could impact investor protections.

## Mitigants (Detail)

**1. U.S. Government Securities Backing (STRONG):** The fund invests in short-duration U.S. government securities, which carry the full faith and credit backing of the U.S. government. This is the highest-quality backing available in fixed income markets. While it does not eliminate interest rate risk or repo counterparty risk, it effectively eliminates credit default risk for the underlying holdings. Gap: duration risk remains unknown without reserve breakdown.

**2. SEC Registered Under '40 Act (MODERATE):** Registration as an open-end management investment company subjects the fund to SEC oversight, periodic reporting, diversification requirements, leverage limits, and fiduciary obligations. The N-1A prospectus filing demonstrates an intent to operate within the regulated mutual fund framework. Gap: the Exchange Act revocation notice and preliminary prospectus status weaken the confidence this mitigant would otherwise provide.

**3. Qualified Custodian with Redundant Records (STRONG):** Assets are held at Anchorage Digital Bank N.A., a federally chartered digital asset bank. Superstate maintains "overlapping, redundant records of ownership" at the fund calculation agent, internally, and onchain. Private key management via Turnkey adds a separation-of-duties layer. This structure protects against single points of failure in custody. Gap: the identity of the fund calculation agent is not disclosed.

**4. Token-Level Compliance Enforcement (STRONG):** The smart contract enforces allowlisting at the token level — unallowlisted addresses cannot receive, hold, or transfer USTB. KYC/AML is required for minting and redeeming. This is stronger than policy-based compliance because it is programmatically enforced and cannot be circumvented. Gap: compliance effectiveness depends on correct implementation on each of the three chains (Ethereum, Solana, Plume).

**5. Multi-Oracle Pricing Architecture (MODERATE):** The fund uses its own USTB Oracle alongside Chainlink and Chronicle for continuous pricing. This provides redundancy — if one oracle fails, others can continue serving prices. Gap: all three oracles likely derive from the same underlying NAV calculation, so a data feed error at the fund level would propagate to all oracles simultaneously.

**6. Dual Redemption Pathways (MODERATE):** Investors can redeem via Protocol Redeem (onchain, instant, USDC) or traditional offchain subscribe/redeem. This provides a fallback if onchain mechanisms fail. Gap: offchain redemption may have different settlement timing and minimum amounts not disclosed in available sources.

## Risk Conclusion

**Overall: MEDIUM.** USTB is a well-structured tokenized money market fund with strong foundational characteristics — U.S. government securities backing, SEC registration intent, qualified custody, and programmatic compliance. However, several data gaps and regulatory ambiguities prevent a LOW rating.

**Suitable for institutional investors** with the resources to conduct additional due diligence beyond what is publicly available. The fund's KYC/allowlisting requirements and onchain infrastructure effectively limit access to institutional and sophisticated participants. Retail accessibility is theoretically possible under '40 Act registration but practically limited by the onboarding requirements.

**Risk level could increase under the following conditions:**
- SEC declares the N-1A registration statement is not effective or issues enforcement action
- Interest rate environment shifts rapidly, creating NAV deviation concerns
- Aave or Frax faces a smart contract exploit triggering correlated USTB redemptions
- Protocol Redeem $10M liquidity pool is exhausted during a stress event without timely replenishment
- Repo counterparty exposure (if held) faces credit deterioration

**Risk-adjusted yield comparison:** At 3.30% native yield, USTB competes with other tokenized Treasury products (e.g., BlackRock BUIDL, Franklin Templeton BENJI, Ondo OUSG). The yield is broadly in line with the current risk-free rate environment. However, the data gaps around fees, reserve composition, and regulatory status mean the true risk-adjusted return cannot be fully calculated from available information. Competitors with fully disclosed fee schedules and audited financials may offer more transparent risk-adjusted comparisons for institutional allocators.

## Data Gaps

The following null fields directly reduce the quality of this risk assessment:

| Null Field | Impact on Risk Assessment | Priority |
|---|---|---|
| reserveBreakdown | Cannot assess duration risk, repo counterparty exposure, or interest rate sensitivity | Critical |
| auditor / lastAuditDate | Cannot verify audit quality, scope, or timeliness; weakens transparency mitigant | Critical |
| managementFee / performanceFee | Cannot calculate true net risk-adjusted yield for comparison with competitors | High |
| minimumInvestment | Cannot confirm retail vs. institutional access barrier | Medium |
| fundManager | Cannot assess manager track record or conflicts of interest | High |
| collateralizationRatio | Cannot verify whether fund is over- or under-collateralized | Medium |
| launchDate | Cannot assess fund operating history or maturity | Medium |
| blockedJurisdictions / sanctionsScreening / amlPolicy | Cannot assess full compliance posture for cross-border investors | Medium |
| amlPolicy (KYC provider) | Cannot assess adequacy of AML controls | Medium |
| porOracleAddress / porOracleChain | Cannot verify oracle contract onchain for independent monitoring | Low |

**Summary:** Nine critical/high-priority data gaps exist. The most impactful are the undisclosed reserve composition and the absence of a named auditor, both of which prevent the level of verification expected by institutional investors. These gaps should be resolved before this asset is presented on an institutional analytics platform without qualification.
```

---

## Source Table

| Field / Item | Value | Source URL | Confidence |
|---|---|---|---|
| overallLevel | MEDIUM | Composite assessment from all layers | — |
| riskFactor 1 (SEC ambiguity) | Exchange Act registration revoked | https://www.sec.gov/edgar/browse/?CIK=1982577&owner=exclude | High |
| riskFactor 1 (N-1A filing) | File Nos. 333-272932 and 811-23886 | https://defillama.com/rwa/asset/USTB (registry source) | High |
| riskFactor 1 (preliminary prospectus) | "Preliminary prospectus dated April 30, 2025" / "SUBJECT TO COMPLETION" | https://www.sec.gov/Archives/edgar/data/1982577/000110465925042142/tm2513524d1_n1a.htm | High |
| riskFactor 2 (undisclosed reserve) | reserveBreakdown = null in reserve.md | All sources reviewed; no breakdown found | High |
| riskFactor 3 (no auditor) | auditor = null, lastAuditDate = null in reserve.md; "Each core component of our platform has been audited" (unnamed) | https://docs.superstate.com/introduction-to-superstate/security | High |
| riskFactor 4 (redemption liquidity) | $10M initial USDC liquidity for Protocol Redeem | https://superstate.com/newsroom/introducing-protocol-mint-and-redeem-for-ustb | High |
| riskFactor 4 (market cap) | $770.5M onchain market cap | https://defillama.com/rwa/asset/USTB | High |
| riskFactor 5 (DeFi concentration) | Aave ~$66.6M, Frax ~$57.5M of ~$190.8M DeFi TVL | identity.md Analyst Notes (compiled from source data) | Medium |
| riskFactor 6 (preliminary prospectus) | "We may not sell these securities until the registration statement filed with the Securities and Exchange Commission is effective" | https://www.sec.gov/Archives/edgar/data/1982577/000110465925042142/tm2513524d1_n1a.htm | High |
| mitigant 1 (UST backing) | backingType = US Treasury; "short-duration U.S. government securities" | https://defillama.com/rwa/asset/USTB; https://superstate.com | High |
| mitigant 2 (SEC registered) | regulatoryStatus = registered | https://defillama.com/rwa/asset/USTB | High |
| mitigant 3 (custodian) | Anchorage Digital Bank N.A.; redundant records | https://docs.superstate.com/introduction-to-superstate/security | High |
| mitigant 3 (key management) | Turnkey for private key management | identity.md (compiled from sources) | Medium |
| mitigant 4 (token compliance) | KYC/AML to mint/redeem; allowlisted to transfer/hold | https://defillama.com/rwa/asset/USTB | High |
| mitigant 5 (multi-oracle) | USTB Oracle, Chainlink, Chronicle | identity.md Analyst Notes | Medium |
| mitigant 6 (dual redemption) | Protocol Redeem (onchain) + traditional offchain | https://superstate.com/newsroom/introducing-protocol-mint-and-redeem-for-ustb | High |
| native yield | 3.30% | https://defillama.com/rwa/asset/USTB | High |