"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Info,
  Search,
  SearchX,
} from "lucide-react";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import type { RiskBadgeProps } from "@/components/dashboard/RiskBadge";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AssetCategoryTab =
  | "ALL"
  | "TREASURY"
  | "CREDIT"
  | "REAL_ESTATE"
  | "COMMODITIES";

/** List row shape aligned with API (flat or nested). */
interface AssetSnapshotRow {
  tvl: number;
  yieldRate: number;
  holderCount: number;
  riskScore: string;
}

interface AssetRiskScoreRow {
  overallScore: string;
}

interface Asset {
  id: string;
  name: string;
  symbol: string;
  protocol: string;
  category: string;
  chain: string;
  snapshots: AssetSnapshotRow[];
  riskScores: AssetRiskScoreRow[];
  /** From flat list summary for 7d sort / display. */
  change7d?: number;
}

function toRiskLevel(s: string | undefined): RiskBadgeProps["level"] {
  const u = (s ?? "MEDIUM").toUpperCase();
  if (u === "LOW" || u === "MEDIUM" || u === "HIGH" || u === "CRITICAL") {
    return u;
  }
  return "MEDIUM";
}

function parseAssetFromApiRow(raw: Record<string, unknown>): Asset {
  const snapshotsRaw = raw.snapshots;
  const riskScoresRaw = raw.riskScores;
  const firstSnap =
    Array.isArray(snapshotsRaw) &&
    snapshotsRaw.length > 0 &&
    typeof snapshotsRaw[0] === "object" &&
    snapshotsRaw[0] !== null
      ? (snapshotsRaw[0] as Record<string, unknown>)
      : null;
  const firstRisk =
    Array.isArray(riskScoresRaw) &&
    riskScoresRaw.length > 0 &&
    typeof riskScoresRaw[0] === "object" &&
    riskScoresRaw[0] !== null
      ? (riskScoresRaw[0] as Record<string, unknown>)
      : null;

  if (firstSnap && firstRisk) {
    return {
      id: String(raw.id ?? ""),
      name: String(raw.name ?? ""),
      symbol: String(raw.symbol ?? ""),
      protocol: String(raw.protocol ?? ""),
      category: String(raw.category ?? "TREASURY"),
      chain: String(raw.chain ?? "base"),
      snapshots: [
        {
          tvl: Number(firstSnap.tvl ?? 0),
          yieldRate: Number(firstSnap.yieldRate ?? 0),
          holderCount: Number(firstSnap.holderCount ?? 0),
          riskScore: String(
            firstSnap.riskScore ?? firstRisk.overallScore ?? "MEDIUM",
          ),
        },
      ],
      riskScores: [
        { overallScore: String(firstRisk.overallScore ?? "MEDIUM") },
      ],
      change7d:
        typeof raw.change7d === "number" ? raw.change7d : undefined,
    };
  }

  const risk = String(raw.riskScore ?? "MEDIUM");
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    symbol: String(raw.symbol ?? ""),
    protocol: String(raw.protocol ?? ""),
    category: String(raw.category ?? "TREASURY"),
    chain: String(raw.chain ?? "base"),
    snapshots: [
      {
        tvl: Number(raw.tvl ?? 0),
        yieldRate: Number(raw.yieldRate ?? 0),
        holderCount: Number(raw.holderCount ?? 0),
        riskScore: risk,
      },
    ],
    riskScores: [{ overallScore: risk }],
    change7d: Number(raw.change7d ?? 0),
  };
}

const CATEGORY_TABS: { key: AssetCategoryTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "TREASURY", label: "Treasury" },
  { key: "CREDIT", label: "Credit" },
  { key: "REAL_ESTATE", label: "Real Estate" },
  { key: "COMMODITIES", label: "Commodities" },
];

const SORT_OPTIONS = ["tvl", "yield", "holders", "name", "change7d"] as const;
type SortKey = (typeof SORT_OPTIONS)[number];

