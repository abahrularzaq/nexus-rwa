import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { MarketOverview } from '@nexus-rwa/shared';
import { CACHE_TTL } from '@nexus-rwa/shared';

export function useMarketOverview() {
  return useQuery({
    queryKey: ['market', 'overview'],
    queryFn: () => apiFetch<MarketOverview>('/v1/market/overview'),
    staleTime: CACHE_TTL.MARKET_OVERVIEW * 1000,
    refetchInterval: CACHE_TTL.MARKET_OVERVIEW * 1000, // auto refresh
  });
}