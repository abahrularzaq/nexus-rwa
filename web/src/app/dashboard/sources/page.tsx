"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Database,
  ExternalLink,
  FileSearch,
  Filter,
  Search,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

type SourceTier = "Tier 1" | "Tier 2" | "Tier 3";
type SourceStatus = "healthy" | "redirected" | "restricted" | "broken" | "manual_required" | "unchecked";

type SourceRow = {
  assetSlug: string;
  layer: string;
  field: string;
  sourceType: string;
  sourceUrl: string;
  reliability: number;
  checkedBy: string;
  status: SourceStatus;
  notes?: string;
};

const sourceRows: SourceRow[] = [
  {
    assetSlug: "ondo-ousg",
    layer: "identity",
    field: "name",
    sourceType: "official_website",
    sourceUrl: "https://ondo.finance/ousg",
    reliability: 92,
    checkedBy: "manual",
    status: "healthy",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "identity",
    field: "docsUrl",
    sourceType: "official_docs",
    sourceUrl: "https://docs.ondo.finance/ondo-global-markets/trust-and-transparency",
    reliability: 92,
    checkedBy: "manual",
    status: "healthy",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "identity",
    field: "twitterUrl",
    sourceType: "official_social",
    sourceUrl: "https://x.com/OndoFinance",
    reliability: 92,
    checkedBy: "manual",
    status: "unchecked",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "identity",
    field: "launchDate",
    sourceType: "market_aggregator",
    sourceUrl: "https://www.coingecko.com/en/coins/ousg",
    reliability: 68,
    checkedBy: "manual",
    status: "healthy",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "reserve",
    field: "backingType",
    sourceType: "official_website",
    sourceUrl: "https://ondo.finance/ousg",
    reliability: 84,
    checkedBy: "manual",
    status: "healthy",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "reserve",
    field: "backingDescription",
    sourceType: "official_docs",
    sourceUrl: "https://docs.ondo.finance/ondo-global-markets/trust-and-transparency",
    reliability: 84,
    checkedBy: "manual",
    status: "healthy",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "reserve",
    field: "custodian",
    sourceType: "official_docs",
    sourceUrl: "https://docs.ondo.finance/trust-and-security",
    reliability: 84,
    checkedBy: "manual",
    status: "healthy",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "reserve",
    field: "reserveBreakdown",
    sourceType: "market_aggregator",
    sourceUrl: "https://app.rwa.xyz/protocols/ondo-finance",
    reliability: 84,
    checkedBy: "manual_required",
    status: "manual_required",
    notes: "Legacy aggregator URL returned 404. Replace with stable official or aggregator source before automatic checks.",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "reserve",
    field: "hasProofOfReserves",
    sourceType: "official_docs",
    sourceUrl: "https://docs.ondo.finance/ondo-global-markets/trust-and-transparency",
    reliability: 84,
    checkedBy: "manual",
    status: "healthy",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "institutional",
    field: "issuerName",
    sourceType: "official_website",
    sourceUrl: "https://ondo.finance/ousg",
    reliability: 81,
    checkedBy: "manual",
    status: "healthy",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "institutional",
    field: "fundManager",
    sourceType: "official_docs",
    sourceUrl: "https://docs.ondo.finance/trust-and-security",
    reliability: 81,
    checkedBy: "manual",
    status: "healthy",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "compliance",
    field: "regulatoryFramework",
    sourceType: "official_website",
    sourceUrl: "https://ondo.finance/ousg",
    reliability: 81,
    checkedBy: "manual",
    status: "healthy",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "compliance",
    field: "kycRequired",
    sourceType: "official_docs",
    sourceUrl: "https://docs.ondo.finance/trust-and-security",
    reliability: 81,
    checkedBy: "manual",
    status: "healthy",
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
    notes: "Legacy Ondo terms URL returned 404. Verify current legal source manually before production publication.",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "blockchain",
    field: "contractAddress",
    sourceType: "block_explorer",
    sourceUrl: "https://etherscan.io/token/0x1bfe8cb57a0f5ecca7e7666798d9fb3f3a9befae",
    reliability: 90,
    checkedBy: "manual",
    status: "healthy",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "yield",
    field: "yieldBenchmark",
    sourceType: "official_docs",
    sourceUrl: "https://docs.ondo.finance/ondo-global-markets/trust-and-transparency",
    reliability: 68,
    checkedBy: "manual",
    status: "healthy",
  },
  {
    assetSlug: "ondo-ousg",
    layer: "liquidity",
    field: "redemptionType",
    sourceType: "official_website",
    sourceUrl: "https://ondo.finance/ousg",
    reliability: 68,
    checkedBy: "manual",
    status: "healthy",
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

function getTier(source: SourceRow): SourceTier {
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

function uniqueValues<T extends keyof SourceRow>(key: T): string[] {
  return Array.from(new Set(sourceRows.map((row) => String(row[key])))).sort();
}

function statusClass(status: SourceStatus): string {
  if (["healthy", "redirected"].includes(status)) return "border-[#00FF88]/30 bg-[#00FF88]/10 text-[#00FF88]";
  if (status === "broken") return "border-[#FF4444]/30 bg-[#FF4444]/10 text-[#FF8888]";
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

export default function SourcesPage() {
  const [search, setSearch] = useState("");
  const [assetSlug, setAssetSlug] = useState("");
  const [layer, setLayer] = useState("");
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [sourceType, setSourceType] = useState("");

  const rowsWithTier = useMemo(() => sourceRows.map((row) => ({ ...row, tier: getTier(row) })), []);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rowsWithTier.filter((row) => {
      const matchesQuery =
        !query ||
        [row.assetSlug, row.layer, row.field, row.sourceType, row.sourceUrl, row.checkedBy, row.notes]
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
  const avgReliability = Math.round(rowsWithTier.reduce((sum, row) => sum + row.reliability, 0) / rowsWithTier.length);
  const tier1Coverage = Math.round((tier1Count / rowsWithTier.length) * 100);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-3 border-b border-[var(--border-line)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5">Source library</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            Evidence Control Center
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Search, filter, and audit the evidence trail behind every asset field, source reliability score, warning, blocker, and grade.
          </p>
        </div>
        <Link
          href="/dashboard/layers"
          className="terminal-label inline-flex items-center gap-1 text-[var(--accent-amber)] hover:underline"
        >
          View 12-layer model
          <ArrowUpRight className="size-3.5" />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="data-surface p-4">
          <p className="terminal-label mb-2">Total Sources</p>
          <div className="terminal-data text-2xl font-semibold text-white">{rowsWithTier.length}</div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Field-level URLs tracked</p>
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
            {uniqueValues("assetSlug").map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={layer} onChange={(event) => setLayer(event.target.value)} className="rounded-lg border border-[var(--border-line)] bg-[#080D19] px-3 py-2 text-sm text-white outline-none">
            <option value="">All layers</option>
            {uniqueValues("layer").map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={tier} onChange={(event) => setTier(event.target.value)} className="rounded-lg border border-[var(--border-line)] bg-[#080D19] px-3 py-2 text-sm text-white outline-none">
            <option value="">All tiers</option>
            {["Tier 1", "Tier 2", "Tier 3"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-[var(--border-line)] bg-[#080D19] px-3 py-2 text-sm text-white outline-none">
            <option value="">All status</option>
            {["healthy", "redirected", "restricted", "broken", "manual_required", "unchecked"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Filter className="size-4 text-[var(--accent-amber)]" /> Source type
          </div>
          <select value={sourceType} onChange={(event) => setSourceType(event.target.value)} className="rounded-lg border border-[var(--border-line)] bg-[#080D19] px-3 py-2 text-sm text-white outline-none">
            <option value="">All source types</option>
            {uniqueValues("sourceType").map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border-line)]">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-[var(--border-line)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Layer</th>
                <th className="px-4 py-3 font-medium">Field</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Reliability</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Checked By</th>
                <th className="px-4 py-3 font-medium">URL</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={`${row.assetSlug}-${row.layer}-${row.field}-${row.sourceUrl}`} className="border-b border-[rgba(30,42,58,0.55)] last:border-0">
                  <td className="px-4 py-3 terminal-data text-white">{row.assetSlug}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{row.layer}</td>
                  <td className="px-4 py-3 text-white">{row.field}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{row.sourceType}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-xs ${tierClass(row.tier)}`}>{row.tier}</span></td>
                  <td className="px-4 py-3"><span className="terminal-data text-white">{row.reliability}</span><span className="ml-2 text-xs text-[var(--text-muted)]">{reliabilityLabel(row.reliability)}</span></td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-xs ${statusClass(row.status)}`}>{row.status}</span></td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{row.checkedBy}</td>
                  <td className="max-w-[220px] px-4 py-3">
                    <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-[220px] items-center gap-1 truncate text-[var(--accent-cyan)] hover:underline">
                      <span className="truncate">{hostname(row.sourceUrl)}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </td>
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
          {manualRows.map((row) => (
            <div key={`${row.assetSlug}-${row.field}`} className="rounded-xl border border-[#B983FF]/20 bg-[#B983FF]/[0.06] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="terminal-data text-white">{row.assetSlug}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{row.layer}.{row.field}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-xs ${statusClass(row.status)}`}>{row.status}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{row.notes}</p>
              <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--accent-cyan)] hover:underline">
                {hostname(row.sourceUrl)} <ExternalLink className="size-3" />
              </a>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <p className="terminal-label">Source Methodology</p>
          <h2 className="mt-1 text-base font-semibold text-white">Evidence tiers</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {sourceTiers.map(({ tier: tierName, title, description, icon: Icon }) => (
            <div key={tierName} className="terminal-panel p-5">
              <Icon className="size-5 text-[var(--accent-amber)]" />
              <p className="terminal-label mt-4">{tierName}</p>
              <h3 className="mt-1 font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="terminal-panel p-5">
        <p className="terminal-label">Source policy</p>
        <h2 className="mt-1 text-base font-semibold text-white">Rules for production-grade asset data</h2>
        <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
          {checks.map((check) => (
            <li key={check} className="flex gap-2 leading-relaxed">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent-amber)]" />
              {check}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
