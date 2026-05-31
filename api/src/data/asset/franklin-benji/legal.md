```
---
regulatoryStatus: registered
primaryRegulator: SEC
regulatoryFramework: Investment Company Act of 1940 / Rule 2a-7
issuerName: Franklin Templeton Trust
issuerCountry: US
legalStructure: Registered Investment Company (Series Fund, FL)
fundManager: Franklin Templeton
minimumInvestment: null
managementFee: null
performanceFee: null
targetInvestors: retail
prospectusUrl: null
kycRequired: true
accreditedOnly: false
blockedJurisdictions: null
allowedJurisdictions: null
sanctionsScreening: null
amlPolicy: null
legalOpinionUrl: null
_lastUpdated: 2026-05-31
_source: manual
---
```

## Legal Analysis

The Franklin OnChain U.S. Government Money Fund (FOBXX) is a registered investment company under the Investment Company Act of 1940, registered with the U.S. Securities and Exchange Commission. It is structured as a series of Franklin Templeton Trust, a Florida-incorporated registered investment company with CIK 0001786958. As a U.S. government money market fund, it is classified under SEC Rule 2a-7, which imposes strict requirements on portfolio composition (minimum 99.5% in U.S. government securities, cash, and repurchase agreements collateralized by government securities), liquidity, weighted average maturity (60 days maximum), and credit quality.

The fund's U.S. registration is the cornerstone of its legal structure. Franklin Templeton explicitly markets BENJI as the "World's First U.S.-Registered Money Market Fund, Onchain," distinguishing it from offshore or synthetic RWA structures. The Florida incorporation and San Mateo, CA headquarters are consistent with Franklin Templeton's corporate footprint.

Retail accessibility is confirmed on the Stellar network, with institutional-only access on the other eight supported chains (Polygon, Arbitrum, Avalanche, Aptos, Ethereum, Base, Solana, Canton). Because FOBXX is a SEC-registered money market fund — not a private fund or Reg D/Reg S offering — it is not restricted to accredited investors. Any U.S. investor who completes KYC verification can invest, subject to standard fund eligibility requirements. The prospectus was not directly accessible from the Franklin Templeton product page (the URL returned only cookie consent content), which is a source limitation to note.

The SEC EDGAR entity record shows that Franklin Templeton Trust's Exchange Act registration has been revoked and its Municipal Advisor registration revoked and cancelled. This applies to the trust entity's Exchange Act filings; the fund's registration as an investment company under the Investment Company Act of 1940 remains separately governed. However, this warrants monitoring, as it may affect the trust's broader regulatory filings posture.

## Investor Access

**Who can invest:** Both retail and institutional investors. On Stellar, BENJI is available to retail and institutional investors. On Polygon, Arbitrum, Avalanche, Aptos, Ethereum, Base, Solana, and Canton, BENJI is available only to institutional investors.

**Onboarding process:** KYC/AML verification is required to mint or redeem BENJI tokens, and KYC/allowlist/whitelisting is required to transfer or hold the token. The specific KYC provider is not publicly named in the available sources. Tokens can be held in user-controlled (self-custody) wallets, though only after meeting the permissioning requirements.

**Estimated KYC timeline:** Not disclosed in available sources.

**KYC provider:** Not publicly identified in any of the five primary sources. Franklin Templeton likely uses its internal compliance infrastructure and/or a third-party provider, but this is not confirmed from the available data.

## Regulatory Risk

**Low — fully registered.** FOBXX operates as a SEC-registered investment company under the Investment Company Act of 1940, subject to Rule 2a-7 for government money market funds. This is among the highest levels of regulatory protection available to U.S. money market fund investors.

