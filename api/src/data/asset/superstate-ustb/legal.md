---

regulatoryStatus: exempt
primaryRegulator: SEC
regulatoryFramework: Reg D
issuerName: Superstate Short Duration US Government Securities Fund, a series of Superstate Asset Trust
issuerCountry: US
legalStructure: Series of a Delaware Statutory Trust
fundManager: Superstate Inc.
minimumInvestment: 100000
managementFee: 0.15% per year
performanceFee: 0%
targetInvestors: institutional
prospectusUrl: null
kycRequired: true
accreditedOnly: true
blockedJurisdictions: null
allowedJurisdictions: ["US","AU","BM","BS","VG","CA","KY","CY","FR","GE","DE","GI","HK","IT","IE","JE","LU","MH","PA","PL","SC","SG","ES","KN","KR","CH","AE","GB"]
sanctionsScreening: true
amlPolicy: AML/KYC program with compliance checks, anti-money laundering screening, accreditation review, identity verification, and allowlist approval
legalOpinionUrl: null
_lastUpdated: 2026-05-31
_source: manual
---------------

## Legal Analysis

USTB is currently presented by Superstate as a tokenized private fund that offers Qualified Purchasers access to short-duration Treasury Bills. The fund is structured as a series of a Delaware Statutory Trust, with ownership represented either as USTB tokens on supported networks or in book-entry record keeping. SEC Form D for “Superstate Short Duration US Government Securities Fund, a series of Superstate Asset Trust” identifies the issuer as a series of a Delaware Trust, not registered as an investment company under the Investment Company Act of 1940, and claiming Rule 506(c) under Regulation D plus Investment Company Act Section 3(c)(1) and Section 3(c)(7) exclusions.

The jurisdiction and structure appear designed for a U.S. private-fund securities offering with transfer-agent and allowlist controls layered onto tokenized fund shares. This structure is not intended for unrestricted retail access. Superstate’s own onboarding documentation says Superstate Funds are available only to Qualified Purchasers in supported countries, with at least $5 million in investable assets for individuals or $25 million for institutions.

There is a material classification issue to monitor: Superstate’s current USTB asset page describes USTB as a “tokenized private fund,” while DefiLlama’s USTB page describes registry information for “Superstate Trust – Delaware statutory trust registered with the SEC as an open-end management investment company” and references a “Superstate USTB Money Market Fund.” SEC filings also show a proposed reorganization of the private predecessor fund into a registered fund structure. For this output, the current official Superstate USTB page and SEC Form D were treated as controlling for the present USTB private-fund legal status.

## Investor Access

Investors must create a Superstate account, complete an investing entity application, and, for Superstate Funds such as USTB, complete a separate fund application. Superstate documentation says fund access requires proof of accredited investor status and eligibility review. The review process includes compliance checks, anti-money laundering screening, and accreditation status assessment, followed by execution of an Investment Agreement after approval.

Superstate Funds are only available to Qualified Purchasers in supported countries. Superstate lists supported countries for Superstate Funds as United States, Australia, Bermuda, Bahamas, British Virgin Islands, Canada, Cayman Islands, Cyprus, France, Georgia, Germany, Gibraltar, Hong Kong, Italy, Ireland, Jersey, Luxembourg, Marshall Islands, Panama, Poland, Seychelles, Singapore, Spain, Saint Kitts and Nevis, South Korea, Switzerland, United Arab Emirates, and United Kingdom. No official blocked-jurisdiction ISO list was found in the provided official Terms of Service, so blockedJurisdictions is set to null.

## Regulatory Risk

Not low — private-fund exemption and tokenized securities structure require ongoing legal monitoring. Key risks include reliance on Regulation D/private-fund exemptions, investor eligibility restrictions, supported-jurisdiction limitations, KYC/AML and allowlist dependency, transferability constraints, evolving tokenized-securities regulation, and the observed classification conflict between current Superstate private-fund materials and third-party/SEC materials referring to a registered open-end fund reorganization path.

---

## Source Table

