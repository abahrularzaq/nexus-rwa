import type { AssetCategory, Chain, HolderSnapshot, RiskScore } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { db } from '../lib/database.js';

/** Query params for paginated asset listing with optional filters. */
export type FindManyAssetsParams = {
  page: number;
  limit: number;
  category?: AssetCategory;
  chain?: Chain;
  search?: string;
};

const assetListInclude = {
  snapshots: { orderBy: { timestamp: 'desc' as const }, take: 1 },
  riskScores: { orderBy: { calculatedAt: 'desc' as const }, take: 1 },
} satisfies Prisma.AssetInclude;

/** Active asset row with latest snapshot and latest risk score (for list/detail list). */
export type AssetWithLatestSnapshotAndRisk = Prisma.AssetGetPayload<{
  include: typeof assetListInclude;
}>;

const assetDetailInclude = {
  snapshots: { orderBy: { timestamp: 'desc' as const }, take: 1 },
  riskScores: { orderBy: { calculatedAt: 'desc' as const }, take: 1 },
  holders: { orderBy: { timestamp: 'desc' as const }, take: 1 },
} satisfies Prisma.AssetInclude;

/** Single asset with latest snapshot, risk score, and holder snapshot. */
export type AssetWithLatestRelations = Prisma.AssetGetPayload<{
  include: typeof assetDetailInclude;
}>;

export type YieldHistoryPeriod = '7d' | '30d' | '90d' | '365d';

export type YieldHistoryPoint = {
  date: string;
  yield: number;
  tvl: number;
};

/** Compact asset row for top movers (7d yield change). */
export type AssetSummary = {
  id: string;
  name: string;
  symbol: string;
  protocol: string;
  category: AssetCategory;
  chain: Chain;
  currentYield: number;
  yieldChange7d: number;
};

function periodToStartDate(period: YieldHistoryPeriod): Date {
  const d = new Date();
  const days =
    period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  d.setTime(d.getTime() - days * 24 * 60 * 60 * 1000);
  return d;
}

function toUtcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeYieldDelta7d(
  rows: { timestamp: Date; yieldRate: number }[],
): { delta: number; currentYield: number } {
  if (rows.length === 0) {
    return { delta: 0, currentYield: 0 };
  }
  const sorted = [...rows].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const latest = sorted[sorted.length - 1]!;
  const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let baseline = sorted[0]!;
  for (const s of sorted) {
    if (s.timestamp.getTime() <= cutoffTime) {
      baseline = s;
    }
  }
  return { delta: latest.yieldRate - baseline.yieldRate, currentYield: latest.yieldRate };
}

/** Paginated active assets with latest snapshot & risk score; optional category, chain, search. */
export async function findMany(params: FindManyAssetsParams): Promise<{
  data: AssetWithLatestSnapshotAndRisk[];
  total: number;
}> {
  const { page, limit, category, chain, search } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.AssetWhereInput = {
    isActive: true,
    ...(category !== undefined ? { category } : {}),
    ...(chain !== undefined ? { chain } : {}),
    ...(search !== undefined && search.trim() !== ''
      ? {
          OR: [
            { name: { contains: search.trim(), mode: 'insensitive' } },
            { symbol: { contains: search.trim(), mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    db.asset.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: assetListInclude,
    }),
    db.asset.count({ where }),
  ]);

  return { data, total };
}

/** One active asset by id with latest snapshot, risk score, and holder snapshot. */
export async function findById(id: string): Promise<AssetWithLatestRelations | null> {
  return db.asset.findFirst({
    where: { id, isActive: true },
    include: assetDetailInclude,
  });
}

/** Yield & TVL series for an asset from start of period until now, ascending by time. */
export async function findYieldHistory(
  id: string,
  period: YieldHistoryPeriod,
): Promise<YieldHistoryPoint[]> {
  const startDate = periodToStartDate(period);
  const rows = await db.assetSnapshot.findMany({
    where: {
      assetId: id,
      timestamp: { gte: startDate },
    },
    orderBy: { timestamp: 'asc' },
    select: { yieldRate: true, tvl: true, timestamp: true },
  });

  return rows.map((r) => ({
    date: toUtcDateString(r.timestamp),
    yield: r.yieldRate,
    tvl: r.tvl,
  }));
}

/** Latest holder snapshot for an asset. */
export async function findHolderData(id: string): Promise<HolderSnapshot | null> {
  return db.holderSnapshot.findFirst({
    where: { assetId: id },
    orderBy: { timestamp: 'desc' },
  });
}

/** Latest risk score for an asset (legacy `RiskScore` table). */
export async function findRiskData(id: string): Promise<RiskScore | null> {
  return db.riskScore.findFirst({
    where: { assetId: id },
    orderBy: { calculatedAt: 'desc' },
  });
}

/** Computed risk fields stored on `Asset`. */
export async function findRiskFields(id: string): Promise<{
  riskScore: number | null;
  riskLevel: string | null;
  riskFactors: string[];
  riskUpdatedAt: Date | null;
} | null> {
  return db.asset.findFirst({
    where: { id, isActive: true },
    select: {
      riskScore: true,
      riskLevel: true,
      riskFactors: true,
      riskUpdatedAt: true,
    },
  });
}

/**
 * Top 5 assets by largest 7d yield increase and top 5 by largest decrease
 * (active assets only; delta = latest yield minus yield at/before 7d ago).
 */
export async function findTopMovers(): Promise<{
  gainers: AssetSummary[];
  losers: AssetSummary[];
}> {
  const activeAssets = await db.asset.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      symbol: true,
      protocol: true,
      category: true,
      chain: true,
    },
  });

  if (activeAssets.length === 0) {
    return { gainers: [], losers: [] };
  }

  const ids = activeAssets.map((a) => a.id);
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 14);

  const snapshots = await db.assetSnapshot.findMany({
    where: {
      assetId: { in: ids },
      timestamp: { gte: windowStart },
    },
    select: { assetId: true, yieldRate: true, timestamp: true },
    orderBy: [{ assetId: 'asc' }, { timestamp: 'asc' }],
  });

  const byAsset = new Map<string, { timestamp: Date; yieldRate: number }[]>();
  for (const s of snapshots) {
    const list = byAsset.get(s.assetId) ?? [];
    list.push({ timestamp: s.timestamp, yieldRate: s.yieldRate });
    byAsset.set(s.assetId, list);
  }

  const withDelta: AssetSummary[] = activeAssets.map((a) => {
    const rows = byAsset.get(a.id) ?? [];
    const { delta, currentYield } = computeYieldDelta7d(rows);
    return {
      id: a.id,
      name: a.name,
      symbol: a.symbol,
      protocol: a.protocol,
      category: a.category,
      chain: a.chain,
      currentYield,
      yieldChange7d: Math.round(delta * 10000) / 10000,
    };
  });

  const sortedDesc = [...withDelta].sort((a, b) => b.yieldChange7d - a.yieldChange7d);
  const sortedAsc = [...withDelta].sort((a, b) => a.yieldChange7d - b.yieldChange7d);

  return {
    gainers: sortedDesc.slice(0, 5),
    losers: sortedAsc.slice(0, 5),
  };
}
