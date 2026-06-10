import fs from "node:fs";
import path from "node:path";

type AssetIdentity = {
  name?: string | null;
  symbol?: string | null;
  fullName?: string | null;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  websiteUrl?: string | null;
  docsUrl?: string | null;
  launchDate?: string | null;
  isin?: string | null;
  tags?: string[];
};

type AssetCompliance = {
  regulatoryStatus?: string | null;
  primaryRegulator?: string | null;
  regulatoryFramework?: string | null;
  kycRequired?: boolean | null;
  accreditedOnly?: boolean | null;
  transferRestricted?: boolean | null;
  sanctionsScreening?: boolean | null;
  legalOpinionUrl?: string | null;
  blockedJurisdictions?: string[];
  allowedJurisdictions?: string[];
  amlPolicy?: string | null;
};

type AssetLiquidity = {
  redemptionType?: string | null;
  redemptionPeriodDays?: number | null;
  lockupPeriodDays?: number | null;
  earlyRedemptionFee?: number | null;
  minRedemptionAmount?: number | null;
  dexPairs?: string[];
  onchainLiquidity?: number | null;
  bidAskSpread?: number | null;
  liquidityScore?: number | null;
  liquidityNotes?: string | null;
};

type AssetReserve = {
  backingType?: string | null;
  backingDescription?: string | null;
  collateralizationRatio?: number | null;
  custodian?: string | null;
  custodianUrl?: string | null;
  hasProofOfReserves?: boolean | null;
  porOracleAddress?: string | null;
  porOracleChain?: string | null;
  auditor?: string | null;
  lastAuditDate?: string | null;
  lastAuditUrl?: string | null;
  reserveBreakdown?: Record<string, unknown> | null;
  redemptionAsset?: string | null;
};

type AssetGradeBaseline = {
  grade?: string | null;
  score?: number | null;
  completenessScore?: number | null;
  sourceScore?: number | null;
  legalScore?: number | null;
  reserveScore?: number | null;
  liquidityScore?: number | null;
  riskScore?: number | null;
  blockers?: string[];
  warnings?: string[];
  baselineDate?: string | null;
  status?: string | null;
  gradingProfile?: string | null;
  assetClass?: string | null;
  instrumentType?: string | null;
  claimType?: string | null;
  publicSegment?: string | null;
  gradeContext?: string | null;
  profileScores?: Record<string, number | null>;
  applicability?: Record<string, string>;
};

export type LocalAssetMetrics = {
  slug: string;
  identity: AssetIdentity;
  compliance: AssetCompliance;
  liquidity: AssetLiquidity;
  reserve: AssetReserve;
  gradeBaseline: AssetGradeBaseline;
};

export function getLocalAssetSlugs() {
  const assetsPath = getAssetsPath();

  if (!fs.existsSync(assetsPath)) return [];

  return fs
    .readdirSync(assetsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function hasLocalAsset(slug: string) {
  return fs.existsSync(path.join(getAssetsPath(), slug));
}

export function getLocalAssetMetrics(slug: string): LocalAssetMetrics {
  return {
    slug,
    identity: readAssetJson<AssetIdentity>(slug, "identity.json"),
    compliance: readAssetJson<AssetCompliance>(slug, "compliance.json"),
    liquidity: readAssetJson<AssetLiquidity>(slug, "liquidity.json"),
    reserve: readAssetJson<AssetReserve>(slug, "reserve.json"),
    gradeBaseline: readAssetJson<AssetGradeBaseline>(slug, "grade-baseline.json"),
  };
}

function readAssetJson<T extends object>(slug: string, fileName: string): T {
  const filePath = path.join(getAssetsPath(), slug, fileName);

  if (!fs.existsSync(filePath)) return {} as T;

  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function getAssetsPath() {
  return path.join(process.cwd(), "..", "data", "assets");
}
