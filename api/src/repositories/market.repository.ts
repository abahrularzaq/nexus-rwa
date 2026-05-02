import type { AssetSummary, MarketOverview, RiskLevel } from '@nexus-rwa/shared';
import { Prisma } from '@prisma/client';
import { db } from '../lib/database.js';
import { findTopMovers } from './asset.repository.js';

/**
 * Latest snapshot per active asset via DISTINCT ON (max timestamp per assetId),
 * then aggregate TVL / AVG yield / SUM holders in one SQL round-trip.
 */
const latestActiveSnapshotMetrics = Prisma.sql`
  WITH latest AS (
    SELECT DISTINCT ON (s."assetId")
      s."assetId",
      s.tvl,
      s."yieldRate",
      s."holderCount"
    FROM "AssetSnapshot" s
    INNER JOIN "Asset" a ON a.id = s."assetId" AND a."isActive" = true
    ORDER BY s."assetId", s."timestamp" DESC
  )
  SELECT
    COALESCE(SUM(tvl), 0)::double precision AS "totalTvl",
    COALESCE(AVG("yieldRate"), 0)::double precision AS "avgYieldRate",
    COALESCE(SUM("holderCount"), 0)::double precision AS "totalHolders"
  FROM latest
`;

function mapMoverToMarketAssetSummary(
  row: {
    id: string;
    name: string;
    symbol: string;
    currentYield: number;
    yieldChange7d: number;
  },
  snapByAsset: Map<string, { tvl: number; yieldRate: number }>,
  riskByAsset: Map<string, RiskLevel>,
): AssetSummary {
  const snap = snapByAsset.get(row.id);
  const riskScore: RiskLevel = riskByAsset.get(row.id) ?? 'MEDIUM';
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    tvl: snap?.tvl ?? 0,
    yieldRate: (snap?.yieldRate ?? row.currentYield) / 100,
    riskScore,
    change7d: row.yieldChange7d / 100,
  };
}

/** Aggregated market stats from latest DB snapshots plus top yield movers (7d). */
export async function getMarketOverview(): Promise<MarketOverview> {
  const [metricRows, totalAssets, movers] = await Promise.all([
    db.$queryRaw<Array<{ totalTvl: number; avgYieldRate: number; totalHolders: number }>>(
      latestActiveSnapshotMetrics,
    ),
    db.asset.count({ where: { isActive: true } }),
    findTopMovers(),
  ]);

  const metrics = metricRows[0] ?? { totalTvl: 0, avgYieldRate: 0, totalHolders: 0 };

  const moverIds = [...new Set([...movers.gainers, ...movers.losers].map((m) => m.id))];

  const [snapRows, riskRows] =
    moverIds.length === 0
      ? [[], []] as const
      : await Promise.all([
          db.assetSnapshot.findMany({
            where: { assetId: { in: moverIds } },
            orderBy: { timestamp: 'desc' },
            select: { assetId: true, tvl: true, yieldRate: true },
          }),
          db.riskScore.findMany({
            where: { assetId: { in: moverIds } },
            orderBy: { calculatedAt: 'desc' },
            select: { assetId: true, overallScore: true },
          }),
        ]);

  const snapByAsset = new Map<string, { tvl: number; yieldRate: number }>();
  for (const s of snapRows) {
    if (!snapByAsset.has(s.assetId)) {
      snapByAsset.set(s.assetId, { tvl: s.tvl, yieldRate: s.yieldRate });
    }
  }

  const riskByAsset = new Map<string, RiskLevel>();
  for (const r of riskRows) {
    if (!riskByAsset.has(r.assetId)) {
      riskByAsset.set(r.assetId, r.overallScore as RiskLevel);
    }
  }

  return {
    totalTvl: Number(metrics.totalTvl),
    totalAssets,
    avgYieldRate: Number(metrics.avgYieldRate) / 100,
    totalHolders: Math.round(Number(metrics.totalHolders)),
    topGainers: movers.gainers.map((g) =>
      mapMoverToMarketAssetSummary(g, snapByAsset, riskByAsset),
    ),
    topLosers: movers.losers.map((l) =>
      mapMoverToMarketAssetSummary(l, snapByAsset, riskByAsset),
    ),
    updatedAt: new Date(),
  };
}
