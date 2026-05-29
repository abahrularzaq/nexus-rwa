"use client";

import { useCallback, useEffect, useState } from "react";
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
  ArrowUpRight,
  Layers,
  Percent,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { RiskHeatmap } from "@/components/charts/RiskHeatmap";
import { YieldLadder } from "@/components/charts/YieldLadder";
import { MarketBriefCard } from "@/components/dashboard/MarketBriefCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import type {
  ApiResponse,
  AssetCategory,
  AssetSummary,
  MarketOverview,
  PaginatedResponse,
} from "@/lib/shared";
import { formatLargeNumber, formatYield } from "@/lib/shared";

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

function fmtTvlUsd(n: number): string {
  return `$${formatLargeNumber(n)}`;
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
  const base = apiBase();
  const res = await fetch(`${base}/v1/assets?limit=13&page=1`, {
    headers: { Accept: "application/json", ...apiKeyHeader() },
    cache: "no-store",
  });
  let body: ApiResponse<PaginatedResponse<AssetSummary>>;
  try {
    body = (await res.json()) as ApiResponse<PaginatedResponse<AssetSummary>>;
  } catch {
    throw new Error("Invalid JSON from assets API");
  }
  if (!res.ok || !body.success) {
    const msg =
      body.success === false ? body.error.message : res.statusText || "Request failed";
    throw new Error(msg);
  }
  return body.data.data.map((a) => ({ ...a })) as AssetRow[];
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
  border: "1px solid rgba(30,42,58,0.9)",
  borderRadius: 8,
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

  const curlExample = `curl -s "${apiBase()}/v1/market/overview"`;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header className="flex flex-col gap-3 border-b border-[var(--border-line)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5">Intelligence terminal</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            Market Overview
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            13 assets tracked across 8 protocols
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--text-secondary)] tabular-nums">
          <span>
            Last updated:{" "}
            <span className="font-medium text-white">{lastDisplay}</span>
          </span>
          <span className="rounded border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2 py-0.5 terminal-label">
            Auto-refresh 60s
          </span>
        </div>
      </header>

      {/* 12-col: brief (4) + analytics (8) */}
      <div className="overview-grid">
        <aside className="overview-grid-brief">
          <MarketBriefCard />
        </aside>

        <div className="overview-grid-main space-y-6">
      {/* METRICS */}
      {overviewError ? (
        <div className="flex flex-col gap-4 rounded-xl border border-[rgba(255,68,68,0.35)] bg-[rgba(255,68,68,0.06)] p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#FF4444]">
              Could not load market overview
            </p>
            <p className="mt-1 text-sm text-[#8892A4]">{overviewError}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadOverview()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--accent-amber)]/35 bg-[var(--accent-amber-dim)] px-4 py-2 text-sm font-medium text-[var(--accent-amber)] transition-colors hover:bg-[var(--accent-amber)]/20"
          >
            <RefreshCw className="size-4" />
            Retry
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total TVL"
            value={overview ? fmtTvlUsd(overview.totalTvl) : 0}
            subtitle="Across active assets"
            icon={<Layers className="text-[var(--accent-amber)]" />}
            isLoading={overviewLoading}
          />
          <MetricCard
            title="Total Assets"
            value={overview ? overview.totalAssets : 0}
            subtitle="Active listings"
            icon={<TrendingUp className="text-[var(--accent-amber)]" />}
            isLoading={overviewLoading}
          />
          <MetricCard
            title="Avg Yield Rate"
            value={overview ? formatYield(overview.avgYieldRate * 100) : "0.00%"}
            subtitle="Volume-weighted snapshot"
            icon={<Percent className="text-[var(--accent-amber)]" />}
            isLoading={overviewLoading}
          />
          <MetricCard
            title="Total Holders"
            value={overview ? overview.totalHolders : 0}
            subtitle="Across active assets"
            icon={<Users className="text-[var(--accent-amber)]" />}
            isLoading={overviewLoading}
          />
        </div>
      )}

      {/* TVL OVERVIEW (free) */}
      {!overviewError ? (
        <section className="terminal-panel p-5">
          <p className="terminal-label">Liquidity</p>
          <h2 className="mt-1 text-base font-semibold text-white">TVL Overview</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Aggregate liquidity snapshot across tracked listings — always free.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="data-surface p-4">
              <p className="terminal-label">Total TVL</p>
              <p className="terminal-data mt-2 text-2xl font-semibold">
                {overviewLoading ? "—" : overview ? fmtTvlUsd(overview.totalTvl) : "—"}
              </p>
            </div>
            <div className="data-surface p-4">
              <p className="terminal-label">Active assets</p>
              <p className="terminal-data mt-2 text-2xl font-semibold">
                {overviewLoading ? "—" : overview ? overview.totalAssets : "—"}
              </p>
            </div>
            <div className="data-surface p-4 sm:col-span-2 lg:col-span-1">
              <p className="terminal-label">Last updated</p>
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

      {/* TOP MOVERS + CHARTS */}
      {overviewLoading && !overviewError ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.5)] p-5">
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
          <div className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.5)] p-5">
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
        </section>
      ) : null}
      {overview && !overviewLoading && !overviewError ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.5)] p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="size-5 text-[#00FF88]" aria-hidden />
              <h2 className="text-base font-bold text-white">Top Gainers 7D</h2>
            </div>
            <ul className="space-y-3">
              {(overview.topGainers ?? []).slice(0, 5).map((a) => (
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
                    <span className="font-medium tabular-nums text-[#00FF88]">
                      {fmtChange7d(a.change7d)}
                    </span>
                    <RiskBadge level={a.riskScore} showDot />
                  </div>
                </li>
              ))}
            </ul>
            {gainersChartData.length > 0 ? (
              <div className="mt-4 h-[180px] w-full">
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
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.5)] p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingDown className="size-5 text-[#FF4444]" aria-hidden />
              <h2 className="text-base font-bold text-white">Top Losers 7D</h2>
            </div>
            <ul className="space-y-3">
              {(overview.topLosers ?? []).slice(0, 5).map((a) => (
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
                    <span className="font-medium tabular-nums text-[#FF4444]">
                      {fmtChange7d(a.change7d)}
                    </span>
                    <RiskBadge level={a.riskScore} showDot />
                  </div>
                </li>
              ))}
            </ul>
            {losersChartData.length > 0 ? (
              <div className="mt-4 h-[180px] w-full">
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
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
        </div>
      </div>

      {/* RECENT ASSETS */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">Recent Assets</h2>
          <Link
            href="/dashboard/assets"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-amber)] hover:underline"
          >
            View All
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        {assetsError ? (
          <div className="flex flex-col gap-3 rounded-xl border border-[rgba(255,68,68,0.35)] bg-[rgba(255,68,68,0.06)] p-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[#8892A4]">{assetsError}</p>
            <button
              type="button"
              onClick={() => void loadAssets()}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-amber)]/35 bg-[var(--accent-amber-dim)] px-4 py-2 text-sm font-medium text-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/20"
            >
              <RefreshCw className="size-4" />
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.5)]">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-line)]">
                  <th className="terminal-label px-4 py-2.5">Asset</th>
                  <th className="terminal-label px-4 py-2.5">Protocol</th>
                  <th className="terminal-label px-4 py-2.5">Category</th>
                  <th className="terminal-label px-4 py-2.5 text-right">TVL</th>
                  <th className="terminal-label px-4 py-2.5 text-right">Yield</th>
                  <th className="terminal-label px-4 py-2.5">Risk</th>
                  <th className="terminal-label px-4 py-2.5 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {assetsLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-[rgba(30,42,58,0.5)]">
                        <td className="px-4 py-3">
                          <div className="h-4 w-40 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" />
                          <div className="mt-2 h-3 w-16 animate-pulse rounded bg-[rgba(30,42,58,0.7)]" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-20 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-24 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="ml-auto h-4 w-12 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-6 w-16 animate-pulse rounded-md bg-[rgba(30,42,58,0.9)]" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="ml-auto h-4 w-14 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" />
                        </td>
                      </tr>
                    ))
                  : assetsRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-[rgba(30,42,58,0.5)] last:border-0"
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
                          {fmtTvlUsd(row.tvl)}
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

      {/* API CALLOUT */}
      <section
        className="rounded-xl border border-[rgba(0,212,255,0.2)] p-6"
        style={{ background: "rgba(0,212,255,0.05)" }}
      >
        <h3 className="text-lg font-semibold text-white">Access this data via API</h3>
        <p className="mt-2 text-sm text-[#8892A4]">
          Endpoint:{" "}
          <code className="rounded bg-[rgba(10,14,26,0.6)] px-1.5 py-0.5 text-[#00D4FF]">
            GET /v1/market/overview
          </code>{" "}
          — <span className="text-[#00FF88]">FREE</span>
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] p-4 text-xs text-[#8892A4]">
          {curlExample}
        </pre>
        <Link
          href="/dashboard/api-docs"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#00D4FF] px-4 py-2.5 text-sm font-semibold text-[#0A0E1A] transition-opacity hover:opacity-90"
        >
          View API Docs
        </Link>
      </section>
    </div>
  );
}
