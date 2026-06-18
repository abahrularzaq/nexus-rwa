import type { Prisma } from '@prisma/client';
import { existsSync } from 'node:fs';
import {
  ASSET_LAYER_FILES,
  assetDirForSlug,
  loadAssetFileBundle,
  type MetadataFile,
  type ScoringFile,
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
  identity: Prisma.AssetIdentityUpdateInput;
  reserve: Prisma.AssetReserveUpdateInput;
  risk: Prisma.AssetRiskUpdateInput;
  yield: Prisma.AssetYieldUpdateInput;
  institutional: Prisma.AssetInstitutionalUpdateInput;
  compliance: Prisma.AssetComplianceUpdateInput;
  liquidity: Prisma.AssetLiquidityUpdateInput;
  blockchain: Prisma.AssetBlockchainCreateWithoutAssetInput[];
};

const IDENTITY_REQUIRED = ['name', 'symbol', 'category'] as const;
const LEGAL_REQUIRED = ['regulatoryStatus', 'issuerName', 'issuerCountry'] as const;
const RESERVE_REQUIRED = ['backingType'] as const;
const SCORING_REQUIRED = [
  'smartContract',
  'counterparty',
  'liquidity',
  'regulatory',
  'market',
  'concentration',
] as const;

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

  for (const file of ['market.md'] as const) {
    if (!existsSync(`${dir}/${file}`)) {
      issues.push({
        severity: 'warning',
        layer: 'asset',
        field: file,
        message: `Optional file missing: ${file} (market data comes from sync service)`,
      });
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

  if (asString(bundle.metadata.slug) !== slug) {
    issues.push({
      severity: 'error',
      layer: 'metadata',
      field: 'slug',
      message: `metadata.json slug "${bundle.metadata.slug}" does not match folder slug "${slug}"`,
    });
  }

  for (const field of IDENTITY_REQUIRED) {
    if (!asString(bundle.identity[field])) {
      issues.push({ severity: 'error', layer: 'identity', field, message: `Required field "${field}" is empty` });
    }
  }

  for (const field of RESERVE_REQUIRED) {
    if (!asString(bundle.reserve[field])) {
      issues.push({ severity: 'error', layer: 'reserve', field, message: `Required field "${field}" is empty` });
    }
  }

  for (const field of LEGAL_REQUIRED) {
    if (!asString(bundle.legal[field])) {
      issues.push({ severity: 'error', layer: 'legal', field, message: `Required field "${field}" is empty` });
    }
  }

  for (const key of SCORING_REQUIRED) {
    const score = bundle.scoring.subScores?.[key as keyof ScoringFile['subScores']];
    if (score == null || !Number.isFinite(score)) {
      issues.push({
        severity: 'error',
        layer: 'scoring',
        field: key,
        message: `scoring.json subScores.${key} must be a number`,
      });
    }
  }

  if (bundle.scoring.overallScore == null) {
    issues.push({ severity: 'error', layer: 'scoring', field: 'overallScore', message: 'overallScore is required' });
  }

  if (!normalizeLevel(bundle.scoring.overallLevel ?? bundle.risk.overallLevel)) {
    issues.push({
      severity: 'error',
      layer: 'scoring',
      field: 'overallLevel',
      message: 'overallLevel must be LOW, MEDIUM, or HIGH',
    });
  }

  const sourceLayers = ['identity', 'reserve', 'legal', 'market'] as const;
  for (const layer of sourceLayers) {
    const section = bundle.sources[layer];
    if (!section || typeof section !== 'object') {
      issues.push({
        severity: 'warning',
        layer: 'sources',
        field: layer,
        message: `sources.yaml missing "${layer}" section`,
      });
      continue;
    }
    const primary = (section as Record<string, unknown>).primary;
    if (!asString(primary)) {
      issues.push({
        severity: 'warning',
        layer: 'sources',
        field: `${layer}.primary`,
        message: `sources.yaml ${layer}.primary is empty`,
      });
    }
  }

  const riskSection = bundle.sources.risk;
  if (!riskSection || typeof riskSection !== 'object') {
    issues.push({
      severity: 'warning',
      layer: 'sources',
      field: 'risk',
      message: 'sources.yaml missing "risk" section',
    });
  } else {
    const rs = riskSection as Record<string, unknown>;
    if (!asString(rs.primary) && !asString(rs.methodology)) {
      issues.push({
        severity: 'warning',
        layer: 'sources',
        field: 'risk.primary',
        message: 'sources.yaml risk needs primary or methodology',
      });
    }
  }

  if (!Array.isArray(bundle.metadata.blockchain) || bundle.metadata.blockchain.length === 0) {
    issues.push({
      severity: 'error',
      layer: 'metadata',
      field: 'blockchain',
      message: 'At least one blockchain entry is required in metadata.json',
    });
  }

  for (const row of bundle.metadata.blockchain ?? []) {
    if (!asString(row.chain) || !asString(row.contractAddress)) {
      issues.push({
        severity: 'error',
        layer: 'metadata',
        field: 'blockchain',
        message: 'Each blockchain entry needs chain and contractAddress',
      });
    }
  }

  return issues;
}

export function mapAssetFilesToImportPayload(slug: string): AssetFileImportPayload {
  const { identity, reserve, legal, risk, metadata, scoring } = loadAssetFileBundle(slug);

  const tags = asStringArray(identity.tags);
  const reserveBreakdown = reserve.reserveBreakdown;
  const breakdown =
    reserveBreakdown && typeof reserveBreakdown === 'object' && !Array.isArray(reserveBreakdown)
      ? (reserveBreakdown as Prisma.InputJsonValue)
      : undefined;

  const yieldMeta = metadata.yield ?? {};
  const liquidityMeta = metadata.liquidity ?? {};

  const blockchain = (metadata.blockchain ?? []).map((row) => ({
    chain: asString(row.chain)!,
    chainId: asInt(row.chainId),
    contractAddress: asString(row.contractAddress)!,
    tokenStandard: asString(row.tokenStandard),
    isTransferable: asBool(row.isTransferable) ?? true,
    hasWhitelist: asBool(row.hasWhitelist) ?? false,
    hasTransferRestrictions: asBool(row.hasTransferRestrictions) ?? false,
    explorerUrl: asString(row.explorerUrl),
    deployedAt: asDate(row.deployedAt),
    isVerified: asBool(row.isVerified) ?? false,
  }));

  const sub = scoring.subScores ?? {};

  return {
    slug,
    asset: {
      isActive: metadata.isActive ?? true,
      dataVersion: metadata.dataVersion ?? 1,
    },
    identity: {
      name: asString(identity.name)!,
      symbol: asString(identity.symbol)!,
      fullName: asString(identity.fullName),
      description: truncate(asString(identity.description), 500),
      category: asString(identity.category)!,
      subcategory: asString(identity.subcategory),
      websiteUrl: asString(identity.websiteUrl),
      docsUrl: asString(identity.docsUrl),
      twitterUrl: asString(identity.twitterUrl),
      tags,
      launchDate: asDate(identity.launchDate),
      isin: asString(identity.isin),
    },
    reserve: {
      backingType: asString(reserve.backingType),
      backingDescription: asString(reserve.backingDescription),
      collateralizationRatio: asNumber(reserve.collateralizationRatio),
      custodian: asString(reserve.custodian),
      custodianUrl: asString(reserve.custodianUrl),
      hasProofOfReserves: asBool(reserve.hasProofOfReserves) ?? false,
      porOracleAddress: asString(reserve.porOracleAddress),
      porOracleChain: asString(reserve.porOracleChain),
      lastAuditDate: asDate(reserve.lastAuditDate),
      lastAuditUrl: asString(reserve.lastAuditUrl),
      auditor: asString(reserve.auditor),
      reserveBreakdown: breakdown,
      redemptionAsset: asString(reserve.redemptionAsset),
    },
    risk: {
      overallScore: asInt(scoring.overallScore),
      overallLevel: normalizeLevel(scoring.overallLevel ?? risk.overallLevel),
      smartContractRisk: asInt(sub.smartContract),
      counterpartyRisk: asInt(sub.counterparty),
      liquidityRisk: asInt(sub.liquidity),
      regulatoryRisk: asInt(sub.regulatory),
      marketRisk: asInt(sub.market),
      concentrationRisk: asInt(sub.concentration),
      riskFactors: asStringArray(risk.riskFactors),
      mitigants: asStringArray(risk.mitigants),
      lastAssessed: asDate(risk.lastAssessed ?? scoring.assessmentDate),
      assessmentMethod: asString(risk.assessmentMethod ?? scoring.assessmentMethod),
    },
    yield: {
      yieldType: asString(yieldMeta.yieldType as unknown),
      yieldFrequency: asString(yieldMeta.yieldFrequency as unknown),
      yieldBenchmark: asString(yieldMeta.yieldBenchmark as unknown),
      yieldCurrency: asString(yieldMeta.yieldCurrency as unknown) ?? 'USD',
      nextYieldDate: asDate(yieldMeta.nextYieldDate as unknown),
    },
    institutional: {
      issuerName: asString(legal.issuerName),
      issuerType: 'protocol_native',
      issuerCountry: asString(legal.issuerCountry),
      fundManager: asString(legal.fundManager),
      legalStructure: asString(legal.legalStructure),
      minimumInvestment: asNumber(legal.minimumInvestment),
      managementFee: asNumber(legal.managementFee),
      performanceFee: asNumber(legal.performanceFee),
      targetInvestors: asString(legal.targetInvestors),
      prospectuUrl: asString(legal.prospectusUrl),
      metadata: (metadata.externalIds ?? undefined) as Prisma.InputJsonValue | undefined,
    },
    compliance: {
      regulatoryStatus: asString(legal.regulatoryStatus),
      primaryRegulator: asString(legal.primaryRegulator),
      regulatoryFramework: asString(legal.regulatoryFramework),
      kycRequired: asBool(legal.kycRequired) ?? true,
      accreditedOnly: asBool(legal.accreditedOnly) ?? false,
      blockedJurisdictions: asStringArray(legal.blockedJurisdictions),
      allowedJurisdictions: asStringArray(legal.allowedJurisdictions),
      sanctionsScreening: asBool(legal.sanctionsScreening) ?? false,
      amlPolicy: asString(legal.amlPolicy),
      legalOpinionUrl: asString(legal.legalOpinionUrl),
    },
    liquidity: {
      redemptionType: asString(liquidityMeta.redemptionType as unknown),
      redemptionPeriodDays: asInt(liquidityMeta.redemptionPeriodDays as unknown),
      lockupPeriodDays: asInt(liquidityMeta.lockupPeriodDays as unknown),
      earlyRedemptionFee: asNumber(liquidityMeta.earlyRedemptionFee as unknown),
      minRedemptionAmount: asNumber(liquidityMeta.minRedemptionAmount as unknown),
      dexPairs: (liquidityMeta.dexPairs as Prisma.InputJsonValue | undefined) ?? [],
      liquidityScore: asInt(liquidityMeta.liquidityScore as unknown),
      liquidityNotes: asString(liquidityMeta.liquidityNotes as unknown),
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

export const SYNC_OWNED_LAYERS = ['market'] as const;
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
    `Skipped (sync-owned): market layer, yield.currentYield + aggregates`,
  ];
}
