import { useQuery } from "@tanstack/react-query";
import { fetchAssetList } from "@/lib/api/assets";
import { toAssetSummaries } from "@/lib/asset-mapper";
import { PAGINATION, type AssetSummary } from "@/lib/shared";

export function useAssetSummaries() {
  return useQuery({
    queryKey: ["assets", "summaries-all"],
    queryFn: async (): Promise<AssetSummary[]> => {
      const { assets } = await fetchAssetList({
        limit: PAGINATION.MAX_LIMIT,
        page: 1,
      });
      return toAssetSummaries(assets);
    },
    staleTime: 2 * 60 * 1000,
  });
}
