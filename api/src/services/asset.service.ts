import type {
  AssetAiNarrative,
  AssetBlockchain,
  AssetCompliance,
  AssetEvent,
  AssetGrade,
  AssetHistory,
  AssetIdentity,
  AssetInstitutional,
  AssetLiquidity,
  AssetMarket,
  AssetReserve,
  AssetRisk,
  AssetSource,
  AssetYield,
} from '@prisma/client';
import { db } from '../lib/database.js';
import { getCached, redis } from '../lib/redis.js';
import type { AccessTier } from '../middleware/x402/pricer.js';
import {
  AssetRepository,
  type AssetWithLayers,
} from '../repositories/asset.repository.js';
import { fullInclude, type LayerName } from '../types/asset.types.js';
import { ERROR_CODES } from '../shared/index.js';
import {
  countLocalAssets,
  findLocalAssetBySlug,
  findLocalAssets,
} from '../lib/local-asset-store.js';

const LIST_CACHE_TTL = 5 * 60;
const DETAIL_CACHE_TTL = 10 * 60;

const LIST_LAYERS_FREE: LayerName[] = ['identity', 'market', 'risk', 'yield', 'grade', 'institutional'];
const LIST_LAYERS_PRO: LayerName[] = [
  'identity',
  'market',
  'risk',
  'yield',
  'reserve',
  'compliance',
  'liquidity',
  'grade',
  'institutional',
];
const DETAIL_LAYERS_FREE: LayerName[] = [
  'identity',
  'market',
  'yield',
  'risk',
  'blockchain',
  'grade',
  'institutional',
  'events',
];
const DETAIL_LAYERS_PRO: LayerName[] = [
  'identity',
  'market',
  'risk',
  'yield',
  'reserve',
  'institutional',
  'blockchain',
  'liquidity',
  'compliance',
  'grade',
  'sources',
  'events',
  'history',
  'aiNarrative',
];

export type AssetAccessTier = AccessTier;

export type AssetDataQuality = {
  lastUpdated: Date | null;
  sourceCount: number;
  confidenceLevel: string;
  riskGrade: string | null;
  status: 'verified' | 'stale' | 'estimated' | 'unavailable';
  stale: boolean;
  staleReason: string | null;
  sourceHealth: { healthy: number; stale: number; broken: number; unavailable: number };
  healthChecks: { stale: number; warning: number; error: number };
};


export type ProfileAwareGrade = {
  grade: AssetGrade['grade'];
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
  reviewedAt?: Date | null;
  updatedAt?: Date | null;
  gradingProfile?: string | null;
  assetClass?: string | null;
  instrumentType?: string | null;
  claimType?: string | null;
  publicSegment?: string | null;
  gradeContext?: string | null;
  profileScores?: Record<string, number | null>;
  applicability?: Record<string, string>;
};

export type AssetListItemFree = {
  id: string;
  slug: string;
  dataVersion: number;
  identity: Pick<AssetIdentity, 'name' | 'symbol' | 'category' | 'subcategory' | 'logoUrl'> | null;
  market: Pick<AssetMarket, 'tvl' | 'tvl7dChange' | 'price' | 'holderCount'> | null;
  yield: Pick<AssetYield, 'currentYield' | 'yieldType' | 'yieldFrequency'> | null;
  risk: { overallLevel: string | null } | null;
  grade: ProfileAwareGrade | null;
  dataQuality?: AssetDataQuality;
};

export type AssetListItemPro = AssetListItemFree & {
  reserve: Pick<AssetReserve, 'backingType' | 'collateralizationRatio' | 'hasProofOfReserves'> | null;
  compliance: Pick<AssetCompliance, 'regulatoryStatus' | 'kycRequired' | 'accreditedOnly'> | null;
  liquidity: Pick<AssetLiquidity, 'redemptionType' | 'redemptionPeriodDays' | 'liquidityScore'> | null;
};

export type AssetListItemEnterprise = AssetWithLayers;

export type AssetListItem =
  | AssetListItemFree
  | AssetListItemPro
  | AssetListItemEnterprise;

