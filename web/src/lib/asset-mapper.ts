import type { AssetCategory, AssetDataMeta, AssetSummary, RiskLevel } from "@/lib/shared";
import type { AssetListItem, AssetWithLayers } from "@/types/asset";

const CATEGORY_MAP: Record<string, AssetCategory> = {
  treasury: "TREASURY",
  credit: "CREDIT",
  realestate: "REAL_ESTATE",
  real_estate: "REAL_ESTATE",
  commodities: "COMMODITIES",
  equity: "EQUITY",
  equities: "EQUITY",
};

export function normalizeCategory(raw?: string | null): AssetCategory {
  if (!raw) return "TREASURY";
  const upper = raw.toUpperCase().replace(/[\s-]+/g, "_") as AssetCategory;
  if (
    upper === "TREASURY" ||
    upper === "CREDIT" ||
    upper === "REAL_ESTATE" ||
    upper === "COMMODITIES" ||
    upper === "EQUITY"
  ) {
    return upper;
  }
  const key = raw.toLowerCase().replace(/[\s-]+/g, "");
  return CATEGORY_MAP[key] ?? "TREASURY";
}

export function normalizeRiskLevel(raw?: string | null): RiskLevel {
  const level = (raw ?? "MEDIUM").toUpperCase();
  if (level === "LOW" || level === "MEDIUM" || level === "HIGH" || level === "CRITICAL") {
    return level;
  }
  return "MEDIUM";
}

function buildMeta(market?: AssetWithLayers["market"]): AssetDataMeta {
  const sources = market?.sources?.length ? market.sources : ["defillama"];
  const confidence =
    market?.confidence === "HIGH" || market?.confidence === "LOW"
      ? market.confidence
      : "MEDIUM";
  return {
    sources,
    lastUpdated: market?.lastUpdated ?? new Date().toISOString(),
    confidence,
    methodology: "12-layer schema",
  };
}

/** Detect 12-layer API payload (not legacy flat / snapshot detail). */
export function isLayeredAsset(raw: Record<string, unknown>): boolean {
  if (raw.snapshot != null && typeof raw.snapshot === "object") {
    return false;
  }
  return (
    typeof raw.slug === "string" &&
    (raw.identity != null || raw.market != null)
  );
}

function parseOptionalNumber(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function stringArray(val: unknown): string[] {
  return Array.isArray(val) ? val.filter((x): x is string => typeof x === "string") : [];
}

function parseIdentity(raw: unknown): AssetWithLayers["identity"] {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    name: String(o.name ?? ""),
    symbol: String(o.symbol ?? ""),
    fullName: o.fullName != null ? String(o.fullName) : null,
    category: String(o.category ?? "Treasury"),
    subcategory: o.subcategory != null ? String(o.subcategory) : null,
    description: o.description != null ? String(o.description) : null,
    logoUrl: o.logoUrl != null ? String(o.logoUrl) : null,
    websiteUrl: o.websiteUrl != null ? String(o.websiteUrl) : null,
    docsUrl: o.docsUrl != null ? String(o.docsUrl) : null,
    twitterUrl: o.twitterUrl != null ? String(o.twitterUrl) : null,
    tags: stringArray(o.tags),
    launchDate: o.launchDate != null ? String(o.launchDate) : null,
  };
}

function parseMarket(raw: unknown): AssetWithLayers["market"] {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    tvl: parseOptionalNumber(o.tvl),
    tvl7dChange:
      parseOptionalNumber(o.tvl7dChange) ??
      (parseOptionalNumber(o.change7d) != null
        ? (parseOptionalNumber(o.change7d) ?? 0) * 100
        : null),
    tvl30dChange: parseOptionalNumber(o.tvl30dChange),
    holderCount: parseOptionalNumber(o.holderCount),
    holderChange7d: parseOptionalNumber(o.holderChange7d),
    price: parseOptionalNumber(o.price),
    priceChange24h: parseOptionalNumber(o.priceChange24h),
    sources: stringArray(o.sources).length ? stringArray(o.sources) : ["defillama"],
    confidence: o.confidence != null ? String(o.confidence) : null,
    lastUpdated: o.lastUpdated != null ? String(o.lastUpdated) : null,
  };
}

