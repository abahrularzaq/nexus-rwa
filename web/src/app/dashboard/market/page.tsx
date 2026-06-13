"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Clock,
  Percent,
  ShieldCheck,
  Users,
  Waves,
} from "lucide-react";
import { YieldLadder } from "@/components/charts/YieldLadder";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { useAssetSummaries } from "@/hooks/use-asset-summaries";
import { useMarketOverview } from "@/hooks/use-market";
import { categoryDisplayLabel } from "@/lib/risk-heatmap";
import type { AssetCategory, AssetSummary } from "@/lib/shared";
import { formatTvl } from "@/lib/api/assets";
import { formatYield } from "@/lib/shared";

const CATEGORY_FILTERS: Array<"ALL" | AssetCategory> = [
  "ALL",
  "TREASURY",
  "CREDIT",
  "REAL_ESTATE",
  "COMMODITIES",
  "EQUITY",
];

type FreshnessStatus = "Fresh" | "Watch" | "Stale" | "Partial";
type MarketSignal = "Strong" | "Watch" | "Thin liquidity" | "Yield outlier" | "Data stale";

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

function hasUsefulNumber(value: number | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function getFreshness(asset: AssetSummary): FreshnessStatus {
  const lastUpdated = asset._meta?.lastUpdated;
  const hasCoreMarketData =
    hasUsefulNumber(asset.tvl) &&
    Number.isFinite(asset.yieldRate) &&
    hasUsefulNumber(asset.holderCount);

  if (!hasCoreMarketData || !lastUpdated) return "Partial";

  const updatedAt = new Date(lastUpdated).getTime();
  if (!Number.isFinite(updatedAt)) return "Partial";

  const ageDays = (Date.now() - updatedAt) / 86_400_000;
  if (ageDays <= 7) return "Fresh";
  if (ageDays <= 30) return "Watch";
  return "Stale";
}

function signalForAsset(asset: AssetSummary, benchmark?: number): MarketSignal {
  const freshness = getFreshness(asset);
  const holderCount = asset.holderCount ?? 0;

  if (freshness === "Stale") return "Data stale";
  if (!hasUsefulNumber(asset.tvl) || holderCount < 100) return "Thin liquidity";
  if (
    benchmark != null &&
    Number.isFinite(benchmark) &&
    asset.yieldRate > benchmark * 1.8
  ) {
    return "Yield outlier";
  }
  if (freshness === "Partial" || freshness === "Watch") return "Watch";
  return "Strong";
}

function signalTone(signal: MarketSignal): string {
  if (signal === "Strong") return "text-[var(--data-positive)] border-[rgba(0,255,136,0.25)] bg-[rgba(0,255,136,0.08)]";
  if (signal === "Watch") return "text-[var(--accent-amber)] border-[var(--accent-amber)]/25 bg-[var(--accent-amber-dim)]";
  return "text-[#FF6B6B] border-[rgba(255,107,107,0.25)] bg-[rgba(255,107,107,0.08)]";
}

function freshnessTone(status: FreshnessStatus): string {
  if (status === "Fresh") return "text-[var(--data-positive)] border-[rgba(0,255,136,0.25)] bg-[rgba(0,255,136,0.08)]";
  if (status === "Watch") return "text-[var(--accent-amber)] border-[var(--accent-amber)]/25 bg-[var(--accent-amber-dim)]";
  if (status === "Stale") return "text-[#FF6B6B] border-[rgba(255,107,107,0.25)] bg-[rgba(255,107,107,0.08)]";
  return "text-[var(--text-label)] border-[var(--border-panel)] bg-[var(--bg-panel)]";
}

function computeMarketQuality(assets: AssetSummary[]): number {
  if (assets.length === 0) return 0;

  const perAssetScores = assets.map((asset) => {
    let score = 0;
    if (hasUsefulNumber(asset.tvl)) score += 25;
    if (Number.isFinite(asset.yieldRate)) score += 20;
    if (hasUsefulNumber(asset.holderCount)) score += 20;
    if (Number.isFinite(asset.change7d)) score += 15;
    if (asset._meta?.sources?.length) score += 10;

    const freshness = getFreshness(asset);
    if (freshness === "Fresh") score += 10;
    else if (freshness === "Watch") score += 6;
    else if (freshness === "Partial") score += 3;

    return score;
  });

  return Math.round(
    perAssetScores.reduce((sum, score) => sum + score, 0) / perAssetScores.length,
  );
}

function latestUpdateLabel(assets: AssetSummary[]): string {
  const latest = assets
    .map((asset) => new Date(asset._meta?.lastUpdated ?? "").getTime())
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];

  if (!latest) return "No timestamp";
  return new Date(latest).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MarketPage() {
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | AssetCategory>("ALL");
  const { data: assets = [], isLoading, isError, error, refetch } =
    useAssetSummaries();
  const overviewQuery = useMarketOverview();

  const benchmark =
    overviewQuery.data?.success && overviewQuery.data.data.avgYieldRate != null
      ? overviewQuery.data.data.avgYieldRate
      : undefined;

  const filteredAssets = useMemo(
    () =>
      selectedCategory === "ALL"
        ? assets
        : assets.filter((asset) => asset.category === selectedCategory),
    [assets, selectedCategory],
  );

  const rankedAssets = useMemo(
    () =>
      [...filteredAssets]
        .filter((a) => Number.isFinite(a.yieldRate))
        .sort((a, b) => b.yieldRate - a.yieldRate),
    [filteredAssets],
  );

  const totalTvl = assets.reduce((sum, asset) => sum + (asset.tvl ?? 0), 0);
  const totalHolders = assets.reduce(
    (sum, asset) => sum + (asset.holderCount ?? 0),
    0,
  );
  const avgYield =
    assets.length > 0
      ? assets.reduce((sum, asset) => sum + asset.yieldRate, 0) / assets.length
      : 0;
  const completeAssets = assets.filter(
    (asset) =>
      getFreshness(asset) !== "Partial" &&
      hasUsefulNumber(asset.tvl) &&
      hasUsefulNumber(asset.holderCount),
  ).length;
  const marketQuality = computeMarketQuality(assets);

  const alerts = useMemo(() => {
    const yieldOutlier = [...assets]
      .filter(
        (asset) =>
          benchmark != null &&
          Number.isFinite(benchmark) &&
          asset.yieldRate > benchmark * 1.8,
      )
      .sort((a, b) => b.yieldRate - a.yieldRate)[0];
    const staleCount = assets.filter((asset) => getFreshness(asset) === "Stale").length;
    const thinLiquidityCount = assets.filter(
      (asset) => !hasUsefulNumber(asset.tvl) || (asset.holderCount ?? 0) < 100,
    ).length;
    const strongestHolderAsset = [...assets]
      .filter((asset) => hasUsefulNumber(asset.holderCount))
      .sort((a, b) => (b.holderCount ?? 0) - (a.holderCount ?? 0))[0];

    return [
      yieldOutlier
        ? `${yieldOutlier.symbol} yield sits far above the current market benchmark; review credit, liquidity, and protocol risk before comparing.`
        : "No major yield outlier detected against the current market benchmark.",
      thinLiquidityCount > 0
        ? `${thinLiquidityCount} asset${thinLiquidityCount === 1 ? "" : "s"} need liquidity or holder-depth review.`
        : "Liquidity and holder coverage look sufficient across tracked assets.",
      staleCount > 0
        ? `${staleCount} market record${staleCount === 1 ? "" : "s"} look stale and should be refreshed.`
        : `Latest market timestamp: ${latestUpdateLabel(assets)}.`,
      strongestHolderAsset
        ? `${strongestHolderAsset.symbol} currently has the deepest holder coverage in this dataset.`
        : "Holder-depth coverage is still limited for this market view.",
    ];
  }, [assets, benchmark]);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-3 border-b border-[var(--border-line)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5">Market workspace</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            RWA Market Intelligence
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--text-secondary)]">
            Compare market depth, yield quality, liquidity access, holder distribution,
            and freshness signals across tokenized real-world assets.
          </p>
        </div>
        <Link
          href="/dashboard/screener"
          className="terminal-label inline-flex items-center gap-1 text-[var(--accent-amber)] hover:underline"
        >
          Compare assets
          <ArrowUpRight className="size-3.5" />
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MarketMetricCard
          icon={<BarChart3 className="size-5 text-[var(--accent-amber)]" />}
          label="Total market size"
          value={isLoading ? "—" : formatTvl(totalTvl)}
          helper={`${assets.length} tracked RWA assets`}
        />
        <MarketMetricCard
          icon={<Percent className="size-5 text-[var(--accent-amber)]" />}
          label="Weighted avg yield"
          value={isLoading ? "—" : formatYield(avgYield * 100)}
          helper="Category-adjusted snapshot"
        />
        <MarketMetricCard
          icon={<Users className="size-5 text-[var(--accent-amber)]" />}
          label="Verified holders"
          value={isLoading ? "—" : totalHolders.toLocaleString("en-US")}
          helper="On-chain holder coverage"
        />
        <MarketMetricCard
          icon={<Waves className="size-5 text-[var(--accent-amber)]" />}
          label="Market coverage"
          value={isLoading ? "—" : `${assets.length} assets`}
          helper={`${completeAssets} complete • ${Math.max(assets.length - completeAssets, 0)} partial`}
        />
        <MarketMetricCard
          icon={<ShieldCheck className="size-5 text-[var(--accent-amber)]" />}
          label="Market quality"
          value={isLoading ? "—" : `${marketQuality}/100`}
          helper="Completeness + freshness"
        />
      </section>

      <section className="terminal-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="terminal-label">Market alerts</p>
            <h2 className="mt-1 text-base font-semibold text-white">
              Signals that need attention
            </h2>
          </div>
          <span className="terminal-label rounded border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2 py-1">
            Rules-based preview
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {alerts.map((alert, index) => (
            <div
              key={alert}
              className="flex gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-3"
            >
              <AlertTriangle
                className={`mt-0.5 size-4 shrink-0 ${index === 0 ? "text-[var(--accent-amber)]" : "text-[var(--text-label)]"}`}
              />
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {alert}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="terminal-label">Yield structure</p>
            <h2 className="mt-1 text-base font-semibold text-white">
              Cross-asset yield ladder
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
              Use category filters before comparing yield. Higher yield may reflect higher
              credit, liquidity, or protocol risk.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${
                  selectedCategory === category
                    ? "border-[var(--accent-amber)] bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]"
                    : "border-[var(--border-panel)] bg-[var(--bg-panel)] text-[var(--text-label)] hover:text-white"
                }`}
              >
                {category === "ALL" ? "All" : categoryDisplayLabel(category)}
              </button>
            ))}
          </div>
        </div>
        <YieldLadder
          assets={filteredAssets}
          benchmarkYield={benchmark}
          grouped={selectedCategory === "ALL"}
          isLoading={isLoading}
          error={isError ? (error instanceof Error ? error.message : "Failed to load") : null}
          onRetry={() => void refetch()}
        />
      </section>

      <section className="terminal-panel overflow-hidden">
        <div className="border-b border-[var(--border-panel)] px-5 py-4">
          <p className="terminal-label">Market signals</p>
          <h2 className="mt-1 text-base font-semibold text-white">
            Assets by market quality signal
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {isLoading
              ? "Loading…"
              : `${rankedAssets.length} listing${rankedAssets.length === 1 ? "" : "s"} shown for ${selectedCategory === "ALL" ? "all categories" : categoryDisplayLabel(selectedCategory)}`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-line)]">
                <th className="terminal-label px-5 py-2.5">Asset</th>
                <th className="terminal-label px-4 py-2.5">Category</th>
                <th className="terminal-label px-4 py-2.5 text-right">TVL/AUM</th>
                <th className="terminal-label px-4 py-2.5 text-right">Yield</th>
                <th className="terminal-label px-4 py-2.5 text-right">7D</th>
                <th className="terminal-label px-4 py-2.5 text-right">Holders</th>
                <th className="terminal-label px-4 py-2.5">Risk</th>
                <th className="terminal-label px-4 py-2.5">Freshness</th>
                <th className="terminal-label px-4 py-2.5">Signal</th>
                <th className="terminal-label px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border-line)]">
                      <td className="px-5 py-3" colSpan={10}>
                        <div className="h-4 w-full max-w-md animate-pulse rounded bg-[rgba(30,42,58,0.7)]" />
                      </td>
                    </tr>
                  ))
                : rankedAssets.length === 0
                  ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-5 py-10 text-center text-sm text-[var(--text-secondary)]"
                      >
                        No market data available for this category.
                      </td>
                    </tr>
                  )
                  : rankedAssets.map((asset) => (
                      <MarketTableRow
                        key={asset.id}
                        asset={asset}
                        benchmark={benchmark}
                      />
                    ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="terminal-panel p-5">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-[var(--accent-amber)]" />
            <div>
              <p className="terminal-label">Liquidity access</p>
              <h2 className="text-base font-semibold text-white">Liquidity review queue</h2>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            Start with assets flagged as thin liquidity or yield outliers. These usually
            need deeper checks on redemption period, lockup, minimum redemption, and
            secondary-market access inside the Pro asset layer.
          </p>
        </div>
        <div className="terminal-panel p-5">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-[var(--accent-amber)]" />
            <div>
              <p className="terminal-label">Holder depth</p>
              <h2 className="text-base font-semibold text-white">Freshness & coverage</h2>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            Freshness badges separate assets with complete market evidence from partial
            records. This protects users from over-reading stale TVL, holder, or yield
            snapshots.
          </p>
        </div>
      </section>

      <section className="data-surface rounded-lg border border-[var(--border-panel)] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="terminal-label">Next step</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Public market view uses <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[var(--accent-amber)]">GET /v1/assets</code>{" "}
              and <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[var(--accent-amber)]">GET /v1/market/overview</code>.
              Detailed history, holder concentration, and liquidity breakdown stay in Pro asset layers.
            </p>
          </div>
          <Link
            href="/dashboard/screener"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--accent-amber)]/35 bg-[var(--accent-amber-dim)] px-4 py-2 text-sm font-medium text-[var(--accent-amber)] transition-colors hover:bg-[var(--accent-amber)]/20"
          >
            Open Screener
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function MarketMetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="terminal-panel p-5">
      {icon}
      <p className="terminal-label mt-4">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{helper}</p>
    </div>
  );
}

function MarketTableRow({
  asset,
  benchmark,
}: {
  asset: AssetSummary;
  benchmark?: number;
}) {
  const aboveBench =
    benchmark != null && Number.isFinite(benchmark) && asset.yieldRate > benchmark;
  const freshness = getFreshness(asset);
  const signal = signalForAsset(asset, benchmark);

  return (
    <tr className="border-b border-[var(--border-line)] last:border-0 hover:bg-[rgba(255,255,255,0.02)]">
      <td className="px-5 py-3">
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
      <td
        className={`px-4 py-3 text-right font-mono text-xs font-medium tabular-nums ${
          asset.change7d >= 0
            ? "text-[var(--data-positive)]"
            : "text-[var(--data-negative)]"
        }`}
      >
        {fmtChange7d(asset.change7d)}
      </td>
      <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
        {(asset.holderCount ?? 0).toLocaleString("en-US")}
      </td>
      <td className="px-4 py-3">
        <RiskBadge level={toBadgeLevel(String(asset.riskScore))} showDot />
      </td>
      <td className="px-4 py-3">
        <span className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${freshnessTone(freshness)}`}>
          {freshness}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${signalTone(signal)}`}>
          {signal}
        </span>
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
