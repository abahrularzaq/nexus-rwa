export type FieldCategory =
  | "Identity"
  | "Market"
  | "Yield"
  | "Reserve"
  | "Compliance"
  | "Liquidity"
  | "Risk"
  | "Grading"
  | "Source";

export type FieldDefinition = {
  label: string;
  category: FieldCategory;
  shortDescription: string;
  whyItMatters: string;
  example?: string;
  valueType: "string" | "number" | "boolean" | "percentage" | "currency" | "score" | "array" | "url";
};

export const FIELD_DEFINITIONS = {
  name: {
    label: "Asset Name",
    category: "Identity",
    shortDescription: "The public name of the RWA asset or tokenized product.",
    whyItMatters: "Consistent naming avoids confusion between similarly named products, share classes, wrappers, or protocol tokens.",
    example: "Ondo Short-Term US Government Treasuries",
    valueType: "string",
  },
  symbol: {
    label: "Symbol",
    category: "Identity",
    shortDescription: "The ticker or token symbol used to identify the asset.",
    whyItMatters: "Symbols are not always unique, so they should be checked together with issuer, chain, and contract address.",
    example: "OUSG, USDY, BENJI, USTB",
    valueType: "string",
  },
  category: {
    label: "Category",
    category: "Identity",
    shortDescription: "The high-level asset class represented by the RWA product.",
    whyItMatters: "Category helps users compare assets with similar risk, yield, liquidity, and regulatory profiles.",
    example: "Treasury, Credit, Real Estate, Commodities",
    valueType: "string",
  },
  tvl: {
    label: "TVL",
    category: "Market",
    shortDescription: "Total value locked or tracked value associated with the asset or protocol.",
    whyItMatters: "TVL can indicate market adoption, but it should be verified against official AUM, issuer reports, or reliable data aggregators.",
    example: "$892.4M",
    valueType: "currency",
  },
  aumUsd: {
    label: "AUM",
    category: "Market",
    shortDescription: "Assets under management reported in U.S. dollars.",
    whyItMatters: "AUM is often more relevant than secondary-market TVL for regulated funds and tokenized treasury products.",
    example: "$500M AUM from issuer disclosure",
    valueType: "currency",
  },
  marketCap: {
    label: "Market Cap",
    category: "Market",
    shortDescription: "Estimated circulating value of the token or asset in the market.",
    whyItMatters: "Market cap can help compare asset scale, but it may be unreliable if supply, pricing, or transferability is unclear.",
    example: "circulatingSupply × price",
    valueType: "currency",
  },
  volume24h: {
    label: "24H Volume",
    category: "Market",
    shortDescription: "Trading volume observed over the last 24 hours.",
    whyItMatters: "Higher volume may indicate better secondary-market liquidity, but issuer redemption terms can be more important for permissioned RWAs.",
    example: "$1.2M traded in 24 hours",
    valueType: "currency",
  },
  holderCount: {
    label: "Holder Count",
    category: "Market",
    shortDescription: "Number of wallets or accounts holding the token.",
    whyItMatters: "Holder count helps estimate adoption and concentration risk, but wallet counts can be distorted by custodians or internal treasury wallets.",
    example: "1,240 holders",
    valueType: "number",
  },
  currentYield: {
    label: "Current Yield",
    category: "Yield",
    shortDescription: "The latest available yield or APY reported for the asset.",
    whyItMatters: "Yield should be tied to a verifiable source and methodology because RWA products may report net yield, gross yield, APY, or benchmark-linked rates differently.",
    example: "5.42% APY",
    valueType: "percentage",
  },
  yieldType: {
    label: "Yield Type",
    category: "Yield",
    shortDescription: "The method used to describe the asset return, such as APY, distribution yield, or target yield.",
    whyItMatters: "Different yield types are not directly comparable without understanding fees, compounding, and distribution mechanics.",
    example: "APY, net yield, target yield, distribution yield",
    valueType: "string",
  },
  backingType: {
    label: "Backing Type",
    category: "Reserve",
    shortDescription: "The underlying real-world asset or collateral type backing the token.",
    whyItMatters: "Backing type is central to understanding credit risk, duration risk, liquidity risk, and regulatory treatment.",
    example: "US Treasury, Money Market Fund, Private Credit, Commodity",
    valueType: "string",
  },
  collateralizationRatio: {
    label: "Collateralization Ratio",
    category: "Reserve",
    shortDescription: "The ratio between backing assets and token liabilities, when explicitly disclosed.",
    whyItMatters: "A verified collateralization ratio can reduce backing uncertainty, but it should not be estimated without a source.",
    example: "1.0 means 100% collateralized",
    valueType: "number",
  },
  custodian: {
    label: "Custodian",
    category: "Reserve",
    shortDescription: "The institution responsible for safekeeping cash, securities, commodities, or other backing assets.",
    whyItMatters: "A credible custodian can reduce operational and asset-safekeeping risk.",
    example: "Bank, qualified custodian, transfer agent, or regulated financial institution",
    valueType: "string",
  },
  hasProofOfReserves: {
    label: "Proof of Reserves",
    category: "Reserve",
    shortDescription: "Indicates whether public evidence of backing or reserves is available.",
    whyItMatters: "Proof of reserves may reduce transparency risk, but it must be distinguished from smart-contract audits or marketing claims.",
    example: "Attestation report, fund report, custodian report, or on-chain reserve oracle",
    valueType: "boolean",
  },
  auditor: {
    label: "Auditor",
    category: "Reserve",
    shortDescription: "The auditor or attestation provider associated with the asset, fund, or reserve report.",
    whyItMatters: "Independent audit or attestation can improve confidence in reported backing, fund operations, and controls.",
    example: "Independent audit firm or attestation provider",
    valueType: "string",
  },
  kycRequired: {
    label: "KYC Required",
    category: "Compliance",
    shortDescription: "Shows whether users must complete identity verification before accessing, minting, redeeming, or transferring the asset.",
    whyItMatters: "KYC can improve regulatory control but may reduce permissionless access and composability.",
    example: "true when issuer requires verified investor onboarding",
    valueType: "boolean",
  },
  accreditedOnly: {
    label: "Accredited Only",
    category: "Compliance",
    shortDescription: "Indicates whether the asset is limited to accredited, qualified, or professional investors.",
    whyItMatters: "Investor eligibility restrictions affect who can legally access the asset and how it can be distributed.",
    example: "true for products limited to qualified purchasers or accredited investors",
    valueType: "boolean",
  },
  transferRestricted: {
    label: "Transfer Restricted",
    category: "Compliance",
    shortDescription: "Shows whether token transfers are restricted by whitelist, jurisdiction, eligibility, or compliance rules.",
    whyItMatters: "Transfer restrictions may improve compliance but can reduce liquidity and DeFi composability.",
    example: "Only whitelisted wallets can receive the token",
    valueType: "boolean",
  },
  sanctionsScreening: {
    label: "Sanctions Screening",
    category: "Compliance",
    shortDescription: "Indicates whether users, wallets, or transactions are screened against sanctions restrictions.",
    whyItMatters: "Sanctions controls are important for institutional adoption and regulatory risk management.",
    example: "OFAC or equivalent screening process disclosed by issuer",
    valueType: "boolean",
  },
  regulatoryStatus: {
    label: "Regulatory Status",
    category: "Compliance",
    shortDescription: "The disclosed regulatory posture of the issuer, fund, token, or offering.",
    whyItMatters: "Regulatory status helps users understand whether the product is registered, exempt, restricted, or unclear.",
    example: "registered, exempt, private offering, regulated fund",
    valueType: "string",
  },
  redemptionType: {
    label: "Redemption Type",
    category: "Liquidity",
    shortDescription: "The mechanism used to redeem the token into cash, stablecoin, or the underlying asset.",
    whyItMatters: "Issuer-supported redemption can matter more than DEX liquidity for many permissioned RWA assets.",
    example: "instant, T+1, T+3, weekly, monthly, gated",
    valueType: "string",
  },
  redemptionPeriodDays: {
    label: "Redemption Period",
    category: "Liquidity",
    shortDescription: "Estimated number of days required to redeem the asset after a valid redemption request.",
    whyItMatters: "Longer redemption periods increase exit risk, especially during market stress or operational disruptions.",
    example: "1 means approximately T+1 business day",
    valueType: "number",
  },
  lockupPeriodDays: {
    label: "Lock-up Period",
    category: "Liquidity",
    shortDescription: "The period during which holders may be unable to redeem or transfer the asset.",
    whyItMatters: "Lock-ups can materially reduce liquidity even when the underlying asset is high quality.",
    example: "30 days lock-up after subscription",
    valueType: "number",
  },
  onchainLiquidity: {
    label: "On-chain Liquidity",
    category: "Liquidity",
    shortDescription: "Available liquidity visible on DEXs, pools, or other on-chain markets.",
    whyItMatters: "On-chain liquidity affects secondary-market exits, but may be less relevant for assets primarily redeemed with the issuer.",
    example: "$250K available across verified pools",
    valueType: "currency",
  },
  liquidityScore: {
    label: "Liquidity Score",
    category: "Liquidity",
    shortDescription: "A score estimating how easily the asset can be bought, sold, transferred, or redeemed.",
    whyItMatters: "Lower liquidity scores may indicate delayed redemption, transfer restrictions, limited market depth, or high exit uncertainty.",
    example: "85-100 for instant redemption; lower for longer windows or lock-ups",
    valueType: "score",
  },
  riskScore: {
    label: "Risk Score",
    category: "Risk",
    shortDescription: "Composite score summarizing the asset's observed risk profile based on available data.",
    whyItMatters: "Risk score helps compare assets, but it is a data-quality and risk indicator, not investment advice.",
    example: "88 out of 100",
    valueType: "score",
  },
  legalScore: {
    label: "Legal Score",
    category: "Grading",
    shortDescription: "Score reflecting legal documentation, issuer clarity, regulator visibility, and investor eligibility disclosures.",
    whyItMatters: "Legal opacity can be a blocker for institutional-grade classification.",
    example: "Higher when prospectus, offering docs, regulator records, and terms are publicly verifiable",
    valueType: "score",
  },
  reserveScore: {
    label: "Reserve Score",
    category: "Grading",
    shortDescription: "Score reflecting the quality and verifiability of asset backing, reserve reporting, custody, and audits.",
    whyItMatters: "Reserve transparency is critical for determining whether an RWA token is credibly backed.",
    example: "Higher when backing, custodian, and audit/attestation sources are strong",
    valueType: "score",
  },
  sourceScore: {
    label: "Source Score",
    category: "Source",
    shortDescription: "Score reflecting the quality, reliability, and completeness of sources used for the asset profile.",
    whyItMatters: "Strong data requires traceable sources, especially for institutional, compliance, and reserve claims.",
    example: "Official issuer docs and regulator filings score higher than aggregators or media mentions",
    valueType: "score",
  },
  completenessScore: {
    label: "Completeness Score",
    category: "Grading",
    shortDescription: "Score measuring how many required fields are populated with verifiable data.",
    whyItMatters: "A complete profile is easier to evaluate, but completeness does not automatically mean low risk.",
    example: "100 means all required fields are filled with acceptable evidence",
    valueType: "score",
  },
  dataQualityGrade: {
    label: "Data Quality Grade",
    category: "Grading",
    shortDescription: "Classification of the asset profile based on evidence depth and review status.",
    whyItMatters: "This separates preliminary research coverage from analytics-ready or institutional-grade data.",
    example: "research, analytics, institutional",
    valueType: "string",
  },
} as const satisfies Record<string, FieldDefinition>;

export type FieldKey = keyof typeof FIELD_DEFINITIONS;

export function getFieldDefinition(fieldKey: string) {
  return FIELD_DEFINITIONS[fieldKey as FieldKey];
}
