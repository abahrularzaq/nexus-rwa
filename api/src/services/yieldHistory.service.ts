import { db } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { resolveAssetMeta, withAssetMeta } from '../lib/dataSources.js';
import type { YieldHistoryResponse } from '../shared/index.js';
import { getAssetRepository } from './asset.service.js';
import { RISK_METHODOLOGY_VERSION } from '../lib/riskEngine.js';
import {
  fetchAllRwaTvl,
  fetchProtocolDetail,
  fetchYieldPools,
  PROTOCOL_SLUGS,
  type YieldPool,
} from './defillama.service.js';

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

export type YieldHistoryPeriod = '7d' | '30d' | '90d';

export type YieldHistoryPoint = {
  timestamp: string;
  yield: number;
  tvl: number;
};

export type YieldHistoryResult = YieldHistoryResponse;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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

function chooseBestTvlUsd(pools: YieldPool[], project: string): number | null {
  const target = normalizeProjectName(project);
  if (target === '') return null;
  const hits = pools.filter((p) => normalizeProjectName(p.project) === target);
  if (hits.length === 0) return null;
  const best = hits.reduce((a, b) => (b.tvlUsd > a.tvlUsd ? b : a));
  return typeof best.tvlUsd === 'number' && Number.isFinite(best.tvlUsd) ? best.tvlUsd : null;
}

async function resolveTvlForAsset(
  assetId: string,
  tvlMap: Record<string, number>,
  pools: YieldPool[],
  projectName: string,
): Promise<{ tvl: number; source: string }> {
  let tvl = tvlMap[assetId];
  if (typeof tvl !== 'number' || !Number.isFinite(tvl) || tvl <= 0) {
    const slug = PROTOCOL_SLUGS[assetId];
    if (slug) {
      const detail = await fetchProtocolDetail(slug);
      if (detail.tvl > 0) {
        tvl = detail.tvl;
      }
    }
  }
  if (typeof tvl === 'number' && Number.isFinite(tvl) && tvl > 0) {
    return { tvl, source: 'defillama' };
  }

  const poolTvl = chooseBestTvlUsd(pools, projectName);
  if (poolTvl !== null && poolTvl > 0) {
    return { tvl: poolTvl, source: 'defillama' };
  }

  const latest = await db.assetHistory.findFirst({
    where: { assetId },
    orderBy: { timestamp: 'desc' },
    select: { tvl: true },
  });
  if (latest?.tvl != null && latest.tvl > 0) {
    return { tvl: latest.tvl, source: 'cached' };
  }

  return { tvl: 0, source: 'cached' };
}

/**
 * Fetches DeFi Llama yield + TVL for all active assets and appends AssetHistory rows.
 */
export async function captureYieldHistory(): Promise<{
  inserted: number;
  skipped: number;
  errors: number;
}> {
  const repo = getAssetRepository();
  const [pools, tvlMap, assets] = await Promise.all([
    fetchYieldPools(),
    fetchAllRwaTvl(),
    db.asset.findMany({
      where: { isActive: true },
      select: {
        id: true,
        risk: { select: { overallScore: true, methodologyVersion: true } },
      },
    }),
  ]);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const now = new Date();

  for (const asset of assets) {
    try {
      const projectName =
        YIELD_PROJECT_BY_PROTOCOL_KEY[asset.id] ?? asset.id;
      const apy = chooseBestApy(pools, projectName);

      if (apy === null) {
        skipped += 1;
        logger.warn({ assetId: asset.id, projectName }, 'Yield history: APY unavailable');
        continue;
      }

      const { tvl, source } = await resolveTvlForAsset(
        asset.id,
        tvlMap,
        pools,
        projectName,
      );

      if (tvl <= 0) {
        skipped += 1;
        logger.warn({ assetId: asset.id }, 'Yield history: TVL unavailable');
        continue;
      }

      await repo.appendHistory(asset.id, {
        yield: apy,
        tvl,
        ...(asset.risk?.overallScore != null ? { riskScore: asset.risk.overallScore } : {}),
        ...(asset.risk?.methodologyVersion != null
          ? { methodologyVersion: asset.risk.methodologyVersion }
          : asset.risk?.overallScore != null
            ? { methodologyVersion: RISK_METHODOLOGY_VERSION }
            : {}),
        source,
      });
      inserted += 1;
    } catch (err) {
      errors += 1;
      logger.warn({ err, assetId: asset.id }, 'Yield history capture failed');
    }
  }

  logger.info(
    { inserted, skipped, errors, total: assets.length, timestamp: now },
    'Yield history capture completed',
  );

  return { inserted, skipped, errors };
}

async function computeLimitedHistory(assetId: string): Promise<boolean> {
  const oldest = await db.assetHistory.findFirst({
    where: { assetId },
    orderBy: { timestamp: 'asc' },
    select: { timestamp: true },
  });
  if (!oldest) {
    return true;
  }
  return Date.now() - oldest.timestamp.getTime() < SEVEN_DAYS_MS;
}

/** Historical yield/TVL series for an asset (from AssetHistory table). */
export async function getYieldHistory(
  assetId: string,
  period: YieldHistoryPeriod,
): Promise<YieldHistoryResult> {
  const asset = await db.asset.findFirst({
    where: { id: assetId, isActive: true },
    select: {
      id: true,
      updatedAt: true,
      market: {
        select: {
          sources: true,
          confidence: true,
          lastUpdated: true,
        },
      },
      history: { orderBy: { timestamp: 'desc' }, take: 1, select: { timestamp: true } },
    },
  });
  if (!asset) {
    throw new Error('ASSET_NOT_FOUND');
  }

  const meta = resolveAssetMeta({
    dataSources: asset.market?.sources ?? [],
    dataConfidence: asset.market?.confidence ?? null,
    dataMethodology: null,
    dataSourcesUpdatedAt: asset.market?.lastUpdated ?? null,
    updatedAt: asset.updatedAt,
    snapshots: asset.history.map((h) => ({ timestamp: h.timestamp })),
  });

  const rows = await getAssetRepository().getHistory(assetId, period);

  const limited_history = await computeLimitedHistory(assetId);

  return withAssetMeta(
    {
      assetId,
      period,
      limited_history,
      history: rows
        .filter((r) => r.yield != null && r.tvl != null)
        .map((r) => ({
          timestamp: r.timestamp.toISOString(),
          yield: r.yield!,
          tvl: r.tvl!,
          ...(r.riskScore != null ? { riskScore: r.riskScore } : {}),
          ...(r.methodologyVersion != null ? { methodologyVersion: r.methodologyVersion } : {}),
        })),
    },
    meta,
  );
}
