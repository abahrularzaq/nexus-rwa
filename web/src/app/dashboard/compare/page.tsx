"use client";

import { Suspense, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Database,
  Gauge,
  RefreshCw,
  Scale,
  ShieldCheck,
  Waves,
  X,
} from "lucide-react";
import { fetchAssetFull, fetchAssetList, formatTvl, formatYield } from "@/lib/api/assets";
import { PAGINATION } from "@/lib/shared";
import type { AssetWithLayers } from "@/types/asset";

const MIN_COMPARE = 2;
const MAX_COMPARE = 4;

function normalize(value?: string | null): string {
  return (value ?? "").toLowerCase().trim();
}

function titleCase(value?: string | null): string {
  if (!value) return "—";
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function assetName(asset: AssetWithLayers): string {
  return asset.identity?.name ?? asset.slug;
}

function assetSymbol(asset: AssetWithLayers): string {
  return asset.identity?.symbol ?? asset.slug.toUpperCase();
}

function scoreLabel(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${Math.round(value)}/100`;
}

function boolLabel(value?: boolean | null): string {
  if (value == null) return "—";
  return value ? "Yes" : "No";
}

function reserveTransparency(asset: AssetWithLayers): string {
  const reserve = asset.reserve;
  if (!reserve) return "Evidence pending";
  const parts = [
    reserve.hasProofOfReserves ? "PoR" : null,
    reserve.auditor ? `Auditor: ${reserve.auditor}` : null,
    reserve.custodian ? `Custodian: ${reserve.custodian}` : null,
    reserve.lastAuditDate ? `Audit: ${reserve.lastAuditDate}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : titleCase(reserve.backingType) || "Partial reserve data";
}

function complianceProfile(asset: AssetWithLayers): string {
  const compliance = asset.compliance;
  if (!compliance) return "Compliance data pending";
  const parts = [
    compliance.regulatoryStatus ? titleCase(compliance.regulatoryStatus) : null,
    compliance.kycRequired ? "KYC required" : "No KYC flag",
    compliance.accreditedOnly ? "Accredited only" : null,
    compliance.primaryRegulator ? `Regulator: ${compliance.primaryRegulator}` : null,
    compliance.blockedJurisdictions?.length
      ? `Blocked: ${compliance.blockedJurisdictions.slice(0, 3).join(", ")}`
      : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

function liquidityProfile(asset: AssetWithLayers): string {
  const liquidity = asset.liquidity;
  if (!liquidity) return "Liquidity data pending";
  const days = liquidity.redemptionPeriodDays;
  const terms = days == null ? null : days <= 0 ? "Instant redemption" : `T+${days} redemption`;
  return [
    scoreLabel(liquidity.liquidityScore),
    terms,
    liquidity.redemptionType ? titleCase(liquidity.redemptionType) : null,
    liquidity.onchainLiquidity != null ? `${formatTvl(liquidity.onchainLiquidity)} on-chain` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function sourceQuality(asset: AssetWithLayers): string {
  const sources = new Set([...(asset.market?.sources ?? []), ...(asset.aiNarrative?.compareTo ?? [])]);
  return [
    `Source score ${scoreLabel(asset.grade?.sourceScore)}`,
    asset.market?.confidence ? `${titleCase(asset.market.confidence)} confidence` : null,
    sources.size ? `${sources.size} source${sources.size > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

type CompareMetric = {
  id: string;
  label: string;
  icon: ReactNode;
  value: (asset: AssetWithLayers) => string;
  helper?: (asset: AssetWithLayers) => string | null;
};

const compareMetrics: CompareMetric[] = [
  { id: "risk", label: "Risk score", icon: <Gauge className="size-4 text-[#FFB800]" />, value: (asset) => scoreLabel(asset.risk?.overallScore ?? asset.grade?.riskScore), helper: (asset) => (asset.risk?.overallLevel ? titleCase(asset.risk.overallLevel) : null) },
  { id: "yield", label: "Yield", icon: <BarChart3 className="size-4 text-[#00FF88]" />, value: (asset) => formatYield(asset.yield?.currentYield), helper: (asset) => asset.yield?.yieldType ? titleCase(asset.yield.yieldType) : null },
  { id: "tvl", label: "TVL / AUM", icon: <Database className="size-4 text-[#8DEBFF]" />, value: (asset) => formatTvl(asset.market?.tvl), helper: (asset) => asset.market?.tvl7dChange != null ? `${asset.market.tvl7dChange}% 7d` : null },
  { id: "reserve", label: "Reserve transparency", icon: <ShieldCheck className="size-4 text-[#00D4FF]" />, value: reserveTransparency, helper: (asset) => `PoR: ${boolLabel(asset.reserve?.hasProofOfReserves)}` },
  { id: "compliance", label: "Compliance profile", icon: <Scale className="size-4 text-[#E6D0FF]" />, value: complianceProfile },
  { id: "liquidity", label: "Liquidity", icon: <Waves className="size-4 text-[#8DEBFF]" />, value: liquidityProfile },
  { id: "sources", label: "Source quality", icon: <CheckCircle2 className="size-4 text-[#00FF88]" />, value: sourceQuality, helper: (asset) => asset.grade?.grade ? `Grade: ${titleCase(asset.grade.grade)}` : null },
];

function ComparePageContent() {
  const searchParams = useSearchParams();
  const initialAssets = useMemo(
    () => (searchParams.get("assets") ?? searchParams.get("asset") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, MAX_COMPARE),
    [searchParams],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(initialAssets);
  const [searchQuery, setSearchQuery] = useState("");


  const listQuery = useQuery({
    queryKey: ["assets", "compare-selector"],
    queryFn: () => fetchAssetList({ limit: PAGINATION.MAX_LIMIT, page: 1 }),
    staleTime: 2 * 60 * 1000,
  });

  const fullQuery = useQuery({
    queryKey: ["assets", "compare-full", selectedIds],
    queryFn: async () => Promise.all(selectedIds.map((id) => fetchAssetFull(id))),
    enabled: selectedIds.length >= MIN_COMPARE,
    staleTime: 2 * 60 * 1000,
  });

  const assets = useMemo(() => listQuery.data?.assets ?? [], [listQuery.data?.assets]);
  const selectedAssets = fullQuery.data ?? [];
  const canAddMore = selectedIds.length < MAX_COMPARE;

  const filteredAssets = useMemo(() => {
    const query = normalize(searchQuery);
    return assets.filter((asset) => {
      if (!query) return true;
      return [assetName(asset), assetSymbol(asset), asset.identity?.category, asset.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [assets, searchQuery]);

  function toggleAsset(slug: string) {
    setSelectedIds((current) => {
      if (current.includes(slug)) return current.filter((id) => id !== slug);
      if (current.length >= MAX_COMPARE) return current;
      return [...current, slug];
    });
  }

  return (
    <div className="space-y-8 pb-10">
      <section className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00D4FF]">Asset compare</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Compare RWA asset profiles</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#8892A4]">
              Select 2–4 assets to compare full profile data across risk score, yield, TVL/AUM,
              reserve transparency, compliance profile, liquidity, and source quality.
            </p>
            <p className="mt-2 text-xs text-[#4A5568]">
              Contextual workspace opened from asset detail links; not part of primary sidebar navigation.
            </p>
          </div>
          <Link href="/dashboard/assets" className="inline-flex items-center gap-2 rounded-lg border border-[#00D1FF]/25 bg-[#00D1FF]/[0.06] px-4 py-2 text-sm font-semibold text-[#8DEBFF] transition hover:border-[#00D4FF] hover:text-white">
            Browse assets
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white">Select assets</h2>
              <p className="text-xs text-[#8892A4]">{selectedIds.length}/{MAX_COMPARE} selected · minimum {MIN_COMPARE}</p>
            </div>
            <button type="button" onClick={() => void listQuery.refetch()} className="rounded-lg border border-[rgba(30,42,58,0.9)] p-2 text-[#8892A4] transition hover:text-white" aria-label="Refresh assets">
              <RefreshCw className="size-4" />
            </button>
          </div>

          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search name, symbol, category…" className="mt-4 w-full rounded-lg border border-[rgba(30,42,58,0.9)] bg-[rgba(10,14,26,0.72)] px-3 py-2 text-sm text-white outline-none placeholder:text-[#4A5568] focus:border-[#00D4FF]" />

          <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {listQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-[rgba(30,42,58,0.55)]" />)
            ) : listQuery.isError ? (
              <p className="rounded-lg border border-[#FF4444]/25 bg-[#FF4444]/10 p-3 text-sm text-[#FF8888]">Failed to load assets.</p>
            ) : (
              filteredAssets.map((asset) => {
                const selected = selectedIds.includes(asset.slug);
                const disabled = !selected && !canAddMore;
                return (
                  <button key={asset.slug} type="button" onClick={() => toggleAsset(asset.slug)} disabled={disabled} className={`w-full rounded-lg border px-3 py-3 text-left transition ${selected ? "border-[#00D4FF]/50 bg-[#00D4FF]/10" : "border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.42)] hover:border-[#00D4FF]/30"} ${disabled ? "cursor-not-allowed opacity-45" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{assetName(asset)}</p>
                        <p className="mt-0.5 text-xs text-[#8892A4]">{assetSymbol(asset)} · {titleCase(asset.identity?.category)}</p>
                      </div>
                      {selected ? <CheckCircle2 className="size-4 shrink-0 text-[#00D4FF]" /> : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => (
              <button key={id} type="button" onClick={() => toggleAsset(id)} className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-3 py-1.5 text-sm font-semibold text-[#8DEBFF]">
                {id}
                <X className="size-3.5" />
              </button>
            ))}
          </div>

          {selectedIds.length < MIN_COMPARE ? (
            <div className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-8 text-center">
              <p className="text-lg font-semibold text-white">Select at least 2 assets</p>
              <p className="mt-2 text-sm text-[#8892A4]">The comparison table uses the full asset profile endpoint once enough assets are selected.</p>
            </div>
          ) : fullQuery.isLoading ? (
            <div className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6"><div className="h-64 animate-pulse rounded-lg bg-[rgba(30,42,58,0.55)]" /></div>
          ) : fullQuery.isError ? (
            <div className="rounded-xl border border-[#FF4444]/25 bg-[#FF4444]/10 p-5 text-sm text-[#FF8888]">Failed to load one or more full asset profiles. Confirm your API access and try again.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)]">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead className="border-b border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.6)]">
                  <tr>
                    <th className="w-56 px-4 py-4 font-semibold text-[#8892A4]">Metric</th>
                    {selectedAssets.map((asset) => (
                      <th key={asset.slug} className="px-4 py-4 align-top">
                        <Link href={`/dashboard/assets/${asset.slug}`} className="group inline-flex items-center gap-2 font-semibold text-white hover:text-[#8DEBFF]">
                          {assetName(asset)}
                          <ArrowUpRight className="size-3.5 opacity-60 transition group-hover:opacity-100" />
                        </Link>
                        <p className="mt-1 text-xs font-normal text-[#8892A4]">{assetSymbol(asset)} · {titleCase(asset.identity?.category)}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareMetrics.map((metric) => (
                    <tr key={metric.id} className="border-b border-[rgba(30,42,58,0.55)] last:border-0">
                      <td className="px-4 py-4 align-top"><div className="flex items-center gap-2 font-semibold text-white">{metric.icon}{metric.label}</div></td>
                      {selectedAssets.map((asset) => (
                        <td key={`${asset.slug}-${metric.id}`} className="px-4 py-4 align-top text-[#DDE7F3]">
                          <p className="font-medium leading-relaxed">{metric.value(asset)}</p>
                          {metric.helper?.(asset) ? <p className="mt-1 text-xs text-[#8892A4]">{metric.helper(asset)}</p> : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}


export default function ComparePage() {
  return (
    <Suspense fallback={<div className="pb-10 text-sm text-[#8892A4]">Loading compare workspace…</div>}>
      <ComparePageContent />
    </Suspense>
  );
}
