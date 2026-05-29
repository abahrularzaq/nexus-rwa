import type { AssetCategory, AssetSummary } from "@/lib/shared";
import {
  HEATMAP_CATEGORIES,
  categoryDisplayLabel,
} from "@/lib/risk-heatmap";

export interface YieldLadderRow {
  id: string;
  name: string;
  symbol: string;
  category: AssetCategory;
  yieldRate: number;
  protocol?: string;
}

export interface YieldLadderGroup {
  category: AssetCategory;
  label: string;
  rows: YieldLadderRow[];
}

function resolveCategory(asset: AssetSummary): AssetCategory {
  const c = asset.category;
  if (c && HEATMAP_CATEGORIES.includes(c)) return c;
  return "TREASURY";
}

function toRow(asset: AssetSummary): YieldLadderRow {
  return {
    id: asset.id,
    name: asset.name,
    symbol: asset.symbol,
    category: resolveCategory(asset),
    yieldRate: Number.isFinite(asset.yieldRate) ? asset.yieldRate : 0,
    protocol: asset.protocol,
  };
}

/** Flat list sorted by yield (desc), optionally truncated. */
export function buildYieldLadderRows(
  assets: AssetSummary[],
  limit?: number,
): YieldLadderRow[] {
  const sorted = [...assets]
    .filter((a) => Number.isFinite(a.yieldRate))
    .sort((a, b) => b.yieldRate - a.yieldRate)
    .map(toRow);
  return limit != null ? sorted.slice(0, limit) : sorted;
}

/** Assets grouped by category; each group sorted by yield (desc). */
export function buildYieldLadderGroups(
  assets: AssetSummary[],
): YieldLadderGroup[] {
  const byCategory = new Map<AssetCategory, YieldLadderRow[]>();

  for (const asset of assets) {
    if (!Number.isFinite(asset.yieldRate)) continue;
    const category = resolveCategory(asset);
    const list = byCategory.get(category) ?? [];
    list.push(toRow(asset));
    byCategory.set(category, list);
  }

  return HEATMAP_CATEGORIES.filter((cat) => (byCategory.get(cat)?.length ?? 0) > 0).map(
    (category) => {
      const rows = (byCategory.get(category) ?? []).sort(
        (a, b) => b.yieldRate - a.yieldRate,
      );
      return {
        category,
        label: categoryDisplayLabel(category),
        rows,
      };
    },
  );
}

/** Simple mean when market overview benchmark is unavailable. */
export function computeYieldBenchmark(assets: AssetSummary[]): number {
  const rates = assets
    .map((a) => a.yieldRate)
    .filter((y) => Number.isFinite(y) && y > 0);
  if (rates.length === 0) return 0;
  return rates.reduce((s, y) => s + y, 0) / rates.length;
}

export const LADDER_CATEGORY_COLORS: Record<AssetCategory, string> = {
  TREASURY: "rgba(232, 163, 23, 0.75)",
  CREDIT: "rgba(96, 165, 250, 0.7)",
  REAL_ESTATE: "rgba(167, 139, 250, 0.7)",
  COMMODITIES: "rgba(251, 146, 60, 0.75)",
  EQUITY: "rgba(52, 211, 153, 0.7)",
};
