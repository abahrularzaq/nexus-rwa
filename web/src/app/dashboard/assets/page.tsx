"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Database,
  Filter,
  Layers,
  Search,
  SearchX,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AssetCard, AssetCardSkeleton } from "@/components/dashboard/AssetCard";
import { fetchAssetList, formatTvl, formatYield } from "@/lib/api/assets";
import { normalizeCategory } from "@/lib/asset-mapper";
import type { AssetWithLayers } from "@/types/asset";

type AssetCategoryTab =
  | "ALL"
  | "TREASURY"
  | "CREDIT"
  | "REAL_ESTATE"
  | "COMMODITIES"
  | "EQUITY";

type GradeTab = "ALL" | "institutional" | "analytics" | "research";

const CATEGORY_TABS: { key: AssetCategoryTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "TREASURY", label: "Treasury" },
  { key: "CREDIT", label: "Credit" },
  { key: "REAL_ESTATE", label: "Real Estate" },
  { key: "COMMODITIES", label: "Commodities" },
  { key: "EQUITY", label: "Equity" },
];

const GRADE_TABS: { key: GradeTab; label: string }[] = [
  { key: "ALL", label: "All Grades" },
  { key: "institutional", label: "Institutional" },
  { key: "analytics", label: "Analytic" },
  { key: "research", label: "Research" },
];

const SORT_OPTIONS = ["tvl", "yield", "holders", "name", "change7d", "grade"] as const;
type SortKey = (typeof SORT_OPTIONS)[number];

function compare(
  a: AssetWithLayers,
  b: AssetWithLayers,
  sortBy: SortKey,
  order: "asc" | "desc",
): number {
  const dir = order === "asc" ? 1 : -1;
  switch (sortBy) {
    case "tvl":
      return ((a.market?.tvl ?? 0) - (b.market?.tvl ?? 0)) * dir;
    case "yield":
      return (
        ((a.yield?.currentYield ?? 0) - (b.yield?.currentYield ?? 0)) * dir
      );
    case "holders":
      return (
        ((a.market?.holderCount ?? 0) - (b.market?.holderCount ?? 0)) * dir
      );
    case "name":
      return (a.identity?.name ?? a.slug).localeCompare(
        b.identity?.name ?? b.slug,
      ) * dir;
    case "change7d":
      return (
        ((a.market?.tvl7dChange ?? 0) - (b.market?.tvl7dChange ?? 0)) * dir
      );
    case "grade":
      return ((a.grade?.score ?? 0) - (b.grade?.score ?? 0)) * dir;
    default:
      return 0;
  }
}

function gradeLabel(asset: AssetWithLayers): string {
  const grade = asset.grade?.grade;
  if (!grade) return "ungraded";
  return grade.toLowerCase();
}

function isInstitutional(asset: AssetWithLayers): boolean {
  return gradeLabel(asset) === "institutional";
}

function highestBy(
  assets: AssetWithLayers[],
  getValue: (asset: AssetWithLayers) => number | null | undefined,
): AssetWithLayers | null {
  return [...assets]
    .filter((asset) => {
      const value = getValue(asset);
      return typeof value === "number" && Number.isFinite(value) && value > 0;
    })
    .sort((a, b) => (getValue(b) ?? 0) - (getValue(a) ?? 0))[0] ?? null;
}

function gradeBadgeClass(grade: string): string {
  if (grade === "institutional") return "border-[#00FF88]/35 bg-[#00FF88]/12 text-[#74FFB8]";
  if (grade === "analytics") return "border-[#00D1FF]/35 bg-[#00D1FF]/12 text-[#8DEBFF]";
  if (grade === "research") return "border-[#FFB800]/35 bg-[#FFB800]/12 text-[#FFD36A]";
  return "border-white/10 bg-white/[0.04] text-[var(--text-label)]";
}

