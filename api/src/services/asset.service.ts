import type {
  AssetAiNarrative,
  AssetBlockchain,
  AssetCompliance,
  AssetEvent,
  AssetHistory,
  AssetIdentity,
  AssetInstitutional,
  AssetLiquidity,
  AssetMarket,
  AssetReserve,
  AssetRisk,
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

const LIST_CACHE_TTL = 5 * 60;
const DETAIL_CACHE_TTL = 10 * 60;

const LIST_LAYERS_FREE: LayerName[] = ['identity', 'market', 'risk'];
const LIST_LAYERS_PRO: LayerName[] = [
  'identity',
  'market',
  'risk',
  'yield',
  'reserve',
  'compliance',
];
const DETAIL_LAYERS_FREE: LayerName[] = [
  'identity',
  'market',
  'risk',
  'yield',
  'blockchain',
  'liquidity',
  'compliance',
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
];

export type AssetAccessTier = AccessTier;

export type AssetListItemFree = {
  id: string;
  slug: string;
  dataVersion: number;
  identity: Pick<AssetIdentity, 'name' | 'symbol' | 'category' | 'subcategory' | 'logoUrl'> | null;
  market: Pick<AssetMarket, 'tvl' | 'tvl7dChange' | 'price' | 'holderCount'> | null;
  risk: { overallLevel: string | null } | null;
};

export type AssetListItemPro = AssetListItemFree & {
  yield: Pick<AssetYield, 'currentYield' | 'yieldType' | 'yieldFrequency'> | null;
  reserve: Pick<AssetReserve, 'backingType' | 'collateralizationRatio' | 'hasProofOfReserves'> | null;
  compliance: Pick<AssetCompliance, 'regulatoryStatus' | 'kycRequired' | 'accreditedOnly'> | null;
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
  market: AssetMarket | null;
  risk: {
    overallLevel: string | null;
    overallScore: number | null;
  } | null;
  yield: Pick<
    AssetYield,
    'currentYield' | 'yieldType' | 'yieldFrequency' | 'yieldBenchmark'
  > | null;
  blockchain: AssetBlockchain[];
  liquidity: AssetLiquidity | null;
  compliance: AssetCompliance | null;
};

export type AssetDetailPro = AssetDetailFree & {
  risk: AssetRisk | null;
  yield: AssetYield | null;
  reserve: AssetReserve | null;
  institutional: AssetInstitutional | null;
  blockchain: AssetBlockchain[];
  liquidity: AssetLiquidity | null;
  compliance: AssetCompliance | null;
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

const repo = new AssetRepository(db);

function listCacheKey(category: string | undefined, tier: AssetAccessTier): string {
  return `assets:list:${category ?? 'all'}:${tier}`;
}

function detailCacheKey(slug: string, tier: AssetAccessTier): string {
  return `asset:${slug}:${tier}`;
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

function mapListItemFree(row: AssetWithLayers): AssetListItemFree {
  return {
    id: row.id,
    slug: row.slug,
    dataVersion: row.dataVersion,
    identity: pickIdentitySummary(row.identity),
    market: pickMarketSummary(row.market),
    risk: row.risk
      ? { overallLevel: row.risk.overallLevel }
      : null,
  };
}

function mapListItemPro(row: AssetWithLayers): AssetListItemPro {
  const base = mapListItemFree(row);
  return {
    ...base,
    yield: row.yield
      ? {
          currentYield: row.yield.currentYield,
          yieldType: row.yield.yieldType,
          yieldFrequency: row.yield.yieldFrequency,
        }
      : null,
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
  };
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
    market: row.market ?? null,
    risk: row.risk
      ? {
          overallLevel: row.risk.overallLevel,
          overallScore: row.risk.overallScore,
        }
      : null,
    yield: row.yield
      ? {
          currentYield: row.yield.currentYield,
          yieldType: row.yield.yieldType,
          yieldFrequency: row.yield.yieldFrequency,
          yieldBenchmark: row.yield.yieldBenchmark,
        }
      : null,
    blockchain: row.blockchain ?? [],
    liquidity: row.liquidity ?? null,
    compliance: row.compliance ?? null,
  };
}

function mapDetailPro(row: AssetWithLayers): AssetDetailPro {
  const free = mapDetailFree(row);
  return {
    ...free,
    risk: row.risk ?? null,
    yield: row.yield ?? null,
    reserve: row.reserve ?? null,
    institutional: row.institutional ?? null,
    blockchain: row.blockchain ?? [],
    liquidity: row.liquidity ?? null,
    compliance: row.compliance ?? null,
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
    return db.asset.findMany({
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
  }

  return repo.findAll({ category, search, limit, offset, layers });
}

async function fetchDetailFromRepo(
  slug: string,
  tier: AssetAccessTier,
): Promise<AssetWithLayers | null> {
  const layers = detailLayersForTier(tier);
  if (layers === 'full') {
    return repo.findFull(slug);
  }
  return repo.findBySlug(slug, layers);
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
    data: rows.map((row) => mapListItem(row, tier)),
    cached,
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

  return { data: mapDetail(row, tier), cached };
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
