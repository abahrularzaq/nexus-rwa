import { ClientError, GraphQLClient } from 'graphql-request';

import { logger } from '../lib/logger.js';

const TIMEOUT_MS = 15_000;

function requestSignal(): AbortSignal {
  return AbortSignal.timeout(TIMEOUT_MS);
}

/** Hosted-service endpoint; newer subgraphs may require a Studio API key. */
export const centrifugeClient = new GraphQLClient(
  'https://api.thegraph.com/subgraphs/name/centrifuge/centrifuge',
);

export const goldfinchClient = new GraphQLClient(
  'https://api.thegraph.com/subgraphs/name/goldfinch-eng/goldfinch',
);

const CENTRIFUGE_POOLS_QUERY = `
  {
    pools(first: 10, orderBy: value, orderDirection: desc) {
      id
      value
      totalBorrowings
      seniorTokenPrice
      juniorTokenPrice
    }
  }
`;

const GOLDFINCH_SENIOR_POOLS_QUERY = `
  {
    seniorPools(first: 1) {
      id
      totalPoolAssets
      estimatedApy
      totalLoansOutstanding
    }
  }
`;

type CentrifugePoolsResponse = {
  pools?: Array<{
    id: string;
    value: string;
    totalBorrowings: string;
    seniorTokenPrice: string;
    juniorTokenPrice: string;
  }>;
};

type GoldfinchSeniorPoolsResponse = {
  seniorPools?: Array<{
    id: string;
    totalPoolAssets: string | number;
    estimatedApy: string | number;
    totalLoansOutstanding: string | number;
  }>;
};

function isAuthOrForbidden(err: unknown): boolean {
  if (err instanceof ClientError) {
    const status = err.response?.status;
    return status === 401 || status === 403;
  }
  return false;
}

function warnTheGraphAuth(err: unknown, context: string): void {
  logger.warn(
    {
      err,
      context,
      todo: 'The Graph Studio API key may be required for this subgraph; set GRAPH_API_KEY / custom URL when available',
    },
    'TODO: The Graph returned 401/403 — add API key or migrate to decentralized network URL',
  );
}

/** Best-effort: sum pool `value` (assumed 18-decimal fixed-point on-chain units). */
function sumPoolValuesUsdApprox(pools: NonNullable<CentrifugePoolsResponse['pools']>): number {
  let sum = 0n;
  for (const p of pools) {
    try {
      sum += BigInt(p.value);
    } catch {
      // ignore malformed row
    }
  }
  return Number(sum) / 1e18;
}

/**
 * Centrifuge subgraph metrics. APY and holder count are not present on the minimal pool query;
 * `apy` is 0 and `holderCount` is 0 until the query is extended.
 */
export async function fetchCentrifugeData(): Promise<{
  tvl: number;
  apy: number;
  holderCount: number;
} | null> {
  try {
    const data = await centrifugeClient.request<CentrifugePoolsResponse>({
      document: CENTRIFUGE_POOLS_QUERY,
      signal: requestSignal(),
    });
    const pools = data.pools;
    if (!pools?.length) {
      logger.warn({ context: 'centrifuge' }, 'The Graph Centrifuge: empty pools list');
      return null;
    }

    const tvl = sumPoolValuesUsdApprox(pools);
    if (!Number.isFinite(tvl) || tvl < 0) {
      logger.warn({ context: 'centrifuge', tvl }, 'The Graph Centrifuge: invalid TVL aggregate');
      return null;
    }

    return {
      tvl,
      apy: 0,
      holderCount: 0,
    };
  } catch (err) {
    if (isAuthOrForbidden(err)) {
      warnTheGraphAuth(err, 'fetchCentrifugeData');
      return null;
    }
    logger.warn({ err, context: 'centrifuge' }, 'The Graph Centrifuge fetch failed');
    return null;
  }
}

function parseGoldfinchApy(raw: string | number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  // Many Goldfinch subgraphs store APY as decimal (e.g. 0.12) or basis points; normalize if huge.
  if (n > 1000) return n / 10_000;
  if (n > 100 && n <= 1000) return n / 100;
  return n * 100 <= 100 && n <= 1 ? n * 100 : n;
}

function parseUsdc6(raw: string | number): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 1e12 ? raw / 1e6 : raw;
  }
  try {
    return Number(BigInt(String(raw))) / 1e6;
  } catch {
    const f = Number(raw);
    return Number.isFinite(f) ? f : 0;
  }
}

export async function fetchGoldfinchData(): Promise<{
  tvl: number;
  apy: number;
} | null> {
  try {
    const data = await goldfinchClient.request<GoldfinchSeniorPoolsResponse>({
      document: GOLDFINCH_SENIOR_POOLS_QUERY,
      signal: requestSignal(),
    });
    const pool = data.seniorPools?.[0];
    if (!pool) {
      logger.warn({ context: 'goldfinch' }, 'The Graph Goldfinch: no senior pool');
      return null;
    }

    const tvl = parseUsdc6(pool.totalPoolAssets);
    const apy = parseGoldfinchApy(pool.estimatedApy);

    if (!Number.isFinite(tvl) || tvl < 0) {
      logger.warn({ context: 'goldfinch', tvl }, 'The Graph Goldfinch: invalid TVL');
      return null;
    }

    return { tvl, apy: Number.isFinite(apy) ? apy : 0 };
  } catch (err) {
    if (isAuthOrForbidden(err)) {
      warnTheGraphAuth(err, 'fetchGoldfinchData');
      return null;
    }
    logger.warn({ err, context: 'goldfinch' }, 'The Graph Goldfinch fetch failed');
    return null;
  }
}
