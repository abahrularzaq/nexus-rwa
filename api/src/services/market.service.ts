import type { MarketBrief, MarketOverview } from '../shared/index.js';
import { CACHE_TTL } from '../shared/index.js';
import { getCached } from '../lib/redis.js';
import { getMarketBrief as fetchMarketBrief } from '../lib/marketBrief.js';
import * as marketRepo from '../repositories/market.repo.js';

const CACHE_KEY = 'nexus:v1:market:overview';

function reviveMarketOverview(raw: MarketOverview): MarketOverview {
  return {
    ...raw,
    updatedAt: new Date(raw.updatedAt as unknown as string | number | Date),
  };
}

/** Market overview from DB via repository, cached in Redis. */
export async function getMarketOverview(): Promise<{
  data: MarketOverview;
  cached: boolean;
}> {
  const { data, cached } = await getCached(
    CACHE_KEY,
    () => marketRepo.getMarketOverview(),
    CACHE_TTL.MARKET_OVERVIEW,
  );
  return { data: reviveMarketOverview(data), cached };
}

/** AI market brief (Claude + Redis cache, static fallback if AI unavailable). */
export async function getMarketBrief(): Promise<{
  data: MarketBrief;
  cached: boolean;
}> {
  return fetchMarketBrief();
}
