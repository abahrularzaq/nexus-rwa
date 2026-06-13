"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Database,
  ExternalLink,
  FileSearch,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

type SourceTier = "Tier 1" | "Tier 2" | "Tier 3";
type SourceStatus = "healthy" | "redirected" | "restricted" | "broken" | "manual_required" | "unchecked" | "timeout" | "error";

type SourceRow = {
  id?: string;
  assetSlug: string;
  layer: string;
  field: string;
  sourceType: string;
  sourceUrl: string;
  reliability: number;
  checkedBy: string;
  status: SourceStatus;
  tier?: SourceTier;
  checkedAt?: string;
  lastCheckedAt?: string;
  notes?: string | null;
  errorMessage?: string | null;
  httpStatus?: number | null;
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

const ADMIN_KEY_STORAGE = "nexus_admin_key";
const SOURCE_LIBRARY_URL = "/api/admin/monitoring/sources?limit=250";

const fallbackRows: SourceRow[] = [
  {
    assetSlug: "ondo-ousg",
    layer: "reserve",
    field: "reserveBreakdown",
    sourceType: "market_aggregator",
    sourceUrl: "https://app.rwa.xyz/protocols/ondo-finance",
    reliability: 84,
    checkedBy: "manual_required",
    status: "manual_required",
    notes: "Fallback preview. API data will replace this after admin source evidence endpoint is reachable.",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "compliance",
    field: "blockedJurisdictions",
    sourceType: "terms_of_service",
    sourceUrl: "https://ondo.finance/terms-of-service",
    reliability: 81,
    checkedBy: "manual_required",
    status: "manual_required",
    notes: "Fallback preview. API data will replace this after admin source evidence endpoint is reachable.",
  },
];

const sourceTiers = [
  {
    tier: "Tier 1",
    title: "Primary evidence",
    description: "Issuer docs, legal documents, reserve reports, SEC filings, official transparency pages, and verified contracts.",
    icon: ShieldCheck,
  },
  {
    tier: "Tier 2",
    title: "Market data sources",
    description: "rwa.xyz, DeFiLlama, explorers, analytics dashboards, and official ecosystem integrations.",
    icon: FileSearch,
  },
  {
    tier: "Tier 3",
    title: "Context only",
    description: "Reputable media, commentary, and secondary references that should not override primary documents.",
    icon: TriangleAlert,
  },
];

const checks = [
  "Every non-null field should have a source URL.",
  "Reserve claims must come from official transparency, audit, legal, or custody documents.",
  "Smart-contract audits must not be treated as reserve audits.",
  "Conflicting values should preserve the higher-reliability source and document the conflict.",
  "Missing evidence should become a data gap, not an estimate.",
];

function normalizeStatus(value: unknown): SourceStatus {
  const status = String(value ?? "unchecked").toLowerCase().replace(/\s+/g, "_");
  if (["healthy", "redirected", "restricted", "broken", "manual_required", "timeout", "error", "unchecked"].includes(status)) {
    return status as SourceStatus;
  }
  return "unchecked";
}

function getTier(source: SourceRow): SourceTier {
  if (source.tier) return source.tier;
  const type = source.sourceType.toLowerCase();
  const url = source.sourceUrl.toLowerCase();

  if (
    type.includes("official") ||
    type.includes("legal") ||
    type.includes("terms") ||
    type.includes("block_explorer") ||
    url.includes("etherscan.io") ||
    url.includes("sec.gov")
  ) {
    return "Tier 1";
  }

  if (
    type.includes("market") ||
    type.includes("aggregator") ||
    url.includes("rwa.xyz") ||
    url.includes("defillama") ||
    url.includes("coingecko") ||
    url.includes("coinmarketcap")
  ) {
    return "Tier 2";
  }

  return "Tier 3";
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatDate(value: unknown): string {
  if (!value || typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function uniqueValues(rows: SourceRow[], key: keyof SourceRow): string[] {
  return Array.from(new Set(rows.map((row) => String(row[key] ?? "")).filter(Boolean))).sort();
}

function statusClass(status: SourceStatus): string {
  if (["healthy", "redirected"].includes(status)) return "border-[#00FF88]/30 bg-[#00FF88]/10 text-[#00FF88]";
  if (["broken", "error"].includes(status)) return "border-[#FF4444]/30 bg-[#FF4444]/10 text-[#FF8888]";
  if (status === "manual_required") return "border-[#B983FF]/30 bg-[#B983FF]/10 text-[#D8B4FE]";
  return "border-[#FFB800]/30 bg-[#FFB800]/10 text-[#FFB800]";
}

function tierClass(tier: SourceTier): string {
  if (tier === "Tier 1") return "border-[#00D1FF]/30 bg-[#00D1FF]/10 text-[#7BE8FF]";
  if (tier === "Tier 2") return "border-[#FFB800]/30 bg-[#FFB800]/10 text-[#FFB800]";
  return "border-white/15 bg-white/[0.04] text-[var(--text-secondary)]";
}

function reliabilityLabel(score: number): string {
  if (score >= 90) return "Institutional";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Acceptable";
  return "Context";
}

function normalizeRows(rows: Array<Record<string, unknown>>): SourceRow[] {
  return rows
    .map((row) => ({
      id: typeof row.id === "string" ? row.id : undefined,
      assetSlug: String(row.assetSlug ?? "unknown"),
      layer: String(row.layer ?? "unknown"),
      field: String(row.field ?? "unknown"),
      sourceType: String(row.sourceType ?? "unknown"),
      sourceUrl: String(row.sourceUrl ?? ""),
      reliability: Number(row.reliability ?? 0),
      checkedBy: String(row.checkedBy ?? "manual"),
      status: normalizeStatus(row.status),
      tier: row.tier === "Tier 1" || row.tier === "Tier 2" || row.tier === "Tier 3" ? row.tier : undefined,
      checkedAt: typeof row.checkedAt === "string" ? row.checkedAt : undefined,
      lastCheckedAt: typeof row.lastCheckedAt === "string" ? row.lastCheckedAt : undefined,
      notes: typeof row.notes === "string" ? row.notes : null,
      errorMessage: typeof row.errorMessage === "string" ? row.errorMessage : null,
      httpStatus: typeof row.httpStatus === "number" ? row.httpStatus : null,
    }))
    .filter((row) => row.sourceUrl.startsWith("http"));
}

export default function SourcesPage() {
  const [rows, setRows] = useState<SourceRow[]>(fallbackRows);
  const [sourceMode, setSourceMode] = useState<"fallback" | "api">("fallback");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [assetSlug, setAssetSlug] = useState("");
  const [layer, setLayer] = useState("");
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [sourceType, setSourceType] = useState("");

  const loadSources = useCallback(async () => {
    const adminKey = window.localStorage.getItem(ADMIN_KEY_STORAGE)?.trim();
    if (!adminKey) {
      setError("Admin key belum tersimpan. Buka Monitoring sekali atau simpan admin key agar Sources bisa membaca data database.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(SOURCE_LIBRARY_URL, {
        method: "GET",
        headers: { Accept: "application/json", "X-Admin-Key": adminKey },
        cache: "no-store",
      });
      const body = (await response.json()) as ApiResponse<Array<Record<string, unknown>>>;
      if (!response.ok || !body.success) {
        throw new Error(body.success === false ? body.error.message : response.statusText);
      }

      const normalized = normalizeRows(body.data);
      if (normalized.length > 0) {
        setRows(normalized);
        setSourceMode("api");
      } else {
        setError("Endpoint Sources sudah hidup, tetapi database belum mengembalikan source rows.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat source evidence dari API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  const rowsWithTier = useMemo(() => rows.map((row) => ({ ...row, tier: getTier(row) })), [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rowsWithTier.filter((row) => {
      const matchesQuery =
        !query ||
        [row.assetSlug, row.layer, row.field, row.sourceType, row.sourceUrl, row.checkedBy, row.notes, row.errorMessage]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return (
        matchesQuery &&
        (!assetSlug || row.assetSlug === assetSlug) &&
        (!layer || row.layer === layer) &&
        (!tier || row.tier === tier) &&
        (!status || row.status === status) &&
        (!sourceType || row.sourceType === sourceType)
      );
    });
  }, [assetSlug, layer, rowsWithTier, search, sourceType, status, tier]);

  const manualRows = rowsWithTier.filter((row) => row.status === "manual_required" || row.checkedBy === "manual_required");
  const tier1Count = rowsWithTier.filter((row) => row.tier === "Tier 1").length;
  const avgReliability = rowsWithTier.length > 0 ? Math.round(rowsWithTier.reduce((sum, row) => sum + row.reliability, 0) / rowsWithTier.length) : 0;
  const tier1Coverage = rowsWithTier.length > 0 ? Math.round((tier1Count / rowsWithTier.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-3 border-b border-[var(--border-line)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5">Source library</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">Evidence Control Center</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Search, filter, and audit the evidence trail behind every asset field, source reliability score, warning, blocker, and grade.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadSources()}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-line)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-cyan)] hover:text-white"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link href="/dashboard/layers" className="terminal-label inline-flex items-center gap-1 text-[var(--accent-amber)] hover:underline">
            View 12-layer model
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </header>

      {error ? (
        <section className="rounded-xl border border-[#FFB800]/25 bg-[#FFB800]/[0.06] p-4 text-sm text-[var(--text-secondary)]">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#FFB800]" />
            <div>
              <p className="font-semibold text-[#FFB800]">Source API note</p>
              <p className="mt-1">{error}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Current page is showing {sourceMode === "api" ? "database" : "fallback preview"} data.</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="data-surface p-4">
          <p className="terminal-label mb-2">Total Sources</p>
          <div className="terminal-data text-2xl font-semibold text-white">{rowsWithTier.length}</div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">{sourceMode === "api" ? "Loaded from database" : "Fallback preview"}</p>
        </div>
        <div className="data-surface p-4">
          <p className="terminal-label mb-2">Tier 1 Coverage</p>
          <div className="terminal-data text-2xl font-semibold text-white">{tier1Coverage}%</div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Primary evidence ratio</p>
        </div>
        <div className="data-surface p-4">
          <p className="terminal-label mb-2">Manual Review</p>
          <div className="terminal-data text-2xl font-semibold text-white">{manualRows.length}</div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Not treated as broken</p>
        </div>
        <div className="data-surface p-4">
          <p className="terminal-label mb-2">Avg Reliability</p>
          <div className="terminal-data text-2xl font-semibold text-white">{avgReliability}</div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Evidence confidence score</p>
        </div>
      </section>

      <section className="terminal-panel p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="terminal-label">Source Library</p>
            <h2 className="mt-1 text-base font-semibold text-white">Searchable field-level evidence</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Database className="size-4 text-[var(--accent-cyan)]" />
            Showing {filteredRows.length}/{rowsWithTier.length} sources
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-6">
          <label className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search asset, field, URL..."
              className="w-full rounded-lg border border-[var(--border-line)] bg-[#080D19] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-[var(--accent-cyan)]"
            />
          </label>
          <select value={assetSlug} onChange={(event) => setAssetSlug(event.target.value)} className="rounded-lg border border-[var(--border-line)] bg-[#080D19] px-3 py-2 text-sm text-white outline-none">
            <option value="">All assets</option>
            {uniqueValues(rowsWithTier, "assetSlug").map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={layer} onChange={(event) => setLayer(event.target.value)} className="rounded-lg border border-[var(--border-line)] bg-[#080D19] px-3 py-2 text-sm text-white outline-none">
            <option value="">All layers</option>
            {uniqueValues(rowsWithTier, "layer").map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={tier} onChange={(event) => setTier(event.target.value)} className="rounded-lg border border-[var(--border-line)] bg-[#080D19] px-3 py-2 text-sm text-white outline-none">
            <option value="">All tiers</option>
            {["Tier 1", "Tier 2", "Tier 3"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-[var(--border-line)] bg-[#080D19] px-3 py-2 text-sm text-white outline-none">
            <option value="">All status</option>
            {["healthy", "redirected", "restricted", "broken", "manual_required", "unchecked", "timeout", "error"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]"><Filter className="size-4 text-[var(--accent-amber)]" /> Source type</div>
          <select value={sourceType} onChange={(event) => setSourceType(event.target.value)} className="rounded-lg border border-[var(--border-line)] bg-[#080D19] px-3 py-2 text-sm text-white outline-none">
            <option value="">All source types</option>
            {uniqueValues(rowsWithTier, "sourceType").map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border-line)]">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="border-b border-[var(--border-line)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Asset</th><th className="px-4 py-3 font-medium">Layer</th><th className="px-4 py-3 font-medium">Field</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Tier</th><th className="px-4 py-3 font-medium">Reliability</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Checked</th><th className="px-4 py-3 font-medium">URL</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={`${row.id ?? "source"}-${row.assetSlug}-${row.layer}-${row.field}-${row.sourceUrl}`} className="border-b border-[rgba(30,42,58,0.55)] last:border-0">
                  <td className="px-4 py-3 terminal-data text-white">{row.assetSlug}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{row.layer}</td>
                  <td className="px-4 py-3 text-white">{row.field}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{row.sourceType}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-xs ${tierClass(row.tier)}`}>{row.tier}</span></td>
                  <td className="px-4 py-3"><span className="terminal-data text-white">{row.reliability}</span><span className="ml-2 text-xs text-[var(--text-muted)]">{reliabilityLabel(row.reliability)}</span></td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-xs ${statusClass(row.status)}`}>{row.status}</span></td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{formatDate(row.lastCheckedAt ?? row.checkedAt)}</td>
                  <td className="max-w-[220px] px-4 py-3"><a href={row.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-[220px] items-center gap-1 truncate text-[var(--accent-cyan)] hover:underline"><span className="truncate">{hostname(row.sourceUrl)}</span><ExternalLink className="size-3 shrink-0" /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="terminal-panel p-5">
        <p className="terminal-label">Manual Review Needed</p>
        <h2 className="mt-1 text-base font-semibold text-white">Sources excluded from automatic broken status</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {manualRows.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">No manual-required sources in current filters.</p> : manualRows.map((row) => (
            <div key={`${row.assetSlug}-${row.field}-${row.sourceUrl}`} className="rounded-xl border border-[#B983FF]/20 bg-[#B983FF]/[0.06] p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="terminal-data text-white">{row.assetSlug}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{row.layer}.{row.field}</p></div><span className={`rounded-full border px-2 py-1 text-xs ${statusClass(row.status)}`}>{row.status}</span></div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{row.notes ?? row.errorMessage ?? "Manual verification is required before this source can be treated as production-grade."}</p>
              <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--accent-cyan)] hover:underline">{hostname(row.sourceUrl)} <ExternalLink className="size-3" /></a>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3"><p className="terminal-label">Source Methodology</p><h2 className="mt-1 text-base font-semibold text-white">Evidence tiers</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          {sourceTiers.map(({ tier: tierName, title, description, icon: Icon }) => (
            <div key={tierName} className="terminal-panel p-5"><Icon className="size-5 text-[var(--accent-amber)]" /><p className="terminal-label mt-4">{tierName}</p><h3 className="mt-1 font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p></div>
          ))}
        </div>
      </section>

      <section className="terminal-panel p-5">
        <p className="terminal-label">Source policy</p>
        <h2 className="mt-1 text-base font-semibold text-white">Rules for production-grade asset data</h2>
        <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
          {checks.map((check) => <li key={check} className="flex gap-2 leading-relaxed"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent-amber)]" />{check}</li>)}
        </ul>
      </section>
    </div>
  );
}
