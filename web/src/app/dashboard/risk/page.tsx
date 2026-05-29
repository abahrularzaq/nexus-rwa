"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { RiskHeatmap } from "@/components/charts/RiskHeatmap";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { useAssetSummaries } from "@/hooks/use-asset-summaries";
import {
  categoryDisplayLabel,
  filterAssetsByHeatmapCell,
  type HeatmapFilter,
} from "@/lib/risk-heatmap";
import type { AssetSummary } from "@/lib/shared";
import { formatLargeNumber, formatYield } from "@/lib/shared";

function fmtTvlUsd(n: number): string {
  return `$${formatLargeNumber(n)}`;
}

function fmtChange7d(change7d: number): string {
  const pct = change7d * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function toBadgeLevel(
  level: string,
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  const u = level.toUpperCase();
  if (u === "LOW" || u === "MEDIUM" || u === "HIGH" || u === "CRITICAL") {
    return u;
  }
  return "MEDIUM";
}

export default function RiskPage() {
  const { data: assets = [], isLoading, isError, error, refetch } =
    useAssetSummaries();
  const [cellFilter, setCellFilter] = useState<HeatmapFilter>(null);

  const filteredAssets = useMemo(
    () => filterAssetsByHeatmapCell(assets, cellFilter),
    [assets, cellFilter],
  );

  const filterLabel =
    cellFilter != null
      ? `${categoryDisplayLabel(cellFilter.category)} · ${cellFilter.riskLevel}`
      : null;

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-3 border-b border-[var(--border-line)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5">Risk workspace</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            Cross-asset risk matrix
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Composite risk levels (LOW / MEDIUM / HIGH) mapped across RWA
            categories. Scores reflect TVL stability, yield sustainability,
            holder depth, and protocol maturity.
          </p>
        </div>
        <Link
          href="/dashboard/assets"
          className="terminal-label inline-flex items-center gap-1 text-[var(--accent-amber)] hover:underline"
        >
          Browse all assets
          <ArrowUpRight className="size-3.5" />
        </Link>
      </header>

      <RiskHeatmap
        assets={assets}
        isLoading={isLoading}
        error={isError ? (error instanceof Error ? error.message : "Failed to load") : null}
        onRetry={() => void refetch()}
        selected={cellFilter}
        onSelectCell={setCellFilter}
      />

      <section className="terminal-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-panel)] px-5 py-4">
          <div>
            <p className="terminal-label">Holdings</p>
            <h2 className="mt-1 text-base font-semibold text-white">
              {cellFilter ? "Filtered assets" : "All tracked assets"}
            </h2>
            {filterLabel ? (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Showing {filteredAssets.length} in{" "}
                <span className="font-medium text-white">{filterLabel}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {filteredAssets.length} listings — select a matrix cell to
                narrow
              </p>
            )}
          </div>
          {cellFilter ? (
            <button
              type="button"
              onClick={() => setCellFilter(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-panel)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-amber)]/40 hover:text-white"
            >
              <X className="size-3.5" />
              Clear filter
            </button>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-line)]">
                <th className="terminal-label px-5 py-2.5">Asset</th>
                <th className="terminal-label px-4 py-2.5">Category</th>
                <th className="terminal-label px-4 py-2.5 text-right">TVL</th>
                <th className="terminal-label px-4 py-2.5 text-right">Yield</th>
                <th className="terminal-label px-4 py-2.5">Risk</th>
                <th className="terminal-label px-4 py-2.5 text-right">
                  7D
                </th>
                <th className="terminal-label px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border-line)]">
                      <td className="px-5 py-3" colSpan={7}>
                        <div className="h-4 w-full max-w-md animate-pulse rounded bg-[rgba(30,42,58,0.7)]" />
                      </td>
                    </tr>
                  ))
                : filteredAssets.length === 0
                  ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-10 text-center text-sm text-[var(--text-secondary)]"
                      >
                        No assets in this matrix cell.
                      </td>
                    </tr>
                  )
                  : filteredAssets.map((row: AssetSummary) => (
                      <tr
                        key={row.id}
                        className="border-b border-[var(--border-line)] last:border-0 hover:bg-[rgba(255,255,255,0.02)]"
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-white">{row.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {row.symbol}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          {row.category
                            ? categoryDisplayLabel(row.category)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
                          {fmtTvlUsd(row.tvl)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
                          {formatYield(row.yieldRate * 100)}
                        </td>
                        <td className="px-4 py-3">
                          <RiskBadge
                            level={toBadgeLevel(String(row.riskScore))}
                            showDot
                          />
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono text-xs font-medium tabular-nums ${
                            row.change7d >= 0
                              ? "text-[var(--data-positive)]"
                              : "text-[var(--data-negative)]"
                          }`}
                        >
                          {fmtChange7d(row.change7d)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dashboard/assets/${row.id}`}
                            className="terminal-label text-[var(--accent-amber)] hover:underline"
                          >
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="data-surface rounded-lg border border-[var(--border-panel)] p-5">
        <p className="terminal-label">API</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Per-asset risk breakdown:{" "}
          <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[var(--accent-amber)]">
            GET /v1/assets/:id/risk
          </code>{" "}
          — returns score, level, and factors. Matrix above is derived client-side
          from{" "}
          <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[var(--accent-amber)]">
            GET /v1/assets
          </code>
          .
        </p>
      </section>
    </div>
  );
}
