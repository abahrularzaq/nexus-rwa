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
import { ComplianceInfoSection } from "@/components/dashboard/ComplianceInfoSection";
import { LiquidityInfoSection } from "@/components/dashboard/LiquidityInfoSection";
import { ReserveInfoSection } from "@/components/dashboard/ReserveInfoSection";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { YieldHistorySection } from "@/components/dashboard/YieldHistorySection";
import { GatedRiskAnalysisSection } from "@/components/dashboard/GatedRiskAnalysisSection";
import { AIInsightCard } from "@/components/dashboard/AIInsightCard";
import { DataTransparencySection } from "@/components/dashboard/DataTransparencySection";
import { RelatedAssetsSection } from "@/components/dashboard/RelatedAssetsSection";
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

export default function AssetDetailPage() {
  const params = useParams();
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

  const apiBase = useMemo(
    () => (API_URL ?? "").trim().replace(/\/$/, ""),
    [],
  );

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
  }, [slug]);

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

  return (
    <div className="space-y-10 pb-10">
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
              </div>
              <p className="mt-1 text-lg text-[#8892A4]">
                {asset.identity?.symbol ?? "—"}
              </p>
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
              {formatTvl(asset.market?.tvl)}
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
              {formatChange7d(change7d)}{" "}
              <span className="font-normal text-[#8892A4]">7d</span>
            </p>
          </div>
        </div>
      </section>

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
            value={
              launchDate
                ? formatAssetAge(launchDate)
                : "—"
            }
            change="—"
            changeType="neutral"
            subtitle="Since launch"
            icon={<Calendar className="text-[#00D4FF]" />}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6">
          <h2 className="text-lg font-bold text-white">Compliance</h2>
          <p className="mt-1 text-sm text-[#8892A4]">
            Regulatory and access requirements
          </p>
          <div className="mt-4">
            <ComplianceInfoSection compliance={asset.compliance} />
          </div>
        </div>
        <div className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6">
          <h2 className="text-lg font-bold text-white">Liquidity</h2>
          <p className="mt-1 text-sm text-[#8892A4]">
            Redemption terms and liquidity score
          </p>
          <div className="mt-4">
            <LiquidityInfoSection liquidity={asset.liquidity} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6">
        <h2 className="text-lg font-bold text-white">Reserve & backing</h2>
        <p className="mt-1 text-sm text-[#8892A4]">
          Custodian, collateralization, and proof-of-reserves (PRO)
        </p>
        <div className="mt-4">
          <ReserveInfoSection
            apiBaseUrl={apiBase}
            assetSlug={asset.slug}
            reserve={asset.reserve}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Yield History</h2>
        <YieldHistorySection apiBaseUrl={apiBase} assetId={asset.slug} />
      </section>

      <GatedRiskAnalysisSection
        apiBaseUrl={apiBase}
        assetId={asset.slug}
        yieldPct={yieldPct ?? yieldFraction * 100}
        categoryAvgPct={categoryAvg}
        initialRisk={legacyRiskForGated(asset, dataMeta)}
      />

      <AIInsightCard apiBaseUrl={apiBase} assetId={asset.slug} />

      <DataTransparencySection
        meta={dataMeta}
        protocol={protocol}
        symbol={asset.identity?.symbol ?? ""}
      />

      <RelatedAssetsSection
        assets={listPeers}
        currentId={asset.slug}
        category={category}
        loading={peersLoading}
      />
    </div>
  );
}
