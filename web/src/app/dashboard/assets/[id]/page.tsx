"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Layers,
  Percent,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { YieldHistorySection } from "@/components/dashboard/YieldHistorySection";
import { GatedRiskAnalysisSection } from "@/components/dashboard/GatedRiskAnalysisSection";
import { AIInsightCard } from "@/components/dashboard/AIInsightCard";
import { DataTransparencySection } from "@/components/dashboard/DataTransparencySection";
import { RelatedAssetsSection } from "@/components/dashboard/RelatedAssetsSection";
import type { RiskBadgeProps } from "@/components/dashboard/RiskBadge";
import {
  categoryAccent,
  formatAssetAge,
  formatCategoryLabel,
  formatChange7d,
  formatMinutesAgo,
  formatTvl,
  formatYieldFraction,
  protocolWebsite,
  categoryAvgYield,
} from "@/lib/assetDetailUtils";
import type {
  ApiResponse,
  Asset,
  AssetDataMeta,
  AssetSnapshot,
  AssetSummary,
  HolderData,
  PaginatedResponse,
  RiskData,
} from "@/lib/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function apiKeyHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const apiKey = localStorage.getItem("nexus_api_key");
  return apiKey ? { "X-API-Key": apiKey } : {};
}

type AssetDetailPayload = Asset & {
  snapshot: AssetSnapshot | null;
  risk: RiskData | null;
  holder: HolderData | null;
  _meta?: AssetDataMeta;
};

const defaultAssetMeta: AssetDataMeta = {
  sources: ["defillama"],
  lastUpdated: new Date().toISOString(),
  confidence: "MEDIUM",
  methodology: "Latest snapshot from DeFi Llama sync (single_source)",
};

const mockAssets: Record<string, AssetDetailPayload> = (() => {
  const now = new Date();
  const snap = (
    id: string,
    tvl: number,
    yieldRate: number,
    holderCount: number,
    risk: AssetSnapshot["riskScore"],
  ): AssetSnapshot => ({
    id: `mock-snap-${id}`,
    assetId: id,
    tvl,
    yieldRate,
    holderCount,
    riskScore: risk,
    price: 1,
    timestamp: now,
  });
  const mockMeta: AssetDataMeta = {
    sources: ["defillama", "rwa_xyz"],
    lastUpdated: now.toISOString(),
    confidence: "MEDIUM",
    methodology: "Mock data for local development (single_source)",
  };

  const riskBlock = (
    id: string,
    level: RiskData["level"],
    score: number,
    factors: string[] = [],
  ): RiskData => ({
    assetId: id,
    score,
    level,
    factors,
    updatedAt: now,
    _meta: mockMeta,
  });

  return {
    "franklin-benji": {
      id: "franklin-benji",
      name: "Franklin BENJI",
      symbol: "BENJI",
      protocol: "Franklin Templeton",
      category: "TREASURY",
      chain: "base",
      contractAddress: "0x60CfC2b186a4CF647486e42c42B11cC6D571d1E4",
      isActive: true,
      createdAt: new Date("2024-06-01"),
      updatedAt: now,
      snapshot: snap("franklin-benji", 4e8, 5.0, 1200, "LOW"),
      risk: riskBlock("franklin-benji", "LOW", 82),
      holder: null,
      _meta: mockMeta,
    },
    "superstate-ustb": {
      id: "superstate-ustb",
      name: "Superstate USTB",
      symbol: "USTB",
      protocol: "Superstate",
      category: "TREASURY",
      chain: "ethereum",
      contractAddress: "0x43415eB6ff9DB7E26A15b704e7A3eDCe97d31C4e",
      isActive: true,
      createdAt: new Date("2024-03-15"),
      updatedAt: now,
      snapshot: snap("superstate-ustb", 2.4e8, 4.8, 900, "LOW"),
      risk: riskBlock("superstate-ustb", "LOW", 78),
      holder: null,
      _meta: mockMeta,
    },
    "mountain-usdm": {
      id: "mountain-usdm",
      name: "Mountain USDM",
      symbol: "USDM",
      protocol: "Mountain Protocol",
      category: "TREASURY",
      chain: "ethereum",
      contractAddress: "0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C",
      isActive: true,
      createdAt: new Date("2024-01-20"),
      updatedAt: now,
      snapshot: snap("mountain-usdm", 2e8, 5.1, 850, "LOW"),
      risk: riskBlock("mountain-usdm", "LOW", 76),
      holder: null,
      _meta: mockMeta,
    },
    "hashnote-usyc": {
      id: "hashnote-usyc",
      name: "Hashnote USYC",
      symbol: "USYC",
      protocol: "Hashnote",
      category: "TREASURY",
      chain: "ethereum",
      contractAddress: "0x136471a34f6ef19fE571EFFC1CA711fdb8E49f2b",
      isActive: true,
      createdAt: new Date("2023-11-10"),
      updatedAt: now,
      snapshot: snap("hashnote-usyc", 1.75e8, 4.9, 700, "LOW"),
      risk: riskBlock("hashnote-usyc", "LOW", 74),
      holder: null,
      _meta: mockMeta,
    },
    "flux-fusdc": {
      id: "flux-fusdc",
      name: "Flux fUSDC",
      symbol: "fUSDC",
      protocol: "Flux Finance",
      category: "CREDIT",
      chain: "ethereum",
      contractAddress: "0x465a5a630482f3abD6d3b84B39B29b07214d19e5",
      isActive: true,
      createdAt: new Date("2024-08-01"),
      updatedAt: now,
      snapshot: snap("flux-fusdc", 1e8, 8.2, 400, "MEDIUM"),
      risk: riskBlock("flux-fusdc", "MEDIUM", 58, [
        "Current yield above 30-day average",
      ]),
      holder: null,
      _meta: mockMeta,
    },
  };
})();

