"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { useAssetSummaries } from "@/hooks/use-asset-summaries";
import {
  buildHeatmapMatrix,
  categoryDisplayLabel,
  type HeatmapCell,
  type HeatmapFilter,
  type HeatmapMatrix,
} from "@/lib/risk-heatmap";
import type { AssetSummary } from "@/lib/shared";
import { formatYield } from "@/lib/shared";

function cellBackground(cell: HeatmapCell, selected: boolean): string {
  if (cell.count === 0) {
    return "rgba(13, 18, 31, 0.9)";
  }
  const base =
    cell.riskLevel === "LOW"
      ? "61, 154, 110"
      : cell.riskLevel === "MEDIUM"
        ? "232, 163, 23"
        : "196, 92, 92";
  const alpha = 0.12 + cell.intensity * 0.55;
  if (selected) {
    return `rgba(${base}, ${Math.min(alpha + 0.2, 0.92)})`;
  }
  return `rgba(${base}, ${alpha})`;
}

function HeatmapGrid({
  matrix,
  compact,
  selected,
  onSelectCell,
}: {
  matrix: HeatmapMatrix;
  compact?: boolean;
  selected: HeatmapFilter;
  onSelectCell?: (filter: HeatmapFilter) => void;
}) {
  const cellMinH = compact ? "min-h-[44px]" : "min-h-[56px]";
  const interactive = Boolean(onSelectCell);

  return (
    <div
      className="overflow-x-auto"
      role="grid"
      aria-label="Cross-asset risk matrix by category and risk level"
    >
      <div
        className="inline-grid min-w-full gap-1"
        style={{
          gridTemplateColumns: `minmax(5.5rem, 7rem) repeat(${matrix.riskLevels.length}, minmax(4.5rem, 1fr))`,
        }}
      >
        <div className="terminal-label flex items-end px-1 pb-1">Category</div>
        {matrix.riskLevels.map((level) => (
          <div
            key={level}
            className="terminal-label flex items-end justify-center px-1 pb-1 text-center"
          >
            {level}
          </div>
        ))}

        {matrix.cells.map((row) => {
          const category = row[0]?.category;
          if (!category) return null;
          return (
            <div key={category} className="contents">
              <div className="terminal-label flex items-center px-1 text-[10px] leading-tight">
                {categoryDisplayLabel(category)}
              </div>
              {row.map((cell) => {
                const isSelected =
                  selected?.category === cell.category &&
                  selected?.riskLevel === cell.riskLevel;
                const title =
                  cell.count === 0
                    ? `${categoryDisplayLabel(cell.category)} · ${cell.riskLevel}: no assets`
                    : `${categoryDisplayLabel(cell.category)} · ${cell.riskLevel}: ${cell.count} asset(s), avg yield ${cell.avgYield != null ? formatYield(cell.avgYield * 100) : "—"}`;

                const inner = (
                  <>
                    <span className="terminal-data text-base font-semibold leading-none">
                      {cell.count}
                    </span>
                    {cell.count > 0 && cell.avgYield != null ? (
                      <span className="mt-1 block font-mono text-[9px] tabular-nums text-[var(--text-secondary)]">
                        {formatYield(cell.avgYield * 100)}
                      </span>
                    ) : (
                      <span className="mt-1 block font-mono text-[9px] text-[var(--text-label)]">
                        —
                      </span>
                    )}
                  </>
                );

                const className = `${cellMinH} rounded border px-2 py-2 text-center transition-colors ${
                  cell.count === 0
                    ? "border-[var(--border-panel)]"
                    : "border-transparent"
                } ${interactive && cell.count > 0 ? "cursor-pointer hover:ring-1 hover:ring-[var(--accent-amber)]/40" : ""} ${
                  isSelected ? "ring-1 ring-[var(--accent-amber)]" : ""
                }`;

                const style = { backgroundColor: cellBackground(cell, isSelected) };

                if (interactive && cell.count > 0) {
                  return (
                    <button
                      key={`${cell.category}-${cell.riskLevel}`}
                      type="button"
                      title={title}
                      className={className}
                      style={style}
                      aria-pressed={isSelected}
                      onClick={() => {
                        if (!onSelectCell) return;
                        onSelectCell(
                          isSelected
                            ? null
                            : { category: cell.category, riskLevel: cell.riskLevel },
                        );
                      }}
                    >
                      {inner}
                    </button>
                  );
                }

                return (
                  <div
                    key={`${cell.category}-${cell.riskLevel}`}
                    title={title}
                    className={className}
                    style={style}
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeatmapSkeleton({ compact }: { compact?: boolean }) {
  const rows = compact ? 4 : 5;
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`grid grid-cols-4 gap-1 ${compact ? "h-11" : "h-14"}`}
        >
          {Array.from({ length: 4 }).map((__, j) => (
            <div
              key={j}
              className="animate-pulse rounded bg-[rgba(30,42,58,0.55)]"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export type RiskHeatmapProps = {
  /** When omitted, loads via useAssetSummaries */
  assets?: AssetSummary[];
  compact?: boolean;
  showFooterLink?: boolean;
  selected?: HeatmapFilter;
  onSelectCell?: (filter: HeatmapFilter) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function RiskHeatmap({
  assets: assetsProp,
  compact = false,
  showFooterLink = false,
  selected = null,
  onSelectCell,
  isLoading: isLoadingProp,
  error: errorProp,
  onRetry,
}: RiskHeatmapProps) {
  const query = useAssetSummaries();
  const assets = assetsProp ?? query.data ?? [];
  const isLoading = isLoadingProp ?? (assetsProp == null && query.isLoading);
  const error =
    errorProp ??
    (assetsProp == null && query.isError
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load assets"
      : null);

  const matrix = useMemo(() => buildHeatmapMatrix(assets), [assets]);

  const handleRetry = onRetry ?? (() => void query.refetch());

  return (
    <section className="terminal-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="terminal-label">Risk concentration</p>
          <h2 className="mt-1 text-base font-semibold text-white">
            {compact ? "Risk heatmap" : "Risk concentration map"}
          </h2>
          {!compact ? (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Identify where risk clusters across RWA categories. Cell intensity shows
              relative asset count; click a populated cell to isolate assets that need review.
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Concentration by category and risk band.
            </p>
          )}
        </div>
        {!isLoading && !error ? (
          <span className="terminal-label rounded border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2 py-1">
            {matrix.totalAssets} assets
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        {error ? (
          <div className="flex flex-col gap-3 rounded-lg border border-[rgba(255,68,68,0.35)] bg-[rgba(255,68,68,0.06)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-amber)]/35 bg-[var(--accent-amber-dim)] px-3 py-1.5 text-sm font-medium text-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/20"
            >
              <RefreshCw className="size-4" />
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <HeatmapSkeleton compact={compact} />
        ) : (
          <HeatmapGrid
            matrix={matrix}
            compact={compact}
            selected={selected}
            onSelectCell={onSelectCell}
          />
        )}
      </div>

      {!isLoading && !error ? (
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[var(--border-panel)] pt-3">
          <p className="terminal-label">Intensity = relative count in grid</p>
          <div className="flex items-center gap-2 font-mono text-[9px] text-[var(--text-label)]">
            <span className="inline-block size-3 rounded bg-[rgba(61,154,110,0.35)]" />
            Low
            <span className="inline-block size-3 rounded bg-[rgba(232,163,23,0.45)]" />
            Med
            <span className="inline-block size-3 rounded bg-[rgba(196,92,92,0.5)]" />
            High
          </div>
        </div>
      ) : null}

      {showFooterLink ? (
        <Link
          href="/dashboard/risk-grade"
          className="terminal-label mt-4 inline-flex items-center gap-1 text-[var(--accent-amber)] hover:underline"
        >
          Open grade workspace
          <ArrowUpRight className="size-3.5" />
        </Link>
      ) : null}
    </section>
  );
}
