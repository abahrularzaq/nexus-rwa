import { apiFetch } from "@/lib/api-client";
import { parseAssetList, parseAssetWithLayers } from "@/lib/asset-mapper";
import type { PaginatedResponse } from "@/lib/shared";
import type { AssetWithLayers } from "@/types/asset";

export type RiskColor = "green" | "yellow" | "red" | "gray";

/** Format TVL in USD; em dash when missing. */
export function formatTvl(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

/** Format APY percent (API stores percent e.g. 5.2 = 5.2%). */
export function formatYield(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}

export function getRiskColor(level?: string | null): RiskColor {
  const u = (level ?? "").toUpperCase();
  if (u === "LOW") return "green";
  if (u === "MEDIUM") return "yellow";
  if (u === "HIGH" || u === "CRITICAL") return "red";
  return "gray";
}

export function riskColorClass(color: RiskColor): string {
  switch (color) {
    case "green":
      return "text-[#00FF88]";
    case "yellow":
      return "text-[#FFB800]";
    case "red":
      return "text-[#FF4444]";
    default:
      return "text-[#8892A4]";
  }
}

function apiKeyHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const apiKey = localStorage.getItem("nexus_api_key");
  return apiKey ? { "X-API-Key": apiKey } : {};
}

export async function fetchAssetList(params?: {
  page?: number;
  limit?: number;
  category?: string;
}): Promise<{ assets: AssetWithLayers[]; total: number }> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(params?.category ? { category: params.category } : {}),
  });

  const res = await apiFetch<PaginatedResponse<Record<string, unknown>>>(
    `/v1/assets?${query}`,
  );
  if (!res.success) {
    throw new Error(res.error.message);
  }
  const assets = parseAssetList(res.data.data);
  return { assets, total: res.data.pagination.total };
}

export async function fetchAsset(slug: string): Promise<AssetWithLayers> {
  const res = await apiFetch<Record<string, unknown>>(`/v1/assets/${slug}`);
  if (!res.success) {
    throw new Error(res.error.message);
  }
  return parseAssetWithLayers(res.data);
}

export async function fetchAssetFull(slug: string): Promise<AssetWithLayers> {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");
  const res = await fetch(`${base}/v1/assets/${slug}/full`, {
    headers: { Accept: "application/json", ...apiKeyHeader() },
  });
  const json = (await res.json()) as {
    success?: boolean;
    data?: Record<string, unknown>;
    error?: { message?: string };
  };
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error?.message ?? "Failed to load full asset");
  }
  return parseAssetWithLayers(json.data);
}

export { apiKeyHeader };
