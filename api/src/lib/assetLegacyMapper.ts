import type {
  AssetCategory,
  AssetDataMeta,
  AssetSummary,
  Chain,
  RiskLevel,
} from '../shared/index.js';
import type {
  AssetDetailPro,
  AssetDetailResponse,
  AssetListItemFree,
  AssetListItemPro,
} from '../services/asset.service.js';

const CATEGORY_ALIASES: Record<string, AssetCategory> = {
  treasury: 'TREASURY',
  credit: 'CREDIT',
  private_credit: 'CREDIT',
  privatecredit: 'CREDIT',
  private_debt: 'CREDIT',
  real_estate: 'REAL_ESTATE',
  realestate: 'REAL_ESTATE',
  commodities: 'COMMODITIES',
  commodity: 'COMMODITIES',
  equity: 'EQUITY',
  equities: 'EQUITY',
  infrastructure: 'REAL_ESTATE',
};

export function normalizeCategory(raw?: string | null): AssetCategory {
  if (!raw) return 'CREDIT';
  const upper = raw.toUpperCase().replace(/[\s-]+/g, '_') as AssetCategory;
  if (
    upper === 'TREASURY' ||
    upper === 'CREDIT' ||
    upper === 'REAL_ESTATE' ||
    upper === 'COMMODITIES' ||
    upper === 'EQUITY'
  ) {
    return upper;
  }
  const key = raw.toLowerCase().replace(/[\s-]+/g, '_');
  return CATEGORY_ALIASES[key] ?? 'CREDIT';
}

function buildMeta(sources?: string[] | null, confidence?: string | null): AssetDataMeta {
  return {
    sources: sources?.length ? sources : ['defillama'],
    lastUpdated: new Date().toISOString(),
    confidence:
      confidence === 'HIGH' || confidence === 'LOW' ? confidence : 'MEDIUM',
    methodology: '12-layer schema',
  };
}

function normalizeRiskLevel(raw?: string | null): RiskLevel {
  const level = (raw ?? 'MEDIUM').toUpperCase();
  if (level === 'LOW' || level === 'MEDIUM' || level === 'HIGH' || level === 'CRITICAL') {
    return level;
  }
  return 'MEDIUM';
}

/** Flat summary for dashboard charts (yield ladder, heatmap, tables). */
export function listItemToLegacySummary(
  item: AssetListItemFree | AssetListItemPro,
): AssetSummary {
  const pro = item as AssetListItemPro;
  const yieldPct = pro.yield?.currentYield ?? 0;
  return {
    id: item.slug,
    name: item.identity?.name ?? item.slug,
    symbol: item.identity?.symbol ?? '',
    category: normalizeCategory(item.identity?.category),
    tvl: item.market?.tvl ?? 0,
    yieldRate: yieldPct / 100,
    riskScore: normalizeRiskLevel(item.risk?.overallLevel),
    change7d: (item.market?.tvl7dChange ?? 0) / 100,
    holderCount: item.market?.holderCount ?? undefined,
    _meta: buildMeta(),
  };
}

export type LegacyAssetDetail = {
  id: string;
  name: string;
  symbol: string;
  protocol: string;
  category: AssetCategory;
  chain: Chain;
  contractAddress: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  snapshot: {
    id: string;
    assetId: string;
    tvl: number;
    yieldRate: number;
    holderCount: number;
    riskScore: RiskLevel;
    price: number;
    timestamp: Date;
  } | null;
  risk: {
    assetId: string;
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
    updatedAt: Date | string | null;
    _meta: AssetDataMeta;
  } | null;
  holder: {
    assetId: string;
    totalHolders: number;
    top10Concentration: number;
    whaleCount: number;
    retailCount: number;
    updatedAt: Date;
    _meta: AssetDataMeta;
  } | null;
  _meta: AssetDataMeta;
};

function mapComputedRiskLevel(level: RiskLevel): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (level === 'LOW') return 'LOW';
  if (level === 'HIGH' || level === 'CRITICAL') return 'HIGH';
  return 'MEDIUM';
}

/** Legacy asset detail payload for the dashboard detail page. */
export function toLegacyAssetDetail(detail: AssetDetailResponse): LegacyAssetDetail {
  const pro = detail as AssetDetailPro;
  const identity = detail.identity;
  const market = detail.market;
  const yieldLayer = pro.yield;
  const riskLayer = pro.risk;
  const meta = buildMeta(market?.sources, market?.confidence);
  const riskLevel = normalizeRiskLevel(riskLayer?.overallLevel);
  const yieldPct = yieldLayer?.currentYield ?? 0;
  const now = new Date();

  const blockchain = pro.blockchain?.[0];

  return {
    id: detail.slug,
    name: identity?.name ?? detail.slug,
    symbol: identity?.symbol ?? '',
    protocol: pro.institutional?.issuerName ?? identity?.name ?? '',
    category: normalizeCategory(identity?.category),
    chain: (blockchain?.chain as Chain) ?? 'ethereum',
    contractAddress: blockchain?.contractAddress ?? '',
    isActive: true,
    createdAt: now,
    updatedAt: market?.lastUpdated ?? now,
    snapshot: market
      ? {
          id: `${detail.id}-snapshot`,
          assetId: detail.id,
          tvl: market.tvl ?? 0,
          yieldRate: yieldPct / 100,
          holderCount: market.holderCount ?? 0,
          riskScore: riskLevel,
          price: market.price ?? 1,
          timestamp: market.lastUpdated ?? now,
        }
      : null,
    risk: riskLayer
      ? {
          assetId: detail.id,
          score:
            riskLayer.overallScore != null ? riskLayer.overallScore : 50,
          level: mapComputedRiskLevel(riskLevel),
          factors:
            'riskFactors' in riskLayer && Array.isArray(riskLayer.riskFactors)
              ? riskLayer.riskFactors
              : [],
          updatedAt:
            'lastAssessed' in riskLayer ? riskLayer.lastAssessed : null,
          _meta: meta,
        }
      : null,
    holder: market?.holderCount != null
      ? {
          assetId: detail.id,
          totalHolders: market.holderCount,
          top10Concentration: 0,
          whaleCount: 0,
          retailCount: market.holderCount,
          updatedAt: market.lastUpdated ?? now,
          _meta: meta,
        }
      : null,
    _meta: meta,
  };
}
