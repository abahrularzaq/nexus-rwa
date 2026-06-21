"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { YieldLadder } from "@/components/charts/YieldLadder";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { useAssetSummaries } from "@/hooks/use-asset-summaries";
import { useMarketOverview } from "@/hooks/use-market";
import { categoryDisplayLabel } from "@/lib/risk-heatmap";
import type { AssetSummary } from "@/lib/shared";
import { formatTvl } from "@/lib/api/assets";
import { formatYield } from "@/lib/shared";

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

export default function YieldPage() {
  const { data: assets = [], isLoading, isError, error, refetch } =
    useAssetSummaries();
  const overviewQuery = useMarketOverview();

  const benchmark =
    overviewQuery.data?.success && overviewQuery.data.data.avgYieldRate != null
      ? overviewQuery.data.data.avgYieldRate
      : undefined;

  const rankedAssets = useMemo(
    () =>
      [...assets]
        .filter((a) => Number.isFinite(a.yieldRate))
        .sort((a, b) => b.yieldRate - a.yieldRate),
    [assets],
  );

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-3 border-b border-[var(--border-line)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5">Yield workspace</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            Cross-asset yield ladder
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Horizontal yield ranking grouped by RWA category. The amber
            benchmark line marks the market average from the latest overview
            snapshot.
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Contextual dashboard page linked from yield components; not part of primary sidebar navigation.
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

      <YieldLadder
        assets={assets}
        benchmarkYield={benchmark}
        grouped
        isLoading={isLoading}
        error={isError ? (error instanceof Error ? error.message : "Failed to load") : null}
        onRetry={() => void refetch()}
      />

      <section className="terminal-panel overflow-hidden">
        <div className="border-b border-[var(--border-panel)] px-5 py-4">
          <p className="terminal-label">Rankings</p>
          <h2 className="mt-1 text-base font-semibold text-white">
            All assets by yield
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {isLoading
              ? "Loading…"
              : `${rankedAssets.length} listings sorted by current yield rate`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-line)]">
                <th className="terminal-label px-5 py-2.5">#</th>
                <th className="terminal-label px-4 py-2.5">Asset</th>
                <th className="terminal-label px-4 py-2.5">Category</th>
                <th className="terminal-label px-4 py-2.5 text-right">TVL</th>
                <th className="terminal-label px-4 py-2.5 text-right">Yield</th>
                <th className="terminal-label px-4 py-2.5">Risk</th>
                <th className="terminal-label px-4 py-2.5 text-right">7D</th>
                <th className="terminal-label px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border-line)]">
                      <td className="px-5 py-3" colSpan={8}>
                        <div className="h-4 w-full max-w-md animate-pulse rounded bg-[rgba(30,42,58,0.7)]" />
                      </td>
                    </tr>
                  ))
                : rankedAssets.length === 0
                  ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-10 text-center text-sm text-[var(--text-secondary)]"
                      >
                        No yield data available.
                      </td>
                    </tr>
                  )
                  : rankedAssets.map((asset, index) => (
                      <YieldTableRow
                        key={asset.id}
                        rank={index + 1}
                        asset={asset}
                        benchmark={benchmark}
                      />
                    ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="data-surface rounded-lg border border-[var(--border-panel)] p-5">
        <p className="terminal-label">API</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Per-asset yield history:{" "}
          <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[var(--accent-amber)]">
            GET /v1/assets/:slug/history
          </code>
          . Ladder above is derived client-side from{" "}
          <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[var(--accent-amber)]">
            GET /v1/assets
          </code>{" "}
          with benchmark from{" "}
          <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[var(--accent-amber)]">
            GET /v1/market/overview
          </code>
          .
        </p>
      </section>
    </div>
  );
}

function YieldTableRow({
  rank,
  asset,
  benchmark,
}: {
  rank: number;
  asset: AssetSummary;
  benchmark?: number;
}) {
  const aboveBench =
    benchmark != null && Number.isFinite(benchmark) && asset.yieldRate > benchmark;

  return (
    <tr className="border-b border-[var(--border-line)] last:border-0 hover:bg-[rgba(255,255,255,0.02)]">
      <td className="px-5 py-3 font-mono text-xs tabular-nums text-[var(--text-label)]">
        {rank}
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-white">{asset.name}</p>
        <p className="text-xs text-[var(--text-secondary)]">{asset.symbol}</p>
      </td>
      <td className="px-4 py-3 text-[var(--text-secondary)]">
        {asset.category ? categoryDisplayLabel(asset.category) : "—"}
      </td>
      <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
        {formatTvl(asset.tvl)}
      </td>
      <td
        className={`px-4 py-3 text-right font-mono tabular-nums ${
          aboveBench ? "text-[var(--accent-amber)]" : "text-white"
        }`}
      >
        {formatYield(asset.yieldRate * 100)}
      </td>
      <td className="px-4 py-3">
        <RiskBadge level={toBadgeLevel(String(asset.riskScore))} showDot />
      </td>
      <td
        className={`px-4 py-3 text-right font-mono text-xs font-medium tabular-nums ${
          asset.change7d >= 0
            ? "text-[var(--data-positive)]"
            : "text-[var(--data-negative)]"
        }`}
      >
        {fmtChange7d(asset.change7d)}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/dashboard/assets/${asset.id}`}
          className="terminal-label text-[var(--accent-amber)] hover:underline"
        >
          Detail
        </Link>
      </td>
    </tr>
  );
}
