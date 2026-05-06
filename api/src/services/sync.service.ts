import { db } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import {
  fetchAllRwaTvl,
  fetchYieldPools,
  fetchProtocolDetail,
  fetchProtocolTvl,
  type YieldPool,
  PROTOCOL_SLUGS,
} from './defillama.service.js';
import { fetchCentrifugeData, fetchGoldfinchData } from './thegraph.service.js';
import { logValidationWarnings, validateAssetSnapshot } from './validation.service.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
const CHANGE_THRESHOLD = 0.001; // 0.1% (legacy TVL-only sync)
const SYNC_CHANGE_THRESHOLD = 0.005; // 0.5% (multi-source sync)

// DeFi Llama yields `project` names are not the same as protocol slugs.
const YIELD_PROJECT_BY_PROTOCOL_KEY: Record<string, string> = {
  'ondo-usdy': 'ondo-yield-assets',
  'ondo-ousg': 'ondo-yield-assets',
  'maple-usdc': 'maple',
  'centrifuge-drop': 'centrifuge',
  'backed-buidl': 'backed',
  'openedon-ousg': 'openeden',
  'goldfinch-gfi': 'goldfinch',
  'realt-token': 'realt',
  'franklin-benji': 'franklin-templeton',
  'superstate-ustb': 'superstate-ustb',
  'mountain-usdm': 'mountain-protocol',
  'hashnote-usyc': 'hashnote',
  'flux-fusdc': 'flux-finance',
};

function shouldCreateSnapshot(prevTvl: number, nextTvl: number): boolean {
  if (!Number.isFinite(nextTvl) || nextTvl < 0) {
    return false;
  }
  if (!Number.isFinite(prevTvl) || prevTvl <= 0) {
    return nextTvl > 0;
  }
  const change = Math.abs(nextTvl - prevTvl) / prevTvl;
  return change > CHANGE_THRESHOLD;
}

function pctChange(prev: number, next: number): number {
  if (!Number.isFinite(next) || !Number.isFinite(prev)) {
    return 1;
  }
  if (prev <= 0) {
    return next > 0 ? 1 : 0;
  }
  return Math.abs(next - prev) / prev;
}

/**
 * Resolve TVL: DeFi Llama (primary) → The Graph (secondary for known assets) → latest DB snapshot (cached).
 *
 * @param defiLlamaTvl optional value from `fetchAllRwaTvl()[assetId]` to avoid duplicate Llama calls.
 * @param latestDbTvl optional latest snapshot TVL from caller to avoid an extra DB read for the cached path.
 */
export async function getBestTvlData(
  assetId: string,
  defiLlamaTvl?: number | null,
  latestDbTvl?: number | null,
): Promise<{ tvl: number; source: string }> {
  let llamaTvl: number | null = null;

  if (typeof defiLlamaTvl === 'number' && Number.isFinite(defiLlamaTvl) && defiLlamaTvl > 0) {
    llamaTvl = defiLlamaTvl;
  } else {
    const slug = PROTOCOL_SLUGS[assetId];
    if (slug) {
      const direct = await fetchProtocolTvl(slug);
      if (typeof direct === 'number' && Number.isFinite(direct) && direct > 0) {
        llamaTvl = direct;
      } else {
        const detail = await fetchProtocolDetail(slug);
        if (typeof detail.tvl === 'number' && Number.isFinite(detail.tvl) && detail.tvl > 0) {
          llamaTvl = detail.tvl;
        }
      }
    }
  }

  if (llamaTvl !== null && llamaTvl > 0) {
    return { tvl: llamaTvl, source: 'defillama' };
  }

  if (assetId === 'centrifuge-drop') {
    const g = await fetchCentrifugeData();
    if (g && typeof g.tvl === 'number' && Number.isFinite(g.tvl) && g.tvl > 0) {
      return { tvl: g.tvl, source: 'thegraph-centrifuge' };
    }
  }

  if (assetId === 'goldfinch-gfi') {
    const g = await fetchGoldfinchData();
    if (g && typeof g.tvl === 'number' && Number.isFinite(g.tvl) && g.tvl > 0) {
      return { tvl: g.tvl, source: 'thegraph-goldfinch' };
    }
  }

  const cachedFromCaller =
    typeof latestDbTvl === 'number' && Number.isFinite(latestDbTvl) && latestDbTvl > 0
      ? latestDbTvl
      : null;

  if (cachedFromCaller !== null) {
    return { tvl: cachedFromCaller, source: 'cached' };
  }

  const row = await db.assetSnapshot.findFirst({
    where: { assetId },
    orderBy: { timestamp: 'desc' },
    select: { tvl: true },
  });

  if (row && typeof row.tvl === 'number' && Number.isFinite(row.tvl) && row.tvl > 0) {
    return { tvl: row.tvl, source: 'cached' };
  }

  return { tvl: 0, source: 'cached' };
}