export type AssetDetailFree = {
  id: string;
  slug: string;
  dataVersion: number;
  identity: AssetIdentity | null;
  market: Pick<
    AssetMarket,
    | 'tvl'
    | 'tvl7dChange'
    | 'price'
    | 'marketCap'
    | 'holderCount'
    | 'aumUsd'
    | 'lastUpdated'
    | 'sources'
    | 'confidence'
  > | null;
  yield: Pick<
    AssetYield,
    'currentYield' | 'yieldType' | 'yieldFrequency' | 'yieldBenchmark' | 'yieldCurrency'
  > | null;
  risk: {
    overallLevel: string | null;
  } | null;
  blockchain: Array<Pick<
    AssetBlockchain,
    'chain' | 'chainId' | 'contractAddress' | 'tokenStandard' | 'explorerUrl'
  >>;
  grade: ProfileAwareGrade | null;
  events: Array<Pick<
    AssetEvent,
    'title' | 'eventType' | 'severity' | 'occurredAt' | 'sourceUrl' | 'isVerified'
  >>;
};

export type AssetDetailPro = AssetDetailFree & {
  market: AssetMarket | null;
  risk: AssetRisk | null;
  yield: AssetYield | null;
  reserve: AssetReserve | null;
  institutional: AssetInstitutional | null;
  blockchain: AssetBlockchain[];
  liquidity: AssetLiquidity | null;
  compliance: AssetCompliance | null;
  grade: ProfileAwareGrade | null;
  sources: AssetSource[];
  events: AssetEvent[];
  history: AssetHistory[];
  aiNarrative: AssetAiNarrative | null;
  dataQuality?: AssetDataQuality;
};

export type AssetDetailEnterprise = AssetWithLayers;

export type AssetDetailResponse = AssetDetailFree | AssetDetailPro | AssetDetailEnterprise;

export type GetAssetListOptions = {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  tier: AssetAccessTier;
};

export type GetAssetListResult = {
  data: AssetListItem[];
  cached: boolean;
  fromLocalDataset: boolean;
};

/** Application-level error with stable code for HTTP mapping. */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Asset tidak ditemukan') {
    super(ERROR_CODES.ASSET_NOT_FOUND, message);
    this.name = 'NotFoundError';
  }
}

let repo: AssetRepository = new AssetRepository(db);

function listCacheKey(category: string | undefined, tier: AssetAccessTier): string {
  return `assets:list:${category ?? 'all'}:${tier}`;
}

