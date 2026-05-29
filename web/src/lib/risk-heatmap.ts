import type { AssetCategory, AssetSummary, ComputedRiskLevel, RiskLevel } from "@/lib/shared";

export const HEATMAP_CATEGORIES: AssetCategory[] = [
  "TREASURY",
  "CREDIT",
  "REAL_ESTATE",
  "COMMODITIES",
  "EQUITY",
];

export const HEATMAP_RISK_LEVELS: ComputedRiskLevel[] = ["LOW", "MEDIUM", "HIGH"];

export interface HeatmapCell {
  category: AssetCategory;
  riskLevel: ComputedRiskLevel;
  count: number;
  avgYield: number | null;
  /** 0–1 relative to max non-zero count in the matrix */
  intensity: number;
}

export interface HeatmapMatrix {
  categories: AssetCategory[];
  riskLevels: ComputedRiskLevel[];
  cells: HeatmapCell[][];
  maxCount: number;
  totalAssets: number;
}

export function normalizeHeatmapRisk(level: RiskLevel | string | undefined): ComputedRiskLevel {
  const u = String(level ?? "MEDIUM").toUpperCase();
  if (u === "LOW") return "LOW";
  if (u === "HIGH" || u === "CRITICAL") return "HIGH";
  return "MEDIUM";
}

export function categoryDisplayLabel(category: AssetCategory): string {
  return category
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function resolveCategory(raw: AssetSummary): AssetCategory {
  const c = raw.category;
  if (c && HEATMAP_CATEGORIES.includes(c)) return c;
  return "TREASURY";
}

export function buildHeatmapMatrix(assets: AssetSummary[]): HeatmapMatrix {
  const buckets = new Map<string, { count: number; yieldSum: number }>();

  for (const asset of assets) {
    const category = resolveCategory(asset);
    const riskLevel = normalizeHeatmapRisk(asset.riskScore);
    const key = `${category}:${riskLevel}`;
    const prev = buckets.get(key) ?? { count: 0, yieldSum: 0 };
    buckets.set(key, {
      count: prev.count + 1,
      yieldSum: prev.yieldSum + (Number.isFinite(asset.yieldRate) ? asset.yieldRate : 0),
    });
  }

  let maxCount = 0;
  const cells: HeatmapCell[][] = HEATMAP_CATEGORIES.map((category) =>
    HEATMAP_RISK_LEVELS.map((riskLevel) => {
      const bucket = buckets.get(`${category}:${riskLevel}`);
      const count = bucket?.count ?? 0;
      if (count > maxCount) maxCount = count;
      const avgYield =
        count > 0 && bucket ? bucket.yieldSum / count : null;
      return {
        category,
        riskLevel,
        count,
        avgYield,
        intensity: 0,
      };
    }),
  );

  for (const row of cells) {
    for (const cell of row) {
      cell.intensity = maxCount > 0 && cell.count > 0 ? cell.count / maxCount : 0;
    }
  }

  return {
    categories: HEATMAP_CATEGORIES,
    riskLevels: HEATMAP_RISK_LEVELS,
    cells,
    maxCount,
    totalAssets: assets.length,
  };
}

export type HeatmapFilter = {
  category: AssetCategory;
  riskLevel: ComputedRiskLevel;
} | null;

export function filterAssetsByHeatmapCell(
  assets: AssetSummary[],
  filter: HeatmapFilter,
): AssetSummary[] {
  if (!filter) return assets;
  return assets.filter(
    (a) =>
      resolveCategory(a) === filter.category &&
      normalizeHeatmapRisk(a.riskScore) === filter.riskLevel,
  );
}
