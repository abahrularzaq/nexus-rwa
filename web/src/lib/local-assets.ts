import fs from "node:fs";
import path from "node:path";

type AssetIdentity = {
  name?: string | null;
  symbol?: string | null;
  category?: string | null;
  subcategory?: string | null;
};

type AssetCompliance = {
  regulatoryStatus?: string | null;
  primaryRegulator?: string | null;
  kycRequired?: boolean | null;
  accreditedOnly?: boolean | null;
  sanctionsScreening?: boolean | null;
  legalOpinionUrl?: string | null;
};

type AssetLiquidity = {
  redemptionType?: string | null;
  redemptionPeriodDays?: number | null;
  lockupPeriodDays?: number | null;
  minRedemptionAmount?: number | null;
  onchainLiquidity?: number | null;
  liquidityScore?: number | null;
};

type AssetReserve = {
  backingType?: string | null;
  custodian?: string | null;
  hasProofOfReserves?: boolean | null;
  auditor?: string | null;
  lastAuditDate?: string | null;
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
};

export type LocalAssetMetrics = {
  slug: string;
  identity: AssetIdentity;
  compliance: AssetCompliance;
  liquidity: AssetLiquidity;
  reserve: AssetReserve;
  gradeBaseline: AssetGradeBaseline;
};

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
  const filePath = path.join(process.cwd(), "..", "data", "assets", slug, fileName);

  if (!fs.existsSync(filePath)) return {} as T;

  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}
