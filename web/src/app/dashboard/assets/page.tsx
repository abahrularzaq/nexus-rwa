"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Info,
  Search,
  SearchX,
} from "lucide-react";
import { AssetCard, AssetCardSkeleton } from "@/components/dashboard/AssetCard";
import { fetchAssetList } from "@/lib/api/assets";
import { normalizeCategory } from "@/lib/asset-mapper";
import type { AssetWithLayers } from "@/types/asset";

type AssetCategoryTab =
  | "ALL"
  | "TREASURY"
  | "CREDIT"
  | "REAL_ESTATE"
  | "COMMODITIES";

const CATEGORY_TABS: { key: AssetCategoryTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "TREASURY", label: "Treasury" },
  { key: "CREDIT", label: "Credit" },
  { key: "REAL_ESTATE", label: "Real Estate" },
  { key: "COMMODITIES", label: "Commodities" },
];

const SORT_OPTIONS = ["tvl", "yield", "holders", "name", "change7d"] as const;
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
    default:
      return 0;
  }
}

export default function DashboardAssetsPage() {
  const [assets, setAssets] = useState<AssetWithLayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AssetCategoryTab>("ALL");
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
      if (!q) return true;
      const name = a.identity?.name?.toLowerCase() ?? "";
      const symbol = a.identity?.symbol?.toLowerCase() ?? "";
      return name.includes(q) || symbol.includes(q);
    });
    const sk = SORT_OPTIONS.includes(sortBy as SortKey)
      ? (sortBy as SortKey)
      : "tvl";
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
      <div
        className="flex gap-3 rounded-xl border border-[rgba(0,212,255,0.2)] px-4 py-3"
        style={{ background: "rgba(0,212,255,0.05)" }}
      >
        <Info className="mt-0.5 size-5 shrink-0 text-[#00D4FF]" aria-hidden />
        <p className="text-sm leading-relaxed text-[#8892A4]">
          Asset discovery and public asset profiles are free. Full risk breakdown, yield history,
          holder intelligence, source trail, and reserve evidence require Pro access.
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

      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-white">
          RWA Assets
        </h1>
        <p className="mt-1 text-sm text-[#8892A4]">
          {loading ? "Loading assets…" : `${assets.length} assets tracked`}
        </p>
      </header>

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
          {filteredSorted.map((asset, index) => (
            <AssetCard key={asset.slug} asset={asset} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
