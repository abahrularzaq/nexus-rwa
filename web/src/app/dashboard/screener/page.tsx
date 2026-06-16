"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Database,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssetList, formatTvl } from "@/lib/api/assets";
import { PAGINATION } from "@/lib/shared";
import type { AssetWithLayers } from "@/types/asset";

type SelectFilter = "all" | string;

type QuickFilter = {
  id: string;
  label: string;
  predicate: (asset: AssetWithLayers) => boolean;
};

const quickFilters: QuickFilter[] = [
  {
    id: "institutional",
    label: "Institutional grade",
    predicate: (asset) => normalize(asset.grade?.grade) === "institutional",
  },
  {
    id: "por",
    label: "Has PoR",
    predicate: (asset) => Boolean(asset.reserve?.hasProofOfReserves),
  },
  {
    id: "custodian",
    label: "Named custodian",
    predicate: (asset) => Boolean(asset.reserve?.custodian),
  },
  {
    id: "no-blockers",
    label: "No blockers",
    predicate: (asset) => (asset.grade?.blockers?.length ?? 0) === 0,
  },
  {
    id: "treasury",
    label: "Treasury",
    predicate: (asset) => normalize(asset.identity?.category).includes("treasury"),
  },
  {
    id: "high-source-score",
    label: "High source score",
    predicate: (asset) => (asset.grade?.sourceScore ?? 0) >= 90,
  },
];

const filterGroups = [
  {
    title: "Asset quality",
    items: ["Grade band", "Score threshold", "No blockers", "Warnings review"],
  },
  {
    title: "Reserve evidence",
    items: ["Proof of reserves", "Named custodian", "Recent audit", "Redemption clarity"],
  },
  {
    title: "Compliance access",
    items: ["KYC required", "Accredited only", "Transfer restrictions", "Sanctions screening"],
  },
  {
    title: "Source quality",
    items: ["Source score", "Official evidence", "Regulatory filing", "Audit trail"],
  },
];

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

function getScore(asset: AssetWithLayers): number | null {
  return asset.grade?.score ?? asset.risk?.overallScore ?? null;
}

function getGradeLabel(asset: AssetWithLayers): string {
  if (asset.grade?.grade) return titleCase(asset.grade.grade);
  const score = getScore(asset);
  if (score == null) return "Research";
  if (score >= 85) return "Institutional";
  if (score >= 70) return "Analytics";
  return "Research";
}

function getGradeClass(asset: AssetWithLayers): string {
  const grade = normalize(getGradeLabel(asset));
  if (grade === "institutional") return "border-[#00FF88]/30 bg-[#00FF88]/10 text-[#00FF88]";
  if (grade === "analytics") return "border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]";
  return "border-[var(--border-panel)] bg-[var(--bg-panel)] text-[var(--text-secondary)]";
}

function getRiskLabel(asset: AssetWithLayers): string {
  const blockers = asset.grade?.blockers?.length ?? 0;
  const warnings = asset.grade?.warnings?.length ?? 0;
  if (blockers > 0) return `${blockers} blocker${blockers > 1 ? "s" : ""}`;
  if (warnings > 0) return `${warnings} warning${warnings > 1 ? "s" : ""}`;
  return "Clean";
}

function getRiskClass(asset: AssetWithLayers): string {
  if ((asset.grade?.blockers?.length ?? 0) > 0) return "text-[#FF4444]";
  if ((asset.grade?.warnings?.length ?? 0) > 0) return "text-[var(--accent-amber)]";
  return "text-[#00FF88]";
}

function getChains(asset: AssetWithLayers): string {
  const chains = Array.from(
    new Set((asset.blockchain ?? []).map((row) => titleCase(row.chain)).filter(Boolean)),
  );
  return chains.length ? chains.join(", ") : "—";
}

