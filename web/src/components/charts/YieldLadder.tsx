"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { useAssetSummaries } from "@/hooks/use-asset-summaries";
import { useMarketOverview } from "@/hooks/use-market";
import {
  buildYieldLadderGroups,
  buildYieldLadderRows,
  computeYieldBenchmark,
  LADDER_CATEGORY_COLORS,
  type YieldLadderGroup,
  type YieldLadderRow,
} from "@/lib/yield-ladder";
import { categoryDisplayLabel } from "@/lib/risk-heatmap";
import type { AssetSummary } from "@/lib/shared";
import { formatYield } from "@/lib/shared";

function LadderSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-4 w-16 animate-pulse rounded bg-[rgba(30,42,58,0.55)]" />
          <div className="h-5 flex-1 animate-pulse rounded bg-[rgba(30,42,58,0.45)]" />
          <div className="h-4 w-12 animate-pulse rounded bg-[rgba(30,42,58,0.55)]" />
        </div>
      ))}
    </div>
  );
}

function scaleMax(rows: YieldLadderRow[], benchmark: number): number {
  const peak = rows.reduce((m, r) => Math.max(m, r.yieldRate), 0);
  return Math.max(peak, benchmark, 0.0001);
}

const GRID_COMPACT = "grid-cols-[3.5rem_1fr_3rem]";
const GRID_FULL = "grid-cols-[4.5rem_1fr_3.5rem] sm:grid-cols-[5.5rem_1fr_4rem]";

function BenchmarkLine({
  benchmark,
  maxYield,
  showLabel,
}: {
  benchmark: number;
  maxYield: number;
  showLabel?: boolean;
}) {
  if (benchmark <= 0) return null;
  const left = Math.min((benchmark / maxYield) * 100, 100);
  return (
    <div
      className="pointer-events-none absolute inset-y-0 z-10 w-px bg-[var(--accent-amber)] shadow-[0_0_6px_rgba(232,163,23,0.35)]"
      style={{ left: `${left}%` }}
      aria-hidden
    >
      {showLabel ? (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-wide text-[var(--accent-amber)]">
          Mkt avg
        </div>
      ) : null}
    </div>
  );
}

function LadderBarTrack({
  row,
  maxYield,
  benchmark,
  showBenchmarkLabel,
}: {
  row: YieldLadderRow;
  maxYield: number;
  benchmark: number;
  showBenchmarkLabel?: boolean;
}) {
  const widthPct = Math.min((row.yieldRate / maxYield) * 100, 100);
  return (
    <div className="relative h-5 rounded-sm bg-[var(--bg-panel)]">
      <BenchmarkLine
        benchmark={benchmark}
        maxYield={maxYield}
        showLabel={showBenchmarkLabel}
      />
      <div
        className="absolute inset-y-0 left-0 rounded-sm"
        style={{
          width: `${widthPct}%`,
          backgroundColor: LADDER_CATEGORY_COLORS[row.category],
          minWidth: row.yieldRate > 0 ? "2px" : 0,
        }}
      />
    </div>
  );
}

