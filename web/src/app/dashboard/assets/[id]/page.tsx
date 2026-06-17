"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  GitCompareArrows,
  Layers,
  Lock,
  Percent,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { ComplianceInfoSection } from "@/components/dashboard/ComplianceInfoSection";
import { LiquidityInfoSection } from "@/components/dashboard/LiquidityInfoSection";
import { ReserveInfoSection } from "@/components/dashboard/ReserveInfoSection";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { YieldHistorySection } from "@/components/dashboard/YieldHistorySection";
import { GatedRiskAnalysisSection } from "@/components/dashboard/GatedRiskAnalysisSection";
import { AIInsightCard } from "@/components/dashboard/AIInsightCard";
import { RelatedAssetsSection } from "@/components/dashboard/RelatedAssetsSection";
import { AssetGradeCard } from "@/components/dashboard/AssetGradeCard";
import { DataQualityPanel } from "@/components/dashboard/DataQualityPanel";
import { AssetSourcesTab } from "@/components/dashboard/asset-tabs/AssetSourcesTab";
import type { RiskBadgeProps } from "@/components/dashboard/RiskBadge";
import {
  fetchAsset,
  fetchAssetFull,
  fetchAssetList,
  formatTvl,
  formatYield,
} from "@/lib/api/assets";
import {
  getProtocolLabel,
  normalizeCategory,
  normalizeRiskLevel,
  toAssetSummaries,
} from "@/lib/asset-mapper";
import {
  categoryAccent,
  formatAssetAge,
  formatCategoryLabel,
  formatChange7d,
  formatMinutesAgo,
  categoryAvgYield,
} from "@/lib/assetDetailUtils";
import type { AssetDataMeta, AssetSummary, RiskData } from "@/lib/shared";
import type { AssetWithLayers } from "@/types/asset";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// NOTE: This page intentionally uses a wallet-aware full asset loader.
// Keep this key in sync with web/src/lib/api/assets.ts until all API helpers
// are migrated to a wallet-aware client interceptor.
const WALLET_STORAGE_KEY = "nexus_wallet_address";

type AssetTabId =
  | "overview"
  | "issuer"
  | "reserve"
  | "market"
  | "liquidity"
  | "blockchain"
  | "risk"
  | "sources"
  | "events";

const ASSET_TABS: { id: AssetTabId; label: string; layers: string }[] = [
  { id: "overview", label: "Overview", layers: "Summary + Grade" },
  { id: "issuer", label: "Issuer & Legal", layers: "Identity · Institutional · Compliance" },
  { id: "reserve", label: "Reserve", layers: "Reserve & custody" },
  { id: "market", label: "Market & Yield", layers: "Market · Yield" },
  { id: "liquidity", label: "Liquidity", layers: "Redemption & exit" },
  { id: "blockchain", label: "Blockchain", layers: "Contracts & chains" },
  { id: "risk", label: "Risk & Grade", layers: "Risk · Grade" },
  { id: "sources", label: "Sources", layers: "Evidence trail" },
  { id: "events", label: "Events", layers: "Timeline" },
];

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

function marketMeta(asset: AssetWithLayers): AssetDataMeta {
  const sources = asset.market?.sources?.length
    ? asset.market.sources
    : ["defillama"];
  const confidence =
    asset.market?.confidence === "HIGH" ||
    asset.market?.confidence === "LOW"
      ? asset.market.confidence
      : "MEDIUM";
  return {
    sources,
    lastUpdated: asset.market?.lastUpdated ?? new Date().toISOString(),
    confidence,
    methodology: "12-layer schema",
  };
}

function legacyRiskForGated(
  asset: AssetWithLayers,
  meta: AssetDataMeta,
): RiskData | null {
  if (!asset.risk) return null;
  const level = normalizeRiskLevel(asset.risk.overallLevel);
  const mapped: RiskData["level"] =
    level === "CRITICAL" || level === "HIGH"
      ? "HIGH"
      : level === "LOW"
        ? "LOW"
        : "MEDIUM";
  return {
    assetId: asset.slug,
    score: asset.risk.overallScore ?? 50,
    level: mapped,
    factors: asset.risk.riskFactors ?? [],
    updatedAt: asset.risk.lastAssessed ?? null,
    _meta: meta,
  };
}

