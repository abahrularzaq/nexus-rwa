import { logger } from './logger.js';

const RWA_XYZ_API_BASE = 'https://api.rwa.xyz';
const FETCH_TIMEOUT_MS = 10_000;
const TVL_GAP_FLAG_PCT = 5;
const TVL_GAP_HIGH_CONFIDENCE_PCT = 2;

export interface DataSource {
  id: string;
  name: string;
  url: string;
  reliability: number;
  lastFetched: Date;
}

export const DATA_SOURCE_CATALOG: Record<
  string,
  Omit<DataSource, 'lastFetched'>
> = {
  defillama: {
    id: 'defillama',
    name: 'DeFi Llama',
    url: 'https://defillama.com',
    reliability: 85,
  },
  rwa_xyz: {
    id: 'rwa_xyz',
    name: 'rwa.xyz',
    url: 'https://rwa.xyz',
    reliability: 90,
  },
  onchain: {
    id: 'onchain',
    name: 'On-chain',
    url: 'https://etherscan.io',
    reliability: 95,
  },
};

export type DataConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AssetDataMeta {
  sources: string[];
  lastUpdated: string;
  confidence: DataConfidence;
  methodology: string;
}

export interface RwaXyzAssetData {
  tvl: number;
  yield: number;
  holders: number;
  metadata: Record<string, unknown>;
}

export interface DefiLlamaSourceInput {
  tvl?: number | null;
  yield?: number | null;
  holders?: number | null;
}

export interface MergedAssetData {
  tvl: number;
  yield: number;
  holders: number;
  sources: string[];
  confidence: DataConfidence;
  methodology: string;
  singleSource: boolean;
  tvlGapFlag: boolean;
  tvlGapPct: number | null;
}

type AssetMetaRow = {
  dataSources: string[];
  dataConfidence: string | null;
  dataMethodology: string | null;
  dataSourcesUpdatedAt: Date | null;
  updatedAt: Date;
  snapshots?: { timestamp: Date }[];
};

function hasNumericSource(
  data: DefiLlamaSourceInput | RwaXyzAssetData | null | undefined,
): boolean {
  if (!data) return false;
  const tvl = 'tvl' in data ? data.tvl : undefined;
  const y = 'yield' in data ? data.yield : undefined;
  const h = 'holders' in data ? data.holders : undefined;
  return (
    (typeof tvl === 'number' && Number.isFinite(tvl) && tvl > 0) ||
    (typeof y === 'number' && Number.isFinite(y)) ||
    (typeof h === 'number' && Number.isFinite(h) && h >= 0)
  );
}

function pctGap(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  const avg = (Math.abs(a) + Math.abs(b)) / 2;
  if (avg <= 0) return a !== b ? 100 : 0;
  return (Math.abs(a - b) / avg) * 100;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return undefined;
}