function parseRisk(raw: unknown): AssetWithLayers["risk"] {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if ("level" in o && !("overallLevel" in o)) {
    return {
      overallLevel: o.level != null ? String(o.level) : null,
      overallScore: typeof o.score === "number" ? o.score : null,
      riskFactors: stringArray(o.factors),
      mitigants: [],
    };
  }
  return {
    overallScore: typeof o.overallScore === "number" ? o.overallScore : null,
    overallLevel: o.overallLevel != null ? String(o.overallLevel) : null,
    smartContractRisk:
      typeof o.smartContractRisk === "number" ? o.smartContractRisk : null,
    counterpartyRisk:
      typeof o.counterpartyRisk === "number" ? o.counterpartyRisk : null,
    liquidityRisk: typeof o.liquidityRisk === "number" ? o.liquidityRisk : null,
    regulatoryRisk:
      typeof o.regulatoryRisk === "number" ? o.regulatoryRisk : null,
    marketRisk: typeof o.marketRisk === "number" ? o.marketRisk : null,
    concentrationRisk:
      typeof o.concentrationRisk === "number" ? o.concentrationRisk : null,
    riskFactors: stringArray(o.riskFactors),
    mitigants: stringArray(o.mitigants),
    assessmentMethod:
      o.assessmentMethod != null ? String(o.assessmentMethod) : null,
    lastAssessed: o.lastAssessed != null ? String(o.lastAssessed) : null,
  };
}

function parseYieldFromRate(rate: number | null): number | null {
  if (rate == null) return null;
  return rate <= 1 ? rate * 100 : rate;
}

function parseYield(raw: unknown): AssetWithLayers["yield"] {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const current =
    parseOptionalNumber(o.currentYield) ??
    parseYieldFromRate(parseOptionalNumber(o.yieldRate));
  return {
    currentYield: current,
    yieldType: o.yieldType != null ? String(o.yieldType) : null,
    yieldAvg7d: parseOptionalNumber(o.yieldAvg7d),
    yieldAvg30d: parseOptionalNumber(o.yieldAvg30d),
    yieldMin52w: parseOptionalNumber(o.yieldMin52w),
    yieldMax52w: parseOptionalNumber(o.yieldMax52w),
    yieldBenchmark: o.yieldBenchmark != null ? String(o.yieldBenchmark) : null,
    yieldVsBenchmark:
      typeof o.yieldVsBenchmark === "number" ? o.yieldVsBenchmark : null,
    yieldFrequency:
      o.yieldFrequency != null ? String(o.yieldFrequency) : null,
  };
}

function parseCompliance(raw: unknown): AssetWithLayers["compliance"] {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    regulatoryStatus:
      o.regulatoryStatus != null ? String(o.regulatoryStatus) : null,
    primaryRegulator:
      o.primaryRegulator != null ? String(o.primaryRegulator) : null,
    regulatoryFramework:
      o.regulatoryFramework != null ? String(o.regulatoryFramework) : null,
    kycRequired: Boolean(o.kycRequired),
    accreditedOnly: Boolean(o.accreditedOnly),
    blockedJurisdictions: stringArray(o.blockedJurisdictions),
    allowedJurisdictions: stringArray(o.allowedJurisdictions),
    sanctionsScreening: Boolean(o.sanctionsScreening),
    amlPolicy: o.amlPolicy != null ? String(o.amlPolicy) : null,
    lastComplianceCheck:
      o.lastComplianceCheck != null ? String(o.lastComplianceCheck) : null,
  };
}

