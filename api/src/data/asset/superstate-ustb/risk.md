---

overallLevel: MEDIUM
assessmentMethod: ai-assisted
lastAssessed: 2026-05-31
riskFactors:

* "No verified collateralizationRatio, audited reserveBreakdown, lastAuditDate, or lastAuditUrl was provided in reserve.md, limiting independent verification of backing quality."
* "USTB is not a fully on-chain reserve model; underlying Treasury assets are held off-chain while tokens represent fund share ownership records."
* "Official Superstate sources conflict on the named custodian: USTB asset page lists The Bank of New York Mellon, while Superstate security documentation lists UMB Bank, N.A."
* "USTB relies on private-fund exemptions, Qualified Purchaser restrictions, KYC/AML onboarding, and allowlisted wallet transfer controls."
* "No proof-of-reserves oracle address or chain was verified, and hasProofOfReserves is false."
  mitigants:
* "Underlying exposure is short-duration U.S. Treasury Bills, a conservative asset class compared with credit, real estate, or commodity-backed RWA structures."
* "USTB has named institutional service providers including The Bank of New York Mellon as custodian, Ernst & Young LLP as auditor, NAV Fund Services as NAV calculation agent, and Federated Hermes as sub-advisor."
* "Investor access is restricted to Qualified Purchasers in supported jurisdictions, with KYC/AML checks, accreditation review, and wallet allowlisting."
* "Redemption is supported in USD or USDC with liquidity each market day, reducing liquidity risk relative to long-duration or illiquid private-credit RWAs."
* "The legal structure is documented through SEC Form D, Regulation D Rule 506(c), and Investment Company Act Section 3(c)(1)/3(c)(7) exemptions."
  _lastUpdated: 2026-05-31
  _source: manual

---

## Assessment Methodology

The risk assessment evaluates USTB across five dimensions using only the provided identity.md, reserve.md, and legal.md data: asset backing, reserve transparency, legal/regulatory structure, operational dependencies, and investor access controls. The asset receives a MEDIUM overall risk level because its underlying exposure is conservative, but verification and operational risks remain material.

Backing risk was evaluated from reserve.md. USTB is backed by a private fund portfolio invested in short-duration U.S. Treasury Bills, and fund shares are represented as USTB tokens or book-entry shares. This supports a lower underlying asset-risk profile. However, collateralizationRatio, lastAuditDate, lastAuditUrl, and reserveBreakdown are null, and hasProofOfReserves is false. This prevents a LOW rating because the backing cannot be independently verified from the provided layer data.

Legal and access risk were evaluated from legal.md. USTB is classified as exempt, with SEC as primaryRegulator and Reg D as regulatoryFramework. The issuer is Superstate Short Duration US Government Securities Fund, a series of Superstate Asset Trust, structured as a series of a Delaware Statutory Trust. Investor access is institutional only, accreditedOnly is true, kycRequired is true, and allowedJurisdictions are explicitly listed. These controls reduce retail mis-selling and transferability risk, but they also create reliance on regulatory exemptions and issuer-operated permissioning.

Operational and transparency risk were evaluated from all three layers. The input states that USTB uses token-level permissioning, allowlisted wallet transfers, multi-network support across Ethereum, Solana, and Plume, and protocol mint/redeem. These features improve controlled access and utility, but they introduce smart-contract, allowlist, cross-chain, and issuer-control dependencies. The uploaded layer data is the only basis for this assessment. 

## Risk Factors (Detail)

The first material risk is incomplete reserve verification. reserve.md sets collateralizationRatio, lastAuditDate, lastAuditUrl, and reserveBreakdown to null. It also states that the public holdings table is unaudited and that no normalized 100% reserveBreakdown could be filled. This matters because investors cannot verify from the provided data whether the full backing composition, current collateralization, and audit recency support the stated risk profile. This risk becomes more material if fund assets change materially, if Treasury holdings mature or are replaced, or if public holdings data remains unaudited.

The second risk is off-chain backing dependency. The input states that USTB is not a fully on-chain reserve model: underlying Treasury assets are held off-chain while tokens represent fund share ownership records. This means token holders depend on off-chain custody, fund administration, transfer-agent records, and issuer processes. This risk is triggered if there are reconciliation issues between token balances and fund records, custodian disruption, or operational failures in the issuer’s redemption and transfer systems.

The third risk is custodian-source conflict. reserve.md states that official Superstate sources conflict: the USTB asset page lists The Bank of New York Mellon, while Superstate security documentation lists UMB Bank, N.A. The input chooses The Bank of New York Mellon as the current asset-page source, but confidence is only Medium. This is material because custody is central to reserve safety. Investors need the current custodian relationship clarified before treating the custody stack as fully verified.

