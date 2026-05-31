---
regulatoryStatus: registered
primaryRegulator: SEC
regulatoryFramework: null
issuerName: Superstate Trust
issuerCountry: US
legalStructure: Delaware statutory trust
fundManager: null
minimumInvestment: null
managementFee: null
performanceFee: null
targetInvestors: institutional
prospectusUrl: https://www.sec.gov/Archives/edgar/data/1982577/000110465925042142/tm2513524d1_n1a.htm
kycRequired: true
accreditedOnly: null
blockedJurisdictions: null
allowedJurisdictions: []
sanctionsScreening: null
amlPolicy: null
legalOpinionUrl: null
_lastUpdated: 2026-05-31
_source: manual
---

## Legal Analysis

USTB is issued by Superstate Trust, a Delaware statutory trust that is registered with the SEC as an open-end management investment company under the Investment Company Act of 1940 (CIK 0001982577, File Nos. 333-272932 under the Securities Act of 1933 and 811-23886 under the Investment Company Act of 1940). The fund's registration statement is filed on Form N-1A, which is the standard registration form for open-end mutual funds seeking to publicly offer their securities. Tokenized shares are official fund shares — not derivatives, wrappers, or separate share classes — recorded on Ethereum, Solana, and Plume Mainnet.

Delaware statutory trusts are a commonly chosen legal vehicle for registered investment funds in the United States, offering well-established trust law protections and regulatory clarity under the '40 Act framework. As a registered open-end investment company, the fund is subject to SEC oversight, periodic reporting requirements, and the compliance obligations that come with public registration. This structure was likely chosen to provide institutional-grade regulatory legitimacy while enabling onchain distribution through compliant token-level permissioning.

The fund targets institutional investors — including asset managers, DeFi protocols, stablecoin issuers, and automated investment strategy operators — who require compliant, yield-bearing onchain instruments. While the Investment Company Act of 1940 does not inherently restrict open-end fund participation to accredited investors, the practical requirements of wallet allowlisting, KYC/AML verification, and the onchain infrastructure may effectively limit the investor base to institutional and sophisticated participants. The platform's messaging on superstate.com explicitly frames FundOS for asset managers and the investor experience for yield-bearing tokenized fund access.

## Investor Access

Investment in USTB requires KYC/AML verification and wallet allowlisting. Both minting/redeeming through the primary market and holding/transferring tokens on the secondary market require prior verification and allowlisting, enforced at the token contract level. The onboarding process is initiated through the Superstate platform (app.superstate.co). A specific KYC provider or estimated onboarding timeline is not publicly disclosed in the reviewed sources.

For Protocol Mint and Redeem on Ethereum, investors who have completed onboarding can mint USTB by transferring USDC in a single blockchain transaction, with no minting limits. Redemption is available through a dedicated redemption contract with initial USDC liquidity of $10,000,000, replenished regularly. Traditional subscribe/redeem workflows are also available offchain.

## Regulatory Risk

**Medium — registered but with notable concerns:**

1. **Exchange Act registration revocation:** The SEC EDGAR page for Superstate Trust (CIK 1982577) states: "This company's Exchange Act registration has been revoked" and its Municipal Advisor registration has been both revoked and cancelled. While this refers to Exchange Act registration (which governs periodic reporting for certain companies) rather than Investment Company Act registration (which governs the fund's status as a registered mutual fund), the distinction is important. The fund's N-1A registration (File Nos. 333-272932 and 811-23886) appears to be filed separately and may remain active. However, the Exchange Act revocation raises questions about the completeness of the issuer's regulatory posture that investors should investigate directly.

2. **Tokenized fund structure novelty:** While USTB operates under the established '40 Act framework, the tokenization of fund shares on public blockchains introduces regulatory questions that have not been fully tested in enforcement or judicial proceedings. The SEC has not issued comprehensive guidance specifically addressing the tokenization of registered fund shares, creating a degree of interpretive uncertainty.

3. **Multi-chain deployment complexity:** The fund operates across Ethereum, Solana, and Plume Mainnet. Compliance enforcement across multiple chains introduces operational risk, as token-level permissioning must function correctly on each network independently.

4. **No disclosed auditor:** Superstate states that each core platform component has been audited, but no auditor name, firm, or audit date is provided in the reviewed sources. For a registered investment company, the absence of a publicly named auditor is a transparency gap.

---

## Source Table

| Field | Value | Source URL | Confidence |
|-------|-------|------------|------------|
| regulatoryStatus | registered | https://defillama.com/rwa/asset/USTB ("registered with the SEC as an open‑end management investment company") | High |
| primaryRegulator | SEC | https://defillama.com/rwa/asset/USTB (CIK 0001982577, SEC-registered); https://www.sec.gov/edgar/browse/?CIK=1982577&owner=exclude | High |
| regulatoryFramework | null | None of the listed options (Reg D, Reg S, MiCA, AIFMD) apply; fund is registered under Securities Act of 1933 and Investment Company Act of 1940, which are not among the available selections | High |
| issuerName | Superstate Trust | https://defillama.com/rwa/asset/USTB ("Issuer: Superstate Trust – Superstate USTB Money Market Fund") | High |
| issuerCountry | US | https://defillama.com/rwa/asset/USTB ("Delaware statutory trust"); https://www.sec.gov/edgar/browse/?CIK=1982577&owner=exclude | High |
| legalStructure | Delaware statutory trust | https://defillama.com/rwa/asset/USTB ("Delaware statutory trust registered with the SEC as an open‑end management investment company") | High |
| fundManager | null | No fund manager entity explicitly named in any source | High (null confirmed) |
| minimumInvestment | null | Not found in any source | High (null confirmed) |
| managementFee | null | Not found in any source | High (null confirmed) |
| performanceFee | null | Not found in any source | High (null confirmed) |
| targetInvestors | institutional | https://superstate.com (FundOS "Reach new investors with a platform built to tokenize private funds, mutual funds, and ETFs"); https://superstate.com/newsroom/introducing-protocol-mint-and-redeem-for-ustb ("DeFi protocols, stablecoin issuers, and automated investment strategies") | Medium |
| prospectusUrl | https://www.sec.gov/Archives/edgar/data/1982577/000110465925042142/tm2513524d1_n1a.htm | https://defillama.com/rwa/asset/USTB (Source field references this N-1A filing URL) | High |
| kycRequired | true | https://defillama.com/rwa/asset/USTB ("KYC to Mint or Redeem: Yes"; "KYC/Allowlisted/Whitelisted to Transfer/Hold: Yes") | High |
| accreditedOnly | null | Sources do not explicitly state whether the fund is restricted to accredited investors; as a '40 Act registered fund, it is not inherently restricted by law, but no source confirms retail accessibility | High (null confirmed) |
| blockedJurisdictions | null | No blocked jurisdictions list found in the reviewed sources | High (null confirmed) |
| allowedJurisdictions | (empty) | — | — |
| sanctionsScreening | null | Not explicitly stated in sources; KYC/AML compliance is required but sanctions screening is not specifically mentioned | High (null confirmed) |
| amlPolicy | null | KYC/AML verification required but specific provider or detailed policy description not found in sources | High (null confirmed) |
| legalOpinionUrl | null | Not found in any source | High (null confirmed) |
