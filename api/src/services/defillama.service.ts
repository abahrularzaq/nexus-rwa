import { logger } from '../lib/logger.js';

const DEFILLAMA_API_BASE_URL = 'https://api.llama.fi';
const DEFILLAMA_YIELDS_API_BASE_URL = 'https://yields.llama.fi';
const TIMEOUT_MS = 10_000;

/**
 * Mapping internal protocol key -> DeFi Llama protocol slug.
 */
export const PROTOCOL_SLUGS: Record<string, string> = {
  'ondo-usdy': 'ondo-finance',
  'ondo-ousg': 'ondo-finance',
  'maple-usdc': 'maple-finance',
  'centrifuge-drop': 'centrifuge',
  'backed-buidl': 'backed-finance',
  'openedon-ousg': 'openeden',
  'realt-token': 'realt',
  'goldfinch-gfi': 'goldfinch',
};

export interface DefiLlamaProtocol {
  slug: string;
  name: string;
  tvl: number;
  chainTvls: Record<string, number>;
  change1d: number | null;
  change7d: number | null;
}

async function fetchJsonWithTimeout<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export interface YieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  pool: string;
}

type DefiLlamaYieldPoolsResponse = {
  status?: string;
  data?: YieldPool[];
};

function isYieldPool(x: unknown): x is YieldPool {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.chain === 'string' &&
    typeof o.project === 'string' &&
    typeof o.symbol === 'string' &&
    typeof o.tvlUsd === 'number' &&
    typeof o.apy === 'number' &&
    typeof o.pool === 'string' &&
    (o.apyBase === null || typeof o.apyBase === 'number') &&
    (o.apyReward === null || typeof o.apyReward === 'number')
  );
}

function matchesRwaKeywords(pool: YieldPool): boolean {
  const hay = `${pool.project} ${pool.symbol} ${pool.chain}`.toLowerCase();
  const keywords = ['ondo', 'maple', 'centrifuge', 'backed', 'openeden', 'goldfinch'];
  return keywords.some((k) => hay.includes(k));
}

/**
 * Sumber data: DeFi Llama yields API (`GET https://yields.llama.fi/pools`).
 */
export async function fetchYieldPools(): Promise<YieldPool[]> {
  try {
    const url = `${DEFILLAMA_YIELDS_API_BASE_URL}/pools`;
    const raw = await fetchJsonWithTimeout<DefiLlamaYieldPoolsResponse | YieldPool[] | unknown>(url);

    const pools: unknown =
      Array.isArray(raw) ? raw : typeof raw === 'object' && raw !== null ? (raw as DefiLlamaYieldPoolsResponse).data : [];

    if (!Array.isArray(pools)) {
      return [];
    }

    return pools.filter(isYieldPool).filter(matchesRwaKeywords);
  } catch (err) {
    logger.warn({ err }, 'DeFi Llama yield pools fetch failed');
    return [];
  }
}

export async function getYieldForProtocol(protocolName: string): Promise<number | null> {
  const pools = await fetchYieldPools();
  const target = protocolName.trim().toLowerCase();
  if (target === '') return null;

  const hits = pools.filter((p) => p.project.toLowerCase() === target);
  if (hits.length === 0) {
    return null;
  }

  const best = hits.reduce((a, b) => (b.tvlUsd > a.tvlUsd ? b : a));
  return typeof best.apy === 'number' && Number.isFinite(best.apy) ? best.apy : null;
}

/**
 * Sumber data: DeFi Llama public API (`GET /tvl/{slug}`).
 */
export async function fetchProtocolTvl(slug: string): Promise<number | null> {
  try {
    const url = `${DEFILLAMA_API_BASE_URL}/tvl/${encodeURIComponent(slug)}`;
    const raw = await fetchJsonWithTimeout<unknown>(url);

    // Response biasanya berupa number langsung, tapi kita handle defensively.
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw;
    }

    if (typeof raw === 'string') {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Sumber data: DeFi Llama public API (`GET /tvl/{slug}`) untuk setiap slug RWA yang kita track.
 */
export async function fetchAllRwaTvl(): Promise<Record<string, number>> {
  const entries = Object.entries(PROTOCOL_SLUGS);

  const results = await Promise.all(
    entries.map(async ([protocolKey, slug]) => {
      const tvl = await fetchProtocolTvl(slug);
      if (tvl === null) {
        logger.warn({ protocolKey, slug }, 'DeFi Llama TVL fetch failed');
        return [protocolKey, null] as const;
      }
      return [protocolKey, tvl] as const;
    }),
  );

  const out: Record<string, number> = {};
  for (const [protocolKey, tvl] of results) {
    if (typeof tvl === 'number') {
      out[protocolKey] = tvl;
    }
  }
  return out;
}

export type DefiLlamaProtocolDetail = {
  tvl: number;
  change1d: number | null;
  change7d: number | null;
  chainTvls: Record<string, number>;
};

type DefiLlamaProtocolResponse = {
  tvl?: number;
  change_1d?: number;
  change_7d?: number;
  chainTvls?: Record<string, number>;
};

/**
 * Sumber data: DeFi Llama public API (`GET /protocol/{slug}`).
 */
export async function fetchProtocolDetail(slug: string): Promise<DefiLlamaProtocolDetail> {
  try {
    const url = `${DEFILLAMA_API_BASE_URL}/protocol/${encodeURIComponent(slug)}`;
    const data = await fetchJsonWithTimeout<DefiLlamaProtocolResponse>(url);

    return {
      tvl: typeof data.tvl === 'number' && Number.isFinite(data.tvl) ? data.tvl : 0,
      change1d:
        typeof data.change_1d === 'number' && Number.isFinite(data.change_1d) ? data.change_1d : null,
      change7d:
        typeof data.change_7d === 'number' && Number.isFinite(data.change_7d) ? data.change_7d : null,
      chainTvls: data.chainTvls && typeof data.chainTvls === 'object' ? data.chainTvls : {},
    };
  } catch (err) {
    logger.warn({ err, slug }, 'DeFi Llama protocol detail fetch failed');
    return { tvl: 0, change1d: null, change7d: null, chainTvls: {} };
  }
}

