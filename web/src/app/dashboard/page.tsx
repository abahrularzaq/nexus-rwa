"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Clock,
  Database,
  Layers,
  Percent,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { RiskHeatmap } from "@/components/charts/RiskHeatmap";
import { YieldLadder } from "@/components/charts/YieldLadder";
import { MarketBriefCard } from "@/components/dashboard/MarketBriefCard";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { fetchAssetList, formatTvl } from "@/lib/api/assets";
import { toAssetSummaries } from "@/lib/asset-mapper";
import type {
  ApiResponse,
  AssetCategory,
  AssetSummary,
  MarketOverview,
} from "@/lib/shared";
import { formatYield } from "@/lib/shared";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type AssetRow = AssetSummary & {
  protocol?: string;
  category?: string | AssetCategory;
};

function apiBase(): string {
  return API_URL.trim().replace(/\/$/, "");
}

function apiKeyHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const apiKey = localStorage.getItem("nexus_api_key");
  return apiKey ? { "X-API-Key": apiKey } : {};
}

function fmtChange7d(change7d: number): string {
  const pct = change7d * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function parseOverviewPayload(data: MarketOverview): MarketOverview {
  return {
    ...data,
    updatedAt: new Date(data.updatedAt as unknown as string),
    topGainers: data.topGainers ?? [],
    topLosers: data.topLosers ?? [],
  };
}

async function fetchMarketOverview(): Promise<MarketOverview> {
  const base = apiBase();
  const res = await fetch(`${base}/v1/market/overview`, {
    headers: { Accept: "application/json", ...apiKeyHeader() },
    cache: "no-store",
  });
  const body = (await res.json()) as ApiResponse<MarketOverview>;
  if (!res.ok || !body.success) {
    const msg =
      body.success === false ? body.error.message : res.statusText || "Request failed";
    throw new Error(msg);
  }
  return parseOverviewPayload(body.data);
}

async function fetchAssetsList(): Promise<AssetRow[]> {
  const { assets } = await fetchAssetList({ limit: 20, page: 1 });
  return toAssetSummaries(assets) as AssetRow[];
}

function formatLastUpdated(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function categoryLabel(c: string | AssetCategory | undefined): string {
  if (!c || c === "—") return "—";
  return String(c)
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

const chartTooltipStyle = {
  backgroundColor: "rgba(15,22,41,0.95)",
  border: "1px solid rgba(0,209,255,0.18)",
  borderRadius: 10,
  color: "#fff",
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [assetsRows, setAssetsRows] = useState<AssetRow[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState<string | null>(null);

  const [lastDisplay, setLastDisplay] = useState<string>("—");

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const data = await fetchMarketOverview();
      setOverview(data);
      setLastDisplay(formatLastUpdated(data.updatedAt));
    } catch (e) {
      setOverview(null);
      setOverviewError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadAssets = useCallback(async () => {
    setAssetsLoading(true);
    setAssetsError(null);
    try {
      const rows = await fetchAssetsList();
      setAssetsRows(rows);
    } catch (e) {
      setAssetsRows([]);
      setAssetsError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setAssetsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadOverview();
      void loadAssets();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadOverview, loadAssets]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadOverview();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [loadOverview]);

  const gainersChartData = (overview?.topGainers ?? [])
    .slice(0, 5)
    .map((a, i) => ({
      rank: i + 1,
      symbol: a.symbol,
      yieldPct: a.yieldRate * 100,
    }));
  const losersChartData = (overview?.topLosers ?? [])
    .slice(0, 5)
    .map((a, i) => ({
      rank: i + 1,
      symbol: a.symbol,
      yieldPct: a.yieldRate * 100,
    }));

  const activeAssets = overview?.totalAssets ?? assetsRows.length;
  const curlExample = `curl -s "${apiBase()}/v1/market/overview"`;

  return (
    <div className="relative isolate space-y-8 overflow-hidden pb-10">
      <div className="pointer-events-none absolute inset-x-[-18%] top-[-180px] -z-10 h-[520px] bg-[radial-gradient(circle_at_28%_22%,rgba(0,209,255,0.18),transparent_34%),radial-gradient(circle_at_72%_18%,rgba(185,131,255,0.13),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(255,184,0,0.08),transparent_36%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-[-12%] top-[720px] -z-10 h-[420px] bg-[radial-gradient(circle_at_18%_20%,rgba(0,255,136,0.09),transparent_30%),radial-gradient(circle_at_88%_60%,rgba(255,68,68,0.08),transparent_32%)] blur-3xl" />

      <header className="relative flex flex-col gap-3 border-b border-[#00D1FF]/15 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5 text-[#8DEBFF]">Intelligence overview</p>
          <h1 className="bg-gradient-to-r from-white via-[#DDF9FF] to-[#8DEBFF] bg-clip-text text-2xl font-semibold leading-tight tracking-tight text-transparent">
            Nexus RWA Command Center
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--text-secondary)]">
            Ringkasan utama untuk membaca market depth, yield, risk, holder coverage,
            dan freshness data sebelum masuk ke Market, Sources, atau Data Layers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--text-secondary)] tabular-nums">
          <span>
            Last updated:{" "}
            <span className="font-medium text-white">{lastDisplay}</span>
          </span>
          <span className="rounded border border-[#00D1FF]/20 bg-[#00D1FF]/[0.06] px-2 py-0.5 terminal-label text-[#8DEBFF]">
            Auto-refresh 60s
          </span>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-xl border border-[#B983FF]/20 bg-[linear-gradient(135deg,rgba(8,13,25,0.96),rgba(11,20,38,0.88))] p-4 shadow-[0_0_40px_rgba(0,209,255,0.06)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_100%_0%,rgba(185,131,255,0.16),transparent_45%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#00D1FF]/40 bg-[#00D1FF]/15 px-2.5 py-1 text-xs font-medium text-[#8DEBFF] shadow-[0_0_18px_rgba(0,209,255,0.12)]">
                Overview layer
              </span>
              <span className="rounded-full border border-[#00FF88]/40 bg-[#00FF88]/15 px-2.5 py-1 text-xs font-medium text-[#74FFB8] shadow-[0_0_18px_rgba(0,255,136,0.14)]">
                {overviewLoading ? "Loading live metrics" : `${activeAssets} active assets`}
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
              Overview dibuat sebagai pintu masuk: cepat membaca kondisi dataset, lalu user diarahkan ke halaman yang lebih spesifik untuk analisis detail.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/market"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#00D1FF]/30 bg-[#00D1FF]/10 px-4 py-2 text-sm font-medium text-[#8DEBFF] shadow-[0_0_24px_rgba(0,209,255,0.12)] transition hover:bg-[#00D1FF]/20 hover:shadow-[0_0_34px_rgba(0,209,255,0.2)]"
            >
              Open Market
              <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/dashboard/sources"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#B983FF]/40 bg-[#B983FF]/15 px-4 py-2 text-sm font-medium text-[#E6D0FF] shadow-[0_0_24px_rgba(185,131,255,0.12)] transition hover:bg-[#B983FF]/25 hover:shadow-[0_0_34px_rgba(185,131,255,0.2)]"
            >
              Review Sources
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {overviewError ? (
        <section className="flex flex-col gap-4 rounded-xl border border-[rgba(255,68,68,0.35)] bg-[rgba(255,68,68,0.08)] p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#FF4444]">
              Could not load market overview
            </p>
            <p className="mt-1 text-sm text-[#8892A4]">{overviewError}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadOverview()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#FFB800]/35 bg-[#FFB800]/10 px-4 py-2 text-sm font-medium text-[#FFD36A] transition-colors hover:bg-[#FFB800]/20"
          >
            <RefreshCw className="size-4" />
            Retry
          </button>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewMetricCard
            icon={<Layers className="size-5 text-[#8DEBFF]" />}
            label="Total TVL"
            value={overviewLoading ? "—" : overview ? formatTvl(overview.totalTvl) : "—"}
            helper="Across active listings"
          />
          <OverviewMetricCard
            icon={<BarChart3 className="size-5 text-[#FFD36A]" />}
            label="Tracked assets"
            value={overviewLoading ? "—" : activeAssets.toLocaleString("en-US")}
            helper="Active dataset coverage"
            variant="amber"
          />
          <OverviewMetricCard
            icon={<Percent className="size-5 text-[#74FFB8]" />}
            label="Avg yield rate"
            value={overviewLoading ? "—" : overview ? formatYield(overview.avgYieldRate * 100) : "—"}
            helper="Volume-weighted snapshot"
            variant="green"
          />
          <OverviewMetricCard
            icon={<Users className="size-5 text-[#E6D0FF]" />}
            label="Total holders"
            value={overviewLoading ? "—" : overview ? overview.totalHolders.toLocaleString("en-US") : "—"}
            helper="Holder coverage signal"
            variant="purple"
          />
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.55fr]">
        <aside className="min-h-[420px]">
          <MarketBriefCard />
        </aside>

        <div className="space-y-6">
          {!overviewError ? (
            <section className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_38px_rgba(0,209,255,0.06)]">
              <div className="pointer-events-none absolute right-[-120px] top-[-140px] h-72 w-72 rounded-full bg-[#00D1FF]/10 blur-3xl" />
              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="terminal-label text-[#8DEBFF]">Liquidity snapshot</p>
                  <h2 className="mt-1 text-base font-semibold text-white">TVL Overview</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Snapshot ringkas agar user langsung tahu ukuran market sebelum melihat tabel detail.
                  </p>
                </div>
                <span className="terminal-label rounded border border-[#00D1FF]/20 bg-[#00D1FF]/[0.06] px-2 py-1 text-[#8DEBFF]">
                  Free endpoint
                </span>
              </div>
              <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
                <div className="data-surface border-[#00D1FF]/15 bg-[#050A14]/55 p-4">
                  <p className="terminal-label text-[#8DEBFF]">Total TVL</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {overviewLoading ? "—" : overview ? formatTvl(overview.totalTvl) : "—"}
                  </p>
                </div>
                <div className="data-surface border-[#00D1FF]/15 bg-[#050A14]/55 p-4">
                  <p className="terminal-label text-[#8DEBFF]">Active assets</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {overviewLoading ? "—" : activeAssets.toLocaleString("en-US")}
                  </p>
                </div>
                <div className="data-surface border-[#00D1FF]/15 bg-[#050A14]/55 p-4">
                  <p className="terminal-label text-[#8DEBFF]">Last updated</p>
                  <p className="mt-2 text-sm font-medium text-white">{lastDisplay}</p>
                </div>
              </div>
            </section>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <YieldLadder
              compact
              limit={8}
              showFooterLink
              benchmarkYield={overview?.avgYieldRate}
            />
            <RiskHeatmap compact showFooterLink />
          </div>
        </div>
      </div>

      {overviewLoading && !overviewError ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <MoverSkeleton />
          <MoverSkeleton />
        </section>
      ) : null}

      {overview && !overviewLoading && !overviewError ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <MoverPanel
            title="Top Gainers 7D"
            label="Positive momentum"
            icon={<TrendingUp className="size-5 text-[#00FF88]" aria-hidden />}
            items={overview.topGainers ?? []}
            chart={
              gainersChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gainersChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gainersFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="rank" tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={44} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v) => {
                        const n = typeof v === "number" ? v : Number(v);
                        return [`${Number.isFinite(n) ? n.toFixed(2) : "—"}%`, "Yield"];
                      }}
                      labelFormatter={(l) => `Rank ${l}`}
                    />
                    <Area type="monotone" dataKey="yieldPct" stroke="#00D4FF" fill="url(#gainersFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null
            }
          />

          <MoverPanel
            title="Top Losers 7D"
            label="Watchlist momentum"
            icon={<TrendingDown className="size-5 text-[#FF4444]" aria-hidden />}
            items={overview.topLosers ?? []}
            negative
            chart={
              losersChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={losersChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <XAxis dataKey="rank" tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={44} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v) => {
                        const n = typeof v === "number" ? v : Number(v);
                        return [`${Number.isFinite(n) ? n.toFixed(2) : "—"}%`, "Yield"];
                      }}
                      labelFormatter={(l) => `Rank ${l}`}
                    />
                    <Line type="monotone" dataKey="yieldPct" stroke="#FF4444" strokeWidth={2} dot={{ r: 3, fill: "#FF4444" }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : null
            }
          />
        </section>
      ) : null}

      <section className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_38px_rgba(0,209,255,0.06)]">
        <div className="pointer-events-none absolute bottom-[-160px] left-[-120px] h-72 w-72 rounded-full bg-[#00FF88]/8 blur-3xl" />
        <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#00D1FF]/15 pb-4">
          <div>
            <p className="terminal-label text-[#8DEBFF]">Recent coverage</p>
            <h2 className="mt-1 text-base font-semibold text-white">Recently tracked assets</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Asset terbaru ditampilkan sebagai preview sebelum user masuk ke full Assets table.
            </p>
          </div>
          <Link
            href="/dashboard/assets"
            className="inline-flex items-center gap-1 rounded-lg border border-[#00D1FF]/20 bg-[#00D1FF]/[0.04] px-3 py-2 text-sm font-medium text-[#8DEBFF] transition hover:border-[var(--accent-cyan)] hover:bg-[#00D1FF]/10 hover:text-white"
          >
            View all
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        {assetsError ? (
          <div className="relative flex flex-col gap-3 rounded-xl border border-[rgba(255,68,68,0.35)] bg-[rgba(255,68,68,0.06)] p-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[#8892A4]">{assetsError}</p>
            <button
              type="button"
              onClick={() => void loadAssets()}
              className="inline-flex items-center gap-2 rounded-lg border border-[#FFB800]/35 bg-[#FFB800]/10 px-4 py-2 text-sm font-medium text-[#FFD36A] hover:bg-[#FFB800]/20"
            >
              <RefreshCw className="size-4" />
              Retry
            </button>
          </div>
        ) : (
          <div className="relative overflow-x-auto rounded-xl border border-[#00D1FF]/15 bg-[#050A14]/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="border-b border-[#00D1FF]/15 bg-[#00D1FF]/[0.035] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Protocol</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">TVL</th>
                  <th className="px-4 py-3 text-right font-medium">Yield</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 text-right font-medium">7D</th>
                </tr>
              </thead>
              <tbody>
                {assetsLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-[rgba(30,42,58,0.55)] last:border-0">
                        <td className="px-4 py-3">
                          <div className="h-4 w-40 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" />
                          <div className="mt-2 h-3 w-16 animate-pulse rounded bg-[rgba(30,42,58,0.7)]" />
                        </td>
                        <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" /></td>
                        <td className="px-4 py-3 text-right"><div className="ml-auto h-4 w-16 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" /></td>
                        <td className="px-4 py-3 text-right"><div className="ml-auto h-4 w-12 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" /></td>
                        <td className="px-4 py-3"><div className="h-6 w-16 animate-pulse rounded-md bg-[rgba(30,42,58,0.9)]" /></td>
                        <td className="px-4 py-3 text-right"><div className="ml-auto h-4 w-14 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" /></td>
                      </tr>
                    ))
                  : assetsRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-[rgba(30,42,58,0.55)] transition hover:bg-[#00D1FF]/[0.045] hover:shadow-[inset_3px_0_0_rgba(0,209,255,0.45)] last:border-0"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{row.name}</p>
                          <p className="text-xs text-[#8892A4]">{row.symbol}</p>
                        </td>
                        <td className="px-4 py-3 text-[#8892A4]">
                          {row.protocol ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[#8892A4]">
                          {categoryLabel(row.category)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-white">
                          {formatTvl(row.tvl)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-white">
                          {formatYield(row.yieldRate * 100)}
                        </td>
                        <td className="px-4 py-3">
                          <RiskBadge level={row.riskScore} showDot />
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium tabular-nums ${
                            row.change7d >= 0 ? "text-[#00FF88]" : "text-[#FF4444]"
                          }`}
                        >
                          {fmtChange7d(row.change7d)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoPanel icon={<Database className="size-5 text-[#8DEBFF]" />} label="Data source" title="API-first overview">
          Overview memakai <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[#8DEBFF]">GET /v1/market/overview</code> sebagai snapshot publik yang ringan.
        </InfoPanel>
        <InfoPanel icon={<ShieldCheck className="size-5 text-[#74FFB8]" />} label="Trust path" title="Bukan halaman detail">
          Detail evidence tetap diarahkan ke Sources, Data Layers, dan Risk & Grade agar Overview tidak terlalu penuh.
        </InfoPanel>
        <InfoPanel icon={<Clock className="size-5 text-[#E6D0FF]" />} label="Freshness" title="Auto-refresh context">
          Timestamp dan refresh 60 detik membuat halaman terlihat hidup tanpa membuat user merasa datanya statis.
        </InfoPanel>
      </section>

      <section className="data-surface rounded-lg border border-[#00D1FF]/15 bg-[linear-gradient(145deg,rgba(0,209,255,0.08),rgba(255,255,255,0.025))] p-5 shadow-[0_0_28px_rgba(0,209,255,0.06)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="terminal-label text-[#8DEBFF]">Developer access</p>
            <h3 className="mt-1 text-base font-semibold text-white">Access this overview via API</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Endpoint: <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[#8DEBFF]">GET /v1/market/overview</code>{" "}
              — <span className="text-[#00FF88]">FREE</span>
            </p>
          </div>
          <Link
            href="/dashboard/api-docs"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#B983FF]/40 bg-[#B983FF]/15 px-4 py-2 text-sm font-medium text-[#E6D0FF] shadow-[0_0_24px_rgba(185,131,255,0.12)] transition hover:bg-[#B983FF]/25 hover:shadow-[0_0_34px_rgba(185,131,255,0.2)]"
          >
            View API Docs
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-[#00D1FF]/15 bg-[#050A14]/70 p-4 text-xs text-[#8892A4]">
          {curlExample}
        </pre>
      </section>
    </div>
  );
}

function OverviewMetricCard({ icon, label, value, helper, variant = "cyan" }: { icon: ReactNode; label: string; value: string; helper: string; variant?: "cyan" | "green" | "amber" | "purple" }) {
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

function MoverSkeleton() {
  return (
    <div className="terminal-panel border-[#00D1FF]/15 p-5 shadow-[0_0_28px_rgba(0,209,255,0.06)]">
      <div className="mb-4 h-5 w-40 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" />
      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="flex justify-between gap-2 border-b border-[rgba(30,42,58,0.5)] pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-48 max-w-full animate-pulse rounded bg-[rgba(30,42,58,0.85)]" />
              <div className="h-3 w-14 animate-pulse rounded bg-[rgba(30,42,58,0.75)]" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <div className="h-4 w-16 animate-pulse rounded bg-[rgba(30,42,58,0.85)]" />
              <div className="h-6 w-20 animate-pulse rounded-md bg-[rgba(30,42,58,0.8)]" />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 h-[180px] w-full animate-pulse rounded-lg bg-[rgba(30,42,58,0.45)]" />
    </div>
  );
}

function MoverPanel({ title, label, icon, items, chart, negative = false }: { title: string; label: string; icon: ReactNode; items: AssetSummary[]; chart: ReactNode; negative?: boolean }) {
  return (
    <div className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_28px_rgba(0,209,255,0.06)]">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <div>
          <p className="terminal-label text-[#8DEBFF]">{label}</p>
          <h2 className="text-base font-semibold text-white">{title}</h2>
        </div>
      </div>
      <ul className="space-y-3">
        {items.slice(0, 5).map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(30,42,58,0.5)] pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{a.name}</p>
              <p className="text-xs text-[#8892A4]">{a.symbol}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-right text-sm">
              <span className="tabular-nums text-[#8892A4]">
                {formatYield(a.yieldRate * 100)}
              </span>
              <span className={`font-medium tabular-nums ${negative ? "text-[#FF4444]" : "text-[#00FF88]"}`}>
                {fmtChange7d(a.change7d)}
              </span>
              <RiskBadge level={a.riskScore} showDot />
            </div>
          </li>
        ))}
      </ul>
      {chart ? <div className="mt-4 h-[180px] w-full">{chart}</div> : null}
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
