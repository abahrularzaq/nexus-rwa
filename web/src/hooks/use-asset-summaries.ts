import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { PAGINATION, type AssetSummary, type PaginatedResponse } from "@/lib/shared";

export function useAssetSummaries() {
  return useQuery({
    queryKey: ["assets", "summaries-all"],
    queryFn: async (): Promise<AssetSummary[]> => {
      const res = await apiFetch<PaginatedResponse<AssetSummary>>(
        `/v1/assets?limit=${PAGINATION.MAX_LIMIT}&page=1`,
      );
      if (!res.success) {
        throw new Error(res.error.message);
      }
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
