import type { AssetDataMeta, AssetSummary, MarketOverview, RiskLevel } from '../shared/index.js';
import { db } from '../lib/database.js';
import { normalizeCategory } from '../lib/assetLegacyMapper.js';

const defaultMoverMeta: AssetDataMeta = {
  sources: ['defillama'],
  lastUpdated: new Date().toISOString(),
  confidence: 'MEDIUM',
  methodology: '12-layer schema (yield history)',
};

type MoverRow = {
  id: string;
  name: string;
  symbol: string;
  currentYield: number;
  yieldChange7d: number;
  category?: string;
};

function normalizeRiskLevel(raw?: string | null): RiskLevel {
  const level = (raw ?? 'MEDIUM').toUpperCase();
  if (level === 'LOW' || level === 'MEDIUM' || level === 'HIGH' || level === 'CRITICAL') {
    return level;
  }
  return 'MEDIUM';
}

function mapMoverToMarketAssetSummary(
  row: MoverRow,
  metaByAsset: Map<string, AssetDataMeta>,
): AssetSummary {
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    category: normalizeCategory(row.category),
    tvl: 0,
    yieldRate: row.currentYield / 100,
    riskScore: 'MEDIUM',
    change7d: row.yieldChange7d / 100,
    _meta: metaByAsset.get(row.id) ?? defaultMoverMeta,
  };
}

/** Top yield movers (7d) from asset history snapshots. */
export async function findTopMovers(): Promise<{
  gainers: MoverRow[];
  losers: MoverRow[];
}> {
  const assets = await db.asset.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      identity: { select: { name: true, symbol: true, category: true } },
      yield: { select: { currentYield: true } },
      market: { select: { sources: true, confidence: true, tvl: true } },
      history: {
        orderBy: { timestamp: 'desc' },
        take: 8,
        select: { yield: true, timestamp: true },
      },
    },
  });

  const scored: MoverRow[] = [];

  for (const asset of assets) {
    const current = asset.yield?.currentYield ?? asset.history[0]?.yield ?? 0;
    if (!Number.isFinite(current) || current <= 0) continue;

    const prior =
      asset.history.length >= 2
        ? asset.history[1]?.yield
        : asset.history[0]?.yield;
    const yieldChange7d =
      prior != null && Number.isFinite(prior) ? current - prior : 0;

    scored.push({
      id: asset.slug,
      name: asset.identity?.name ?? asset.slug,
      symbol: asset.identity?.symbol ?? '',
      currentYield: current,
      yieldChange7d,
      category: asset.identity?.category ?? undefined,
    });
  }

  const gainers = [...scored]
    .sort((a, b) => b.yieldChange7d - a.yieldChange7d)
    .slice(0, 5);
  const losers = [...scored]
    .sort((a, b) => a.yieldChange7d - b.yieldChange7d)
    .slice(0, 5);

  return { gainers, losers };
}

/** Aggregated market stats from 12-layer market + yield tables. */
export async function getMarketOverview(): Promise<MarketOverview> {
  const [activeRows, totalAssets, movers] = await Promise.all([
    db.asset.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        identity: { select: { name: true, symbol: true, category: true } },
        market: {
          select: {
            tvl: true,
            holderCount: true,
            sources: true,
            confidence: true,
            lastUpdated: true,
          },
        },
        yield: { select: { currentYield: true } },
        risk: { select: { overallLevel: true } },
      },
    }),
    db.asset.count({ where: { isActive: true } }),
    findTopMovers(),
  ]);

  let totalTvl = 0;
  let totalHolders = 0;
  let yieldSum = 0;
  let yieldCount = 0;

  const metaByAsset = new Map<string, AssetDataMeta>();
  const snapByAsset = new Map<string, { tvl: number; yieldRate: number }>();
  const riskByAsset = new Map<string, RiskLevel>();

  for (const row of activeRows) {
    const tvl = row.market?.tvl ?? 0;
    const holders = row.market?.holderCount ?? 0;
    const yieldPct = row.yield?.currentYield ?? 0;

    totalTvl += tvl;
    totalHolders += holders;

    if (Number.isFinite(yieldPct) && yieldPct > 0) {
      yieldSum += yieldPct;
      yieldCount += 1;
    }

    snapByAsset.set(row.slug, { tvl, yieldRate: yieldPct });
    riskByAsset.set(row.slug, normalizeRiskLevel(row.risk?.overallLevel));
    metaByAsset.set(row.slug, {
      sources: row.market?.sources?.length ? row.market.sources : ['defillama'],
      lastUpdated: (row.market?.lastUpdated ?? new Date()).toISOString(),
      confidence:
        row.market?.confidence === 'HIGH' || row.market?.confidence === 'LOW'
          ? row.market.confidence
          : 'MEDIUM',
      methodology: '12-layer schema',
    });
  }

  const avgYieldRate = yieldCount > 0 ? yieldSum / yieldCount / 100 : 0;

  const mapMover = (m: MoverRow): AssetSummary => {
    const snap = snapByAsset.get(m.id);
    const summary = mapMoverToMarketAssetSummary(m, metaByAsset);
    return {
      ...summary,
      tvl: snap?.tvl ?? 0,
      yieldRate: (snap?.yieldRate ?? m.currentYield) / 100,
      riskScore: riskByAsset.get(m.id) ?? 'MEDIUM',
    };
  };

  return {
    totalTvl,
    totalAssets,
    avgYieldRate,
    totalHolders,
    topGainers: movers.gainers.map(mapMover),
    topLosers: movers.losers.map(mapMover),
    updatedAt: new Date(),
  };
}