| Field                | Value                                                                                                                                         | Source URL                                                                                                                                                                                       | Confidence |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| regulatoryStatus     | exempt                                                                                                                                        | [https://www.sec.gov/Archives/edgar/data/2004367/000200436724000001/xslFormDX08/primary_doc.xml](https://www.sec.gov/Archives/edgar/data/2004367/000200436724000001/xslFormDX08/primary_doc.xml) | High       |
| primaryRegulator     | SEC                                                                                                                                           | [https://www.sec.gov/Archives/edgar/data/2004367/000200436724000001/xslFormDX08/primary_doc.xml](https://www.sec.gov/Archives/edgar/data/2004367/000200436724000001/xslFormDX08/primary_doc.xml) | High       |
| regulatoryFramework  | Reg D                                                                                                                                         | [https://www.sec.gov/Archives/edgar/data/2004367/000200436724000001/xslFormDX08/primary_doc.xml](https://www.sec.gov/Archives/edgar/data/2004367/000200436724000001/xslFormDX08/primary_doc.xml) | High       |
| issuerName           | Superstate Short Duration US Government Securities Fund, a series of Superstate Asset Trust                                                   | [https://www.sec.gov/Archives/edgar/data/2004367/000200436724000001/xslFormDX08/primary_doc.xml](https://www.sec.gov/Archives/edgar/data/2004367/000200436724000001/xslFormDX08/primary_doc.xml) | High       |
| issuerCountry        | US                                                                                                                                            | [https://www.sec.gov/Archives/edgar/data/2004367/000200436724000001/xslFormDX08/primary_doc.xml](https://www.sec.gov/Archives/edgar/data/2004367/000200436724000001/xslFormDX08/primary_doc.xml) | High       |
| legalStructure       | Series of a Delaware Statutory Trust                                                                                                          | [https://superstate.com/assets/ustb](https://superstate.com/assets/ustb)                                                                                                                         | High       |
| fundManager          | Superstate Inc.                                                                                                                               | [https://superstate.com/assets/ustb](https://superstate.com/assets/ustb)                                                                                                                         | High       |
| minimumInvestment    | 100000                                                                                                                                        | [https://docs.superstate.com/superstate-funds](https://docs.superstate.com/superstate-funds)                                                                                                     | High       |
| managementFee        | 0.15% per year                                                                                                                                | [https://superstate.com/assets/ustb](https://superstate.com/assets/ustb)                                                                                                                         | High       |
| performanceFee       | 0%                                                                                                                                            | [https://superstate.com/assets/ustb](https://superstate.com/assets/ustb)                                                                                                                         | High       |
| targetInvestors      | institutional                                                                                                                                 | [https://superstate.com/assets/ustb](https://superstate.com/assets/ustb)                                                                                                                         | High       |
| kycRequired          | true                                                                                                                                          | [https://docs.superstate.com/welcome-to-superstate/onboarding](https://docs.superstate.com/welcome-to-superstate/onboarding)                                                                     | High       |
| accreditedOnly       | true                                                                                                                                          | [https://docs.superstate.com/welcome-to-superstate/onboarding](https://docs.superstate.com/welcome-to-superstate/onboarding)                                                                     | High       |
| allowedJurisdictions | ["US","AU","BM","BS","VG","CA","KY","CY","FR","GE","DE","GI","HK","IT","IE","JE","LU","MH","PA","PL","SC","SG","ES","KN","KR","CH","AE","GB"] | [https://docs.superstate.com/welcome-to-superstate/onboarding](https://docs.superstate.com/welcome-to-superstate/onboarding)                                                                     | High       |
| sanctionsScreening   | true                                                                                                                                          | [https://superstate.com/terms](https://superstate.com/terms)                                                                                                                                     | Medium     |
| amlPolicy            | AML/KYC program with compliance checks, anti-money laundering screening, accreditation review, identity verification, and allowlist approval  | [https://docs.superstate.com/welcome-to-superstate/onboarding](https://docs.superstate.com/welcome-to-superstate/onboarding)                                                                     | High       |
| _lastUpdated         | 2026-05-31                                                                                                                                    | N/A — task metadata                                                                                                                                                                              | High       |
| _source              | manual                                                                                                                                        | N/A — task metadata                                                                                                                                                                              | High       |
