import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { CACHE_TTL, type MarketOverview } from '@/lib/shared';

export function useMarketOverview() {
  return useQuery({
    queryKey: ['market', 'overview'],
    queryFn: () => apiFetch<MarketOverview>('/v1/market/overview'),
    staleTime: CACHE_TTL.MARKET_OVERVIEW * 1000,
    refetchInterval: CACHE_TTL.MARKET_OVERVIEW * 1000, // auto refresh
  });
}