function parseLiquidity(raw: unknown): AssetWithLayers["liquidity"] {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    redemptionType:
      o.redemptionType != null ? String(o.redemptionType) : null,
    redemptionPeriodDays:
      typeof o.redemptionPeriodDays === "number"
        ? o.redemptionPeriodDays
        : null,
    lockupPeriodDays:
      typeof o.lockupPeriodDays === "number" ? o.lockupPeriodDays : null,
    liquidityScore:
      typeof o.liquidityScore === "number" ? o.liquidityScore : null,
    onchainLiquidity:
      typeof o.onchainLiquidity === "number" ? o.onchainLiquidity : null,
    minRedemptionAmount:
      typeof o.minRedemptionAmount === "number" ? o.minRedemptionAmount : null,
    liquidityNotes:
      o.liquidityNotes != null ? String(o.liquidityNotes) : null,
  };
}

function parseBlockchain(raw: unknown): AssetWithLayers["blockchain"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x === "object")
    .map((row) => {
      const o = row as Record<string, unknown>;
      return {
        chain: String(o.chain ?? "ethereum"),
        chainId: typeof o.chainId === "number" ? o.chainId : null,
        contractAddress: String(o.contractAddress ?? ""),
        tokenStandard:
          o.tokenStandard != null ? String(o.tokenStandard) : null,
        explorerUrl: o.explorerUrl != null ? String(o.explorerUrl) : null,
        isVerified: Boolean(o.isVerified),
        hasWhitelist: Boolean(o.hasWhitelist),
        hasTransferRestrictions: Boolean(o.hasTransferRestrictions),
      };
    });
}

function parseReserve(raw: unknown): AssetWithLayers["reserve"] {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    backingType: o.backingType != null ? String(o.backingType) : null,
    backingDescription:
      o.backingDescription != null ? String(o.backingDescription) : null,
    collateralizationRatio:
      typeof o.collateralizationRatio === "number"
        ? o.collateralizationRatio
        : null,
    custodian: o.custodian != null ? String(o.custodian) : null,
    custodianUrl: o.custodianUrl != null ? String(o.custodianUrl) : null,
    hasProofOfReserves: Boolean(o.hasProofOfReserves),
    lastAuditDate:
      o.lastAuditDate != null ? String(o.lastAuditDate) : null,
    lastAuditUrl: o.lastAuditUrl != null ? String(o.lastAuditUrl) : null,
    auditor: o.auditor != null ? String(o.auditor) : null,
    redemptionAsset: o.redemptionAsset != null ? String(o.redemptionAsset) : null,
  };
}

function parseInstitutional(raw: unknown): AssetWithLayers["institutional"] {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    issuerName: o.issuerName != null ? String(o.issuerName) : null,
    issuerType: o.issuerType != null ? String(o.issuerType) : null,
    issuerCountry: o.issuerCountry != null ? String(o.issuerCountry) : null,
    legalStructure:
      o.legalStructure != null ? String(o.legalStructure) : null,
    targetInvestors:
      o.targetInvestors != null ? String(o.targetInvestors) : null,
  };
}

function parseGrade(raw: unknown): AssetWithLayers["grade"] {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const score = parseOptionalNumber(o.score) ?? 0;
  return {
    grade: o.grade != null ? String(o.grade) : "research",
    score,
    completenessScore: parseOptionalNumber(o.completenessScore) ?? 0,
    sourceScore: parseOptionalNumber(o.sourceScore) ?? 0,
    legalScore: parseOptionalNumber(o.legalScore) ?? 0,
    reserveScore: parseOptionalNumber(o.reserveScore) ?? 0,
    liquidityScore: parseOptionalNumber(o.liquidityScore) ?? 0,
    riskScore: parseOptionalNumber(o.riskScore) ?? 0,
    blockers: stringArray(o.blockers),
    warnings: stringArray(o.warnings),
    reviewedBy: o.reviewedBy != null ? String(o.reviewedBy) : null,
    reviewedAt: o.reviewedAt != null ? String(o.reviewedAt) : null,
    updatedAt: o.updatedAt != null ? String(o.updatedAt) : null,
  };
}