function detailCacheKey(slug: string, tier: AssetAccessTier): string {
  return `asset:${slug}:${tier}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function classificationFromInstitutional(
  institutional: AssetInstitutional | null | undefined,
): Record<string, unknown> | null {
  const metadata = asRecord(institutional?.metadata);
  if (!metadata) return null;

  const classification = asRecord(metadata.classification);
  return classification ?? metadata;
}

function profileLabel(profile?: string | null): string | null {
  if (!profile) return null;
  const labels: Record<string, string> = {
    asset_backed: 'Asset-backed Profile',
    commodity_backed: 'Commodity-backed Profile',
    credit_pool: 'Credit Pool Profile',
    real_estate_claim: 'Real Estate Claim Profile',
    governance_protocol: 'Governance Protocol Profile',
  };
  return labels[profile] ?? profile;
}

function gradeLabel(grade?: string | null): string {
  if (grade === 'institutional') return 'Institutional';
  if (grade === 'analytics') return 'Analytics';
  if (grade === 'research') return 'Research';
  return grade ? grade.charAt(0).toUpperCase() + grade.slice(1) : 'Research';
}

function buildApplicability(
  classification: Record<string, unknown> | null,
): Record<string, string> | undefined {
  if (!classification) return undefined;

  return {
    reserve: stringOrNull(classification.reserveApplicability) ?? 'missing',
    custody: stringOrNull(classification.custodyApplicability) ?? 'missing',
    redemption: stringOrNull(classification.redemptionApplicability) ?? 'missing',
    proofOfReserves: stringOrNull(classification.proofOfReservesApplicability) ?? 'missing',
  };
}

function pickIdentitySummary(
  identity: AssetIdentity | null | undefined,
): AssetListItemFree['identity'] {
  if (!identity) return null;
  return {
    name: identity.name,
    symbol: identity.symbol,
    category: identity.category,
    subcategory: identity.subcategory,
    logoUrl: identity.logoUrl,
  };
}

function pickMarketSummary(
  market: AssetMarket | null | undefined,
): AssetListItemFree['market'] {
  if (!market) return null;
  return {
    tvl: market.tvl,
    tvl7dChange: market.tvl7dChange,
    price: market.price,
    holderCount: market.holderCount,
  };
}

function pickYieldSummary(
  assetYield: AssetYield | null | undefined,
): AssetListItemFree['yield'] {
  if (!assetYield) return null;
  return {
    currentYield: assetYield.currentYield,
    yieldType: assetYield.yieldType,
    yieldFrequency: assetYield.yieldFrequency,
  };
}

function pickGradeSummary(
  grade: AssetGrade | null | undefined,
  institutional?: AssetInstitutional | null,
): ProfileAwareGrade | null {
  if (!grade) return null;

  const localGrade = grade as AssetGrade & {
    gradingProfile?: string | null;
    assetClass?: string | null;
    instrumentType?: string | null;
    claimType?: string | null;
    publicSegment?: string | null;
    gradeContext?: string | null;
    profileScores?: Record<string, number | null>;
    applicability?: Record<string, string>;
  };
  const classification = classificationFromInstitutional(institutional);
  const gradingProfile = stringOrNull(classification?.gradingProfile) ?? localGrade.gradingProfile ?? null;
  const assetClass = stringOrNull(classification?.assetClass) ?? localGrade.assetClass ?? null;
  const instrumentType = stringOrNull(classification?.instrumentType) ?? localGrade.instrumentType ?? null;
  const claimType = stringOrNull(classification?.claimType) ?? localGrade.claimType ?? null;
  const publicSegment = stringOrNull(classification?.publicSegment) ?? localGrade.publicSegment ?? null;
  const applicability = buildApplicability(classification);
  const reserveScore = gradingProfile === 'governance_protocol' ? null : grade.reserveScore;
  const profileName = profileLabel(gradingProfile);

  return {
    grade: grade.grade,
    score: grade.score,
    completenessScore: grade.completenessScore,
    sourceScore: grade.sourceScore,
    legalScore: grade.legalScore,
    reserveScore,
    liquidityScore: grade.liquidityScore,
    riskScore: grade.riskScore,
    blockers: grade.blockers,
    warnings: grade.warnings,
    reviewedBy: grade.reviewedBy,
    reviewedAt: grade.reviewedAt,
    updatedAt: grade.updatedAt,
    gradingProfile,
    assetClass,
    instrumentType,
    claimType,
    publicSegment,
    gradeContext: localGrade.gradeContext ?? (profileName ? `${gradeLabel(grade.grade)} — ${profileName}` : null),
    profileScores: localGrade.profileScores ?? {
      completenessScore: grade.completenessScore,
      sourceScore: grade.sourceScore,
      legalScore: grade.legalScore,
      reserveScore,
      liquidityScore: grade.liquidityScore,
      riskScore: grade.riskScore,
    },
    applicability: localGrade.applicability ?? applicability,
  };
}

function pickLiquiditySummary(
  liquidity: AssetLiquidity | null | undefined,
): AssetListItemPro['liquidity'] {
  if (!liquidity) return null;
  return {
    redemptionType: liquidity.redemptionType,
    redemptionPeriodDays: liquidity.redemptionPeriodDays,
    liquidityScore: liquidity.liquidityScore,
  };
}

function pickMarketFreeDetail(
  market: AssetMarket | null | undefined,
): AssetDetailFree['market'] {
  if (!market) return null;
  return {
    tvl: market.tvl,
    tvl7dChange: market.tvl7dChange,
    price: market.price,
    marketCap: market.marketCap,
    holderCount: market.holderCount,
    aumUsd: market.aumUsd,
    lastUpdated: market.lastUpdated,
    sources: market.sources,
    confidence: market.confidence,
  };
}

function pickYieldFreeDetail(
  assetYield: AssetYield | null | undefined,
): AssetDetailFree['yield'] {
  if (!assetYield) return null;
  return {
    currentYield: assetYield.currentYield,
    yieldType: assetYield.yieldType,
    yieldFrequency: assetYield.yieldFrequency,
    yieldBenchmark: assetYield.yieldBenchmark,
    yieldCurrency: assetYield.yieldCurrency,
  };
}

function pickBlockchainFreeDetail(
  blockchain: AssetBlockchain[] | undefined,
): AssetDetailFree['blockchain'] {
  return (blockchain ?? []).map((row) => ({
    chain: row.chain,
    chainId: row.chainId,
    contractAddress: row.contractAddress,
    tokenStandard: row.tokenStandard,
    explorerUrl: row.explorerUrl,
  }));
}

function pickEventsFreeDetail(
  events: AssetEvent[] | undefined,
): AssetDetailFree['events'] {
  return (events ?? []).map((event) => ({
    title: event.title,
    eventType: event.eventType,
    severity: event.severity,
    occurredAt: event.occurredAt,
    sourceUrl: event.sourceUrl,
    isVerified: event.isVerified,
  }));
}

function mapListItemFree(row: AssetWithLayers): AssetListItemFree {
  return {
    id: row.id,
    slug: row.slug,
    dataVersion: row.dataVersion,
    identity: pickIdentitySummary(row.identity),
    market: pickMarketSummary(row.market),
    yield: pickYieldSummary(row.yield),
    risk: row.risk
      ? { overallLevel: row.risk.overallLevel }
      : null,
    grade: pickGradeSummary(row.grade, row.institutional),
  };
}

function mapListItemPro(row: AssetWithLayers): AssetListItemPro {
  const base = mapListItemFree(row);
  return {
    ...base,
    reserve: row.reserve
      ? {
          backingType: row.reserve.backingType,
          collateralizationRatio: row.reserve.collateralizationRatio,
          hasProofOfReserves: row.reserve.hasProofOfReserves,
        }
      : null,
    compliance: row.compliance
      ? {
          regulatoryStatus: row.compliance.regulatoryStatus,
          kycRequired: row.compliance.kycRequired,
          accreditedOnly: row.compliance.accreditedOnly,
        }
      : null,
    liquidity: pickLiquiditySummary(row.liquidity),
  };
}

function daysOld(value: Date | null): number | null {
  if (!value) return null;
  return Math.floor((Date.now() - value.getTime()) / (24 * 60 * 60 * 1000));
}

function latestDate(values: Array<Date | null | undefined>): Date | null {
  return values
    .filter((value): value is Date => value instanceof Date && !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
}

async function getAssetDataQuality(row: AssetWithLayers): Promise<AssetDataQuality> {
  let sourceCount = 0;
  let sourceRows: Array<{ status: string; lastCheckedAt: Date | null }> = [];
  let healthRows: Array<{ status: string; severity: string; lastCheckedAt: Date | null; reason: string | null }> = [];
  const isLocalDataset = (row as AssetWithLayers & { __localDataset?: boolean }).__localDataset === true;

  try {
    if (isLocalDataset) {
      throw new Error('Local dataset fallback');
    }
    [sourceCount, sourceRows, healthRows] = await Promise.all([
      db.assetSource.count({ where: { assetId: row.id } }),
      db.sourceHealth.findMany({ where: { assetSlug: row.slug }, select: { status: true, lastCheckedAt: true } }),
      db.dataHealthCheck.findMany({ where: { assetSlug: row.slug }, select: { status: true, severity: true, lastCheckedAt: true, reason: true } }),
    ]);
  } catch {
    sourceCount = row.sources?.length ?? row.market?.sources?.length ?? 0;
    sourceRows = (row.sources ?? []).map(() => ({ status: 'unchecked', lastCheckedAt: null }));
    healthRows = [];
  }
  const lastUpdated = latestDate([
    row.market?.lastUpdated,
    row.grade?.updatedAt,
    row.grade?.reviewedAt,
    row.risk?.lastAssessed,
    ...sourceRows.map((source) => source.lastCheckedAt),
    ...healthRows.map((health) => health.lastCheckedAt),
  ]);
  const age = daysOld(lastUpdated);
  const sourceHealth = {
    healthy: sourceRows.filter((row) => ['healthy', 'redirected'].includes(row.status.toLowerCase())).length,
    stale: sourceRows.filter((row) => ['manual_required', 'unchecked', 'timeout'].includes(row.status.toLowerCase())).length,
    broken: sourceRows.filter((row) => ['broken', 'error'].includes(row.status.toLowerCase())).length,
    unavailable: sourceRows.length === 0 ? 1 : 0,
  };
  const healthChecks = {
    stale: healthRows.filter((row) => row.status.toLowerCase().includes('stale')).length,
    warning: healthRows.filter((row) => row.severity.toLowerCase() === 'warning').length,
    error: healthRows.filter((row) => ['error', 'critical'].includes(row.severity.toLowerCase())).length,
  };
  const stale = (age != null && age > 30) || healthChecks.stale > 0;
  const confidenceLevel = row.market?.confidence ?? (sourceCount > 1 ? 'MEDIUM' : 'LOW');
  const hasData = Boolean(row.market || row.grade || row.risk || sourceCount > 0);
  const status = !hasData
    ? 'unavailable'
    : stale
      ? 'stale'
      : confidenceLevel === 'LOW' || sourceCount <= 1
        ? 'estimated'
        : 'verified';
  return {
    lastUpdated,
    sourceCount,
    confidenceLevel,
    riskGrade: row.grade?.grade ?? row.risk?.overallLevel ?? null,
    status,
    stale,
    staleReason: stale ? (healthRows.find((row) => row.status.toLowerCase().includes('stale'))?.reason ?? (age != null ? `Last refresh is ${age} days old` : 'Freshness check flagged stale data')) : null,
    sourceHealth,
    healthChecks,
  };
}

async function attachDataQuality<T extends AssetListItem | AssetDetailResponse>(rows: AssetWithLayers[], mapped: T[]): Promise<T[]> {
  const qualities = await Promise.all(rows.map(getAssetDataQuality));
  return mapped.map((item, index) => ({ ...item, dataQuality: qualities[index] }));
}

function mapListItem(row: AssetWithLayers, tier: AssetAccessTier): AssetListItem {
  if (tier === 'enterprise') {
    return row;
  }
  if (tier === 'pro') {
    return mapListItemPro(row);
  }
  return mapListItemFree(row);
}

function mapDetailFree(row: AssetWithLayers): AssetDetailFree {
  return {
    id: row.id,
    slug: row.slug,
    dataVersion: row.dataVersion,
    identity: row.identity ?? null,
    market: pickMarketFreeDetail(row.market),
    risk: row.risk
      ? {
          overallLevel: row.risk.overallLevel,
        }
      : null,
    yield: pickYieldFreeDetail(row.yield),
    blockchain: pickBlockchainFreeDetail(row.blockchain),
    grade: pickGradeSummary(row.grade, row.institutional),
    events: pickEventsFreeDetail(row.events),
  };
}

function mapDetailPro(row: AssetWithLayers): AssetDetailPro {
  const free = mapDetailFree(row);
  return {
    ...free,
    market: row.market ?? null,
    risk: row.risk ?? null,
    yield: row.yield ?? null,
    reserve: row.reserve ?? null,
    institutional: row.institutional ?? null,
    blockchain: row.blockchain ?? [],
    liquidity: row.liquidity ?? null,
    compliance: row.compliance ?? null,
    grade: pickGradeSummary(row.grade, row.institutional),
    sources: row.sources ?? [],
    events: row.events ?? [],
    history: row.history ?? [],
    aiNarrative: row.aiNarrative ?? null,
  };
}

function mapDetail(row: AssetWithLayers, tier: AssetAccessTier): AssetDetailResponse {
  if (tier === 'enterprise') {
    return row;
  }
  if (tier === 'pro') {
    return mapDetailPro(row);
  }
  return mapDetailFree(row);
}

function listLayersForTier(tier: AssetAccessTier): LayerName[] | 'full' {
  if (tier === 'enterprise') return 'full';
  if (tier === 'pro') return LIST_LAYERS_PRO;
  return LIST_LAYERS_FREE;
}

function detailLayersForTier(tier: AssetAccessTier): LayerName[] | 'full' {
  if (tier === 'enterprise') return 'full';
  if (tier === 'pro') return DETAIL_LAYERS_PRO;
  return DETAIL_LAYERS_FREE;
}

async function fetchListFromRepo(
  options: GetAssetListOptions,
): Promise<AssetWithLayers[]> {
  const { category, search, limit = 50, offset = 0, tier } = options;
  const layers = listLayersForTier(tier);

  if (layers === 'full') {
    const searchTerm = search?.trim();
    try {
      return await db.asset.findMany({
        where: {
          isActive: true,
          ...(category !== undefined ? { identity: { category } } : {}),
          ...(searchTerm
            ? {
                OR: [
                  { slug: { contains: searchTerm, mode: 'insensitive' } },
                  { identity: { name: { contains: searchTerm, mode: 'insensitive' } } },
                  { identity: { symbol: { contains: searchTerm, mode: 'insensitive' } } },
                ],
              }
            : {}),
        },
        include: fullInclude,
        orderBy: { market: { tvl: 'desc' } },
        take: limit,
        skip: offset,
      });
    } catch {
      return findLocalAssets({ category, search, limit, offset });
    }
  }

  try {
    return await repo.findAll({ category, search, limit, offset, layers });
  } catch {
    return findLocalAssets({ category, search, limit, offset });
  }
}

async function fetchDetailFromRepo(
  slug: string,
  tier: AssetAccessTier,
): Promise<AssetWithLayers | null> {
  const layers = detailLayersForTier(tier);
  if (layers === 'full') {
    try {
      return await repo.findFull(slug);
    } catch {
      return findLocalAssetBySlug(slug);
    }
  }
  try {
    return await repo.findBySlug(slug, layers);
  } catch {
    return findLocalAssetBySlug(slug);
  }
}

export async function getAssetList(
  options: GetAssetListOptions,
): Promise<GetAssetListResult> {
  const { tier, category } = options;
  const cacheKey = listCacheKey(category, tier);

  const { data: rows, cached } = await getCached(
    cacheKey,
    () => fetchListFromRepo(options),
    LIST_CACHE_TTL,
  );

  return {
    data: await attachDataQuality(rows, rows.map((row) => mapListItem(row, tier))),
    cached,
    fromLocalDataset: rows.some(
      (row) => (row as AssetWithLayers & { __localDataset?: boolean }).__localDataset === true,
    ),
  };
}

export async function getAssetDetail(
  slug: string,
  tier: AssetAccessTier,
): Promise<{ data: AssetDetailResponse; cached: boolean }> {
  const cacheKey = detailCacheKey(slug, tier);

  const { data: row, cached } = await getCached(
    cacheKey,
    async () => {
      const asset = await fetchDetailFromRepo(slug, tier);
      if (!asset) {
        throw new NotFoundError();
      }
      return asset;
    },
    DETAIL_CACHE_TTL,
  );

  const [data] = await attachDataQuality([row], [mapDetail(row, tier)]);
  return { data, cached };
}

export async function countAssets(category?: string, preferLocal = false): Promise<number> {
  if (preferLocal) {
    return countLocalAssets(category);
  }

  try {
    return await repo.countActive(category);
  } catch {
    return countLocalAssets(category);
  }
}

async function deleteRedisKeys(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    const client = redis();
    await client.del(...keys);
  } catch {
    // best-effort
  }
}

async function deleteRedisPattern(pattern: string): Promise<void> {
  try {
    const client = redis();
    let cursor = '0';
    const toDelete: string[] = [];
    do {
      const [next, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      toDelete.push(...keys);
    } while (cursor !== '0');
    if (toDelete.length > 0) {
      await client.del(...toDelete);
    }
  } catch {
    // best-effort
  }
}

async function invalidateAssetCacheAsync(slug: string): Promise<void> {
  const tiers: AssetAccessTier[] = ['free', 'pro', 'enterprise'];
  const detailKeys = tiers.map((tier) => detailCacheKey(slug, tier));
  await deleteRedisKeys(detailKeys);
  await deleteRedisPattern('assets:list:*');
}

/** Clears list + detail cache entries for a slug (fire-and-forget). */
export function invalidateAssetCache(slug: string): void {
  void invalidateAssetCacheAsync(slug);
}

export function getAssetRepository(): AssetRepository {
  return repo;
}

export function setAssetRepositoryForTests(repository: AssetRepository): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('setAssetRepositoryForTests is only available while NODE_ENV=test');
  }
  repo = repository;
}

export function resetAssetRepositoryForTests(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetAssetRepositoryForTests is only available while NODE_ENV=test');
  }
  repo = new AssetRepository(db);
}

/** @deprecated Use `getAssetList` */
export async function getAssets(params: {
  page: number;
  limit: number;
  category?: string;
}): Promise<{ data: AssetListItemFree[]; total: number }> {
  const offset = (params.page - 1) * params.limit;
  const [list, total] = await Promise.all([
    getAssetList({
      tier: 'free',
      category: params.category,
      limit: params.limit,
      offset,
    }),
    repo.countActive(params.category),
  ]);
  return {
    data: list.data as AssetListItemFree[],
    total,
  };
}
