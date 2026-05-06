import { db } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import {
  fetchAllRwaTvl,
  fetchYieldPools,
  fetchProtocolDetail,
  type YieldPool,
  PROTOCOL_SLUGS,
} from './defillama.service.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
const CHANGE_THRESHOLD = 0.001; // 0.1%

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

      await db.assetSnapshot.create({
        data: {
          assetId: asset.id,
          tvl: nextTvl,
          yieldRate: latest?.yieldRate ?? 0,
          holderCount: latest?.holderCount ?? 0,
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
        await db.assetSnapshot.create({
          data: {
            assetId: asset.id,
            tvl: latest?.tvl ?? 0,
            yieldRate: apy,
            holderCount: latest?.holderCount ?? 0,
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
 * Scheduler sync TVL periodik (1 jam).
 * Sumber data: DeFi Llama public API (lihat `syncTvlData`).
 */
export function startSyncScheduler(): void {
  const runOnce = async (): Promise<void> => {
    logger.info({ timestamp: new Date() }, 'Sync started');
    try {
      await Promise.all([syncTvlData(), syncYieldData()]);
    } catch (err) {
      logger.error({ err }, 'Sync run failed (non-fatal)');
    }
  };

  void runOnce();

  setInterval(() => {
    void runOnce();
  }, ONE_HOUR_MS);
}

