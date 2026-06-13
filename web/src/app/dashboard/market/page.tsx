"use client";

import { useMemo, useState, type ReactNode } from "react";
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

function toBadgeLevel(level: string): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  const u = level.toUpperCase();
  if (u === "LOW" || u === "MEDIUM" || u === "HIGH" || u === "CRITICAL") return u;
  return "MEDIUM";
}

function hasUsefulNumber(value: number | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function getFreshness(asset: AssetSummary): FreshnessStatus {
  const lastUpdated = asset._meta?.lastUpdated;
  const hasCoreMarketData =
    hasUsefulNumber(asset.tvl) && Number.isFinite(asset.yieldRate) && hasUsefulNumber(asset.holderCount);

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
  if (benchmark != null && Number.isFinite(benchmark) && asset.yieldRate > benchmark * 1.8) {
    return "Yield outlier";
  }
  if (freshness === "Partial" || freshness === "Watch") return "Watch";
  return "Strong";
}

function signalTone(signal: MarketSignal): string {
  if (signal === "Strong") return "text-[#74FFB8] border-[#00FF88]/35 bg-[#00FF88]/12 shadow-[0_0_18px_rgba(0,255,136,0.12)]";
  if (signal === "Watch") return "text-[#FFD36A] border-[#FFB800]/35 bg-[#FFB800]/12 shadow-[0_0_18px_rgba(255,184,0,0.1)]";
  return "text-[#FFA0A0] border-[#FF4444]/35 bg-[#FF4444]/12 shadow-[0_0_18px_rgba(255,68,68,0.12)]";
}

function freshnessTone(status: FreshnessStatus): string {
  if (status === "Fresh") return "text-[#74FFB8] border-[#00FF88]/35 bg-[#00FF88]/12";
  if (status === "Watch") return "text-[#FFD36A] border-[#FFB800]/35 bg-[#FFB800]/12";
  if (status === "Stale") return "text-[#FFA0A0] border-[#FF4444]/35 bg-[#FF4444]/12";
  return "text-[var(--text-label)] border-white/10 bg-white/[0.04]";
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

  return Math.round(perAssetScores.reduce((sum, score) => sum + score, 0) / perAssetScores.length);
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
  const { data: assets = [], isLoading, isError, error, refetch } = useAssetSummaries();
  const overviewQuery = useMarketOverview();

  const benchmark =
    overviewQuery.data?.success && overviewQuery.data.data.avgYieldRate != null
      ? overviewQuery.data.data.avgYieldRate
      : undefined;

  const filteredAssets = useMemo(
    () => (selectedCategory === "ALL" ? assets : assets.filter((asset) => asset.category === selectedCategory)),
    [assets, selectedCategory],
  );

  const rankedAssets = useMemo(
    () => [...filteredAssets].filter((a) => Number.isFinite(a.yieldRate)).sort((a, b) => b.yieldRate - a.yieldRate),
    [filteredAssets],
  );

  const totalTvl = assets.reduce((sum, asset) => sum + (asset.tvl ?? 0), 0);
  const totalHolders = assets.reduce((sum, asset) => sum + (asset.holderCount ?? 0), 0);
  const avgYield = assets.length > 0 ? assets.reduce((sum, asset) => sum + asset.yieldRate, 0) / assets.length : 0;
  const completeAssets = assets.filter(
    (asset) => getFreshness(asset) !== "Partial" && hasUsefulNumber(asset.tvl) && hasUsefulNumber(asset.holderCount),
  ).length;
  const marketQuality = computeMarketQuality(assets);

  const alerts = useMemo(() => {
    const yieldOutlier = [...assets]
      .filter((asset) => benchmark != null && Number.isFinite(benchmark) && asset.yieldRate > benchmark * 1.8)
      .sort((a, b) => b.yieldRate - a.yieldRate)[0];
    const staleCount = assets.filter((asset) => getFreshness(asset) === "Stale").length;
    const thinLiquidityCount = assets.filter((asset) => !hasUsefulNumber(asset.tvl) || (asset.holderCount ?? 0) < 100).length;
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
    <div className="relative isolate space-y-8 overflow-hidden pb-10">
      <div className="pointer-events-none absolute inset-x-[-18%] top-[-180px] -z-10 h-[520px] bg-[radial-gradient(circle_at_28%_22%,rgba(0,209,255,0.18),transparent_34%),radial-gradient(circle_at_72%_18%,rgba(185,131,255,0.13),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(255,184,0,0.08),transparent_36%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-[-12%] top-[760px] -z-10 h-[420px] bg-[radial-gradient(circle_at_18%_20%,rgba(0,255,136,0.09),transparent_30%),radial-gradient(circle_at_88%_60%,rgba(255,68,68,0.08),transparent_32%)] blur-3xl" />

      <header className="relative flex flex-col gap-3 border-b border-[#00D1FF]/15 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5 text-[#8DEBFF]">Market workspace</p>
          <h1 className="bg-gradient-to-r from-white via-[#DDF9FF] to-[#8DEBFF] bg-clip-text text-2xl font-semibold leading-tight tracking-tight text-transparent">
            RWA Market Intelligence
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--text-secondary)]">
            Compare market depth, yield quality, liquidity access, holder distribution,
            and freshness signals across tokenized real-world assets.
          </p>
        </div>
        <Link
          href="/dashboard/screener"
          className="inline-flex items-center gap-2 rounded-lg border border-[#00D1FF]/20 bg-[#00D1FF]/[0.04] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-cyan)] hover:bg-[#00D1FF]/10 hover:text-white hover:shadow-[0_0_24px_rgba(0,209,255,0.16)]"
        >
          <BarChart3 className="size-3.5" />
          Compare assets
        </Link>
      </header>

      <section className="relative overflow-hidden rounded-xl border border-[#B983FF]/20 bg-[linear-gradient(135deg,rgba(8,13,25,0.96),rgba(11,20,38,0.88))] p-4 shadow-[0_0_40px_rgba(0,209,255,0.06)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_100%_0%,rgba(185,131,255,0.16),transparent_45%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#00D1FF]/40 bg-[#00D1FF]/15 px-2.5 py-1 text-xs font-medium text-[#8DEBFF] shadow-[0_0_18px_rgba(0,209,255,0.12)]">
                Market intelligence layer
              </span>
              <span className="rounded-full border border-[#00FF88]/40 bg-[#00FF88]/15 px-2.5 py-1 text-xs font-medium text-[#74FFB8] shadow-[0_0_18px_rgba(0,255,136,0.14)]">
                Freshness-aware signals
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
              This workspace turns market.json, yield.json, liquidity.json, and holder coverage into cross-asset signals for comparison and review.
            </p>
          </div>
          <Link
            href="/dashboard/layers"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#B983FF]/40 bg-[#B983FF]/15 px-4 py-2 text-sm font-medium text-[#E6D0FF] shadow-[0_0_24px_rgba(185,131,255,0.12)] transition hover:bg-[#B983FF]/25 hover:shadow-[0_0_34px_rgba(185,131,255,0.2)]"
          >
            View data layers
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MarketMetricCard icon={<BarChart3 className="size-5 text-[#8DEBFF]" />} label="Total market size" value={isLoading ? "—" : formatTvl(totalTvl)} helper={`${assets.length} tracked RWA assets`} />
        <MarketMetricCard icon={<Percent className="size-5 text-[#FFD36A]" />} label="Weighted avg yield" value={isLoading ? "—" : formatYield(avgYield * 100)} helper="Category-adjusted snapshot" variant="amber" />
        <MarketMetricCard icon={<Users className="size-5 text-[#74FFB8]" />} label="Verified holders" value={isLoading ? "—" : totalHolders.toLocaleString("en-US")} helper="On-chain holder coverage" variant="green" />
        <MarketMetricCard icon={<Waves className="size-5 text-[#E6D0FF]" />} label="Market coverage" value={isLoading ? "—" : `${assets.length} assets`} helper={`${completeAssets} complete • ${Math.max(assets.length - completeAssets, 0)} partial`} variant="purple" />
        <MarketMetricCard icon={<ShieldCheck className="size-5 text-[#8DEBFF]" />} label="Market quality" value={isLoading ? "—" : `${marketQuality}/100`} helper="Completeness + freshness" />
      </section>

      <section className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_38px_rgba(0,209,255,0.06)]">
        <div className="pointer-events-none absolute right-[-120px] top-[-140px] h-72 w-72 rounded-full bg-[#00D1FF]/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="terminal-label text-[#8DEBFF]">Market alerts</p>
            <h2 className="mt-1 text-base font-semibold text-white">Signals that need attention</h2>
          </div>
          <span className="terminal-label rounded border border-[#00D1FF]/20 bg-[#00D1FF]/[0.06] px-2 py-1 text-[#8DEBFF]">
            Rules-based preview
          </span>
        </div>
        <div className="relative mt-4 grid gap-3 md:grid-cols-2">
          {alerts.map((alert, index) => (
            <div key={alert} className="flex gap-3 rounded-lg border border-[#00D1FF]/15 bg-[#050A14]/55 p-3 transition hover:bg-[#00D1FF]/[0.045]">
              <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${index === 0 ? "text-[#FFD36A]" : "text-[#8DEBFF]"}`} />
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{alert}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_38px_rgba(0,209,255,0.06)]">
        <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="terminal-label text-[#8DEBFF]">Yield structure</p>
            <h2 className="mt-1 text-base font-semibold text-white">Cross-asset yield ladder</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
              Use category filters before comparing yield. Higher yield may reflect higher credit, liquidity, or protocol risk.
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
                    ? "border-[#00D1FF]/45 bg-[#00D1FF]/15 text-[#8DEBFF] shadow-[0_0_18px_rgba(0,209,255,0.12)]"
                    : "border-white/10 bg-white/[0.04] text-[var(--text-label)] hover:border-[#00D1FF]/25 hover:text-white"
                }`}
              >
                {category === "ALL" ? "All" : categoryDisplayLabel(category)}
              </button>
            ))}
          </div>
        </div>
        <YieldLadder assets={filteredAssets} benchmarkYield={benchmark} grouped={selectedCategory === "ALL"} isLoading={isLoading} error={isError ? (error instanceof Error ? error.message : "Failed to load") : null} onRetry={() => void refetch()} />
      </section>

      <section className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_38px_rgba(0,209,255,0.06)]">
        <div className="pointer-events-none absolute bottom-[-160px] left-[-120px] h-72 w-72 rounded-full bg-[#00FF88]/8 blur-3xl" />
        <div className="relative border-b border-[#00D1FF]/15 pb-4">
          <p className="terminal-label text-[#8DEBFF]">Market signals</p>
          <h2 className="mt-1 text-base font-semibold text-white">Assets by market quality signal</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {isLoading ? "Loading…" : `${rankedAssets.length} listing${rankedAssets.length === 1 ? "" : "s"} shown for ${selectedCategory === "ALL" ? "all categories" : categoryDisplayLabel(selectedCategory)}`}
          </p>
        </div>

        <div className="relative mt-4 overflow-x-auto rounded-xl border border-[#00D1FF]/15 bg-[#050A14]/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="border-b border-[#00D1FF]/15 bg-[#00D1FF]/[0.035] text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">TVL/AUM</th>
                <th className="px-4 py-3 text-right font-medium">Yield</th>
                <th className="px-4 py-3 text-right font-medium">7D</th>
                <th className="px-4 py-3 text-right font-medium">Holders</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Freshness</th>
                <th className="px-4 py-3 font-medium">Signal</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-[rgba(30,42,58,0.55)]">
                      <td className="px-4 py-3" colSpan={10}><div className="h-4 w-full max-w-md animate-pulse rounded bg-[rgba(30,42,58,0.7)]" /></td>
                    </tr>
                  ))
                : rankedAssets.length === 0
                  ? <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">No market data available for this category.</td></tr>
                  : rankedAssets.map((asset) => <MarketTableRow key={asset.id} asset={asset} benchmark={benchmark} />)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <InfoPanel icon={<Activity className="size-5 text-[#8DEBFF]" />} label="Liquidity access" title="Liquidity review queue">
          Start with assets flagged as thin liquidity or yield outliers. These usually need deeper checks on redemption period, lockup, minimum redemption, and secondary-market access inside the Pro asset layer.
        </InfoPanel>
        <InfoPanel icon={<Clock className="size-5 text-[#E6D0FF]" />} label="Holder depth" title="Freshness & coverage">
          Freshness badges separate assets with complete market evidence from partial records. This protects users from over-reading stale TVL, holder, or yield snapshots.
        </InfoPanel>
      </section>

      <section className="data-surface rounded-lg border border-[#00D1FF]/15 bg-[linear-gradient(145deg,rgba(0,209,255,0.08),rgba(255,255,255,0.025))] p-5 shadow-[0_0_28px_rgba(0,209,255,0.06)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="terminal-label text-[#8DEBFF]">Next step</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Public market view uses <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[#8DEBFF]">GET /v1/assets</code>{" "}
              and <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[#8DEBFF]">GET /v1/market/overview</code>.
              Detailed history, holder concentration, and liquidity breakdown stay in Pro asset layers.
            </p>
          </div>
          <Link href="/dashboard/screener" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#B983FF]/40 bg-[#B983FF]/15 px-4 py-2 text-sm font-medium text-[#E6D0FF] shadow-[0_0_24px_rgba(185,131,255,0.12)] transition hover:bg-[#B983FF]/25 hover:shadow-[0_0_34px_rgba(185,131,255,0.2)]">
            Open Screener
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function MarketMetricCard({ icon, label, value, helper, variant = "cyan" }: { icon: ReactNode; label: string; value: string; helper: string; variant?: "cyan" | "green" | "amber" | "purple" }) {
  const styles = {
    cyan: "border-[#00D1FF]/20 bg-[linear-gradient(145deg,rgba(0,209,255,0.08),rgba(255,255,255,0.025))] shadow-[0_0_28px_rgba(0,209,255,0.06)]",
    green: "border-[#00FF88]/20 bg-[linear-gradient(145deg,rgba(0,255,136,0.08),rgba(255,255,255,0.025))] shadow-[0_0_28px_rgba(0,255,136,0.06)]",
    amber: "border-[#FFB800]/20 bg-[linear-gradient(145deg,rgba(255,184,0,0.08),rgba(255,255,255,0.025))] shadow-[0_0_28px_rgba(255,184,0,0.06)]",
    purple: "border-[#B983FF]/20 bg-[linear-gradient(145deg,rgba(185,131,255,0.09),rgba(255,184,0,0.035))] shadow-[0_0_28px_rgba(185,131,255,0.06)]",
  } as const;

  return (
    <div className={`data-surface p-5 ${styles[variant]}`}>
      {icon}
      <p className="terminal-label mt-4 text-[#8DEBFF]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{helper}</p>
    </div>
  );
}

function InfoPanel({ icon, label, title, children }: { icon: ReactNode; label: string; title: string; children: ReactNode }) {
  return (
    <div className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_28px_rgba(0,209,255,0.06)]">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className="terminal-label text-[#8DEBFF]">{label}</p>
          <h2 className="text-base font-semibold text-white">{title}</h2>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</p>
    </div>
  );
}

function MarketTableRow({ asset, benchmark }: { asset: AssetSummary; benchmark?: number }) {
  const aboveBench = benchmark != null && Number.isFinite(benchmark) && asset.yieldRate > benchmark;
  const freshness = getFreshness(asset);
  const signal = signalForAsset(asset, benchmark);

  return (
    <tr className="border-b border-[rgba(30,42,58,0.55)] transition hover:bg-[#00D1FF]/[0.045] hover:shadow-[inset_3px_0_0_rgba(0,209,255,0.45)] last:border-0">
      <td className="px-4 py-3"><p className="font-medium text-white">{asset.name}</p><p className="text-xs text-[var(--text-secondary)]">{asset.symbol}</p></td>
      <td className="px-4 py-3 text-[var(--text-secondary)]">{asset.category ? categoryDisplayLabel(asset.category) : "—"}</td>
      <td className="px-4 py-3 text-right font-mono tabular-nums text-white">{formatTvl(asset.tvl)}</td>
      <td className={`px-4 py-3 text-right font-mono tabular-nums ${aboveBench ? "text-[#FFD36A]" : "text-white"}`}>{formatYield(asset.yieldRate * 100)}</td>
      <td className={`px-4 py-3 text-right font-mono text-xs font-medium tabular-nums ${asset.change7d >= 0 ? "text-[#74FFB8]" : "text-[#FFA0A0]"}`}>{fmtChange7d(asset.change7d)}</td>
      <td className="px-4 py-3 text-right font-mono tabular-nums text-white">{(asset.holderCount ?? 0).toLocaleString("en-US")}</td>
      <td className="px-4 py-3"><RiskBadge level={toBadgeLevel(String(asset.riskScore))} showDot /></td>
      <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${freshnessTone(freshness)}`}>{freshness}</span></td>
      <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${signalTone(signal)}`}>{signal}</span></td>
      <td className="px-4 py-3 text-right"><Link href={`/dashboard/assets/${asset.id}`} className="terminal-label text-[#8DEBFF] transition hover:text-white hover:underline">Detail</Link></td>
    </tr>
  );
}
