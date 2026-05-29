import { useQuery } from '@tanstack/react-query';
import { fetchAsset, fetchAssetList } from '@/lib/api/assets';

export function useAssets(params?: { page?: number; limit?: number; category?: string }) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: () =>
      fetchAssetList({
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        category: params?.category,
      }),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAsset(slug: string) {
  return useQuery({
    queryKey: ['asset', slug],
    queryFn: () => fetchAsset(slug),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(slug),
  });
}