function averageDefined(a: number | undefined, b: number | undefined, fallback = 0): number {
  const vals = [a, b].filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (vals.length === 0) return fallback;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

/**
 * Merge DeFi Llama + rwa.xyz payloads into a single metrics view with confidence scoring.
 */
export function mergeDataSources(
  defillama: DefiLlamaSourceInput | null | undefined,
  rwaXyz: RwaXyzAssetData | null | undefined,
): MergedAssetData {
  const hasLlama = hasNumericSource(defillama ?? null);
  const hasRwa = hasNumericSource(rwaXyz ?? null);

  const llamaTvl = defillama?.tvl ?? undefined;
  const llamaYield = defillama?.yield ?? undefined;
  const llamaHolders = defillama?.holders ?? undefined;

  const rwaTvl = rwaXyz?.tvl;
  const rwaYield = rwaXyz?.yield;
  const rwaHolders = rwaXyz?.holders;

  if (hasLlama && hasRwa) {
    const tvlGapPct = pctGap(llamaTvl ?? 0, rwaTvl ?? 0);
    const tvlGapFlag = tvlGapPct > TVL_GAP_FLAG_PCT;
    const confidence: DataConfidence =
      tvlGapPct <= TVL_GAP_HIGH_CONFIDENCE_PCT
        ? 'HIGH'
        : tvlGapPct <= TVL_GAP_FLAG_PCT
          ? 'MEDIUM'
          : 'LOW';

    const deltaLabel = tvlGapPct.toFixed(1);
    const methodology = tvlGapFlag
      ? `TVL averaged from 2 sources, delta ${deltaLabel}% (>5% flag)`
      : `TVL averaged from 2 sources, delta < ${TVL_GAP_HIGH_CONFIDENCE_PCT}%`;

    return {
      tvl: averageDefined(llamaTvl, rwaTvl),
      yield: averageDefined(llamaYield, rwaYield),
      holders: Math.round(averageDefined(llamaHolders, rwaHolders)),
      sources: ['defillama', 'rwa_xyz'],
      confidence,
      methodology,
      singleSource: false,
      tvlGapFlag,
      tvlGapPct,
    };
  }

  if (hasLlama) {
    return {
      tvl: llamaTvl ?? 0,
      yield: llamaYield ?? 0,
      holders: Math.round(llamaHolders ?? 0),
      sources: ['defillama'],
      confidence: 'MEDIUM',
      methodology: 'TVL from DeFi Llama only (single_source)',
      singleSource: true,
      tvlGapFlag: false,
      tvlGapPct: null,
    };
  }

  if (hasRwa) {
    return {
      tvl: rwaTvl ?? 0,
      yield: rwaYield ?? 0,
      holders: Math.round(rwaHolders ?? 0),
      sources: ['rwa_xyz'],
      confidence: 'MEDIUM',
      methodology: 'TVL from rwa.xyz only (single_source)',
      singleSource: true,
      tvlGapFlag: false,
      tvlGapPct: null,
    };
  }

  return {
    tvl: 0,
    yield: 0,
    holders: 0,
    sources: [],
    confidence: 'LOW',
    methodology: 'No external source data available',
    singleSource: true,
    tvlGapFlag: false,
    tvlGapPct: null,
  };
}

export function mergedToAssetMeta(
  merged: MergedAssetData,
  lastUpdated: Date = new Date(),
): AssetDataMeta {
  return {
    sources: merged.sources.length > 0 ? merged.sources : ['defillama'],
    lastUpdated: lastUpdated.toISOString(),
    confidence: merged.confidence,
    methodology: merged.methodology,
  };
}

/** Resolve `_meta` for API responses from persisted asset fields or snapshot fallback. */
export function resolveAssetMeta(row: AssetMetaRow): AssetDataMeta {
  if (row.dataSources.length > 0 && row.dataConfidence) {
    return {
      sources: row.dataSources,
      lastUpdated: (row.dataSourcesUpdatedAt ?? row.updatedAt).toISOString(),
      confidence: row.dataConfidence as DataConfidence,
      methodology: row.dataMethodology ?? 'Multi-source metrics',
    };
  }

  const snapTs = row.snapshots?.[0]?.timestamp;
  return {
    sources: ['defillama'],
    lastUpdated: (snapTs ?? row.updatedAt).toISOString(),
    confidence: 'MEDIUM',
    methodology: 'Latest snapshot from DeFi Llama sync (single_source)',
  };
}

export function sourceDisplayName(sourceId: string): string {
  return DATA_SOURCE_CATALOG[sourceId]?.name ?? sourceId;
}

async function fetchRwaXyzJson<T>(url: string, apiKey: string | undefined): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (apiKey) {
      headers.authorization = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      logger.debug({ status: res.status, url }, 'rwa.xyz request failed');
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    logger.debug({ err, url }, 'rwa.xyz fetch error');
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseRwaTokenRow(row: Record<string, unknown>): RwaXyzAssetData | null {
  const tvl = pickNumber(row, [
    'market_value_dollar',
    'circulating_market_value_dollar',
    'tvl_dollar',
    'tvl',
  ]);
  const yieldRate = pickNumber(row, ['apy', 'current_apy', 'yield_rate', 'yield']);
  const holders = pickNumber(row, [
    'holder_count',
    'holders',
    'unique_holders',
    'total_holders',
  ]);

  if (tvl === undefined && yieldRate === undefined && holders === undefined) {
    return null;
  }

  return {
    tvl: tvl ?? 0,
    yield: yieldRate ?? 0,
    holders: holders ?? 0,
    metadata: row,
  };
}

/**
 * Fetch rwa.xyz token metrics by symbol. Returns null on failure (never throws).
 */
export async function fetchFromRwaXyz(assetSymbol: string): Promise<RwaXyzAssetData | null> {
  const symbol = assetSymbol.trim();
  if (!symbol) return null;

  const apiKey = process.env.RWA_XYZ_API_KEY?.trim();
  const query = {
    filter: {
      operator: 'equals',
      field: 'ticker',
      value: symbol.toUpperCase(),
    },
    pagination: { page: 1, perPage: 1 },
  };

  const queryParam = encodeURIComponent(JSON.stringify(query));
  const url = `${RWA_XYZ_API_BASE}/v4/tokens?query=${queryParam}`;

  const payload = await fetchRwaXyzJson<{ data?: unknown[] }>(url, apiKey);
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const first = rows[0];
  if (!first || typeof first !== 'object') {
    return null;
  }

  return parseRwaTokenRow(first as Record<string, unknown>);
}

export function withAssetMeta<T extends object>(
  payload: T,
  meta: AssetDataMeta,
): T & { _meta: AssetDataMeta } {
  return { ...payload, _meta: meta };
}
