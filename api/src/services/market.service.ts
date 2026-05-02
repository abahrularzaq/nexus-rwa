import type { MarketOverview } from '@nexus-rwa/shared';
import { CACHE_TTL } from '@nexus-rwa/shared';
import { getCached } from '../lib/redis.js';
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