function normalizeProjectName(name: string): string {
  return name.trim().toLowerCase();
}

function chooseBestApy(pools: YieldPool[], project: string): number | null {
  const target = normalizeProjectName(project);
  if (target === '') return null;
  const hits = pools.filter((p) => normalizeProjectName(p.project) === target);
  if (hits.length === 0) return null;
  const best = hits.reduce((a, b) => (b.tvlUsd > a.tvlUsd ? b : a));
  return typeof best.apy === 'number' && Number.isFinite(best.apy) ? best.apy : null;
}

function shouldCreateMultiSourceSnapshot(params: {
  latest: { tvl: number; yieldRate: number } | undefined;
  nextTvl: number;
  nextYield: number;
}): boolean {
  const { latest, nextTvl, nextYield } = params;

  if (!latest) {
    return nextTvl > 0 || nextYield > 0;
  }

  const prevTvl = latest.tvl;
  const prevYield = latest.yieldRate;

  return (
    pctChange(prevTvl, nextTvl) > SYNC_CHANGE_THRESHOLD ||
    pctChange(prevYield, nextYield) > SYNC_CHANGE_THRESHOLD
  );
}

/**
 * Multi-source sync: DeFi Llama TVL + yields, The Graph fallback TVL, then cached TVL.
 * Fetches external APIs in parallel; creates `AssetSnapshot` when TVL or yield moves more than 0.5%.
 */