function getLiquidityLabel(asset: AssetWithLayers): string {
  const days = asset.liquidity?.redemptionPeriodDays;
  if (days == null) return asset.liquidity?.redemptionType ?? "—";
  if (days <= 0) return "Instant";
  if (days === 1) return "T+1";
  if (days <= 3) return "T+3";
  if (days <= 7) return "Weekly";
  if (days <= 31) return "Monthly";
  return `T+${days}`;
}

function getEvidenceLabel(asset: AssetWithLayers): string {
  if (asset.reserve?.hasProofOfReserves) return "Proof of reserves";
  if (asset.reserve?.lastAuditDate || asset.reserve?.auditor) return "Audit evidence";
  if (asset.reserve?.custodian) return "Named custodian";
  return "Evidence pending";
}

function passesLiquidity(asset: AssetWithLayers, liquidity: SelectFilter): boolean {
  if (liquidity === "all") return true;
  const days = asset.liquidity?.redemptionPeriodDays;
  if (days == null) return false;
  if (liquidity === "instant") return days <= 0;
  if (liquidity === "t1") return days <= 1;
  if (liquidity === "t3") return days <= 3;
  if (liquidity === "weekly") return days <= 7;
  if (liquidity === "monthly") return days <= 31;
  return true;
}

export default function ScreenerPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["assets", "screener"],
    queryFn: () => fetchAssetList({ limit: PAGINATION.MAX_LIMIT, page: 1 }),
    staleTime: 2 * 60 * 1000,
  });

  const assets = useMemo(() => data?.assets ?? [], [data?.assets]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
  const [gradeFilter, setGradeFilter] = useState<SelectFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<SelectFilter>("all");
  const [minScoreFilter, setMinScoreFilter] = useState<SelectFilter>("all");
  const [sourceScoreFilter, setSourceScoreFilter] = useState<SelectFilter>("all");
  const [evidenceFilter, setEvidenceFilter] = useState<SelectFilter>("all");
  const [complianceFilter, setComplianceFilter] = useState<SelectFilter>("all");
  const [liquidityFilter, setLiquidityFilter] = useState<SelectFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(assets.map((asset) => asset.identity?.category).filter(Boolean)))
      .sort((a, b) => String(a).localeCompare(String(b)));
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const query = normalize(searchQuery);
    const enabledQuickFilters = quickFilters.filter((filter) =>
      activeQuickFilters.includes(filter.id),
    );

    return assets.filter((asset) => {
      const score = getScore(asset);
      const sourceScore = asset.grade?.sourceScore ?? null;
      const haystack = [
        asset.identity?.name,
        asset.identity?.symbol,
        asset.identity?.fullName,
        asset.institutional?.issuerName,
        asset.identity?.category,
        asset.reserve?.backingType,
        asset.slug,
        getChains(asset),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (query && !haystack.includes(query)) return false;
      if (!enabledQuickFilters.every((filter) => filter.predicate(asset))) return false;
      if (gradeFilter !== "all" && normalize(getGradeLabel(asset)) !== gradeFilter) return false;
      if (categoryFilter !== "all" && normalize(asset.identity?.category) !== categoryFilter) return false;
      if (minScoreFilter !== "all" && (score ?? 0) < Number(minScoreFilter)) return false;
      if (sourceScoreFilter !== "all" && (sourceScore ?? 0) < Number(sourceScoreFilter)) return false;

      if (evidenceFilter === "por" && !asset.reserve?.hasProofOfReserves) return false;
      if (evidenceFilter === "custodian" && !asset.reserve?.custodian) return false;
      if (evidenceFilter === "audit" && !asset.reserve?.lastAuditDate && !asset.reserve?.auditor) return false;

      if (complianceFilter === "kyc" && !asset.compliance?.kycRequired) return false;
      if (complianceFilter === "accredited" && !asset.compliance?.accreditedOnly) return false;
      if (
        complianceFilter === "transfer" &&
        !(asset.blockchain ?? []).some((row) => row.hasTransferRestrictions)
      ) {
        return false;
      }
      if (complianceFilter === "sanctions" && !asset.compliance?.sanctionsScreening) return false;

      return passesLiquidity(asset, liquidityFilter);
    });
  }, [
    activeQuickFilters,
    assets,
    categoryFilter,
    complianceFilter,
    evidenceFilter,
    gradeFilter,
    liquidityFilter,
    minScoreFilter,
    searchQuery,
    sourceScoreFilter,
  ]);

  const selectedAssets = useMemo(
    () => assets.filter((asset) => selectedIds.includes(asset.slug)).slice(0, 4),
    [assets, selectedIds],
  );

  function toggleQuickFilter(id: string) {
    setActiveQuickFilters((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 4) return current;
      return [...current, id];
    });
  }

  function clearFilters() {
    setSearchQuery("");
    setActiveQuickFilters([]);
    setGradeFilter("all");
    setCategoryFilter("all");
    setMinScoreFilter("all");
    setSourceScoreFilter("all");
    setEvidenceFilter("all");
    setComplianceFilter("all");
    setLiquidityFilter("all");
  }

  const hasActiveFilters =
    searchQuery ||
    activeQuickFilters.length > 0 ||
    gradeFilter !== "all" ||
    categoryFilter !== "all" ||
    minScoreFilter !== "all" ||
    sourceScoreFilter !== "all" ||
    evidenceFilter !== "all" ||
    complianceFilter !== "all" ||
    liquidityFilter !== "all";

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-3 border-b border-[var(--border-line)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5">Asset screener</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            Screen RWAs by institutional readiness
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Find RWA assets by grade, reserve evidence, compliance access,
            liquidity profile, source reliability, and market category.
          </p>
        </div>
        <Link
          href="/dashboard/assets"
          className="terminal-label inline-flex items-center gap-1 text-[var(--accent-amber)] hover:underline"
        >
          Browse asset catalog
          <ArrowUpRight className="size-3.5" />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="terminal-panel p-5">
          <Search className="size-5 text-[var(--accent-amber)]" />
          <h2 className="mt-3 font-semibold text-white">Search</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Search by asset, symbol, issuer, category, chain, backing type, or slug.
          </p>
        </div>
        <div className="terminal-panel p-5">
          <Filter className="size-5 text-[var(--accent-amber)]" />
          <h2 className="mt-3 font-semibold text-white">Filter</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Combine grade, reserve, compliance, source, liquidity, and market filters.
          </p>
        </div>
        <div className="terminal-panel p-5">
          <SlidersHorizontal className="size-5 text-[var(--accent-amber)]" />
          <h2 className="mt-3 font-semibold text-white">Compare</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Select up to 4 assets and compare evidence completeness side by side.
          </p>
        </div>
      </section>

      <section className="terminal-panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search asset, issuer, symbol, category, chain..."
              className="w-full rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-amber)]/50"
            />
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-panel)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--accent-amber)]/40 hover:text-white"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickFilters.map((filter) => {
            const active = activeQuickFilters.includes(filter.id);
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => toggleQuickFilter(filter.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-[var(--accent-amber)] bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]"
                    : "border-[var(--border-panel)] text-[var(--text-secondary)] hover:border-[var(--accent-amber)]/40 hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1.5 text-xs text-[var(--text-secondary)]">
            <span className="terminal-label">Grade</span>
            <select
              value={gradeFilter}
              onChange={(event) => setGradeFilter(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">All grades</option>
              <option value="institutional">Institutional</option>
              <option value="analytics">Analytics</option>
              <option value="research">Research</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs text-[var(--text-secondary)]">
            <span className="terminal-label">Category</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">All categories</option>
              {categoryOptions.map((category) => (
                <option key={String(category)} value={normalize(category)}>
                  {titleCase(category)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-xs text-[var(--text-secondary)]">
            <span className="terminal-label">Score</span>
            <select
              value={minScoreFilter}
              onChange={(event) => setMinScoreFilter(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">Any score</option>
              <option value="70">70+</option>
              <option value="80">80+</option>
              <option value="90">90+</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs text-[var(--text-secondary)]">
            <span className="terminal-label">Reserve</span>
            <select
              value={evidenceFilter}
              onChange={(event) => setEvidenceFilter(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">Any evidence</option>
              <option value="por">Proof of reserves</option>
              <option value="custodian">Named custodian</option>
              <option value="audit">Audit evidence</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs text-[var(--text-secondary)]">
            <span className="terminal-label">Compliance</span>
            <select
              value={complianceFilter}
              onChange={(event) => setComplianceFilter(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">Any access</option>
              <option value="kyc">KYC required</option>
              <option value="accredited">Accredited only</option>
              <option value="transfer">Transfer restricted</option>
              <option value="sanctions">Sanctions screening</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs text-[var(--text-secondary)]">
            <span className="terminal-label">Source</span>
            <select
              value={sourceScoreFilter}
              onChange={(event) => setSourceScoreFilter(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">Any source score</option>
              <option value="70">70+</option>
              <option value="80">80+</option>
              <option value="90">90+</option>
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1.5 text-xs text-[var(--text-secondary)] xl:col-span-2">
            <span className="terminal-label">Liquidity</span>
            <select
              value={liquidityFilter}
              onChange={(event) => setLiquidityFilter(event.target.value)}
              className="w-full rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">Any redemption period</option>
              <option value="instant">Instant</option>
              <option value="t1">T+1 or better</option>
              <option value="t3">T+3 or better</option>
              <option value="weekly">Weekly or better</option>
              <option value="monthly">Monthly or better</option>
            </select>
          </label>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 self-end rounded-lg border border-[var(--border-panel)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--accent-amber)]/40 hover:text-white"
            >
              <X className="size-4" />
              Clear filters
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {filterGroups.map((group) => (
          <div key={group.title} className="data-surface rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white">{group.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
              {group.items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[var(--accent-amber)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="terminal-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-panel)] px-5 py-4">
          <div>
            <p className="terminal-label">Screener results</p>
            <h2 className="mt-1 text-base font-semibold text-white">
              {isLoading ? "Loading assets" : `Showing ${filteredAssets.length} of ${assets.length} assets`}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Select assets to compare grade, reserve, compliance, liquidity, and source trail.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Database className="size-4 text-[var(--accent-amber)]" />
            12-layer evidence model
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-line)]">
                <th className="terminal-label px-5 py-2.5">Compare</th>
                <th className="terminal-label px-4 py-2.5">Asset</th>
                <th className="terminal-label px-4 py-2.5">Category</th>
                <th className="terminal-label px-4 py-2.5">Grade</th>
                <th className="terminal-label px-4 py-2.5 text-right">Score</th>
                <th className="terminal-label px-4 py-2.5">Reserve</th>
                <th className="terminal-label px-4 py-2.5">Compliance</th>
                <th className="terminal-label px-4 py-2.5">Liquidity</th>
                <th className="terminal-label px-4 py-2.5 text-right">Source</th>
                <th className="terminal-label px-4 py-2.5">Risk</th>
                <th className="terminal-label px-4 py-2.5 text-right">TVL</th>
                <th className="terminal-label px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-[var(--border-line)]">
                    <td className="px-5 py-3" colSpan={12}>
                      <div className="h-4 w-full max-w-xl animate-pulse rounded bg-[rgba(30,42,58,0.7)]" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={12} className="px-5 py-10 text-center text-sm text-[#FF4444]">
                    {error instanceof Error ? error.message : "Failed to load screener data."}
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-5 py-12 text-center">
                    <div className="mx-auto max-w-md">
                      <TriangleAlert className="mx-auto size-6 text-[var(--accent-amber)]" />
                      <h3 className="mt-3 font-semibold text-white">No assets match this filter</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Try removing proof-of-reserves, score threshold, source score, or category filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const isSelected = selectedIds.includes(asset.slug);
                  const selectionDisabled = selectedIds.length >= 4 && !isSelected;
                  return (
                    <tr
                      key={asset.slug}
                      className="border-b border-[var(--border-line)] last:border-0 hover:bg-[rgba(255,255,255,0.02)]"
                    >
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={selectionDisabled}
                          onChange={() => toggleSelected(asset.slug)}
                          className="size-4 rounded border-[var(--border-panel)] bg-[var(--bg-panel)]"
                          aria-label={`Select ${asset.identity?.name ?? asset.slug} for comparison`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{asset.identity?.name ?? asset.slug}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {asset.identity?.symbol || asset.slug} · {getChains(asset)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {titleCase(asset.identity?.category)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-1 text-xs font-medium ${getGradeClass(asset)}`}>
                          {getGradeLabel(asset)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
                        {getScore(asset) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {getEvidenceLabel(asset)}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {asset.compliance?.kycRequired
                          ? "KYC required"
                          : asset.compliance?.accreditedOnly
                            ? "Accredited only"
                            : asset.compliance?.regulatoryStatus ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {getLiquidityLabel(asset)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
                        {asset.grade?.sourceScore ?? "—"}
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${getRiskClass(asset)}`}>
                        {getRiskLabel(asset)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
                        {formatTvl(asset.market?.tvl)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/assets/${asset.slug}`}
                          className="terminal-label text-[var(--accent-amber)] hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedAssets.length > 0 ? (
        <section className="terminal-panel overflow-hidden border-[var(--accent-amber)]/30">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-panel)] px-5 py-4">
            <div>
              <p className="terminal-label">Compare selected</p>
              <h2 className="mt-1 text-base font-semibold text-white">
                {selectedAssets.length} asset{selectedAssets.length > 1 ? "s" : ""} selected
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-panel)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--accent-amber)]/40 hover:text-white"
            >
              <X className="size-4" />
              Clear compare
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-line)]">
                  <th className="terminal-label px-5 py-2.5">Layer</th>
                  {selectedAssets.map((asset) => (
                    <th key={asset.slug} className="terminal-label px-4 py-2.5">
                      {asset.identity?.symbol || asset.slug}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Grade", (asset: AssetWithLayers) => `${getGradeLabel(asset)} · ${getScore(asset) ?? "—"}`],
                  ["Reserve", getEvidenceLabel],
                  ["Custodian", (asset: AssetWithLayers) => asset.reserve?.custodian ?? "—"],
                  ["Compliance", (asset: AssetWithLayers) => asset.compliance?.regulatoryStatus ?? (asset.compliance?.kycRequired ? "KYC required" : "—")],
                  ["Liquidity", getLiquidityLabel],
                  ["Source score", (asset: AssetWithLayers) => String(asset.grade?.sourceScore ?? "—")],
                  ["Risk", getRiskLabel],
                ].map(([label, getter]) => (
                  <tr key={String(label)} className="border-b border-[var(--border-line)] last:border-0">
                    <td className="px-5 py-3 font-medium text-white">{String(label)}</td>
                    {selectedAssets.map((asset) => (
                      <td key={asset.slug} className="px-4 py-3 text-[var(--text-secondary)]">
                        {(getter as (asset: AssetWithLayers) => string)(asset)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="data-surface rounded-lg border border-[var(--border-panel)] p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 text-[var(--accent-amber)]" />
          <div>
            <p className="terminal-label">Screener positioning</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Screener is optimized for evidence-first discovery: grade, reserve proof,
              compliance access, source score, liquidity profile, and blockers come before
              pure market ranking.
            </p>
          </div>
          <CheckCircle2 className="ml-auto hidden size-5 text-[#00FF88] sm:block" />
          <ShieldCheck className="hidden size-5 text-[var(--accent-amber)] sm:block" />
        </div>
      </section>
    </div>
  );
}