The fourth risk is legal and access restriction risk. legal.md classifies USTB as exempt under Reg D, relying on Rule 506(c) and Investment Company Act Section 3(c)(1)/3(c)(7) exclusions. It also states that access is limited to Qualified Purchasers in supported countries, with accreditedOnly true and kycRequired true. This reduces retail exposure, but it means USTB is not freely accessible and depends on ongoing compliance with private-fund exemption rules. The risk increases if regulatory treatment of tokenized private fund shares changes or if supported-jurisdiction rules evolve.

The fifth risk is lack of proof-of-reserves. reserve.md sets hasProofOfReserves to false, porOracleAddress to null, and porOracleChain to null. This means there is no verified on-chain oracle mechanism in the input that proves reserves against token supply. For a tokenized RWA product, this limits real-time transparency and leaves investors dependent on issuer disclosures and off-chain reporting.

## Mitigants (Detail)

The strongest mitigant is the quality of underlying exposure. USTB is backed by short-duration U.S. Treasury Bills, and the fund targets current income consistent with liquidity and stability of principal. Compared with credit, real estate, commodities, or receivables-backed RWAs, short-duration Treasury exposure generally reduces duration, credit, and liquidity risk. The remaining gap is that the exact reserveBreakdown is null and unaudited in the provided input.

A second mitigant is the named institutional service-provider stack. identity.md and reserve.md identify The Bank of New York Mellon as custodian, Ernst & Young LLP as auditor, NAV Fund Services as NAV calculation agent, and Federated Hermes as sub-advisor. These providers reduce operational and governance risk relative to an issuer with no recognizable external service providers. However, the custodian conflict between BNY Mellon and UMB Bank weakens this mitigant until clarified.

A third mitigant is restricted investor access. USTB is designed for Qualified Purchasers, requires KYC/AML checks, accreditation review, and wallet allowlisting, and only supports investors in listed allowed jurisdictions. This reduces the likelihood of unsuitable retail participation and supports compliance with the stated private-fund structure. The gap is that blockedJurisdictions is null, so the platform does not yet have a complete negative-jurisdiction list.

A fourth mitigant is redemption support. reserve.md states redemptionAsset is USD or USDC, and identity.md states subscriptions and redemptions can be made through USD or USDC with liquidity each market day. This helps reduce liquidity risk compared with RWA products tied to less liquid private credit or real estate assets. The limitation is that no collateralizationRatio or audited reserveBreakdown was provided to verify redemption coverage under stressed conditions.

A fifth mitigant is documented legal structuring. legal.md provides a concrete issuer name, U.S. jurisdiction, Delaware Statutory Trust structure, SEC regulator reference, Reg D framework, and private-fund exemption basis. This reduces legal ambiguity compared with an unregistered or undocumented token issuer. However, legal.md also notes a classification issue between Superstate private-fund materials and third-party or SEC materials referencing a registered open-end fund reorganization path.

## Risk Conclusion

USTB is suitable for institutional or Qualified Purchaser investors only, not retail investors. The underlying asset profile is conservative because the exposure is short-duration U.S. Treasury Bills, and the fund has institutional service providers and documented legal restrictions. However, the lack of verified collateralizationRatio, audited reserveBreakdown, proof-of-reserves oracle, and lastAuditDate prevents a LOW risk rating.

Risk could increase under conditions where Treasury holdings are not updated transparently, reserve data remains unaudited, custodian identity remains unresolved, redemption liquidity becomes constrained, or the regulatory classification shifts from the current private-fund exemption model. Risk could also increase if cross-chain deployments or allowlist controls create operational failures across Ethereum, Solana, or Plume.

Risk-adjusted yield versus closest competitors in the same category cannot be compared from the provided data because no competitor yield, USTB yield, AUM, duration, fee-adjusted return, or benchmark yield data was included in the input. Based only on the provided layers, the asset’s risk profile is stronger than higher-risk RWA categories such as credit or real estate, but cannot be ranked against other Treasury RWAs without additional market and yield data.

## Data Gaps

The following null or incomplete fields materially affect assessment quality: collateralizationRatio, reserveBreakdown, porOracleAddress, porOracleChain, lastAuditDate, lastAuditUrl, prospectusUrl, blockedJurisdictions, and legalOpinionUrl.

The most important missing items are an audited reserve breakdown, current audit date and audit URL, collateralization ratio, proof-of-reserves mechanism, and final clarification of custodian identity. Without these, the assessment should remain MEDIUM even though the underlying asset class is conservative.