export async function syncAllData(): Promise<{
  synced: number;
  failed: number;
  sources: Record<string, string>;
}> {
  const [tvlData, yieldPools] = await Promise.all([fetchAllRwaTvl(), fetchYieldPools()]);

  const assets = await db.asset.findMany({
    select: {
      id: true,
      protocol: true,
      snapshots: {
        select: { id: true, tvl: true, yieldRate: true, holderCount: true, timestamp: true },
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  });

  let synced = 0;
  let failed = 0;
  const sources: Record<string, string> = {};

  for (const asset of assets) {
    try {
      const batchLlama = tvlData[asset.id];
      const latest = asset.snapshots[0];
      const best = await getBestTvlData(asset.id, batchLlama, latest?.tvl);
      sources[asset.id] = best.source;

      const projectName = YIELD_PROJECT_BY_PROTOCOL_KEY[asset.id] ?? asset.id;
      const apyFromPools = chooseBestApy(yieldPools, projectName);

      const prevTvl = latest?.tvl ?? 0;
      const prevYield = latest?.yieldRate ?? 0;
      const nextTvl = best.tvl;
      const nextYield =
        apyFromPools !== null && Number.isFinite(apyFromPools) ? apyFromPools : prevYield;

      if (!shouldCreateMultiSourceSnapshot({ latest, nextTvl, nextYield })) {
        continue;
      }

      if (
        !latest &&
        (!Number.isFinite(nextTvl) || nextTvl <= 0) &&
        (!Number.isFinite(nextYield) || nextYield <= 0)
      ) {
        continue;
      }

      const holderCount = latest?.holderCount ?? 0;
      const validation = await validateAssetSnapshot({
        assetId: asset.id,
        tvl: Number.isFinite(nextTvl) ? nextTvl : 0,
        yieldRate: Number.isFinite(nextYield) ? nextYield : 0,
        holderCount,
      });
      logValidationWarnings(asset.id, validation);
      if (!validation.isValid) {
        failed += 1;
        continue;
      }

      await db.assetSnapshot.create({
        data: {
          assetId: asset.id,
          tvl: Number.isFinite(nextTvl) ? nextTvl : 0,
          yieldRate: Number.isFinite(nextYield) ? nextYield : 0,
          holderCount,
          timestamp: new Date(),
        },
      });

      logger.info(
        {
          source: best.source,
          assetId: asset.id,
          tvl: nextTvl,
          yield: nextYield,
        },
        'syncAllData snapshot',
      );

      synced += 1;
    } catch (err) {
      failed += 1;
      logger.warn(
        { err, assetId: asset.id, protocolKey: asset.id, protocol: asset.protocol },
        'syncAllData failed for asset',
      );
    }
  }

  logger.info(
    {
      synced,
      failed,
      timestamp: new Date(),
    },
    'syncAllData completed',
  );

  return { synced, failed, sources };
}

/**
 * Sync TVL dari DeFi Llama ke database.
 * Sumber data: DeFi Llama public API (`GET /tvl/{slug}` dan fallback `GET /protocol/{slug}`).
 */
export async function syncTvlData(): Promise<void> {
  const tvlData = await fetchAllRwaTvl();

  const assets = await db.asset.findMany({
    select: {
      id: true,
      protocol: true,
      snapshots: {
        select: { tvl: true, yieldRate: true, holderCount: true },
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  });

  let synced = 0;
  let failed = 0;

  for (const asset of assets) {
    try {
      // NOTE: our internal key is the Asset.id (e.g. "ondo-usdy"); Asset.protocol is display name (e.g. "Ondo Finance").
      const protocolKey = asset.id;

      let nextTvl = tvlData[protocolKey];
      if (typeof nextTvl !== 'number') {
        const slug = PROTOCOL_SLUGS[protocolKey];
        if (slug) {
          const detail = await fetchProtocolDetail(slug);
          nextTvl = detail.tvl;
        }
      }

      if (typeof nextTvl !== 'number' || !Number.isFinite(nextTvl)) {
        failed += 1;
        logger.warn(
          { assetId: asset.id, protocolKey, protocol: asset.protocol },
          'TVL not available for asset',
        );
        continue;
      }

      const latest = asset.snapshots[0];
      const prevTvl = latest?.tvl ?? 0;

      if (!shouldCreateSnapshot(prevTvl, nextTvl)) {
        continue;
      }

      const holderCount = latest?.holderCount ?? 0;
      const validation = await validateAssetSnapshot({
        assetId: asset.id,
        tvl: nextTvl,
        yieldRate: latest?.yieldRate ?? 0,
        holderCount,
      });
      logValidationWarnings(asset.id, validation);
      if (!validation.isValid) {
        failed += 1;
        continue;
      }

      await db.assetSnapshot.create({
        data: {
          assetId: asset.id,
          tvl: nextTvl,
          yieldRate: latest?.yieldRate ?? 0,
          holderCount,
          timestamp: new Date(),
        },
      });

      synced += 1;
    } catch (err) {
      failed += 1;
      logger.warn(
        { err, assetId: asset.id, protocolKey: asset.id, protocol: asset.protocol },
        'TVL sync failed for asset',
      );
    }
  }

  logger.info(
    {
      synced,
      failed,
      timestamp: new Date(),
    },
    'TVL sync completed',
  );
}

/**
 * Sync yield/APY dari DeFi Llama yields API ke database.
 * Sumber data: DeFi Llama yields API (`GET https://yields.llama.fi/pools`).
 */
export async function syncYieldData(): Promise<void> {
  const pools = await fetchYieldPools();

  const assets = await db.asset.findMany({
    select: {
      id: true,
      protocol: true,
      snapshots: {
        select: { id: true, tvl: true, yieldRate: true, holderCount: true, timestamp: true },
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  });

  let updated = 0;
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const asset of assets) {
    try {
      const protocolKey = asset.id;
      const projectName = YIELD_PROJECT_BY_PROTOCOL_KEY[protocolKey] ?? protocolKey;
      const apy = chooseBestApy(pools, projectName);

      if (apy === null) {
        skipped += 1;
        logger.warn(
          { assetId: asset.id, protocolKey, protocol: asset.protocol, projectName },
          'Yield not available for asset',
        );
        continue;
      }

      const latest = asset.snapshots[0];
      const now = Date.now();
      const latestAgeMs = latest ? now - latest.timestamp.getTime() : Number.POSITIVE_INFINITY;

      if (!latest || latestAgeMs > ONE_HOUR_MS) {
        const holderCount = latest?.holderCount ?? 0;
        const nextTvl = latest?.tvl ?? 0;
        const validation = await validateAssetSnapshot({
          assetId: asset.id,
          tvl: nextTvl,
          yieldRate: apy,
          holderCount,
        });
        logValidationWarnings(asset.id, validation);
        if (!validation.isValid) {
          failed += 1;
          continue;
        }

        await db.assetSnapshot.create({
          data: {
            assetId: asset.id,
            tvl: nextTvl,
            yieldRate: apy,
            holderCount,
            timestamp: new Date(),
          },
        });
        created += 1;
        continue;
      }

      // Update latest snapshot in-place when it's still within the 1h window.
      await db.assetSnapshot.update({
        where: { id: latest.id },
        data: { yieldRate: apy },
      });
      updated += 1;
    } catch (err) {
      failed += 1;
      logger.warn(
        { err, assetId: asset.id, protocolKey: asset.id, protocol: asset.protocol },
        'Yield sync failed for asset',
      );
    }
  }

  logger.info(
    {
      updated,
      created,
      skipped,
      failed,
      timestamp: new Date(),
    },
    'Yield sync completed',
  );
}

/**
 * Scheduler sync periodik (1 jam).
 * Sumber data: `syncAllData` (DeFi Llama + The Graph + cache).
 */
export function startSyncScheduler(): void {
  const runOnce = async (): Promise<void> => {
    logger.info({ timestamp: new Date() }, 'Sync started');
    try {
      await syncAllData();
    } catch (err) {
      logger.error({ err }, 'Sync run failed (non-fatal)');
    }
  };

  void runOnce();

  setInterval(() => {
    void runOnce();
  }, ONE_HOUR_MS);
}
