import { Prisma } from '@prisma/client';
import type { Redis } from 'ioredis';
import { Redis as IORedis } from 'ioredis';
import { db } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { redis as getRedisClient } from '../lib/redis.js';
import { invalidateAssetCache } from './asset.service.js';
import {
  AssetRepository,
  RepositoryError,
} from '../repositories/asset.repository.js';
import type { UpsertMarketData, UpsertRiskData, UpsertYieldData } from '../types/asset.types.js';
import { readErc20TotalSupply } from './onchain.service.js';
import { PROTOCOL_SLUGS, type YieldPool } from './defillama.service.js';
import {
  RISK_METHODOLOGY_VERSION,
  calculateWeightedRiskScore,
  scoreToRiskLevel,
  type RiskSubScores,
} from '../lib/riskEngine.js';

const DEFILLAMA_API = 'https://api.llama.fi';
const DEFILLAMA_YIELDS_API = 'https://yields.llama.fi';
const FETCH_TIMEOUT_MS = 10_000;
const RATE_LIMIT_WAIT_MS = 60_000;
const INTER_ASSET_DELAY_MS = 300;
const SYNC_STATUS_TTL_SEC = 7 * 24 * 60 * 60;
const SYNC_STATUS_KEY_PREFIX = 'sync:status:';

const YIELD_PROJECT_BY_SLUG: Record<string, string> = {
  'ondo-usdy': 'ondo-yield-assets',
  'ondo-ousg': 'ondo-yield-assets',
  'franklin-benji': 'franklin-templeton',
  'maple-usdc': 'maple',
  'centrifuge-cfg': 'centrifuge',
  'goldfinch-gfi': 'goldfinch',
  'clearpool': 'clearpool',
  'truefi': 'truefi',
  'credix': 'credix',
  'ribbon-finance': 'ribbon-finance',
  'superstate': 'superstate-ustb',
  'backed-finance': 'backed',
  'openeden': 'openeden',
};

export type SyncResult = {
  success: boolean;
  layersUpdated: string[];
  error?: string;
  skipped?: boolean;
  reason?: string;
};

export type BatchSyncResult = {
  total: number;
  success: number;
  failed: number;
  durationMs: number;
  results: Array<{ slug: string; success: boolean; error?: string }>;
};

export type SyncSingleResult = BatchSyncResult & {
  riskOverwritten: boolean;
  riskProtected: boolean;
};

const PROTECTED_RISK_ASSESSMENT_METHODS = ['ai-assisted', 'manual', 'hybrid'] as const;

export type SyncStatusRecord = {
  lastSync: string;
  duration: number;
  layersUpdated: string[];
  errors?: string[];
};

export type AssetSyncStatusView = {
  slug: string;
  lastSync: string | null;
  status: 'ok' | 'error' | 'never';
  layersUpdated: string[];
};

type DefiLlamaProtocolRaw = {
  tvl?: unknown;
  change_1d?: unknown;
  change_7d?: unknown;
  change_30d?: unknown;
};

type YieldPoolsResponse = {
  data?: YieldPool[];
};

type YieldChartResponse = {
  data?: Array<{ timestamp?: string; apy?: number; tvlUsd?: number }>;
  status?: string;
};

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function isPrismaError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof RepositoryError
  );
}

