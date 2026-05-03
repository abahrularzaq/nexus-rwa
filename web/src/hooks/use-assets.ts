import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { Asset, PaginatedResponse } from '@/lib/shared';

export function useAssets(params?: { page?: number; limit?: number; category?: string }) {
  const query = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 20),
    ...(params?.category && { category: params.category }),
  });

  return useQuery({
    queryKey: ['assets', params],
    queryFn: () => apiFetch<PaginatedResponse<Asset>>(`/v1/assets?${query}`),
    staleTime: 2 * 60 * 1000, // 2 menit
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => apiFetch<Asset>(`/v1/assets/${id}`),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}