function categoryPillLabel(c: string): string {
  return c
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function formatTvl(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatHolders(n: number): string {
  return n.toLocaleString("en-US");
}

function formatYieldFraction(f: number): string {
  return `${(f * 100).toFixed(2)}%`;
}

function formatChange7d(f: number): string {
  const pct = f * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function categoryAccent(category: string): string {
  switch (category) {
    case "TREASURY":
      return "#00D4FF";
    case "CREDIT":
      return "#7C3AED";
    case "REAL_ESTATE":
      return "#00FF88";
    case "COMMODITIES":
      return "#FFB800";
    default:
      return "#8892A4";
  }
}

function compare(a: Asset, b: Asset, sortBy: SortKey, order: "asc" | "desc"): number {
  const dir = order === "asc" ? 1 : -1;
  const sa = a.snapshots?.[0];
  const sb = b.snapshots?.[0];
  switch (sortBy) {
    case "tvl":
      return ((sa?.tvl ?? 0) - (sb?.tvl ?? 0)) * dir;
    case "yield":
      return ((sa?.yieldRate ?? 0) - (sb?.yieldRate ?? 0)) * dir;
    case "holders":
      return ((sa?.holderCount ?? 0) - (sb?.holderCount ?? 0)) * dir;
    case "name":
      return a.name.localeCompare(b.name) * dir;
    case "change7d":
      return ((a.change7d ?? 0) - (b.change7d ?? 0)) * dir;
    default:
      return 0;
  }
}

function AssetCardSkeleton() {
  return (
    <div className="asset-card-skeleton rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.5)] p-5">
      <div className="h-10 w-[85%] max-w-md rounded-lg bg-[rgba(30,42,58,0.9)]" />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="h-12 rounded bg-[rgba(30,42,58,0.7)]" />
        <div className="h-12 rounded bg-[rgba(30,42,58,0.7)]" />
        <div className="h-12 rounded bg-[rgba(30,42,58,0.7)]" />
      </div>
      <div className="mt-4 h-8 w-full rounded bg-[rgba(30,42,58,0.7)]" />
      <div className="mt-4 h-10 w-full rounded-lg bg-[rgba(30,42,58,0.75)]" />
    </div>
  );
}

export default function DashboardAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AssetCategoryTab>("ALL");
  const [sortBy, setSortBy] = useState<string>("tvl");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function fetchAssets() {
      setLoading(true);
      try {
        setError(null);
        const base = (API_URL ?? "").trim().replace(/\/$/, "");
        if (!base) {
          setError("Failed to load assets");
          setAssets([]);
          return;
        }
        const res = await fetch(`${base}/v1/assets?limit=50&page=1`);
        const json: unknown = await res.json();
        const body = json as {
          success?: boolean;
          data?: { data?: unknown[] };
        };
        if (!res.ok || !body.success || !Array.isArray(body.data?.data)) {
          setError("Failed to load assets");
          setAssets([]);
          return;
        }
        setAssets(
          body.data!.data!.map((row) =>
            parseAssetFromApiRow(row as Record<string, unknown>),
          ),
        );
        setError(null);
      } catch {
        setError("Failed to load assets");
        setAssets([]);
      } finally {
        setLoading(false);
      }
    }
    void fetchAssets();
  }, []);

  const filteredSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = assets.filter((a) => {
      const catOk =
        selectedCategory === "ALL" || a.category === selectedCategory;
      if (!catOk) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.symbol.toLowerCase().includes(q)
      );
    });
    const sk = SORT_OPTIONS.includes(sortBy as SortKey) ? (sortBy as SortKey) : "tvl";
    list = [...list].sort((x, y) => compare(x, y, sk, sortOrder));
    return list;
  }, [assets, searchQuery, selectedCategory, sortBy, sortOrder]);

  function toggleSort(key: string) {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder(key === "name" ? "asc" : "desc");
    }
  }

  const sortLabel =
    sortBy === "tvl"
      ? "TVL"
      : sortBy === "yield"
        ? "Yield"
        : sortBy === "holders"
          ? "Holders"
          : sortBy === "change7d"
            ? "7D change"
            : "Name";

  return (
    <div className="space-y-6">
      {/* X402 NOTICE */}
      <div
        className="flex gap-3 rounded-xl border border-[rgba(0,212,255,0.2)] px-4 py-3"
        style={{ background: "rgba(0,212,255,0.05)" }}
      >
        <Info className="mt-0.5 size-5 shrink-0 text-[#00D4FF]" aria-hidden />
        <p className="text-sm leading-relaxed text-[#8892A4]">
          Basic asset data is free. Advanced analytics (yield history, risk
          details, holder intelligence) require X402 micropayment.
        </p>
      </div>

      {error ? (
        <div
          className="rounded-xl border border-[rgba(255,68,68,0.25)] px-4 py-3 text-sm text-[#FF8888]"
          style={{ background: "rgba(255,68,68,0.06)" }}
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {/* HEADER */}
      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-white">
          RWA Assets
        </h1>
        <p className="mt-1 text-sm text-[#8892A4]">
          {loading
            ? "Loading assets…"
            : `${assets.length} assets tracked`}
        </p>
      </header>

      {/* FILTER BAR */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 hidden text-[#8892A4] sm:inline-flex" aria-hidden>
            <Filter className="size-4" />
          </span>
          {CATEGORY_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCategory(key)}
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                selectedCategory === key
                  ? "bg-[rgba(0,212,255,0.15)] text-[#00D4FF] ring-1 ring-[rgba(0,212,255,0.35)]"
                  : "bg-[rgba(15,22,41,0.6)] text-[#8892A4] ring-1 ring-[rgba(30,42,58,0.8)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:max-w-xl">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#4A5568]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or symbol..."
              className="w-full rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.85)] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-[#4A5568] outline-none ring-[#00D4FF]/0 transition-[box-shadow,border-color] focus:border-[rgba(0,212,255,0.35)] focus:ring-2"
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="hidden text-xs text-[#4A5568] sm:inline">Sort</span>
            <div className="flex rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.85)] p-0.5">
              {(["tvl", "yield", "change7d", "name"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSort(key)}
                  className={[
                    "flex items-center gap-0.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    sortBy === key
                      ? "bg-[rgba(0,212,255,0.12)] text-[#00D4FF]"
                      : "text-[#8892A4] hover:text-white",
                  ].join(" ")}
                >
                  {key === "tvl"
                    ? "TVL"
                    : key === "yield"
                      ? "Yield"
                      : key === "change7d"
                        ? "7D"
                        : "Name"}
                  {sortBy === key ? (
                    sortOrder === "asc" ? (
                      <ChevronUp className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#4A5568]">
        Sorted by {sortLabel} ({sortOrder})
      </p>

      {/* GRID / LOADING / EMPTY */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <AssetCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(30,42,58,0.9)] bg-[rgba(15,22,41,0.35)] px-6 py-16 text-center">
          <SearchX className="size-12 text-[#4A5568]" aria-hidden />
          <p className="mt-4 text-lg font-semibold text-white">No assets found</p>
          <p className="mt-1 max-w-sm text-sm text-[#8892A4]">
            Try another search or category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("ALL");
            }}
            className="mt-6 rounded-lg border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.1)] px-4 py-2 text-sm font-medium text-[#00D4FF] transition-colors hover:bg-[rgba(0,212,255,0.16)]"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSorted.map((asset) => {
            const snapshot = asset.snapshots?.[0];
            const tvl = snapshot?.tvl ?? 0;
            const yieldRate = snapshot?.yieldRate ?? 0;
            const holderCount = snapshot?.holderCount ?? 0;
            const riskScore = toRiskLevel(asset.riskScores?.[0]?.overallScore);
            const accent = categoryAccent(asset.category);
            const change7d = asset.change7d ?? 0;
            const up = change7d >= 0;
            const protocolLabel = asset.protocol.trim() ? asset.protocol : "—";
            return (
              <article
                key={asset.id}
                className="group flex flex-col rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.65)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[rgba(0,212,255,0.45)] hover:shadow-[0_0_24px_rgba(0,212,255,0.12)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className="size-11 shrink-0 rounded-full ring-2 ring-white/10"
                      style={{ background: accent }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <h2 className="truncate font-bold text-white">{asset.name}</h2>
                      <p className="text-sm text-[#8892A4]">{asset.symbol}</p>
                    </div>
                  </div>
                  <RiskBadge level={riskScore} showDot />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[rgba(30,42,58,0.6)] pt-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8892A4]">
                      TVL
                    </p>
                    <p className="mt-1 text-sm font-bold tabular-nums text-white">
                      {formatTvl(tvl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8892A4]">
                      Yield
                    </p>
                    <p className="mt-1 text-sm font-bold tabular-nums text-[#00FF88]">
                      {formatYieldFraction(yieldRate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8892A4]">
                      Holders
                    </p>
                    <p className="mt-1 text-sm font-bold tabular-nums text-white">
                      {formatHolders(holderCount)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[rgba(30,42,58,0.6)] pt-4 text-sm">
                  <span className="font-medium text-white">{protocolLabel}</span>
                  <span className="rounded-full border border-[rgba(30,42,58,0.9)] bg-[rgba(10,14,26,0.5)] px-2 py-0.5 text-[11px] font-medium text-[#8892A4]">
                    {categoryPillLabel(asset.category)}
                  </span>
                  <span
                    className={`ml-auto font-semibold tabular-nums ${up ? "text-[#00FF88]" : "text-[#FF4444]"}`}
                  >
                    {formatChange7d(change7d)}
                  </span>
                </div>

                <Link
                  href={`/dashboard/assets/${asset.id}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.08)] py-2.5 text-sm font-semibold text-[#00D4FF] transition-colors hover:bg-[rgba(0,212,255,0.14)]"
                >
                  View Details →
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
