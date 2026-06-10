/** 12-layer asset types — mirror API `AssetWithLayers` / tier-scoped list items. */

export type FieldApplicability = "available" | "missing" | "not_applicable" | string;

export type AssetClassification = {
  assetClass?: string | null;
  instrumentType?: string | null;
  claimType?: string | null;
  gradingProfile?: string | null;
  publicSegment?: string | null;
  reserveApplicability?: FieldApplicability | null;
  custodyApplicability?: FieldApplicability | null;
  redemptionApplicability?: FieldApplicability | null;
  proofOfReservesApplicability?: FieldApplicability | null;
  classificationNote?: string | null;
};

export type AssetIdentity = {
  name: string;
  symbol: string;
  fullName?: string | null;
  category: string;
  subcategory?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  docsUrl?: string | null;
  twitterUrl?: string | null;
  tags: string[];
  launchDate?: string | null;
};

export type AssetMarket = {
  tvl?: number | null;
  tvl7dChange?: number | null;
  tvl30dChange?: number | null;
  holderCount?: number | null;
  holderChange7d?: number | null;
  price?: number | null;
  priceChange24h?: number | null;
  sources: string[];
  confidence?: string | null;
  lastUpdated?: string | null;
};

export type AssetRisk = {
  overallScore?: number | null;
  overallLevel?: string | null;
  smartContractRisk?: number | null;
  counterpartyRisk?: number | null;
  liquidityRisk?: number | null;
  regulatoryRisk?: number | null;
  marketRisk?: number | null;
  concentrationRisk?: number | null;
  riskFactors: string[];
  mitigants: string[];
  assessmentMethod?: string | null;
  lastAssessed?: string | null;
};

export type AssetYield = {
  currentYield?: number | null;
  yieldType?: string | null;
  yieldAvg7d?: number | null;
  yieldAvg30d?: number | null;
  yieldMin52w?: number | null;
  yieldMax52w?: number | null;
  yieldBenchmark?: string | null;
  yieldVsBenchmark?: number | null;
  yieldFrequency?: string | null;
};

export type AssetCompliance = {
  regulatoryStatus?: string | null;
  primaryRegulator?: string | null;
  regulatoryFramework?: string | null;
  kycRequired: boolean;
  accreditedOnly: boolean;
  blockedJurisdictions: string[];
  allowedJurisdictions?: string[];
  sanctionsScreening?: boolean;
  amlPolicy?: string | null;
  lastComplianceCheck?: string | null;
};

export type AssetLiquidity = {
  redemptionType?: string | null;
  redemptionPeriodDays?: number | null;
  lockupPeriodDays?: number | null;
  liquidityScore?: number | null;
  onchainLiquidity?: number | null;
  minRedemptionAmount?: number | null;
  liquidityNotes?: string | null;
};

export type AssetBlockchain = {
  chain: string;
  chainId?: number | null;
  contractAddress: string;
  tokenStandard?: string | null;
  explorerUrl?: string | null;
  isVerified?: boolean;
  hasWhitelist?: boolean;
  hasTransferRestrictions?: boolean;
};

export type AssetReserve = {
  backingType?: string | null;
  backingDescription?: string | null;
  collateralizationRatio?: number | null;
  custodian?: string | null;
  custodianUrl?: string | null;
  hasProofOfReserves?: boolean;
  lastAuditDate?: string | null;
  lastAuditUrl?: string | null;
  auditor?: string | null;
  redemptionAsset?: string | null;
};

export type AssetInstitutional = {
  issuerName?: string | null;
  issuerType?: string | null;
  issuerCountry?: string | null;
  legalStructure?: string | null;
  targetInvestors?: string | null;
  metadata?: {
    classification?: AssetClassification;
    [key: string]: unknown;
  } | null;
};

export type AssetAiNarrative = {
  summary?: string | null;
  opportunities: string[];
  risks: string[];
  outlook?: string | null;
  outlookReason?: string | null;
  confidence?: string | null;
  compareTo: string[];
  generatedAt?: string | null;
  modelVersion?: string | null;
};

export type AssetGrade = {
  grade: "research" | "analytics" | "institutional" | string;
  score: number;
  completenessScore: number;
  sourceScore: number;
  legalScore: number;
  reserveScore: number | null;
  liquidityScore: number;
  riskScore: number;
  blockers: string[];
  warnings: string[];
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  updatedAt?: string | null;
  gradingProfile?: string | null;
  assetClass?: string | null;
  instrumentType?: string | null;
  claimType?: string | null;
  publicSegment?: string | null;
  gradeContext?: string | null;
  profileScores?: Record<string, number | null>;
  applicability?: Record<string, FieldApplicability>;
};

/** Full detail (FREE+); reserve/institutional on `/full` PRO response. */
export type AssetWithLayers = {
  id: string;
  slug: string;
  dataVersion: number;
  identity?: AssetIdentity | null;
  market?: AssetMarket | null;
  risk?: AssetRisk | null;
  yield?: AssetYield | null;
  compliance?: AssetCompliance | null;
  liquidity?: AssetLiquidity | null;
  blockchain?: AssetBlockchain[];
  reserve?: AssetReserve | null;
  institutional?: AssetInstitutional | null;
  aiNarrative?: AssetAiNarrative | null;
  grade?: AssetGrade | null;
};

/** List row from GET /v1/assets (pro tier layers). */
export type AssetListItem = AssetWithLayers;
