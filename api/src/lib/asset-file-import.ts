import type { Prisma } from '@prisma/client';
import { existsSync } from 'node:fs';
import {
  ASSET_LAYER_FILES,
  assetDirForSlug,
  loadAssetFileBundle,
} from './asset-file-parser.js';

export type ValidationIssue = {
  severity: 'error' | 'warning';
  layer: string;
  field?: string;
  message: string;
};

export type FieldConflict = {
  layer: string;
  field: string;
  fileValue: unknown;
  dbValue: unknown;
};

export type AssetFileImportPayload = {
  slug: string;
  asset: Pick<Prisma.AssetUpdateInput, 'isActive' | 'dataVersion'>;
  identity: Prisma.AssetIdentityCreateWithoutAssetInput;
  reserve: Prisma.AssetReserveCreateWithoutAssetInput;
  risk: Prisma.AssetRiskCreateWithoutAssetInput;
  yield: Prisma.AssetYieldCreateWithoutAssetInput;
  institutional: Prisma.AssetInstitutionalCreateWithoutAssetInput;
  compliance: Prisma.AssetComplianceCreateWithoutAssetInput;
  liquidity: Prisma.AssetLiquidityCreateWithoutAssetInput;
  market: Prisma.AssetMarketCreateWithoutAssetInput;
  blockchain: Prisma.AssetBlockchainCreateWithoutAssetInput[];
};

const IDENTITY_REQUIRED = ['name', 'symbol', 'category'] as const;
const INSTITUTIONAL_REQUIRED = ['issuerName', 'issuerCountry'] as const;
const RESERVE_REQUIRED = ['backingType'] as const;

function asString(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') return value.trim() || undefined;
  return String(value);
}

function asNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function asInt(value: unknown): number | undefined {
  const n = asNumber(value);
  return n == null ? undefined : Math.round(n);
}

function asBool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function hasOwnField(record: Record<string, unknown>, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, field);
}

function asNullableBoolField(record: Record<string, unknown>, field: string): boolean | null | undefined {
  if (!hasOwnField(record, field)) return undefined;
  const value = record[field];
  if (value === null) return null;
  return asBool(value);
}

function asNullableStringField(record: Record<string, unknown>, field: string): string | null | undefined {
  if (!hasOwnField(record, field)) return undefined;
  const value = record[field];
  if (value === null) return null;
  return asString(value);
}

function asNullableNumberField(record: Record<string, unknown>, field: string): number | null | undefined {
  if (!hasOwnField(record, field)) return undefined;
  const value = record[field];
  if (value === null) return null;
  return asNumber(value);
}

function asNullableIntField(record: Record<string, unknown>, field: string): number | null | undefined {
  const n = asNullableNumberField(record, field);
  return n == null ? n : Math.round(n);
}

export const assetFileImportTestHelpers = {
  asNullableBoolField,
  asNullableStringField,
  asNullableNumberField,
  asNullableIntField,
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
}

