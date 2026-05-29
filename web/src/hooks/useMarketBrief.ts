import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { CACHE_TTL, type MarketBrief } from '@/lib/shared';

export function useMarketBrief() {
  return useQuery({
    queryKey: ['market', 'brief'],
    queryFn: async (): Promise<MarketBrief> => {
      const res = await apiFetch<MarketBrief>('/v1/market/brief');
      if (!res.success) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
    staleTime: CACHE_TTL.MARKET_BRIEF * 1000,
    refetchInterval: CACHE_TTL.MARKET_BRIEF * 1000,
  });
}