function sourceAttribution(meta: AssetDataMeta): string {
  const names = meta.sources
    .map((id) =>
      id === "defillama" ? "DeFi Llama" : id === "rwa_xyz" ? "rwa.xyz" : id,
    )
    .join(" + ");
  return names || "Nexus sync";
}

function displayValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? value.toLocaleString("en-US") : "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return String(value);
}

function formatEnumLabel(value?: string | null): string | null {
  if (!value) return null;
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function FieldRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.45)] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8892A4]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-white">
        {displayValue(value)}
      </p>
    </div>
  );
}

function SectionShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-[#8892A4]">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

type LayerStatus = "complete" | "partial" | "pro" | "missing";

function statusClass(status: LayerStatus): string {
  if (status === "complete") return "text-[#00FF88] bg-[rgba(0,255,136,0.08)] border-[rgba(0,255,136,0.25)]";
  if (status === "pro") return "text-[#00D4FF] bg-[rgba(0,212,255,0.08)] border-[rgba(0,212,255,0.25)]";
  if (status === "partial") return "text-[#FFB800] bg-[rgba(255,184,0,0.08)] border-[rgba(255,184,0,0.25)]";
  return "text-[#8892A4] bg-[rgba(136,146,164,0.06)] border-[rgba(136,146,164,0.18)]";
}

function statusIcon(status: LayerStatus) {
  if (status === "complete") return <CheckCircle2 className="size-4" />;
  if (status === "pro") return <Lock className="size-4" />;
  return <CircleDashed className="size-4" />;
}

function LayerCompletenessMatrix({ asset }: { asset: AssetWithLayers }) {
  const rows: { layer: string; status: LayerStatus; note: string }[] = [
    { layer: "Identity", status: asset.identity ? "complete" : "missing", note: "Public profile" },
    { layer: "Institutional", status: asset.institutional ? "complete" : "pro", note: "Issuer and structure" },
    { layer: "Compliance", status: asset.compliance ? "complete" : "partial", note: "KYC and restrictions" },
    { layer: "Reserve", status: asset.reserve ? "complete" : "pro", note: "Backing and custody" },
    { layer: "Blockchain", status: asset.blockchain?.length ? "complete" : "partial", note: "Chains and contracts" },
    { layer: "Liquidity", status: asset.liquidity ? "complete" : "pro", note: "Redemption and exit" },
    { layer: "Market", status: asset.market ? "complete" : "missing", note: "TVL, holders, price" },
    { layer: "Yield", status: asset.yield?.currentYield != null ? "complete" : "partial", note: "Current and history" },
    { layer: "Risk", status: asset.risk ? "complete" : "pro", note: "Factors and score" },
    { layer: "Sources", status: "pro", note: "Field-level trail" },
    { layer: "Events", status: "missing", note: "Timeline planned" },
    { layer: "Grade", status: asset.grade ? "complete" : "partial", note: "Baseline score" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <div
          key={row.layer}
          className={`rounded-lg border px-4 py-3 ${statusClass(row.status)}`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">{row.layer}</p>
            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide">
              {statusIcon(row.status)}
              {row.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#8892A4]">{row.note}</p>
        </div>
      ))}
    </div>
  );
}

function BlockchainTab({ asset }: { asset: AssetWithLayers }) {
  const rows = asset.blockchain ?? [];
  if (!rows.length) {
    return (
      <SectionShell title="Blockchain" subtitle="Chains, contracts, token standard, verification, and transfer controls">
        <p className="text-sm text-[#8892A4]">Blockchain deployment data is not available for this asset yet.</p>
      </SectionShell>
    );
  }

  return (
    <SectionShell title="Blockchain" subtitle="Chains, contracts, token standard, verification, and transfer controls">
      <div className="overflow-x-auto rounded-lg border border-[rgba(30,42,58,0.8)]">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.5)] text-[#8892A4]">
              <th className="px-4 py-2.5">Chain</th>
              <th className="px-4 py-2.5">Contract</th>
              <th className="px-4 py-2.5">Standard</th>
              <th className="px-4 py-2.5">Verified</th>
              <th className="px-4 py-2.5">Whitelist</th>
              <th className="px-4 py-2.5">Restrictions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.chain}-${row.contractAddress}`} className="border-b border-[rgba(30,42,58,0.5)] last:border-0">
                <td className="px-4 py-3 font-medium text-white">{row.chain}</td>
                <td className="px-4 py-3 font-mono text-xs text-[#00D4FF]">
                  {row.explorerUrl ? (
                    <a href={row.explorerUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {row.contractAddress}
                    </a>
                  ) : row.contractAddress}
                </td>
                <td className="px-4 py-3 text-[#8892A4]">{displayValue(row.tokenStandard)}</td>
                <td className="px-4 py-3 text-[#8892A4]">{displayValue(row.isVerified)}</td>
                <td className="px-4 py-3 text-[#8892A4]">{displayValue(row.hasWhitelist)}</td>
                <td className="px-4 py-3 text-[#8892A4]">{displayValue(row.hasTransferRestrictions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

export default function AssetDetailPage() {
  const params = useParams();
  const { address } = useAccount();
  const rawId = params?.id;
  const slug =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId)
        ? (rawId[0] ?? "")
        : "";

  const [asset, setAsset] = useState<AssetWithLayers | null>(null);
  const [listPeers, setListPeers] = useState<AssetSummary[]>([]);
  const [change7d, setChange7d] = useState(0);
  const [loading, setLoading] = useState(true);
  const [peersLoading, setPeersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AssetTabId>("overview");

  const apiBase = useMemo(
    () => (API_URL ?? "").trim().replace(/\/$/, ""),
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (address) {
      localStorage.setItem(WALLET_STORAGE_KEY, address);
    } else {
      localStorage.removeItem(WALLET_STORAGE_KEY);
    }
  }, [address]);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setLoading(true);
      try {
        setError(null);
        const base = await fetchAsset(slug);
        setAsset(base);
        setChange7d((base.market?.tvl7dChange ?? 0) / 100);

        try {
          const full = await fetchAssetFull(slug);
          setAsset((prev) =>
            prev
              ? {
                  ...prev,
                  ...full,
                  reserve: full.reserve ?? prev.reserve,
                  institutional: full.institutional ?? prev.institutional,
                  aiNarrative: full.aiNarrative ?? prev.aiNarrative,
                  grade: full.grade ?? prev.grade,
                }
              : full,
          );
        } catch {
          // PRO /full optional — FREE layers already loaded
        }
      } catch {
        setError("Failed to load asset");
        setAsset(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [slug, address]);

  useEffect(() => {
    async function loadPeers() {
      setPeersLoading(true);
      try {
        const { assets } = await fetchAssetList({ limit: 50, page: 1 });
        const summaries = toAssetSummaries(assets);
        setListPeers(summaries);
        const self = summaries.find((a) => a.id === slug);
        if (self) setChange7d(self.change7d ?? 0);
      } catch {
        setListPeers([]);
      } finally {
        setPeersLoading(false);
      }
    }
    if (slug) void loadPeers();
  }, [slug]);

  const category = asset
    ? normalizeCategory(asset.identity?.category)
    : "TREASURY";
  const riskLevel = toRiskLevel(normalizeRiskLevel(asset?.risk?.overallLevel));
  const accent = asset ? categoryAccent(category) : "#8892A4";
  const dataMeta = asset ? marketMeta(asset) : undefined;
  const website = asset?.identity?.websiteUrl ?? null;
  const yieldPct = asset?.yield?.currentYield;
  const yieldFraction =
    yieldPct != null && Number.isFinite(yieldPct) ? yieldPct / 100 : 0;

  const categoryAvg = useMemo(
    () => (asset ? categoryAvgYield(listPeers, category) : null),
    [listPeers, asset, category],
  );

  const tvlChangePct = change7d * 100 * 0.85;
  const holdersChangePct = change7d * 100 * 0.35;
  const yieldChangePct = change7d * 100;

  if (!slug) {
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

  if (error || !asset || !dataMeta) {
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
  const displayName = asset.identity?.name ?? asset.slug;
  const protocol = getProtocolLabel(asset);
  const launchDate = asset.identity?.launchDate;
  const gradeContext = asset.grade?.gradeContext ?? null;
  const claimTypeLabel = formatEnumLabel(asset.grade?.claimType);
  const publicSegment = asset.grade?.publicSegment ?? null;
  const reserveScoreLabel = asset.grade?.reserveScore == null ? null : `Reserve ${asset.grade.reserveScore}/100`;

  return (
    <div className="space-y-8 pb-10">
      <Link
        href="/dashboard/assets"
        className="inline-flex items-center gap-2 text-sm text-[#8892A4] transition-colors hover:text-[#00D4FF]"
      >
        <ArrowLeft className="size-4" />
        <span>
          Assets <span className="text-[#4A5568]">/</span>{" "}
          <span className="font-medium text-white">{displayName}</span>
        </span>
      </Link>

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
                  {displayName}
                </h1>
                <RiskBadge level={riskLevel} showDot />
                {asset.compliance?.kycRequired ? (
                  <span className="rounded-md border border-[rgba(255,184,0,0.35)] bg-[rgba(255,184,0,0.08)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FFB800]">
                    KYC Required
                  </span>
                ) : null}
                {asset.grade ? (
                  <span className="rounded-md border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.08)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#00D4FF]">
                    {asset.grade.grade} · {asset.grade.score}/100
                  </span>
                ) : null}
                {gradeContext ? (
                  <span className="rounded-md border border-[rgba(0,255,136,0.28)] bg-[rgba(0,255,136,0.08)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#00FF88]">
                    {gradeContext}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-lg text-[#8892A4]">
                {asset.identity?.symbol ?? "—"}
              </p>
              {(claimTypeLabel || publicSegment || reserveScoreLabel) ? (
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  {claimTypeLabel ? (
                    <span className="rounded-full border border-[rgba(30,42,58,0.9)] bg-[rgba(10,14,26,0.55)] px-3 py-1 text-[#C9D4E5]">
                      Claim: {claimTypeLabel}
                    </span>
                  ) : null}
                  {publicSegment ? (
                    <span className="rounded-full border border-[rgba(30,42,58,0.9)] bg-[rgba(10,14,26,0.55)] px-3 py-1 text-[#C9D4E5]">
                      Segment: {publicSegment}
                    </span>
                  ) : null}
                  {reserveScoreLabel ? (
                    <span className="rounded-full border border-[rgba(30,42,58,0.9)] bg-[rgba(10,14,26,0.55)] px-3 py-1 text-[#C9D4E5]">
                      {reserveScoreLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-white">{protocol}</span>
                <span className="text-[#4A5568]">·</span>
                <span className="text-[#8892A4]">
                  {formatCategoryLabel(category)}
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
              <div className="mt-5">
                <Link
                  href={`/dashboard/compare?assets=${asset.slug}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#00D1FF]/25 bg-[#00D1FF]/[0.06] px-4 py-2 text-sm font-semibold text-[#8DEBFF] transition hover:border-[#00D4FF] hover:text-white"
                >
                  <GitCompareArrows className="size-4" />
                  Compare with another asset
                </Link>
              </div>
              <p className="mt-4 text-xs text-[#8892A4]">
                Last updated: <span className="text-white">{formatMinutesAgo(dataMeta.lastUpdated)}</span>
                <span className="text-[#4A5568]"> · </span>
                <span>via {attribution}</span>
                <span className="text-[#4A5568]"> · </span>
                <Link href="/methodology" className="text-[#00D4FF] hover:underline">Methodology</Link>
              </p>
            </div>
          </div>

          <div className="shrink-0 text-left lg:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8892A4]">
              Total value locked
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-white lg:text-5xl">
              {formatTvl(asset.market?.tvl)}
            </p>
            <p
              className={`mt-2 inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${
                tvlUp ? "text-[#00FF88]" : "text-[#FF4444]"
              }`}
            >
              {tvlUp ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              {formatChange7d(change7d)} <span className="font-normal text-[#8892A4]">7d</span>
            </p>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.42)] p-2">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {ASSET_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "min-w-fit rounded-lg px-3 py-2 text-left transition-colors",
                activeTab === tab.id
                  ? "bg-[rgba(0,212,255,0.12)] text-[#00D4FF] ring-1 ring-[rgba(0,212,255,0.28)]"
                  : "text-[#8892A4] hover:bg-[rgba(255,255,255,0.04)] hover:text-white",
              ].join(" ")}
            >
              <span className="block text-xs font-semibold">{tab.label}</span>
              <span className="mt-0.5 hidden text-[10px] text-[#4A5568] sm:block">{tab.layers}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Key Metrics</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="TVL"
                value={formatTvl(asset.market?.tvl)}
                change={`${tvlChangePct >= 0 ? "+" : ""}${tvlChangePct.toFixed(2)}%`}
                changeType={changeTypeFromDelta(change7d)}
                subtitle="7d change"
                icon={<Layers className="text-[#00D4FF]" />}
              />
              <MetricCard
                title="Yield"
                value={formatYield(asset.yield?.currentYield)}
                change={`${yieldChangePct >= 0 ? "+" : ""}${yieldChangePct.toFixed(2)}%`}
                changeType={changeTypeFromDelta(change7d)}
                subtitle="7d change"
                icon={<Percent className="text-[#00D4FF]" />}
              />
              <MetricCard
                title="Holders"
                value={
                  asset.market?.holderCount != null
                    ? asset.market.holderCount.toLocaleString("en-US")
                    : "—"
                }
                change={`${holdersChangePct >= 0 ? "+" : ""}${holdersChangePct.toFixed(2)}%`}
                changeType={changeTypeFromDelta(change7d * 0.35)}
                subtitle="7d est."
                icon={<Users className="text-[#00D4FF]" />}
              />
              <MetricCard
                title="Age"
                value={launchDate ? formatAssetAge(launchDate) : "—"}
                change="—"
                changeType="neutral"
                subtitle="Since launch"
                icon={<Calendar className="text-[#00D4FF]" />}
              />
            </div>
          </section>

          <DataQualityPanel asset={asset} />

          <AssetGradeCard grade={asset.grade} />

          <SectionShell title="Layer completeness" subtitle="12-layer coverage status for this asset">
            <LayerCompletenessMatrix asset={asset} />
          </SectionShell>

          <AIInsightCard apiBaseUrl={apiBase} assetId={asset.slug} />
        </div>
      ) : null}

      {activeTab === "issuer" ? (
        <div className="space-y-6">
          <SectionShell title="Identity" subtitle="Core public profile, official references, and asset classification">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <FieldRow label="Name" value={asset.identity?.name} />
              <FieldRow label="Symbol" value={asset.identity?.symbol} />
              <FieldRow label="Full name" value={asset.identity?.fullName} />
              <FieldRow label="Category" value={asset.identity?.category} />
              <FieldRow label="Subcategory" value={asset.identity?.subcategory} />
              <FieldRow label="Launch date" value={asset.identity?.launchDate} />
              <FieldRow label="Asset class" value={formatEnumLabel(asset.grade?.assetClass)} />
              <FieldRow label="Claim type" value={formatEnumLabel(asset.grade?.claimType)} />
              <FieldRow label="Public segment" value={asset.grade?.publicSegment} />
              <FieldRow label="Tags" value={asset.identity?.tags} />
            </div>
            {asset.identity?.description ? (
              <p className="mt-4 text-sm leading-relaxed text-[#8892A4]">{asset.identity.description}</p>
            ) : null}
          </SectionShell>

          <SectionShell title="Institutional" subtitle="Issuer, structure, target investors, and institutional counterparties">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <FieldRow label="Issuer" value={asset.institutional?.issuerName} />
              <FieldRow label="Issuer type" value={asset.institutional?.issuerType} />
              <FieldRow label="Issuer country" value={asset.institutional?.issuerCountry} />
              <FieldRow label="Legal structure" value={asset.institutional?.legalStructure} />
              <FieldRow label="Target investors" value={asset.institutional?.targetInvestors} />
            </div>
          </SectionShell>

          <SectionShell title="Compliance" subtitle="Regulatory and access requirements">
            <ComplianceInfoSection compliance={asset.compliance} />
          </SectionShell>
        </div>
      ) : null}

      {activeTab === "reserve" ? (
        <SectionShell title="Reserve & backing" subtitle="Custodian, collateralization, audit trail, and proof-of-reserves">
          <ReserveInfoSection apiBaseUrl={apiBase} assetSlug={asset.slug} reserve={asset.reserve} />
        </SectionShell>
      ) : null}

      {activeTab === "market" ? (
        <div className="space-y-6">
          <SectionShell title="Market" subtitle="TVL, price, holders, supply, and adoption signals">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FieldRow label="TVL" value={formatTvl(asset.market?.tvl)} />
              <FieldRow label="7D TVL change" value={asset.market?.tvl7dChange != null ? `${asset.market.tvl7dChange}%` : null} />
              <FieldRow label="30D TVL change" value={asset.market?.tvl30dChange != null ? `${asset.market.tvl30dChange}%` : null} />
              <FieldRow label="Price" value={asset.market?.price} />
              <FieldRow label="24H price change" value={asset.market?.priceChange24h != null ? `${asset.market.priceChange24h}%` : null} />
              <FieldRow label="Holders" value={asset.market?.holderCount} />
              <FieldRow label="Holder 7D change" value={asset.market?.holderChange7d} />
              <FieldRow label="Confidence" value={asset.market?.confidence} />
            </div>
          </SectionShell>

          <SectionShell title="Yield" subtitle="Current yield, benchmark, frequency, and Pro yield / TVL / risk score history">
            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FieldRow label="Current yield" value={formatYield(asset.yield?.currentYield)} />
              <FieldRow label="Yield type" value={asset.yield?.yieldType} />
              <FieldRow label="Frequency" value={asset.yield?.yieldFrequency} />
              <FieldRow label="Benchmark" value={asset.yield?.yieldBenchmark} />
              <FieldRow label="7D avg" value={asset.yield?.yieldAvg7d} />
              <FieldRow label="30D avg" value={asset.yield?.yieldAvg30d} />
              <FieldRow label="52W min" value={asset.yield?.yieldMin52w} />
              <FieldRow label="52W max" value={asset.yield?.yieldMax52w} />
            </div>
            <YieldHistorySection apiBaseUrl={apiBase} assetId={asset.slug} />
          </SectionShell>
        </div>
      ) : null}

      {activeTab === "liquidity" ? (
        <SectionShell title="Liquidity" subtitle="Redemption terms, exit quality, and liquidity score">
          <LiquidityInfoSection liquidity={asset.liquidity} />
        </SectionShell>
      ) : null}

      {activeTab === "blockchain" ? <BlockchainTab asset={asset} /> : null}

      {activeTab === "risk" ? (
        <div className="space-y-6">
          <DataQualityPanel asset={asset} />
          <AssetGradeCard grade={asset.grade} />
          <GatedRiskAnalysisSection
            apiBaseUrl={apiBase}
            assetId={asset.slug}
            yieldPct={yieldPct ?? yieldFraction * 100}
            categoryAvgPct={categoryAvg}
            initialRisk={legacyRiskForGated(asset, dataMeta)}
          />
        </div>
      ) : null}

      {activeTab === "sources" ? (
        <div className="space-y-6">
          <DataQualityPanel asset={asset} />
          <AssetSourcesTab
            asset={asset}
          meta={dataMeta}
          protocol={protocol}
            symbol={asset.identity?.symbol ?? ""}
          />
        </div>
      ) : null}

      {activeTab === "events" ? (
        <SectionShell title="Events" subtitle="Launches, audits, integrations, incidents, migrations, and major updates">
          <p className="text-sm leading-relaxed text-[#8892A4]">
            Event timeline is planned for this asset. Until field-level events are available, use Sources and official issuer updates for audit and launch history.
          </p>
        </SectionShell>
      ) : null}

      <RelatedAssetsSection
        assets={listPeers}
        currentId={asset.slug}
        category={category}
        loading={peersLoading}
      />
    </div>
  );
}