function asDate(value: unknown): Date | undefined {
  const s = asString(value);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function truncate(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function normalizeLevel(level: unknown): string | undefined {
  const s = asString(level)?.toUpperCase();
  if (s === 'LOW' || s === 'MEDIUM' || s === 'HIGH') return s;
  return undefined;
}

export function validateAssetFileBundle(slug: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const dir = assetDirForSlug(slug);

  if (!existsSync(dir)) {
    return [{ severity: 'error', layer: 'asset', message: `Asset folder not found: ${dir}` }];
  }

  for (const file of ASSET_LAYER_FILES) {
    if (!existsSync(`${dir}/${file}`)) {
      issues.push({ severity: 'error', layer: 'asset', field: file, message: `Missing required file: ${file}` });
    }
  }

  if (issues.some((i) => i.severity === 'error')) {
    return issues;
  }

  let bundle;
  try {
    bundle = loadAssetFileBundle(slug);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return [{ severity: 'error', layer: 'parse', message }];
  }

  for (const field of IDENTITY_REQUIRED) {
    if (!asString(bundle.identity[field])) {
      issues.push({ severity: 'error', layer: 'identity', field, message: `Required field "${field}" is empty` });
    }
  }

  for (const field of RESERVE_REQUIRED) {
    if (!asString(bundle.reserve[field])) {
      issues.push({ severity: 'warning', layer: 'reserve', field, message: `Optional/verifiable field "${field}" is empty` });
    }
  }

  for (const field of INSTITUTIONAL_REQUIRED) {
    if (!asString(bundle.institutional[field])) {
      issues.push({ severity: 'warning', layer: 'institutional', field, message: `Optional/verifiable field "${field}" is empty` });
    }
  }

  if (!normalizeLevel(bundle.risk.overallLevel)) {
    issues.push({ severity: 'warning', layer: 'risk', field: 'overallLevel', message: 'overallLevel is missing or not LOW, MEDIUM, or HIGH' });
  }

  for (const field of ['custodian', 'auditor', 'lastAuditUrl', 'porOracleAddress', 'porOracleChain'] as const) {
    if (bundle.reserve[field] == null) {
      issues.push({ severity: 'warning', layer: 'reserve', field, message: `Optional/verifiable field "${field}" is null` });
    }
  }

  for (const field of ['legalOpinionUrl', 'amlPolicy'] as const) {
    if (bundle.compliance[field] == null) {
      issues.push({ severity: 'warning', layer: 'compliance', field, message: `Optional/verifiable field "${field}" is null` });
    }
  }

  if (bundle.blockchain.length === 0) {
    issues.push({ severity: 'warning', layer: 'blockchain', message: 'No blockchain entries found' });
  }

  for (const [index, row] of bundle.blockchain.entries()) {
    if (!asString(row.chain)) {
      issues.push({ severity: 'error', layer: 'blockchain', field: `${index}.chain`, message: 'Blockchain entry needs chain' });
    }
    if (!asString(row.contractAddress)) {
      issues.push({ severity: 'warning', layer: 'blockchain', field: `${index}.contractAddress`, message: 'Optional/verifiable contractAddress is null or empty; row will be skipped because Prisma requires a value' });
    }
  }

  return issues;
}

export function mapAssetFilesToImportPayload(slug: string): AssetFileImportPayload {
  const { identity, reserve, risk, yield: yieldLayer, institutional, compliance, liquidity, market, blockchain: chainRows } = loadAssetFileBundle(slug);

  const reserveBreakdown = reserve.reserveBreakdown;
  const breakdown =
    reserveBreakdown && typeof reserveBreakdown === 'object' && !Array.isArray(reserveBreakdown)
      ? (reserveBreakdown as Prisma.InputJsonValue)
      : undefined;

  const blockchain = chainRows
    .filter((row) => asString(row.chain) && asString(row.contractAddress))
    .map((row) => ({
      chain: asString(row.chain)!,
      chainId: asInt(row.chainId),
      contractAddress: asString(row.contractAddress)!,
      tokenStandard: asString(row.tokenStandard),
      isTransferable: asBool(row.isTransferable) ?? true,
      hasWhitelist: asNullableBoolField(row, 'hasWhitelist'),
      hasTransferRestrictions: asBool(row.hasTransferRestrictions) ?? false,
      explorerUrl: asString(row.explorerUrl),
      deployedAt: asDate(row.deployedAt),
      isVerified: asBool(row.isVerified) ?? false,
    }));

  return {
    slug,
    asset: { isActive: true, dataVersion: 1 },
    identity: {
      name: asString(identity.name)!,
      symbol: asString(identity.symbol)!,
      fullName: asString(identity.fullName),
      description: truncate(asString(identity.description), 500),
      category: asString(identity.category)!,
      subcategory: asString(identity.subcategory),
      logoUrl: asString(identity.logoUrl),
      websiteUrl: asString(identity.websiteUrl),
      docsUrl: asString(identity.docsUrl),
      twitterUrl: asString(identity.twitterUrl),
      tags: asStringArray(identity.tags),
      launchDate: asDate(identity.launchDate),
      isin: asString(identity.isin),
    },
    reserve: {
      backingType: asString(reserve.backingType),
      backingDescription: asString(reserve.backingDescription),
      collateralizationRatio: asNumber(reserve.collateralizationRatio),
      custodian: asString(reserve.custodian),
      custodianUrl: asString(reserve.custodianUrl),
      hasProofOfReserves: asNullableBoolField(reserve, 'hasProofOfReserves'),
      porOracleAddress: asString(reserve.porOracleAddress),
      porOracleChain: asString(reserve.porOracleChain),
      lastAuditDate: asDate(reserve.lastAuditDate),
      lastAuditUrl: asString(reserve.lastAuditUrl),
      auditor: asString(reserve.auditor),
      reserveBreakdown: breakdown,
      redemptionAsset: asNullableStringField(reserve, 'redemptionAsset'),
    },
    risk: {
      overallScore: asInt(risk.overallScore),
      overallLevel: normalizeLevel(risk.overallLevel),
      smartContractRisk: asInt(risk.smartContractRisk),
      counterpartyRisk: asInt(risk.counterpartyRisk),
      liquidityRisk: asInt(risk.liquidityRisk),
      regulatoryRisk: asInt(risk.regulatoryRisk),
      marketRisk: asInt(risk.marketRisk),
      concentrationRisk: asInt(risk.concentrationRisk),
      riskFactors: asStringArray(risk.riskFactors),
      mitigants: asStringArray(risk.mitigants),
      lastAssessed: asDate(risk.lastAssessed),
      assessmentMethod: asString(risk.assessmentMethod),
    },
    yield: {
      currentYield: asNumber(yieldLayer.currentYield),
      yieldType: asString(yieldLayer.yieldType),
      yieldFrequency: asString(yieldLayer.yieldFrequency),
      yieldBenchmark: asString(yieldLayer.yieldBenchmark),
      yieldVsBenchmark: asNumber(yieldLayer.yieldVsBenchmark),
      yieldAvg7d: asNumber(yieldLayer.yieldAvg7d),
      yieldAvg30d: asNumber(yieldLayer.yieldAvg30d),
      yieldAvg90d: asNumber(yieldLayer.yieldAvg90d),
      yieldMin52w: asNumber(yieldLayer.yieldMin52w),
      yieldMax52w: asNumber(yieldLayer.yieldMax52w),
      yieldStdDev30d: asNumber(yieldLayer.yieldStdDev30d),
      nextYieldDate: asDate(yieldLayer.nextYieldDate),
      yieldCurrency: asString(yieldLayer.yieldCurrency) ?? 'USD',
    },
    institutional: {
      issuerName: asString(institutional.issuerName),
      issuerType: asString(institutional.issuerType),
      issuerCountry: asString(institutional.issuerCountry),
      fundManager: asString(institutional.fundManager),
      legalStructure: asString(institutional.legalStructure),
      minimumInvestment: asNumber(institutional.minimumInvestment),
      managementFee: asNumber(institutional.managementFee),
      performanceFee: asNumber(institutional.performanceFee),
      fundAdmin: asString(institutional.fundAdmin),
      transferAgent: asString(institutional.transferAgent),
      targetInvestors: asString(institutional.targetInvestors),
      prospectuUrl: asString(institutional.prospectuUrl ?? institutional.prospectusUrl),
      metadata: (institutional.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
    compliance: {
      regulatoryStatus: asString(compliance.regulatoryStatus),
      primaryRegulator: asString(compliance.primaryRegulator),
      regulatoryFramework: asString(compliance.regulatoryFramework),
      kycRequired: asNullableBoolField(compliance, 'kycRequired'),
      accreditedOnly: asBool(compliance.accreditedOnly) ?? false,
      blockedJurisdictions: asStringArray(compliance.blockedJurisdictions),
      allowedJurisdictions: asStringArray(compliance.allowedJurisdictions),
      sanctionsScreening: asNullableBoolField(compliance, 'sanctionsScreening'),
      amlPolicy: asString(compliance.amlPolicy),
      lastComplianceCheck: asDate(compliance.lastComplianceCheck),
      legalOpinionUrl: asString(compliance.legalOpinionUrl),
    },
    liquidity: {
      redemptionType: asString(liquidity.redemptionType),
      redemptionPeriodDays: asInt(liquidity.redemptionPeriodDays),
      lockupPeriodDays: asInt(liquidity.lockupPeriodDays),
      earlyRedemptionFee: asNullableNumberField(liquidity, 'earlyRedemptionFee'),
      minRedemptionAmount: asNumber(liquidity.minRedemptionAmount),
      dexPairs: (liquidity.dexPairs as Prisma.InputJsonValue | undefined) ?? [],
      onchainLiquidity: asNumber(liquidity.onchainLiquidity),
      bidAskSpread: asNumber(liquidity.bidAskSpread),
      liquidityScore: asNullableIntField(liquidity, 'liquidityScore'),
      liquidityNotes: asString(liquidity.liquidityNotes),
    },
    market: {
      tvl: asNumber(market.tvl),
      tvl7dChange: asNumber(market.tvl7dChange),
      tvl30dChange: asNumber(market.tvl30dChange),
      price: asNumber(market.price),
      priceChange24h: asNumber(market.priceChange24h),
      marketCap: asNumber(market.marketCap),
      volume24h: asNumber(market.volume24h),
      circulatingSupply: asNumber(market.circulatingSupply),
      totalSupply: asNumber(market.totalSupply),
      holderCount: asInt(market.holderCount),
      holderChange7d: asInt(market.holderChange7d),
      aumUsd: asNullableNumberField(market, 'aumUsd'),
      lastUpdated: asDate(market.lastUpdated),
      sources: asStringArray(market.sources),
      confidence: asString(market.confidence),
    },
    blockchain,
  };
}

type DbAssetSnapshot = {
  slug: string;
  dataVersion: number;
  identity: Record<string, unknown> | null;
  reserve: Record<string, unknown> | null;
  risk: Record<string, unknown> | null;
  institutional: Record<string, unknown> | null;
  compliance: Record<string, unknown> | null;
  liquidity: Record<string, unknown> | null;
  yield: Record<string, unknown> | null;
  blockchain: Array<{ chain: string; contractAddress: string }>;
};

const CONFLICT_FIELDS: Array<{ layer: keyof AssetFileImportPayload; field: string; dbField?: string }> = [
  { layer: 'identity', field: 'name' },
  { layer: 'identity', field: 'symbol' },
  { layer: 'identity', field: 'launchDate' },
  { layer: 'reserve', field: 'custodian' },
  { layer: 'reserve', field: 'hasProofOfReserves' },
  { layer: 'risk', field: 'overallScore' },
  { layer: 'risk', field: 'overallLevel' },
  { layer: 'institutional', field: 'minimumInvestment' },
  { layer: 'institutional', field: 'issuerName' },
  { layer: 'compliance', field: 'regulatoryStatus' },
  { layer: 'liquidity', field: 'minRedemptionAmount' },
  { layer: 'liquidity', field: 'liquidityScore' },
];

function comparable(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.join(',');
  return value;
}

export function detectConflicts(
  payload: AssetFileImportPayload,
  db: DbAssetSnapshot,
): FieldConflict[] {
  const conflicts: FieldConflict[] = [];

  for (const { layer, field } of CONFLICT_FIELDS) {
    const layerPayload = payload[layer];
    if (!layerPayload || typeof layerPayload !== 'object') continue;

    const fileValue = (layerPayload as Record<string, unknown>)[field];
    const dbLayer = db[layer as keyof DbAssetSnapshot];
    if (!dbLayer || typeof dbLayer !== 'object') continue;

    const dbValue = (dbLayer as Record<string, unknown>)[field];
    if (comparable(fileValue) === comparable(dbValue)) continue;
    if (fileValue == null && dbValue == null) continue;

    conflicts.push({ layer, field, fileValue, dbValue });
  }

  const fileChain = payload.blockchain[0];
  const dbChain = db.blockchain.find(
    (b) => b.chain.toLowerCase() === fileChain?.chain.toLowerCase(),
  ) ?? db.blockchain[0];

  if (fileChain && dbChain) {
    const fileAddr = fileChain.contractAddress.toLowerCase();
    const dbAddr = dbChain.contractAddress.toLowerCase();
    if (fileAddr !== dbAddr) {
      conflicts.push({
        layer: 'blockchain',
        field: 'contractAddress',
        fileValue: fileChain.contractAddress,
        dbValue: dbChain.contractAddress,
      });
    }
  }

  return conflicts;
}

export const SYNC_OWNED_LAYERS = [] as const;
export const SYNC_OWNED_YIELD_FIELDS = [
  'currentYield',
  'yieldAvg7d',
  'yieldAvg30d',
  'yieldAvg90d',
  'yieldMin52w',
  'yieldMax52w',
  'yieldStdDev30d',
] as const;

export function importPayloadSummary(payload: AssetFileImportPayload): string[] {
  return [
    `Asset: ${payload.slug}`,
    `Identity: ${payload.identity.name} (${payload.identity.symbol})`,
    `Risk: ${payload.risk.overallScore}/100 ${payload.risk.overallLevel}`,
    `Reserve custodian: ${payload.reserve.custodian}`,
    `Blockchain: ${payload.blockchain.map((b) => `${b.chain}:${b.contractAddress}`).join(', ')}`,
    `Market: tvl=${payload.market.tvl ?? 'unknown'} price=${payload.market.price ?? 'unknown'}`,
  ];
}