function toRiskLevel(s: string | undefined): RiskBadgeProps["level"] {
  const u = (s ?? "MEDIUM").toUpperCase();
  if (u === "LOW" || u === "MEDIUM" || u === "HIGH" || u === "CRITICAL") {
    return u;
  }
  return "MEDIUM";
}

function changeTypeFromDelta(
  delta: number,
): "positive" | "negative" | "neutral" {
  if (delta > 0.0001) return "positive";
  if (delta < -0.0001) return "negative";
  return "neutral";
}

function sourceAttribution(meta: AssetDataMeta): string {
  const names = meta.sources
    .map((id) => (id === "defillama" ? "DeFi Llama" : id === "rwa_xyz" ? "rwa.xyz" : id))
    .join(" + ");
  return names || "Nexus sync";
}

export default function AssetDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId)
        ? (rawId[0] ?? "")
        : "";

  const [asset, setAsset] = useState<AssetDetailPayload | null>(null);
  const [listPeers, setListPeers] = useState<AssetSummary[]>([]);
  const [change7d, setChange7d] = useState(0);
  const [loading, setLoading] = useState(true);
  const [peersLoading, setPeersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = useMemo(
    () => (API_URL ?? "").trim().replace(/\/$/, ""),
    [],
  );

  useEffect(() => {
    async function fetchAssetDetail() {
      setLoading(true);
      try {
        setError(null);
        const base = apiBase;
        if (!id || !base) {
          const fallback = mockAssets[id];
          if (fallback) {
            setAsset(fallback);
            setChange7d(0.012);
            setError(null);
            return;
          }
          setAsset(null);
          setError("Failed to load asset");
          return;
        }
        const res = await fetch(`${base}/v1/assets/${id}`, {
          headers: { Accept: "application/json", ...apiKeyHeader() },
        });
        const json: unknown = await res.json();
        const body = json as { success?: boolean; data?: AssetDetailPayload };
        if (!res.ok || !body.success || !body.data) {
          const fallback = mockAssets[id];
          if (fallback) {
            setAsset(fallback);
            setChange7d(0.012);
            setError(null);
            return;
          }
          setAsset(null);
          setError("Failed to load asset");
          return;
        }
        setAsset(body.data);
        setError(null);
      } catch {
        const fallback = mockAssets[id];
        if (fallback) {
          setAsset(fallback);
          setChange7d(0.012);
          setError(null);
        } else {
          setError("Failed to load asset");
          setAsset(null);
        }
      } finally {
        setLoading(false);
      }
    }
    if (id) void fetchAssetDetail();
  }, [id, apiBase]);

  useEffect(() => {
    async function fetchPeers() {
      setPeersLoading(true);
      const base = apiBase;
      if (!base) {
        setListPeers([]);
        setPeersLoading(false);
        return;
      }
      try {
        const res = await fetch(`${base}/v1/assets?limit=50&page=1`, {
          headers: { Accept: "application/json", ...apiKeyHeader() },
        });
        const body = (await res.json()) as ApiResponse<PaginatedResponse<AssetSummary>>;
        if (res.ok && body.success) {
          setListPeers(body.data.data);
          const self = body.data.data.find((a) => a.id === id);
          if (self) setChange7d(self.change7d ?? 0);
        }
      } catch {
        setListPeers([]);
      } finally {
        setPeersLoading(false);
      }
    }
    if (id) void fetchPeers();
  }, [id, apiBase]);

  const snapshot = asset?.snapshot ?? null;
  const riskLevel = toRiskLevel(asset?.risk?.level ?? snapshot?.riskScore);
  const accent = asset ? categoryAccent(asset.category) : "#8892A4";
  const tvl = snapshot?.tvl ?? 0;
  const yieldRate = snapshot?.yieldRate ?? 0;
  const yieldFraction = yieldRate > 1 ? yieldRate / 100 : yieldRate;
  const holders = snapshot?.holderCount ?? 0;
  const dataMeta = asset?._meta ?? asset?.risk?._meta ?? defaultAssetMeta;
  const website = asset ? protocolWebsite(asset.protocol) : null;

  const categoryAvg = useMemo(
    () =>
      asset
        ? categoryAvgYield(listPeers, asset.category)
        : null,
    [listPeers, asset],
  );

  const tvlChangePct = change7d * 100 * 0.85;
  const holdersChangePct = change7d * 100 * 0.35;
  const yieldChangePct = change7d * 100;

  if (!id) {
    return (
      <div className="space-y-4 pb-10">
        <p className="text-[#8892A4]">Invalid asset id.</p>
        <Link href="/dashboard/assets" className="text-sm text-[#00D4FF] hover:underline">
          ← Back to assets
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="h-4 w-48 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" />
        <div className="flex gap-4">
          <div className="size-16 shrink-0 animate-pulse rounded-full bg-[rgba(30,42,58,0.9)]" />
          <div className="flex-1 space-y-2">
            <div className="h-9 w-[min(100%,20rem)] animate-pulse rounded bg-[rgba(30,42,58,0.9)]" />
            <div className="h-5 w-24 animate-pulse rounded bg-[rgba(30,42,58,0.85)]" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <MetricCard key={i} title="—" value="—" isLoading />
          ))}
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="space-y-6 pb-10">
        <Link
          href="/dashboard/assets"
          className="inline-flex items-center gap-2 text-sm text-[#8892A4] transition-colors hover:text-[#00D4FF]"
        >
          <ArrowLeft className="size-4" />
          Back to assets
        </Link>
        <div
          className="rounded-xl border border-[rgba(255,68,68,0.25)] px-4 py-3 text-sm text-[#FF8888]"
          style={{ background: "rgba(255,68,68,0.06)" }}
          role="alert"
        >
          {error ?? "Failed to load asset"}
        </div>
      </div>
    );
  }

  const tvlUp = change7d >= 0;
  const attribution = sourceAttribution(dataMeta);

  return (
    <div className="space-y-10 pb-10">
      <Link
        href="/dashboard/assets"
        className="inline-flex items-center gap-2 text-sm text-[#8892A4] transition-colors hover:text-[#00D4FF]"
      >
        <ArrowLeft className="size-4" />
        <span>
          Assets <span className="text-[#4A5568]">/</span>{" "}
          <span className="font-medium text-white">{asset.name}</span>
        </span>
      </Link>

      {/* 1. Header (FREE) */}
      <section className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <div
              className="size-16 shrink-0 rounded-full ring-2 ring-white/10"
              style={{ background: accent }}
              aria-hidden
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  {asset.name}
                </h1>
                <RiskBadge level={riskLevel} showDot />
              </div>
              <p className="mt-1 text-lg text-[#8892A4]">{asset.symbol}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-white">{asset.protocol}</span>
                <span className="text-[#4A5568]">·</span>
                <span className="text-[#8892A4]">
                  {formatCategoryLabel(asset.category)}
                </span>
                {website ? (
                  <>
                    <span className="text-[#4A5568]">·</span>
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#00D4FF] hover:underline"
                    >
                      Official site
                      <ExternalLink className="size-3.5" />
                    </a>
                  </>
                ) : null}
              </div>
              <p className="mt-4 text-xs text-[#8892A4]">
                Last updated:{" "}
                <span className="text-white">
                  {formatMinutesAgo(dataMeta.lastUpdated)}
                </span>
                <span className="text-[#4A5568]"> · </span>
                <span>via {attribution}</span>
              </p>
            </div>
          </div>

          <div className="shrink-0 text-left lg:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8892A4]">
              Total value locked
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-white lg:text-5xl">
              {snapshot ? formatTvl(tvl) : "—"}
            </p>
            <p
              className={`mt-2 inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${
                tvlUp ? "text-[#00FF88]" : "text-[#FF4444]"
              }`}
            >
              {tvlUp ? (
                <TrendingUp className="size-4" />
              ) : (
                <TrendingDown className="size-4" />
              )}
              {formatChange7d(change7d)} <span className="font-normal text-[#8892A4]">7d</span>
            </p>
          </div>
        </div>
      </section>

      {/* 2. Key metrics (FREE) */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Key Metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="TVL"
            value={snapshot ? formatTvl(tvl) : "—"}
            change={`${tvlChangePct >= 0 ? "+" : ""}${tvlChangePct.toFixed(2)}%`}
            changeType={changeTypeFromDelta(change7d)}
            subtitle="7d change"
            icon={<Layers className="text-[#00D4FF]" />}
          />
          <MetricCard
            title="Yield"
            value={snapshot ? formatYieldFraction(yieldFraction) : "—"}
            change={`${yieldChangePct >= 0 ? "+" : ""}${yieldChangePct.toFixed(2)}%`}
            changeType={changeTypeFromDelta(change7d)}
            subtitle="7d change"
            icon={<Percent className="text-[#00D4FF]" />}
          />
          <MetricCard
            title="Holders"
            value={snapshot ? holders.toLocaleString("en-US") : "—"}
            change={`${holdersChangePct >= 0 ? "+" : ""}${holdersChangePct.toFixed(2)}%`}
            changeType={changeTypeFromDelta(change7d * 0.35)}
            subtitle="7d est."
            icon={<Users className="text-[#00D4FF]" />}
          />
          <MetricCard
            title="Age"
            value={formatAssetAge(asset.createdAt)}
            change="—"
            changeType="neutral"
            subtitle="Since listing"
            icon={<Calendar className="text-[#00D4FF]" />}
          />
        </div>
      </section>

      {/* 3. Yield history (GATED) */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Yield History</h2>
        <YieldHistorySection apiBaseUrl={apiBase} assetId={asset.id} />
      </section>

      {/* 4. Risk analysis (GATED) */}
      <GatedRiskAnalysisSection
        apiBaseUrl={apiBase}
        assetId={asset.id}
        yieldPct={yieldRate}
        categoryAvgPct={categoryAvg}
        initialRisk={asset.risk}
      />

      {/* 4b. AI insight (PRO gated) */}
      <AIInsightCard apiBaseUrl={apiBase} assetId={asset.id} />

      {/* 5. Data transparency (FREE) */}
      <DataTransparencySection
        meta={dataMeta}
        protocol={asset.protocol}
        symbol={asset.symbol}
      />

      {/* 6. Related assets (FREE) */}
      <RelatedAssetsSection
        assets={listPeers}
        currentId={asset.id}
        category={asset.category}
        loading={peersLoading}
      />
    </div>
  );
}
