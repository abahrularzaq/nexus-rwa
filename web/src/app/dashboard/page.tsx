import { DashboardClient, type AssetRow } from "./DashboardClient";
import { parseAssetList, toAssetSummaries } from "@/lib/asset-mapper";
import type { ApiResponse, MarketOverview } from "@/lib/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function apiBase(): string {
  return API_URL.trim().replace(/\/$/, "");
}

function parseOverviewPayload(data: MarketOverview): MarketOverview {
  return {
    ...data,
    updatedAt: new Date(data.updatedAt as unknown as string),
    topGainers: data.topGainers ?? [],
    topLosers: data.topLosers ?? [],
  };
}

async function fetchInitialMarketOverview(): Promise<MarketOverview> {
  const res = await fetch(`${apiBase()}/v1/market/overview`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const body = (await res.json()) as ApiResponse<MarketOverview>;
  if (!res.ok || !body.success) {
    const msg =
      body.success === false
        ? body.error.message
        : res.statusText || "Request failed";
    throw new Error(msg);
  }
  return parseOverviewPayload(body.data);
}

async function fetchInitialAssetsList(): Promise<AssetRow[]> {
  const query = new URLSearchParams({ page: "1", limit: "20" });
  const res = await fetch(`${apiBase()}/v1/assets?${query}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const body = (await res.json()) as ApiResponse<{
    data: Record<string, unknown>[];
  }>;
  if (!res.ok || !body.success) {
    const msg =
      body.success === false
        ? body.error.message
        : res.statusText || "Request failed";
    throw new Error(msg);
  }
  return toAssetSummaries(parseAssetList(body.data.data)) as AssetRow[];
}

async function settle<T>(
  promise: Promise<T>,
): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await promise, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default async function DashboardPage() {
  const [overview, assets] = await Promise.all([
    settle(fetchInitialMarketOverview()),
    settle(fetchInitialAssetsList()),
  ]);

  return (
    <DashboardClient
      initialOverview={overview.data}
      initialOverviewError={overview.error}
      initialAssetsRows={assets.data ?? []}
      initialAssetsError={assets.error}
    />
  );
}