/** Parse API JSON into layered asset (supports legacy flat fallback). */
export function parseAssetWithLayers(raw: Record<string, unknown>): AssetWithLayers {
  if (isLayeredAsset(raw)) {
    return {
      id: String(raw.id ?? raw.slug ?? ""),
      slug: String(raw.slug ?? raw.id ?? ""),
      dataVersion: typeof raw.dataVersion === "number" ? raw.dataVersion : 1,
      identity: parseIdentity(raw.identity),
      market: parseMarket(raw.market),
      risk: parseRisk(raw.risk),
      yield: parseYield(raw.yield),
      compliance: parseCompliance(raw.compliance),
      liquidity: parseLiquidity(raw.liquidity),
      blockchain: parseBlockchain(raw.blockchain),
      reserve: parseReserve(raw.reserve),
      institutional: parseInstitutional(raw.institutional),
      grade: parseGrade(raw.grade),
    };
  }

  const slug = String(raw.slug ?? raw.id ?? "");
  const snap =
    raw.snapshot && typeof raw.snapshot === "object"
      ? (raw.snapshot as Record<string, unknown>)
      : null;
  const holder =
    raw.holder && typeof raw.holder === "object"
      ? (raw.holder as Record<string, unknown>)
      : null;
  const riskObj =
    raw.risk && typeof raw.risk === "object"
      ? (raw.risk as Record<string, unknown>)
      : null;
  const riskLevel = String(
    riskObj?.level ?? riskObj?.overallLevel ?? raw.riskScore ?? "MEDIUM",
  );
  const tvl =
    parseOptionalNumber(raw.tvl) ?? parseOptionalNumber(snap?.tvl);
  const yieldRate =
    parseOptionalNumber(raw.yieldRate) ??
    parseOptionalNumber(snap?.yieldRate);
  const holderCount =
    parseOptionalNumber(raw.holderCount) ??
    parseOptionalNumber(snap?.holderCount) ??
    parseOptionalNumber(holder?.totalHolders);
  const change7d =
    parseOptionalNumber(raw.change7d) ??
    (parseOptionalNumber(raw.tvl7dChange) != null
      ? (parseOptionalNumber(raw.tvl7dChange) ?? 0) / 100
      : null);

  return {
    id: String(raw.id ?? slug),
    slug,
    dataVersion: typeof raw.dataVersion === "number" ? raw.dataVersion : 1,
    identity: {
      name: String(raw.name ?? slug),
      symbol: String(raw.symbol ?? ""),
      category: String(raw.category ?? "Treasury"),
      tags: [],
    },
    market: {
      tvl,
      tvl7dChange: change7d != null ? change7d * 100 : null,
      holderCount,
      sources: ["defillama"],
    },
    risk: {
      overallLevel: riskLevel,
      overallScore: parseOptionalNumber(riskObj?.score),
      riskFactors: stringArray(riskObj?.factors),
      mitigants: [],
    },
    yield: {
      currentYield: parseYieldFromRate(yieldRate),
    },
    grade: parseGrade(raw.grade),
  };
}

export function parseAssetList(rows: unknown): AssetListItem[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row): row is Record<string, unknown> => row != null && typeof row === "object")
    .map(parseAssetWithLayers);
}

export function toAssetSummary(asset: AssetWithLayers): AssetSummary {
  const meta = buildMeta(asset.market);
  return {
    id: asset.slug,
    name: asset.identity?.name ?? asset.slug,
    symbol: asset.identity?.symbol ?? "",
    category: normalizeCategory(asset.identity?.category),
    tvl: asset.market?.tvl ?? null,
    yieldRate:
      asset.yield?.currentYield != null ? asset.yield.currentYield / 100 : null,
    risk: normalizeRiskLevel(asset.risk?.overallLevel),
    change7d:
      asset.market?.tvl7dChange != null ? asset.market.tvl7dChange / 100 : null,
    holderCount: asset.market?.holderCount ?? null,
    _meta: meta,
  };
}

export function toAssetSummaries(assets: AssetWithLayers[]): AssetSummary[] {
  return assets.map(toAssetSummary);
}
