import { db } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import {
  batchCalculateRisk,
  type AssetData,
} from '../lib/riskEngine.js';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

type SnapshotRow = {
  assetId: string;
  tvl: number;
  yieldRate: number;
  holderCount: number;
  timestamp: Date;
};

function monthsBetween(start: Date, end: Date): number {
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  return Math.max(0, years * 12 + months);
}

function tvl7dChangePercent(rows: SnapshotRow[]): number {
  if (rows.length === 0) {
    return 0;
  }
  const sorted = [...rows].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );
  const latest = sorted[sorted.length - 1]!;
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let baseline = sorted[0]!;
  for (const r of sorted) {
    if (r.timestamp.getTime() <= cutoff) {
      baseline = r;
    }
  }
  if (!Number.isFinite(baseline.tvl) || baseline.tvl <= 0) {
    return latest.tvl > 0 ? 100 : 0;
  }
  return ((latest.tvl - baseline.tvl) / baseline.tvl) * 100;
}

function averageYield30d(rows: SnapshotRow[]): number {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const inWindow = rows.filter((r) => r.timestamp.getTime() >= cutoff);
  if (inWindow.length === 0) {
    return rows.length > 0 ? rows[rows.length - 1]!.yieldRate : 0;
  }
  const sum = inWindow.reduce((acc, r) => acc + r.yieldRate, 0);
  return sum / inWindow.length;
}

function buildAssetDataInputs(
  assets: { id: string; createdAt: Date }[],
  latestByAsset: Map<string, SnapshotRow>,
  historyByAsset: Map<string, SnapshotRow[]>,
): AssetData[] {
  const now = new Date();
  return assets.map((asset) => {
    const latest = latestByAsset.get(asset.id);
    const history = historyByAsset.get(asset.id) ?? [];
    const protocolAgeMonths = monthsBetween(asset.createdAt, now);

    return {
      id: asset.id,
      tvl: latest?.tvl ?? 0,
      tvl7dChange: tvl7dChangePercent(history),
      yield: latest?.yieldRate ?? 0,
      yieldAvg30d: averageYield30d(history),
      holderCount: latest?.holderCount ?? 0,
      protocolAgeMonths,
    };
  });
}

/**
 * Recomputes risk scores for all active assets and persists on `Asset`.
 */
export async function updateRiskScores(): Promise<{
  updated: number;
  errors: number;
}> {
  const assets = await db.asset.findMany({
    where: { isActive: true },
    select: { id: true, createdAt: true },
  });

  if (assets.length === 0) {
    logger.info('Risk score update: no active assets');
    return { updated: 0, errors: 0 };
  }

  const ids = assets.map((a) => a.id);
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 35);

  const snapshots = await db.assetSnapshot.findMany({
    where: {
      assetId: { in: ids },
      timestamp: { gte: windowStart },
    },
    select: {
      assetId: true,
      tvl: true,
      yieldRate: true,
      holderCount: true,
      timestamp: true,
    },
    orderBy: [{ assetId: 'asc' }, { timestamp: 'asc' }],
  });

  const historyByAsset = new Map<string, SnapshotRow[]>();
  const latestByAsset = new Map<string, SnapshotRow>();

  for (const row of snapshots) {
    const snap: SnapshotRow = {
      assetId: row.assetId,
      tvl: row.tvl,
      yieldRate: row.yieldRate,
      holderCount: row.holderCount,
      timestamp: row.timestamp,
    };
    const list = historyByAsset.get(row.assetId) ?? [];
    list.push(snap);
    historyByAsset.set(row.assetId, list);
    latestByAsset.set(row.assetId, snap);
  }

  const inputs = buildAssetDataInputs(assets, latestByAsset, historyByAsset);
  const results = batchCalculateRisk(inputs);

  let updated = 0;
  let errors = 0;
  const now = new Date();

  for (const asset of assets) {
    const result = results.get(asset.id);
    if (!result) {
      errors += 1;
      continue;
    }

    try {
      await db.asset.update({
        where: { id: asset.id },
        data: {
          riskScore: result.score,
          riskLevel: result.level,
          riskFactors: result.factors,
          riskUpdatedAt: now,
        },
      });
      updated += 1;
    } catch (err) {
      errors += 1;
      logger.warn({ err, assetId: asset.id }, 'Failed to update asset risk score');
    }
  }

  logger.info(
    { updated, errors, total: assets.length, timestamp: now },
    'Risk score update completed',
  );

  return { updated, errors };
}

/** Runs risk scoring immediately, then every 6 hours. */
export function startRiskScoreScheduler(): void {
  const runOnce = async (): Promise<void> => {
    logger.info({ timestamp: new Date() }, 'Risk score job started');
    try {
      await updateRiskScores();
    } catch (err) {
      logger.error({ err }, 'Risk score job failed (non-fatal)');
    }
  };

  void runOnce();

  setInterval(() => {
    void runOnce();
  }, SIX_HOURS_MS);
}