function logSyncError(
  operation: string,
  slug: string,
  assetId: string | undefined,
  error: unknown,
): void {
  const payload: Record<string, unknown> = { operation, slug, err: error };
  if (assetId) payload.assetId = assetId;
  if (isPrismaError(error)) {
    payload.prisma = true;
    if (error instanceof RepositoryError) {
      payload.repositoryContext = error.context;
    }
  }
  logger.error(payload, `Sync failed: ${operation}`);
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

function standardDeviation(values: number[]): number | undefined {
  if (values.length < 2) return undefined;
  const mean = average(values);
  if (mean === undefined) return undefined;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function minMax(values: number[]): { min?: number; max?: number } {
  if (values.length === 0) return {};
  return { min: Math.min(...values), max: Math.max(...values) };
}

function yieldValuesFromHistory(
  points: Array<{ yield?: number }>,
): number[] {
  return points
    .map((p) => p.yield)
    .filter((v): v is number => v != null && Number.isFinite(v));
}

export class SyncService {
  constructor(
    private readonly repo: AssetRepository,
    private readonly redis: Redis,
  ) {}

  async syncMarketData(slug: string): Promise<SyncResult> {
    const layersUpdated: string[] = [];
    let assetId: string | undefined;

    try {
      const asset = await this.repo.findBySlug(slug, ['identity', 'market', 'yield']);
      if (!asset) {
        return { success: false, layersUpdated, error: `Asset not found: ${slug}` };
      }

      assetId = asset.id;
      const protocolSlug = PROTOCOL_SLUGS[slug] ?? slug;
      const symbol = asset.identity?.symbol ?? '';

      const [protocolRaw, pools] = await Promise.all([
        this.fetchProtocolDetail(protocolSlug),
        this.fetchYieldPoolsCached(),
      ]);

      const marketData = this.mapDefiLlamaToMarket(protocolRaw);
      await this.repo.upsertMarket(asset.id, marketData);
      layersUpdated.push('market');

      const yieldData = this.mapPoolsToYield(pools, symbol, slug);
      if (yieldData) {
        await this.repo.upsertYield(asset.id, yieldData);
        layersUpdated.push('yield');
      }

      logger.info(
        {
          slug,
          assetId: asset.id,
          layersUpdated,
          tvl: marketData.tvl,
          yield: yieldData?.currentYield,
        },
        'syncMarketData completed',
      );

      invalidateAssetCache(slug);

      return { success: true, layersUpdated };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'syncMarketData failed';
      logSyncError('syncMarketData', slug, assetId, error);
      return { success: false, layersUpdated, error: message };
    }
  }

  async syncYieldDetail(slug: string): Promise<SyncResult> {
    const layersUpdated: string[] = [];
    let assetId: string | undefined;

    try {
      const asset = await this.repo.findBySlug(slug, ['identity', 'yield']);
      if (!asset) {
        return { success: false, layersUpdated, error: `Asset not found: ${slug}` };
      }

      assetId = asset.id;
      const symbol = asset.identity?.symbol ?? '';
      const pools = await this.fetchYieldPoolsCached();
      const poolId = this.resolvePoolId(pools, symbol, slug);

      if (poolId) {
        await this.fetchYieldChart(poolId);
      } else {
        logger.debug({ slug }, 'syncYieldDetail: no DeFi Llama pool id resolved');
      }

      const [history7d, history30d, history1y] = await Promise.all([
        this.repo.getHistory(asset.id, '7d'),
        this.repo.getHistory(asset.id, '30d'),
        this.repo.getHistory(asset.id, '1y'),
      ]);

      const yields7d = yieldValuesFromHistory(history7d);
      const yields30d = yieldValuesFromHistory(history30d);
      const yields52w = yieldValuesFromHistory(history1y);

      const avg7d = average(yields7d);
      const avg30d = average(yields30d);
      const std30d = standardDeviation(yields30d);
      const range52w = minMax(yields52w);

      const yieldPatch: UpsertYieldData = {
        ...(avg7d !== undefined ? { yieldAvg7d: avg7d } : {}),
        ...(avg30d !== undefined ? { yieldAvg30d: avg30d } : {}),
        ...(std30d !== undefined ? { yieldStdDev30d: std30d } : {}),
        ...(range52w.min !== undefined ? { yieldMin52w: range52w.min } : {}),
        ...(range52w.max !== undefined ? { yieldMax52w: range52w.max } : {}),
      };

      if (Object.keys(yieldPatch).length === 0) {
        logger.info({ slug, assetId: asset.id }, 'syncYieldDetail: no yield history to aggregate');
        return { success: true, layersUpdated };
      }

      await this.repo.upsertYield(asset.id, yieldPatch);
      layersUpdated.push('yield-detail');

      logger.info({ slug, assetId: asset.id, yieldPatch }, 'syncYieldDetail completed');

      invalidateAssetCache(slug);

      return { success: true, layersUpdated };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'syncYieldDetail failed';
      logSyncError('syncYieldDetail', slug, assetId, error);
      return { success: false, layersUpdated, error: message };
    }
  }

  async syncBlockchainData(slug: string): Promise<SyncResult> {
    const layersUpdated: string[] = [];
    let assetId: string | undefined;

    try {
      const asset = await this.repo.findBySlug(slug, ['blockchain', 'market']);
      if (!asset) {
        return { success: false, layersUpdated, error: `Asset not found: ${slug}` };
      }

      assetId = asset.id;
      const chains = asset.blockchain ?? [];

      if (chains.length === 0) {
        logger.debug({ slug }, 'syncBlockchainData: no blockchain records, skipping');
        return { success: true, layersUpdated };
      }

      let totalCirculating = 0;
      let anySupply = false;

      for (const record of chains) {
        const address = record.contractAddress?.trim() ?? '';
        if (!address) {
          logger.info(
            { slug, chain: record.chain },
            'syncBlockchainData: empty contractAddress, skipping chain',
          );
          continue;
        }

        const supply = await readErc20TotalSupply(address, record.chain);
        if (supply == null) {
          logger.warn(
            { slug, chain: record.chain, contractAddress: address },
            'syncBlockchainData: could not read on-chain supply',
          );
          continue;
        }

        totalCirculating += supply;
        anySupply = true;
      }

      if (!anySupply) {
        return { success: true, layersUpdated };
      }

      await this.repo.upsertMarket(asset.id, { circulatingSupply: totalCirculating });
      layersUpdated.push('blockchain');

      logger.info(
        { slug, assetId: asset.id, circulatingSupply: totalCirculating },
        'syncBlockchainData completed',
      );

      invalidateAssetCache(slug);

      return { success: true, layersUpdated };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'syncBlockchainData failed';
      logSyncError('syncBlockchainData', slug, assetId, error);
      return { success: false, layersUpdated, error: message };
    }
  }

  async syncRiskScore(
    slug: string,
    options?: { force?: boolean },
  ): Promise<SyncResult> {
    const layersUpdated: string[] = [];
    let assetId: string | undefined;

    try {
      const asset = await this.repo.findBySlug(slug, ['market', 'liquidity']);
      if (!asset) {
        return { success: false, layersUpdated, error: `Asset not found: ${slug}` };
      }

      assetId = asset.id;

      if (!options?.force) {
        const existingRisk = await db.assetRisk.findUnique({
          where: { assetId: asset.id },
          select: { assessmentMethod: true, lastAssessed: true },
        });

        const method = existingRisk?.assessmentMethod ?? null;
        if (
          method != null &&
          PROTECTED_RISK_ASSESSMENT_METHODS.includes(
            method as (typeof PROTECTED_RISK_ASSESSMENT_METHODS)[number],
          )
        ) {
          logger.info(
            { slug, assetId: asset.id, assessmentMethod: method },
            `[syncRiskScore] Skipping ${slug} — assessmentMethod is "${method}", protected from algorithmic overwrite`,
          );
          return { success: true, layersUpdated, skipped: true, reason: 'protected' };
        }
      }

      const history = await this.repo.getHistory(asset.id, '30d');

      const tvl30dChange =
        asset.market?.tvl30dChange ??
        this.estimateTvl30dChange(history.map((h) => h.tvl).filter((v): v is number => v != null));

      const yieldValues = history
        .map((h) => h.yield)
        .filter((v): v is number => v != null && Number.isFinite(v));

      const subScores: RiskSubScores = {
        smartContractRisk: 50,
        counterpartyRisk: 50,
        regulatoryRisk: 50,
        marketRisk: this.calculateMarketRisk(tvl30dChange, yieldValues),
        liquidityRisk: asset.liquidity?.liquidityScore ?? 50,
        concentrationRisk: this.calculateConcentrationRisk(asset.market?.holderCount),
      };

      const overallScore = this.calculateWeightedRiskScore(subScores);
      const overallLevel = this.scoreToLevel(overallScore);

      const riskData: UpsertRiskData = {
        overallScore,
        overallLevel,
        smartContractRisk: subScores.smartContractRisk,
        counterpartyRisk: subScores.counterpartyRisk,
        liquidityRisk: subScores.liquidityRisk,
        regulatoryRisk: subScores.regulatoryRisk,
        marketRisk: subScores.marketRisk,
        concentrationRisk: subScores.concentrationRisk,
        lastAssessed: new Date(),
        assessmentMethod: 'algorithmic',
        methodologyVersion: RISK_METHODOLOGY_VERSION,
      };

      await this.repo.upsertRisk(asset.id, riskData);
      await this.repo.appendHistory(asset.id, {
        ...(asset.market?.tvl != null ? { tvl: asset.market.tvl } : {}),
        ...(asset.market?.holderCount != null ? { holderCount: asset.market.holderCount } : {}),
        riskScore: overallScore,
        methodologyVersion: RISK_METHODOLOGY_VERSION,
        source: 'risk-sync',
      });
      layersUpdated.push('risk', 'history');

      logger.info({ slug, assetId: asset.id, overallScore, overallLevel }, 'syncRiskScore completed');

      invalidateAssetCache(slug);

      return { success: true, layersUpdated };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'syncRiskScore failed';
      logSyncError('syncRiskScore', slug, assetId, error);
      return { success: false, layersUpdated, error: message };
    }
  }

  async appendHistorySnapshot(slug: string): Promise<SyncResult> {
    const layersUpdated: string[] = [];
    let assetId: string | undefined;

    try {
      const asset = await this.repo.findBySlug(slug, ['market', 'yield', 'risk']);
      if (!asset) {
        return { success: false, layersUpdated, error: `Asset not found: ${slug}` };
      }

      assetId = asset.id;

      await this.repo.appendHistory(asset.id, {
        ...(asset.market?.tvl != null ? { tvl: asset.market.tvl } : {}),
        ...(asset.yield?.currentYield != null ? { yield: asset.yield.currentYield } : {}),
        ...(asset.risk?.overallScore != null ? { riskScore: asset.risk.overallScore } : {}),
        ...(asset.risk?.methodologyVersion != null ? { methodologyVersion: asset.risk.methodologyVersion } : {}),
        source: 'sync',
      });
      layersUpdated.push('history');

      return { success: true, layersUpdated };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'appendHistorySnapshot failed';
      logSyncError('appendHistorySnapshot', slug, assetId, error);
      return { success: false, layersUpdated, error: message };
    }
  }

  async syncAll(): Promise<BatchSyncResult> {
    const startedAt = Date.now();
    const assets = await this.repo.findActiveAssets();
    const results: BatchSyncResult['results'] = [];
    let success = 0;
    let failed = 0;

    console.log('\n=== Nexus RWA — Full sync started ===');
    console.log(`Assets: ${assets.length} | ${new Date().toISOString()}\n`);

    for (const asset of assets) {
      const single = await this.syncSingle(asset.slug);
      const entry = single.results[0] ?? { slug: asset.slug, success: false, error: 'No result' };
      results.push(entry);

      if (entry.success) {
        success += 1;
        console.log(`  ✓ ${asset.slug}`);
      } else {
        failed += 1;
        console.log(`  ✗ ${asset.slug} — ${entry.error ?? 'unknown error'}`);
      }

      await this.sleep(INTER_ASSET_DELAY_MS);
    }

    const durationMs = Date.now() - startedAt;
    const batch: BatchSyncResult = {
      total: assets.length,
      success,
      failed,
      durationMs,
      results,
    };

    console.log('\n=== Sync summary ===');
    console.log(`  Total:    ${batch.total}`);
    console.log(`  Success:  ${batch.success}`);
    console.log(`  Failed:   ${batch.failed}`);
    console.log(`  Duration: ${(durationMs / 1000).toFixed(1)}s`);
    console.log('========================\n');

    logger.info(batch, 'syncAll completed');

    try {
      const client = getRedisClient();
      await client.set(
        'admin:sync:last',
        JSON.stringify({
          finishedAt: new Date().toISOString(),
          scope: 'syncAll',
          result: batch,
        }),
      );
    } catch {
      // optional
    }

    return batch;
  }

  async syncSingle(slug: string, options?: { forceRisk?: boolean }): Promise<SyncSingleResult> {
    const startedAt = Date.now();
    const layersUpdated: string[] = [];
    const errors: string[] = [];

    const market = await this.syncMarketData(slug);
    layersUpdated.push(...market.layersUpdated);
    if (!market.success && market.error) errors.push(market.error);

    await this.sleep(INTER_ASSET_DELAY_MS);

    const yieldDetail = await this.syncYieldDetail(slug);
    layersUpdated.push(...yieldDetail.layersUpdated);
    if (!yieldDetail.success && yieldDetail.error) errors.push(yieldDetail.error);

    const risk = await this.syncRiskScore(slug, { force: options?.forceRisk });
    layersUpdated.push(...risk.layersUpdated);
    if (!risk.success && risk.error) errors.push(risk.error);

    const riskProtected = risk.skipped === true && risk.reason === 'protected';
    const riskOverwritten = risk.layersUpdated.includes('risk');

    const blockchain = await this.syncBlockchainData(slug);
    layersUpdated.push(...blockchain.layersUpdated);
    if (!blockchain.success && blockchain.error) errors.push(blockchain.error);

    const history = await this.appendHistorySnapshot(slug);
    layersUpdated.push(...history.layersUpdated);
    if (!history.success && history.error) errors.push(history.error);

    const durationMs = Date.now() - startedAt;
    const ok = errors.length === 0;

    await this.saveSyncStatus(slug, {
      lastSync: new Date().toISOString(),
      duration: durationMs,
      layersUpdated: [...new Set(layersUpdated)],
      ...(errors.length > 0 ? { errors } : {}),
    });

    return {
      total: 1,
      success: ok ? 1 : 0,
      failed: ok ? 0 : 1,
      durationMs,
      riskOverwritten,
      riskProtected,
      results: [
        {
          slug,
          success: ok,
          error: errors.length > 0 ? errors.join('; ') : undefined,
        },
      ],
    };
  }

  /** Hourly cron: sync market data for top assets by TVL. */
  async syncTopMarketData(limit = 5): Promise<BatchSyncResult> {
    const startedAt = Date.now();
    const topAssets = await this.repo.findAll({ limit });
    const results: BatchSyncResult['results'] = [];
    let success = 0;
    let failed = 0;

    for (const asset of topAssets) {
      const market = await this.syncMarketData(asset.slug);
      const history = await this.appendHistorySnapshot(asset.slug);
      const ok = market.success && history.success;

      results.push({
        slug: asset.slug,
        success: ok,
        error: [market.error, history.error].filter(Boolean).join('; ') || undefined,
      });

      if (ok) {
        success += 1;
        await this.saveSyncStatus(asset.slug, {
          lastSync: new Date().toISOString(),
          duration: Date.now() - startedAt,
          layersUpdated: [...market.layersUpdated, ...history.layersUpdated],
        });
      } else {
        failed += 1;
        await this.saveSyncStatus(asset.slug, {
          lastSync: new Date().toISOString(),
          duration: Date.now() - startedAt,
          layersUpdated: [...market.layersUpdated, ...history.layersUpdated],
          errors: [market.error, history.error].filter(Boolean) as string[],
        });
      }

      await this.sleep(INTER_ASSET_DELAY_MS);
    }

    return {
      total: topAssets.length,
      success,
      failed,
      durationMs: Date.now() - startedAt,
      results,
    };
  }

  /** Daily cron: on-chain circulating supply for all active assets. */
  async syncAllBlockchainData(): Promise<BatchSyncResult> {
    const startedAt = Date.now();
    const assets = await this.repo.findActiveAssets();
    const results: BatchSyncResult['results'] = [];
    let success = 0;
    let failed = 0;

    for (const asset of assets) {
      const result = await this.syncBlockchainData(asset.slug);
      results.push({
        slug: asset.slug,
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        success += 1;
      } else {
        failed += 1;
      }

      await this.sleep(INTER_ASSET_DELAY_MS);
    }

    logger.info(
      { success, failed, durationMs: Date.now() - startedAt },
      'syncAllBlockchainData completed',
    );

    return {
      total: assets.length,
      success,
      failed,
      durationMs: Date.now() - startedAt,
      results,
    };
  }

  async getAllSyncStatuses(): Promise<AssetSyncStatusView[]> {
    const assets = await this.repo.findActiveAssets();

    const statuses = await Promise.all(
      assets.map(async ({ slug }) => {
        const record = await this.getSyncStatus(slug);
        if (!record) {
          return {
            slug,
            lastSync: null,
            status: 'never' as const,
            layersUpdated: [],
          };
        }

        return {
          slug,
          lastSync: record.lastSync,
          status: record.errors?.length ? ('error' as const) : ('ok' as const),
          layersUpdated: record.layersUpdated,
        };
      }),
    );

    return statuses;
  }

  private async saveSyncStatus(slug: string, record: SyncStatusRecord): Promise<void> {
    try {
      await this.redis.setex(
        `${SYNC_STATUS_KEY_PREFIX}${slug}`,
        SYNC_STATUS_TTL_SEC,
        JSON.stringify(record),
      );
    } catch (err) {
      logger.warn({ err, slug }, 'Failed to persist sync status to Redis');
    }
  }

  private async getSyncStatus(slug: string): Promise<SyncStatusRecord | null> {
    try {
      const raw = await this.redis.get(`${SYNC_STATUS_KEY_PREFIX}${slug}`);
      if (!raw) return null;
      return JSON.parse(raw) as SyncStatusRecord;
    } catch {
      return null;
    }
  }

  private resolvePoolId(pools: YieldPool[], symbol: string, slug: string): string | null {
    const normalizedSymbol = normalizeName(symbol);
    const projectName = YIELD_PROJECT_BY_SLUG[slug] ?? slug;

    let hits = pools.filter((p) => normalizeName(p.symbol) === normalizedSymbol);

    if (hits.length === 0 && normalizedSymbol !== '') {
      hits = pools.filter((p) => normalizeName(p.symbol).includes(normalizedSymbol));
    }

    if (hits.length === 0) {
      const project = normalizeName(projectName);
      hits = pools.filter((p) => normalizeName(p.project) === project);
    }

    if (hits.length === 0) {
      return null;
    }

    const best = hits.reduce((a, b) => (b.tvlUsd > a.tvlUsd ? b : a));
    return best.pool ?? null;
  }

  private async fetchYieldChart(poolId: string): Promise<YieldChartResponse['data']> {
    const cacheKey = `sync:defillama:yields:chart:${poolId}`;
    const cached = await this.getCache<YieldChartResponse['data']>(cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${DEFILLAMA_YIELDS_API}/chart/${encodeURIComponent(poolId)}`;
    const raw = await this.fetchJsonWithRetry<YieldChartResponse>(url);
    const data = Array.isArray(raw.data) ? raw.data : [];
    await this.setCache(cacheKey, data, 600);
    return data;
  }

  private mapDefiLlamaToMarket(raw: DefiLlamaProtocolRaw): UpsertMarketData {
    const tvl = toNumber(raw?.tvl);
    const change7d = toNumber(raw?.change_7d);
    const change1d = toNumber(raw?.change_1d);
    const change30d = toNumber(raw?.change_30d);

    return {
      ...(tvl !== undefined ? { tvl } : {}),
      ...(change7d !== undefined ? { tvl7dChange: change7d } : {}),
      ...(change30d !== undefined ? { tvl30dChange: change30d } : {}),
      ...(change1d !== undefined ? { priceChange24h: change1d } : {}),
      sources: ['defillama'],
      confidence: 'MEDIUM',
    };
  }

  private mapPoolsToYield(
    pools: YieldPool[],
    symbol: string,
    slug: string,
  ): UpsertYieldData | null {
    const normalizedSymbol = normalizeName(symbol);
    const projectName = YIELD_PROJECT_BY_SLUG[slug] ?? slug;

    let hits = pools.filter((p) => normalizeName(p.symbol) === normalizedSymbol);

    if (hits.length === 0 && normalizedSymbol !== '') {
      hits = pools.filter((p) => normalizeName(p.symbol).includes(normalizedSymbol));
    }

    if (hits.length === 0) {
      const project = normalizeName(projectName);
      hits = pools.filter((p) => normalizeName(p.project) === project);
    }

    if (hits.length === 0) {
      return null;
    }

    const best = hits.reduce((a, b) => (b.tvlUsd > a.tvlUsd ? b : a));

    return {
      currentYield: toNumber(best.apy),
      yieldAvg7d: toNumber(best.apyBase) ?? toNumber(best.apy),
      yieldBenchmark: best.apyReward != null ? 'reward+base' : undefined,
    };
  }

  private calculateWeightedRiskScore(subScores: RiskSubScores): number {
    return calculateWeightedRiskScore(subScores);
  }

  private calculateMarketRisk(tvl30dChange: number | null, yieldValues: number[]): number {
    let tvlComponent = 65;
    if (tvl30dChange != null && Number.isFinite(tvl30dChange)) {
      if (tvl30dChange < -20) tvlComponent = 30;
      else if (tvl30dChange < -10) tvlComponent = 45;
      else if (tvl30dChange < 0) tvlComponent = 55;
      else if (tvl30dChange > 5) tvlComponent = 85;
      else tvlComponent = 70;
    }

    const volatility = this.yieldVolatility(yieldValues);
    let volComponent = 75;
    if (volatility > 2) volComponent = 35;
    else if (volatility > 1) volComponent = 50;
    else if (volatility > 0.5) volComponent = 60;

    return Math.round((tvlComponent + volComponent) / 2);
  }

  private calculateConcentrationRisk(holderCount: number | null | undefined): number {
    if (holderCount == null || !Number.isFinite(holderCount)) {
      return 50;
    }
    if (holderCount < 100) return 25;
    if (holderCount < 500) return 45;
    if (holderCount < 2_000) return 60;
    return 80;
  }

  private estimateTvl30dChange(tvlSeries: number[]): number | null {
    if (tvlSeries.length < 2) {
      return null;
    }
    const first = tvlSeries[0]!;
    const last = tvlSeries[tvlSeries.length - 1]!;
    if (!Number.isFinite(first) || first <= 0) {
      return null;
    }
    return ((last - first) / first) * 100;
  }

  private yieldVolatility(values: number[]): number {
    if (values.length < 2) {
      return 0;
    }
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  private scoreToLevel(score: number): string {
    return scoreToRiskLevel(score);
  }

  private async fetchProtocolDetail(slug: string): Promise<DefiLlamaProtocolRaw> {
    const cacheKey = `sync:defillama:protocol:${slug}`;
    const cached = await this.getCache<DefiLlamaProtocolRaw>(cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${DEFILLAMA_API}/protocol/${encodeURIComponent(slug)}`;
    const data = await this.fetchJsonWithRetry<DefiLlamaProtocolRaw>(url);
    await this.setCache(cacheKey, data, 300);
    return data;
  }

  private async fetchYieldPoolsCached(): Promise<YieldPool[]> {
    const cacheKey = 'sync:defillama:yields:pools';
    const cached = await this.getCache<YieldPool[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${DEFILLAMA_YIELDS_API}/pools`;
    const raw = await this.fetchJsonWithRetry<YieldPoolsResponse | YieldPool[]>(url);
    const pools = Array.isArray(raw) ? raw : (raw.data ?? []);
    const valid = pools.filter(
      (p): p is YieldPool =>
        typeof p === 'object' &&
        p !== null &&
        typeof (p as YieldPool).symbol === 'string' &&
        typeof (p as YieldPool).apy === 'number',
    );

    await this.setCache(cacheKey, valid, 300);
    return valid;
  }

  private async fetchJsonWithRetry<T>(url: string, retried = false): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: controller.signal,
      });

      if (res.status === 429) {
        if (!retried) {
          logger.warn({ url }, 'DeFi Llama rate limit (429) — waiting 60s before retry');
          await this.sleep(RATE_LIMIT_WAIT_MS);
          return this.fetchJsonWithRetry<T>(url, true);
        }
        throw new Error('DeFi Llama rate limit exceeded after retry');
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getCache<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private async setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // cache is best-effort
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function createSyncRedis(): Redis {
  try {
    return getRedisClient();
  } catch {
    return new IORedis({
      host: '127.0.0.1',
      port: 6379,
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      retryStrategy: () => null,
      enableOfflineQueue: false,
    });
  }
}

let syncServiceInstance: SyncService | null = null;

export function createSyncService(): SyncService {
  return new SyncService(new AssetRepository(db), createSyncRedis());
}

export function getSyncService(): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = createSyncService();
  }
  return syncServiceInstance;
}

/** @deprecated Use `getSyncService().syncAll()` */
export async function syncAllData(): Promise<{
  synced: number;
  failed: number;
  sources: Record<string, string>;
}> {
  const batch = await getSyncService().syncAll();
  return { synced: batch.success, failed: batch.failed, sources: {} };
}