Items to monitor:
- The SEC EDGAR revocation of the Franklin Templeton Trust entity's Exchange Act registration and Municipal Advisor registration. While the fund's Investment Company Act registration is separately maintained, the broader entity posture should be monitored for any downstream filing impacts.
- Cross-chain expansion to permissionless blockchain environments may create jurisdictional grey areas if tokens are held by non-U.S. persons without U.S. regulatory protections. The DeFiLlama source notes the fund is tracked across 9 chains, with some chains restricted to institutional investors — but no explicit blocked jurisdiction list was found in the available sources.
- No explicit blocked jurisdictions, sanctions screening policy, or AML provider details were disclosed in the five primary sources. Institutional investors should obtain this information directly from Franklin Templeton before investing.

## Source Table

| Field | Value | Source URL | Confidence |
|-------|-------|------------|------------|
| regulatoryStatus | registered | https://digitalassets.franklintempleton.com/benji/ ("World's First U.S.-Registered Money Market Fund, Onchain"); https://defillama.com/rwa/asset/BENJI ("registered investment company, SEC filer CIK 0001786958") | High |
| primaryRegulator | SEC | https://digitalassets.franklintempleton.com/benji/ ("U.S.-Registered"); https://www.sec.gov/edgar/browse/?CIK=1786958&owner=exclude (EDGAR filings confirm SEC oversight) | High |
| regulatoryFramework | Investment Company Act of 1940 / Rule 2a-7 | https://defillama.com/rwa/asset/BENJI ("registered investment company"); implicit from "Government Money Fund" classification per SEC Rule 2a-7 | High |
| issuerName | Franklin Templeton Trust | https://www.sec.gov/edgar/browse/?CIK=1786958&owner=exclude ("FRANKLIN TEMPLETON TRUST"); https://defillama.com/rwa/asset/BENJI ("Issuer: Franklin Templeton Trust – Franklin OnChain U.S. Government Money Fund") | High |
| issuerCountry | US | https://www.sec.gov/edgar/browse/?CIK=1786958&owner=exclude (business address: San Mateo, CA) | High |
| legalStructure | Registered Investment Company (Series Fund, FL) | https://www.sec.gov/edgar/browse/?CIK=1786958&owner=exclude (State of incorporation: FL); https://defillama.com/rwa/asset/BENJI ("registered investment company... Series S000067043") | High |
| fundManager | Franklin Templeton | https://digitalassets.franklintempleton.com/benji/ (Franklin Templeton branded platform); https://defillama.com/rwa/asset/BENJI (Issuer: Franklin Templeton Trust) | High |
| targetInvestors | retail | https://defillama.com/rwa/asset/BENJI ("available for retail and institutional investors on Stellar") | High |
| kycRequired | true | https://defillama.com/rwa/asset/BENJI ("KYC to Mint or Redeem: yes"; "KYC/Allowlisted/Whitelisted to Transfer/Hold: yes") | High |
| accreditedOnly | false | https://digitalassets.franklintempleton.com/benji/ ("U.S.-Registered Money Market Fund"); https://defillama.com/rwa/asset/BENJI (available to retail investors on Stellar) — registered money market funds are open to all investors, not just accredited | Medium-High (inferred from SEC registration and retail availability; prospectus not directly reviewed) |
| minimumInvestment | null | N/A — not disclosed in any provided source | N/A |
| managementFee | null | N/A — not disclosed in any provided source | N/A |
| performanceFee | null | N/A — not disclosed in any provided source | N/A |
| prospectusUrl | null | https://www.franklintempleton.com/investments/options/mutual-funds/products/9001/A/franklin-onchain-us-government-money-fund/FOBXX returned only cookie consent content; no prospectus link retrievable | N/A |
| blockedJurisdictions | null | N/A — not disclosed in any provided source | N/A |
| allowedJurisdictions | null | N/A — not disclosed in any provided source | N/A |
| sanctionsScreening | null | N/A — not disclosed in any provided source | N/A |
| amlPolicy | null | N/A — specific AML/KYC provider not identified in provided sources | N/A |
| legalOpinionUrl | null | N/A — no legal opinion document referenced in provided sources | N/A |