function LadderGrid({
  rows,
  benchmark,
  gridClass,
  showCategoryChip,
}: {
  rows: YieldLadderRow[];
  benchmark: number;
  gridClass: string;
  showCategoryChip?: boolean;
}) {
  const maxYield = scaleMax(rows, benchmark);

  return (
    <div>
      <div className={`mb-2 grid gap-2 ${gridClass}`}>
        <span className="terminal-label">Asset</span>
        <span className="terminal-label">Yield vs market</span>
        <span className="terminal-label text-right">Rate</span>
      </div>
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div key={row.id}>
            {showCategoryChip ? (
              <p className="terminal-label mb-0.5 pl-0.5">
                {categoryDisplayLabel(row.category)}
              </p>
            ) : null}
            <div className={`grid items-center gap-2 ${gridClass}`}>
              <Link
                href={`/dashboard/assets/${row.id}`}
                className="truncate font-mono text-xs font-medium text-white hover:text-[var(--accent-amber)]"
                title={`${row.name} (${row.symbol})`}
              >
                {row.symbol}
              </Link>
              <LadderBarTrack
                row={row}
                maxYield={maxYield}
                benchmark={benchmark}
                showBenchmarkLabel={i === 0}
              />
              <span className="text-right font-mono text-xs tabular-nums text-white">
                {formatYield(row.yieldRate * 100)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LadderRows({
  rows,
  benchmark,
  compact,
  showCategoryChip,
}: {
  rows: YieldLadderRow[];
  benchmark: number;
  compact?: boolean;
  showCategoryChip?: boolean;
}) {
  return (
    <LadderGrid
      rows={rows}
      benchmark={benchmark}
      gridClass={compact ? GRID_COMPACT : GRID_FULL}
      showCategoryChip={showCategoryChip}
    />
  );
}

function GroupedLadder({
  groups,
  benchmark,
}: {
  groups: YieldLadderGroup[];
  benchmark: number;
}) {
  const allRows = groups.flatMap((g) => g.rows);
  const maxYield = scaleMax(allRows, benchmark);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.category}>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-block size-2 rounded-sm"
              style={{ backgroundColor: LADDER_CATEGORY_COLORS[group.category] }}
            />
            <h3 className="terminal-label text-[11px] text-white">
              {group.label}
            </h3>
            <span className="font-mono text-[10px] text-[var(--text-label)]">
              {group.rows.length} asset{group.rows.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-1.5">
            {group.rows.map((row, i) => (
              <div
                key={row.id}
                className={`grid items-center gap-2 ${GRID_FULL}`}
              >
                <Link
                  href={`/dashboard/assets/${row.id}`}
                  className="truncate font-mono text-xs font-medium text-white hover:text-[var(--accent-amber)]"
                  title={`${row.name} (${row.symbol})`}
                >
                  {row.symbol}
                </Link>
                <LadderBarTrack
                  row={row}
                  maxYield={maxYield}
                  benchmark={benchmark}
                  showBenchmarkLabel={i === 0}
                />
                <span className="text-right font-mono text-xs tabular-nums text-white">
                  {formatYield(row.yieldRate * 100)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export type YieldLadderProps = {
  assets?: AssetSummary[];
  /** Market avg yield (decimal, e.g. 0.0542). Falls back to asset mean. */
  benchmarkYield?: number;
  /** Flat top-N mode for overview mini ladder */
  limit?: number;
  /** Group by category (yield page). Ignored when limit is set. */
  grouped?: boolean;
  compact?: boolean;
  showFooterLink?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function YieldLadder({
  assets: assetsProp,
  benchmarkYield: benchmarkProp,
  limit,
  grouped = false,
  compact = false,
  showFooterLink = false,
  isLoading: isLoadingProp,
  error: errorProp,
  onRetry,
}: YieldLadderProps) {
  const query = useAssetSummaries();
  const overviewQuery = useMarketOverview();

  const assets = assetsProp ?? query.data ?? [];
  const isLoading = isLoadingProp ?? (assetsProp == null && query.isLoading);
  const error =
    errorProp ??
    (assetsProp == null && query.isError
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load assets"
      : null);

  const benchmark = useMemo(() => {
    if (benchmarkProp != null && Number.isFinite(benchmarkProp)) {
      return benchmarkProp;
    }
    const overviewRes = overviewQuery.data;
    if (overviewRes?.success && Number.isFinite(overviewRes.data.avgYieldRate)) {
      return overviewRes.data.avgYieldRate;
    }
    return computeYieldBenchmark(assets);
  }, [benchmarkProp, overviewQuery.data, assets]);

  const flatRows = useMemo(
    () => buildYieldLadderRows(assets, limit),
    [assets, limit],
  );

  const groups = useMemo(
    () => (limit != null ? [] : buildYieldLadderGroups(assets)),
    [assets, limit],
  );

  const useGrouped = grouped && limit == null;
  const displayCount = limit ?? assets.length;

  const handleRetry = onRetry ?? (() => void query.refetch());

  return (
    <section className="terminal-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="terminal-label">Yield structure</p>
          <h2 className="mt-1 text-base font-semibold text-white">
            {compact ? "Yield ladder" : "Cross-asset yield ladder"}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {compact
              ? "Top listings by current yield vs market benchmark."
              : "Horizontal ranking by category — amber line marks market average yield."}
          </p>
        </div>
        {!isLoading && !error ? (
          <span className="terminal-label rounded border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2 py-1">
            Bench {formatYield(benchmark * 100)}
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
          <LadderSkeleton rows={compact ? 6 : 8} />
        ) : useGrouped && groups.length > 0 ? (
          <GroupedLadder groups={groups} benchmark={benchmark} />
        ) : flatRows.length > 0 ? (
          <LadderRows
            rows={flatRows}
            benchmark={benchmark}
            compact={compact}
            showCategoryChip={compact && !useGrouped}
          />
        ) : (
          <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
            No yield data available.
          </p>
        )}
      </div>

      {!isLoading && !error && displayCount > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--border-panel)] pt-3">
          <p className="terminal-label">Bar length ∝ yield rate</p>
          <div className="flex flex-wrap gap-2">
            {(["TREASURY", "CREDIT", "REAL_ESTATE", "COMMODITIES"] as const).map(
              (cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 font-mono text-[9px] text-[var(--text-label)]"
                >
                  <span
                    className="inline-block size-2 rounded-sm"
                    style={{ backgroundColor: LADDER_CATEGORY_COLORS[cat] }}
                  />
                  {categoryDisplayLabel(cat)}
                </span>
              ),
            )}
          </div>
        </div>
      ) : null}

      {showFooterLink ? (
        <Link
          href="/dashboard/yield"
          className="terminal-label mt-4 inline-flex items-center gap-1 text-[var(--accent-amber)] hover:underline"
        >
          View full ladder
          <ArrowUpRight className="size-3.5" />
        </Link>
      ) : null}
    </section>
  );
}