export default function DashboardAssetsPage() {
  const [assets, setAssets] = useState<AssetWithLayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AssetCategoryTab>("ALL");
  const [selectedGrade, setSelectedGrade] = useState<GradeTab>("ALL");
  const [sortBy, setSortBy] = useState<string>("tvl");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        setError(null);
        const { assets: rows } = await fetchAssetList({ limit: 50, page: 1 });
        setAssets(rows);
      } catch {
        setError("Failed to load assets");
        setAssets([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filteredSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = assets.filter((a) => {
      const cat = normalizeCategory(a.identity?.category);
      const catOk = selectedCategory === "ALL" || cat === selectedCategory;
      if (!catOk) return false;

      const gradeOk = selectedGrade === "ALL" || gradeLabel(a) === selectedGrade;
      if (!gradeOk) return false;

      if (!q) return true;
      const name = a.identity?.name?.toLowerCase() ?? "";
      const symbol = a.identity?.symbol?.toLowerCase() ?? "";
      const protocol = a.institutional?.issuerName?.toLowerCase() ?? "";
      return name.includes(q) || symbol.includes(q) || protocol.includes(q);
    });
    const sk = SORT_OPTIONS.includes(sortBy as SortKey)
      ? (sortBy as SortKey)
      : "tvl";
    list = [...list].sort((x, y) => compare(x, y, sk, sortOrder));
    return list;
  }, [assets, searchQuery, selectedCategory, selectedGrade, sortBy, sortOrder]);

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
            : sortBy === "grade"
              ? "Grade score"
              : "Name";

  const totalTvl = assets.reduce((sum, asset) => sum + (asset.market?.tvl ?? 0), 0);
  const institutionalCount = assets.filter(isInstitutional).length;
  const highestTvlAsset = highestBy(assets, (asset) => asset.market?.tvl);
  const highestYieldAsset = highestBy(assets, (asset) => asset.yield?.currentYield);
  const featuredAssets = assets.filter(isInstitutional).slice(0, 3);

  return (
    <div className="relative isolate space-y-8 overflow-hidden pb-10">
      <div className="pointer-events-none absolute inset-x-[-18%] top-[-180px] -z-10 h-[520px] bg-[radial-gradient(circle_at_28%_22%,rgba(0,209,255,0.18),transparent_34%),radial-gradient(circle_at_72%_18%,rgba(185,131,255,0.13),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(255,184,0,0.08),transparent_36%)] blur-2xl" />

      <header className="relative flex flex-col gap-3 border-b border-[#00D1FF]/15 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5 text-[#8DEBFF]">Asset workspace</p>
          <h1 className="bg-gradient-to-r from-white via-[#DDF9FF] to-[#8DEBFF] bg-clip-text text-2xl font-semibold leading-tight tracking-tight text-transparent">
            RWA Asset Universe
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--text-secondary)]">
            Explore tokenized real-world assets by category, market size, yield profile,
            risk level, source coverage, and institutional readiness.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/screener"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#00D1FF]/30 bg-[#00D1FF]/10 px-4 py-2 text-sm font-medium text-[#8DEBFF] shadow-[0_0_24px_rgba(0,209,255,0.12)] transition hover:bg-[#00D1FF]/20 hover:shadow-[0_0_34px_rgba(0,209,255,0.2)]"
          >
            Open Screener
            <ArrowUpRight className="size-4" />
          </Link>
          <Link
            href="/dashboard/layers"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#B983FF]/40 bg-[#B983FF]/15 px-4 py-2 text-sm font-medium text-[#E6D0FF] shadow-[0_0_24px_rgba(185,131,255,0.12)] transition hover:bg-[#B983FF]/25 hover:shadow-[0_0_34px_rgba(185,131,255,0.2)]"
          >
            View Data Layers
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-xl border border-[#B983FF]/20 bg-[linear-gradient(135deg,rgba(8,13,25,0.96),rgba(11,20,38,0.88))] p-4 shadow-[0_0_40px_rgba(0,209,255,0.06)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_100%_0%,rgba(185,131,255,0.16),transparent_45%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#00D1FF]/40 bg-[#00D1FF]/15 px-2.5 py-1 text-xs font-medium text-[#8DEBFF] shadow-[0_0_18px_rgba(0,209,255,0.12)]">
                Asset universe
              </span>
              <span className="rounded-full border border-[#00FF88]/40 bg-[#00FF88]/15 px-2.5 py-1 text-xs font-medium text-[#74FFB8] shadow-[0_0_18px_rgba(0,255,136,0.14)]">
                Institutional-ready coverage
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
              Assets are grouped as an intelligence catalog, not just a token list. Use this view to scan coverage quality, then open an asset profile for the full 12-layer evidence trail.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
            <HeroMiniStat label="Assets" value={loading ? "—" : assets.length.toLocaleString("en-US")} />
            <HeroMiniStat label="Total TVL" value={loading ? "—" : formatTvl(totalTvl)} />
          </div>
        </div>
      </section>

      {error ? (
        <div
          className="rounded-xl border border-[rgba(255,68,68,0.25)] bg-[rgba(255,68,68,0.06)] px-4 py-3 text-sm text-[#FF8888]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AssetMetricCard
          icon={<Database className="size-5 text-[#8DEBFF]" />}
          label="Total assets"
          value={loading ? "—" : assets.length.toLocaleString("en-US")}
          helper={`${filteredSorted.length} currently shown`}
        />
        <AssetMetricCard
          icon={<ShieldCheck className="size-5 text-[#74FFB8]" />}
          label="Institutional grade"
          value={loading ? "—" : institutionalCount.toLocaleString("en-US")}
          helper="Assets ready for serious review"
          variant="green"
        />
        <AssetMetricCard
          icon={<BarChart3 className="size-5 text-[#FFD36A]" />}
          label="Largest asset"
          value={loading ? "—" : highestTvlAsset ? highestTvlAsset.identity?.symbol ?? highestTvlAsset.slug : "—"}
          helper={highestTvlAsset ? formatTvl(highestTvlAsset.market?.tvl) : "By TVL/AUM"}
          variant="amber"
        />
        <AssetMetricCard
          icon={<TrendingUp className="size-5 text-[#E6D0FF]" />}
          label="Highest yield"
          value={loading ? "—" : highestYieldAsset ? highestYieldAsset.identity?.symbol ?? highestYieldAsset.slug : "—"}
          helper={highestYieldAsset ? formatYield(highestYieldAsset.yield?.currentYield) : "Current snapshot"}
          variant="purple"
        />
      </section>

      {featuredAssets.length > 0 ? (
        <section className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_38px_rgba(0,209,255,0.06)]">
          <div className="pointer-events-none absolute right-[-120px] top-[-140px] h-72 w-72 rounded-full bg-[#00D1FF]/10 blur-3xl" />
          <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="terminal-label text-[#8DEBFF]">Featured coverage</p>
              <h2 className="mt-1 text-base font-semibold text-white">Institutional-ready assets</h2>
              <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
                A quick lane for assets with the strongest current grading baseline.
              </p>
            </div>
            <span className="terminal-label rounded border border-[#00FF88]/25 bg-[#00FF88]/10 px-2 py-1 text-[#74FFB8]">
              Grade-filtered
            </span>
          </div>
          <div className="relative grid gap-3 md:grid-cols-3">
            {featuredAssets.map((asset) => (
              <Link
                key={asset.slug}
                href={`/dashboard/assets/${asset.slug}`}
                className="group rounded-xl border border-[#00D1FF]/15 bg-[#050A14]/55 p-4 transition hover:border-[#00D1FF]/35 hover:bg-[#00D1FF]/[0.045] hover:shadow-[0_0_24px_rgba(0,209,255,0.12)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{asset.identity?.name ?? asset.slug}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{asset.identity?.symbol ?? "—"}</p>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-[#8DEBFF] opacity-70 transition group-hover:opacity-100" />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${gradeBadgeClass(gradeLabel(asset))}`}>
                    {gradeLabel(asset)}
                  </span>
                  <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--text-label)]">
                    {asset.grade?.score ?? "—"}/100
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_38px_rgba(0,209,255,0.06)]">
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#00D1FF]/15 pb-4">
            <div>
              <p className="terminal-label text-[#8DEBFF]">Asset lens</p>
              <h2 className="mt-1 text-base font-semibold text-white">Filter the asset universe</h2>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Sorted by {sortLabel} ({sortOrder})
            </p>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="hidden text-[#8DEBFF] sm:inline-flex" aria-hidden>
                  <Filter className="size-4" />
                </span>
                {CATEGORY_TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategory(key)}
                    className={`rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${
                      selectedCategory === key
                        ? "border-[#00D1FF]/45 bg-[#00D1FF]/15 text-[#8DEBFF] shadow-[0_0_18px_rgba(0,209,255,0.12)]"
                        : "border-white/10 bg-white/[0.04] text-[var(--text-label)] hover:border-[#00D1FF]/25 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="hidden text-[#74FFB8] sm:inline-flex" aria-hidden>
                  <Sparkles className="size-4" />
                </span>
                {GRADE_TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedGrade(key)}
                    className={`rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${
                      selectedGrade === key
                        ? "border-[#00FF88]/40 bg-[#00FF88]/12 text-[#74FFB8] shadow-[0_0_18px_rgba(0,255,136,0.12)]"
                        : "border-white/10 bg-white/[0.04] text-[var(--text-label)] hover:border-[#00FF88]/25 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end xl:max-w-xl">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#4A5568]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, symbol, or issuer..."
                  className="w-full rounded-lg border border-[#00D1FF]/15 bg-[#050A14]/70 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-[#4A5568] outline-none ring-[#00D1FF]/0 transition-[box-shadow,border-color] focus:border-[#00D1FF]/35 focus:ring-2"
                />
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="hidden text-xs text-[#4A5568] sm:inline">Sort</span>
                <div className="flex rounded-lg border border-[#00D1FF]/15 bg-[#050A14]/70 p-0.5">
                  {(["tvl", "yield", "change7d", "grade", "name"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSort(key)}
                      className={`flex items-center gap-0.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                        sortBy === key
                          ? "bg-[#00D1FF]/12 text-[#8DEBFF]"
                          : "text-[#8892A4] hover:text-white"
                      }`}
                    >
                      {key === "tvl"
                        ? "TVL"
                        : key === "yield"
                          ? "Yield"
                          : key === "change7d"
                            ? "7D"
                            : key === "grade"
                              ? "Grade"
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
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <AssetCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#00D1FF]/20 bg-[#050A14]/55 px-6 py-16 text-center">
          <SearchX className="size-12 text-[#4A5568]" aria-hidden />
          <p className="mt-4 text-lg font-semibold text-white">No assets found</p>
          <p className="mt-1 max-w-sm text-sm text-[#8892A4]">
            Try another search, category, or grade filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("ALL");
              setSelectedGrade("ALL");
            }}
            className="mt-6 rounded-lg border border-[#00D1FF]/35 bg-[#00D1FF]/10 px-4 py-2 text-sm font-medium text-[#8DEBFF] transition-colors hover:bg-[#00D1FF]/16"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="terminal-label text-[#8DEBFF]">All assets</p>
              <h2 className="mt-1 text-base font-semibold text-white">
                {filteredSorted.length} asset{filteredSorted.length === 1 ? "" : "s"} shown
              </h2>
            </div>
            <Link
              href="/dashboard/api-docs"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#8DEBFF] hover:underline"
            >
              Use API
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredSorted.map((asset, index) => (
              <AssetCard key={asset.slug} asset={asset} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HeroMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#00D1FF]/15 bg-[#050A14]/55 p-3">
      <p className="terminal-label text-[#8DEBFF]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function AssetMetricCard({ icon, label, value, helper, variant = "cyan" }: { icon: ReactNode; label: string; value: string; helper: string; variant?: "cyan" | "green" | "amber" | "purple" }) {
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
