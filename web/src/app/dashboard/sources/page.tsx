"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Database,
  ExternalLink,
  FileSearch,
  Filter,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useAccount } from "wagmi";

import { PaywallModal } from "@/components/paywall/PaywallModal";
import { parseX402Response, type AccessTier, type X402Details } from "@/types/x402";

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

type SourceRowWithTier = SourceRow & { tier: SourceTier };

type SourceQualityRow = {
  assetSlug: string;
  totalSources: number;
  tier1Count: number;
  tier1Coverage: number;
  manualReview: number;
  broken: number;
  healthy: number;
  healthyCoverage: number;
  avgReliability: number;
  sourceScore: number;
  quality: "Excellent" | "Strong" | "Developing" | "Weak";
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

type SessionResponse = {
  success?: boolean;
  data?: {
    active?: boolean;
    tier?: AccessTier;
    expiresAt?: string | null;
  };
};

const ADMIN_KEY_STORAGE = "nexus_admin_key";
const SOURCE_LIBRARY_URL = "/api/admin/monitoring/sources?limit=250";
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
const DEFAULT_UNLOCK_SLUG = "ondo-ousg";

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
] as const;

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

function normalizeTier(value: unknown): SourceTier | undefined {
  if (value === "Tier 1" || value === "Tier 2" || value === "Tier 3") return value;
  return undefined;
}

function getTier(source: SourceRow): SourceTier {
  const normalized = normalizeTier(source.tier);
  if (normalized) return normalized;

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

function uniqueValues(rows: SourceRowWithTier[], key: keyof SourceRow): string[] {
  return Array.from(new Set(rows.map((row) => String(row[key] ?? "")).filter(Boolean))).sort();
}

function statusClass(status: SourceStatus): string {
  if (["healthy", "redirected"].includes(status)) return "border-[#00FF88]/40 bg-[#00FF88]/15 text-[#6DFFB2] shadow-[0_0_18px_rgba(0,255,136,0.12)]";
  if (["broken", "error"].includes(status)) return "border-[#FF4444]/40 bg-[#FF4444]/15 text-[#FFA0A0] shadow-[0_0_18px_rgba(255,68,68,0.12)]";
  if (status === "manual_required") return "border-[#B983FF]/40 bg-[#B983FF]/15 text-[#E6D0FF] shadow-[0_0_18px_rgba(185,131,255,0.12)]";
  return "border-[#FFB800]/40 bg-[#FFB800]/15 text-[#FFD36A] shadow-[0_0_18px_rgba(255,184,0,0.1)]";
}

function tierClass(tier: SourceTier): string {
  if (tier === "Tier 1") return "border-[#00D1FF]/40 bg-[#00D1FF]/15 text-[#8DEBFF] shadow-[0_0_18px_rgba(0,209,255,0.12)]";
  if (tier === "Tier 2") return "border-[#FFB800]/40 bg-[#FFB800]/15 text-[#FFD36A] shadow-[0_0_18px_rgba(255,184,0,0.1)]";
  return "border-white/15 bg-white/[0.04] text-[var(--text-secondary)]";
}

function reliabilityLabel(score: number, isProAccess: boolean): string {
  if (!isProAccess) {
    if (score >= 90) return "90+";
    if (score >= 80) return "80–89";
    if (score >= 70) return "70–79";
    return "<70";
  }
  if (score >= 90) return "Institutional";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Acceptable";
  return "Context";
}

function qualityClass(quality: SourceQualityRow["quality"]): string {
  if (quality === "Excellent") return "border-[#00FF88]/45 bg-[#00FF88]/15 text-[#74FFB8] shadow-[0_0_22px_rgba(0,255,136,0.16)] ring-1 ring-[#00FF88]/10";
  if (quality === "Strong") return "border-[#00D1FF]/45 bg-[#00D1FF]/15 text-[#8DEBFF] shadow-[0_0_22px_rgba(0,209,255,0.16)] ring-1 ring-[#00D1FF]/10";
  if (quality === "Developing") return "border-[#FFB800]/45 bg-[#FFB800]/15 text-[#FFD36A] shadow-[0_0_22px_rgba(255,184,0,0.14)] ring-1 ring-[#FFB800]/10";
  return "border-[#FF4444]/45 bg-[#FF4444]/15 text-[#FFA0A0] shadow-[0_0_22px_rgba(255,68,68,0.14)] ring-1 ring-[#FF4444]/10";
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function sourceQualityLabel(score: number): SourceQualityRow["quality"] {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 65) return "Developing";
  return "Weak";
}

function normalizeRows(rows: Array<Record<string, unknown>>): SourceRow[] {
  return rows
    .map<SourceRow>((row) => ({
      id: typeof row.id === "string" ? row.id : undefined,
      assetSlug: String(row.assetSlug ?? "unknown"),
      layer: String(row.layer ?? "unknown"),
      field: String(row.field ?? "unknown"),
      sourceType: String(row.sourceType ?? "unknown"),
      sourceUrl: String(row.sourceUrl ?? ""),
      reliability: Number(row.reliability ?? 0),
      checkedBy: String(row.checkedBy ?? "manual"),
      status: normalizeStatus(row.status),
      tier: normalizeTier(row.tier),
      checkedAt: typeof row.checkedAt === "string" ? row.checkedAt : undefined,
      lastCheckedAt: typeof row.lastCheckedAt === "string" ? row.lastCheckedAt : undefined,
      notes: typeof row.notes === "string" ? row.notes : null,
      errorMessage: typeof row.errorMessage === "string" ? row.errorMessage : null,
      httpStatus: typeof row.httpStatus === "number" ? row.httpStatus : null,
    }))
    .filter((row) => row.sourceUrl.startsWith("http"));
}

function buildSourceQuality(rows: SourceRowWithTier[]): SourceQualityRow[] {
  const grouped = rows.reduce<Map<string, SourceRowWithTier[]>>((acc, row) => {
    const existing = acc.get(row.assetSlug) ?? [];
    existing.push(row);
    acc.set(row.assetSlug, existing);
    return acc;
  }, new Map());

  return Array.from(grouped.entries())
    .map(([assetSlug, assetRows]) => {
      const totalSources = assetRows.length;
      const tier1Count = assetRows.filter((row) => row.tier === "Tier 1").length;
      const manualReview = assetRows.filter((row) => row.status === "manual_required" || row.checkedBy === "manual_required").length;
      const broken = assetRows.filter((row) => ["broken", "error", "timeout"].includes(row.status)).length;
      const healthy = assetRows.filter((row) => ["healthy", "redirected"].includes(row.status)).length;
      const avgReliability = totalSources > 0 ? Math.round(assetRows.reduce((sum, row) => sum + row.reliability, 0) / totalSources) : 0;
      const tier1Coverage = totalSources > 0 ? Math.round((tier1Count / totalSources) * 100) : 0;
      const healthyCoverage = totalSources > 0 ? Math.round((healthy / totalSources) * 100) : 0;
      const penalty = manualReview * 2 + broken * 6;
      const sourceScore = clampScore(avgReliability * 0.5 + tier1Coverage * 0.3 + healthyCoverage * 0.2 - penalty);

      return {
        assetSlug,
        totalSources,
        tier1Count,
        tier1Coverage,
        manualReview,
        broken,
        healthy,
        healthyCoverage,
        avgReliability,
        sourceScore,
        quality: sourceQualityLabel(sourceScore),
      };
    })
    .sort((a, b) => b.sourceScore - a.sourceScore || b.totalSources - a.totalSources || a.assetSlug.localeCompare(b.assetSlug));
}

function isPaidTier(tier: AccessTier | "free"): boolean {
  return tier === "pro" || tier === "enterprise";
}

export default function SourcesPage() {
  const { address } = useAccount();
  const [rows, setRows] = useState<SourceRow[]>(fallbackRows);
  const [sourceMode, setSourceMode] = useState<"fallback" | "api">("fallback");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessTier, setAccessTier] = useState<AccessTier | "free">("free");
  const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<X402Details | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [unlockSlug, setUnlockSlug] = useState(DEFAULT_UNLOCK_SLUG);
  const [search, setSearch] = useState("");
  const [assetSlug, setAssetSlug] = useState("");
  const [layer, setLayer] = useState("");
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [sourceType, setSourceType] = useState("");

  const isProAccess = isPaidTier(accessTier);

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

  const checkAccess = useCallback(async () => {
    if (!address) {
      setAccessTier("free");
      setAccessExpiresAt(null);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/v1/session?wallet=${address}`, {
        headers: { Accept: "application/json", "X-Wallet-Address": address },
        cache: "no-store",
      });
      const body = (await response.json().catch(() => null)) as SessionResponse | null;
      const tierFromSession = body?.data?.active ? body.data.tier ?? "free" : "free";
      setAccessTier(tierFromSession);
      setAccessExpiresAt(body?.data?.expiresAt ?? null);
    } catch {
      setAccessTier("free");
      setAccessExpiresAt(null);
    }
  }, [address]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSources();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSources]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkAccess();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [checkAccess]);

  const rowsWithTier = useMemo<SourceRowWithTier[]>(() => rows.map((row) => ({ ...row, tier: getTier(row) })), [rows]);
  const sourceQualityRows = useMemo(() => buildSourceQuality(rowsWithTier), [rowsWithTier]);
  const topSourceQuality = sourceQualityRows[0];

  const selectedUnlockSlug = useMemo(() => assetSlug || rowsWithTier[0]?.assetSlug || DEFAULT_UNLOCK_SLUG, [assetSlug, rowsWithTier]);

  const requestProAccess = useCallback(async () => {
    if (!address) {
      setPaymentError("Connect wallet dulu untuk membuka Pro source access.");
      return;
    }

    const slug = selectedUnlockSlug;
    setUnlockSlug(slug);
    setPaymentError(null);

    try {
      const response = await fetch(`/api/proxy/v1/assets/${encodeURIComponent(slug)}/sources`, {
        headers: { Accept: "application/json", "X-Wallet-Address": address },
        cache: "no-store",
      });

      if (response.ok) {
        await checkAccess();
        setAccessTier("pro");
        return;
      }

      const body = await response.json().catch(() => null);
      const parsed = parseX402Response(body, `/v1/assets/${slug}/sources`);
      if (!parsed) throw new Error("Payment metadata tidak tersedia dari API.");

      setPaymentData(parsed.x402);
      setPaywallOpen(true);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Gagal menyiapkan Pro source access.");
    }
  }, [address, checkAccess, selectedUnlockSlug]);

  const onPaymentSuccess = useCallback(async (paymentHeader: string) => {
    if (!address) return;

    try {
      const response = await fetch(`/api/proxy/v1/assets/${encodeURIComponent(unlockSlug)}/sources`, {
        headers: {
          Accept: "application/json",
          "X-Wallet-Address": address,
          "X-Payment-Tx": paymentHeader,
        },
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`Payment verification failed (${response.status}).`);

      setPaywallOpen(false);
      setPaymentData(null);
      setPaymentError(null);
      setAccessTier("pro");
      await checkAccess();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Payment berhasil dibuat, tapi session belum terverifikasi.");
    }
  }, [address, checkAccess, unlockSlug]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rowsWithTier.filter((row) => {
      const searchableValues = isProAccess
        ? [row.assetSlug, row.layer, row.field, row.sourceType, row.sourceUrl, row.checkedBy, row.notes, row.errorMessage]
        : [row.assetSlug, row.layer, row.field, row.sourceType, hostname(row.sourceUrl), row.status, row.tier];
      const matchesQuery =
        !query ||
        searchableValues
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
  }, [assetSlug, isProAccess, layer, rowsWithTier, search, sourceType, status, tier]);

  const manualRows = rowsWithTier.filter((row) => row.status === "manual_required" || row.checkedBy === "manual_required");
  const tier1Count = rowsWithTier.filter((row) => row.tier === "Tier 1").length;
  const avgReliability = rowsWithTier.length > 0 ? Math.round(rowsWithTier.reduce((sum, row) => sum + row.reliability, 0) / rowsWithTier.length) : 0;
  const tier1Coverage = rowsWithTier.length > 0 ? Math.round((tier1Count / rowsWithTier.length) * 100) : 0;

  return (
    <div className="relative isolate space-y-8 overflow-hidden pb-10">
      <div className="pointer-events-none absolute inset-x-[-18%] top-[-180px] -z-10 h-[520px] bg-[radial-gradient(circle_at_28%_22%,rgba(0,209,255,0.18),transparent_34%),radial-gradient(circle_at_72%_18%,rgba(185,131,255,0.13),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(255,184,0,0.08),transparent_36%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-[-12%] top-[360px] -z-10 h-[420px] bg-[radial-gradient(circle_at_18%_20%,rgba(0,255,136,0.09),transparent_30%),radial-gradient(circle_at_88%_60%,rgba(255,68,68,0.08),transparent_32%)] blur-3xl" />

      <header className="relative flex flex-col gap-3 border-b border-[#00D1FF]/15 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5 text-[#8DEBFF]">Source library</p>
          <h1 className="bg-gradient-to-r from-white via-[#DDF9FF] to-[#8DEBFF] bg-clip-text text-2xl font-semibold leading-tight tracking-tight text-transparent">
            Evidence Control Center
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Search, filter, and audit the evidence trail behind every asset field, source reliability score, warning, blocker, and grade.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadSources()}
            className="inline-flex items-center gap-2 rounded-lg border border-[#00D1FF]/20 bg-[#00D1FF]/[0.04] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-cyan)] hover:bg-[#00D1FF]/10 hover:text-white hover:shadow-[0_0_24px_rgba(0,209,255,0.16)]"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link href="/dashboard/layers" className="terminal-label inline-flex items-center gap-1 text-[var(--accent-amber)] transition hover:text-[#FFD36A] hover:underline">
            View 12-layer model
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-xl border border-[#B983FF]/20 bg-[linear-gradient(135deg,rgba(8,13,25,0.96),rgba(11,20,38,0.88))] p-4 shadow-[0_0_40px_rgba(0,209,255,0.06)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_100%_0%,rgba(185,131,255,0.16),transparent_45%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium shadow-[0_0_18px_rgba(255,184,0,0.1)] ${isProAccess ? "border-[#00FF88]/40 bg-[#00FF88]/15 text-[#74FFB8] shadow-[0_0_18px_rgba(0,255,136,0.14)]" : "border-[#FFB800]/40 bg-[#FFB800]/15 text-[#FFD36A]"}`}>
                {isProAccess ? `${String(accessTier).toUpperCase()} access active` : "FREE source access"}
              </span>
              {accessExpiresAt ? <span className="text-xs text-[var(--text-muted)]">expires {formatDate(accessExpiresAt)}</span> : null}
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Free users see evidence summary, domains, tier, status, and reliability bands. Pro unlocks full URLs, field-level notes, manual review detail, and exact reliability scores.
            </p>
            {paymentError ? <p className="mt-2 text-xs text-[#FF8888]">{paymentError}</p> : null}
          </div>
          {!isProAccess ? (
            <button
              type="button"
              onClick={() => void requestProAccess()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#B983FF]/40 bg-[#B983FF]/15 px-4 py-2 text-sm font-medium text-[#E6D0FF] shadow-[0_0_24px_rgba(185,131,255,0.12)] transition hover:bg-[#B983FF]/25 hover:shadow-[0_0_34px_rgba(185,131,255,0.2)]"
            >
              <Sparkles className="size-4" />
              Unlock Pro source audit
            </button>
          ) : null}
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-[#FFB800]/30 bg-[#FFB800]/[0.08] p-4 text-sm text-[var(--text-secondary)] shadow-[0_0_28px_rgba(255,184,0,0.08)]">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#FFD36A]" />
            <div>
              <p className="font-semibold text-[#FFD36A]">Source API note</p>
              <p className="mt-1">{error}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Current page is showing {sourceMode === "api" ? "database" : "fallback preview"} data.</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="data-surface border-[#00D1FF]/20 bg-[linear-gradient(145deg,rgba(0,209,255,0.08),rgba(255,255,255,0.025))] p-4 shadow-[0_0_26px_rgba(0,209,255,0.06)]">
          <p className="terminal-label mb-2 text-[#8DEBFF]">Total Sources</p>
          <div className="terminal-data text-2xl font-semibold text-white">{rowsWithTier.length}</div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">{sourceMode === "api" ? "Loaded from database" : "Fallback preview"}</p>
        </div>
        <div className="data-surface border-[#00FF88]/20 bg-[linear-gradient(145deg,rgba(0,255,136,0.08),rgba(255,255,255,0.025))] p-4 shadow-[0_0_26px_rgba(0,255,136,0.06)]">
          <p className="terminal-label mb-2 text-[#74FFB8]">Tier 1 Coverage</p>
          <div className="terminal-data text-2xl font-semibold text-white">{tier1Coverage}%</div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Primary evidence ratio</p>
        </div>
        <div className="data-surface border-[#B983FF]/20 bg-[linear-gradient(145deg,rgba(185,131,255,0.09),rgba(255,184,0,0.035))] p-4 shadow-[0_0_26px_rgba(185,131,255,0.06)]">
          <p className="terminal-label mb-2 text-[#E6D0FF]">Manual Review</p>
          <div className="terminal-data text-2xl font-semibold text-white">{manualRows.length}</div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">{isProAccess ? "Open field notes" : "Count only in Free"}</p>
        </div>
        <div className="data-surface border-[#FFB800]/20 bg-[linear-gradient(145deg,rgba(255,184,0,0.08),rgba(255,255,255,0.025))] p-4 shadow-[0_0_26px_rgba(255,184,0,0.06)]">
          <p className="terminal-label mb-2 text-[#FFD36A]">Avg Reliability</p>
          <div className="terminal-data text-2xl font-semibold text-white">{isProAccess ? avgReliability : `${Math.round(avgReliability / 10) * 10}s`}</div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">{isProAccess ? "Exact evidence score" : "Rounded public band"}</p>
        </div>
      </section>

      <section className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_38px_rgba(0,209,255,0.06)]">
        <div className="pointer-events-none absolute right-[-120px] top-[-140px] h-72 w-72 rounded-full bg-[#00D1FF]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-160px] left-[-120px] h-72 w-72 rounded-full bg-[#00FF88]/8 blur-3xl" />
        <div className="relative mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="terminal-label text-[#8DEBFF]">Phase 3</p>
            <h2 className="mt-1 text-base font-semibold text-white">Source Quality per Asset</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Asset-level evidence quality summary built from field-level sources, tier coverage, health status, manual review, and reliability.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#00D1FF]/20 bg-[#00D1FF]/[0.06] px-3 py-1.5 text-xs text-[var(--text-secondary)]">
            <BarChart3 className="size-4 text-[var(--accent-cyan)]" />
            {sourceQualityRows.length} assets scored
          </div>
        </div>

        <div className="relative mb-4 grid gap-4 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-xl border border-[#00D1FF]/25 bg-[linear-gradient(145deg,rgba(0,209,255,0.12),rgba(0,255,136,0.045),rgba(255,255,255,0.025))] p-4 shadow-[0_0_34px_rgba(0,209,255,0.1)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D1FF]/70 to-transparent" />
            <p className="terminal-label mb-2 text-[#8DEBFF]">Top Source Quality</p>
            <div className="terminal-data text-xl font-semibold text-white">{topSourceQuality?.assetSlug ?? "—"}</div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">Score {isProAccess ? topSourceQuality?.sourceScore ?? "—" : topSourceQuality ? `${Math.round(topSourceQuality.sourceScore / 10) * 10}s` : "—"}</p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-[#B983FF]/25 bg-[linear-gradient(145deg,rgba(185,131,255,0.12),rgba(255,184,0,0.05),rgba(255,255,255,0.025))] p-4 shadow-[0_0_34px_rgba(185,131,255,0.1)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B983FF]/70 to-[#FFB800]/30" />
            <p className="terminal-label mb-2 text-[#E6D0FF]">Assets with Manual Review</p>
            <div className="terminal-data text-xl font-semibold text-white">{sourceQualityRows.filter((row) => row.manualReview > 0).length}</div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">Requires human evidence verification</p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-[#FF4444]/25 bg-[linear-gradient(145deg,rgba(255,68,68,0.11),rgba(255,184,0,0.045),rgba(255,255,255,0.025))] p-4 shadow-[0_0_34px_rgba(255,68,68,0.08)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF8888]/65 to-[#FFB800]/30" />
            <p className="terminal-label mb-2 text-[#FFA0A0]">Assets with Broken Sources</p>
            <div className="terminal-data text-xl font-semibold text-white">{sourceQualityRows.filter((row) => row.broken > 0).length}</div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">Broken, timeout, or error status</p>
          </div>
        </div>

        <div className="relative overflow-x-auto rounded-xl border border-[#00D1FF]/15 bg-[#050A14]/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-[#00D1FF]/15 bg-[#00D1FF]/[0.035] text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Sources</th>
                <th className="px-4 py-3 font-medium">Tier 1</th>
                <th className="px-4 py-3 font-medium">Healthy</th>
                <th className="px-4 py-3 font-medium">Manual</th>
                <th className="px-4 py-3 font-medium">Broken</th>
                <th className="px-4 py-3 font-medium">Avg Reliability</th>
                <th className="px-4 py-3 font-medium">Source Score</th>
                <th className="px-4 py-3 font-medium">Quality</th>
              </tr>
            </thead>
            <tbody>
              {sourceQualityRows.map((row) => (
                <tr key={row.assetSlug} className="border-b border-[rgba(30,42,58,0.55)] transition hover:bg-[#00D1FF]/[0.045] hover:shadow-[inset_3px_0_0_rgba(0,209,255,0.45)] last:border-0">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setAssetSlug(row.assetSlug)} className="terminal-data text-left text-white transition hover:text-[var(--accent-cyan)]">
                      {row.assetSlug}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{row.totalSources}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{row.tier1Coverage}%</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{row.healthyCoverage}%</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{row.manualReview}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{row.broken}</td>
                  <td className="px-4 py-3 text-white">{isProAccess ? row.avgReliability : reliabilityLabel(row.avgReliability, false)}</td>
                  <td className="px-4 py-3 text-white">{isProAccess ? row.sourceScore : `${Math.round(row.sourceScore / 10) * 10}s`}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${qualityClass(row.quality)}`}>{row.quality}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_38px_rgba(0,209,255,0.05)]">
        <div className="pointer-events-none absolute right-[-160px] top-[-120px] h-80 w-80 rounded-full bg-[#00D1FF]/8 blur-3xl" />
        <div className="relative mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="terminal-label text-[#8DEBFF]">Source Library</p>
            <h2 className="mt-1 text-base font-semibold text-white">Searchable field-level evidence</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#00D1FF]/20 bg-[#00D1FF]/[0.06] px-3 py-1.5 text-xs text-[var(--text-secondary)]">
            <Database className="size-4 text-[var(--accent-cyan)]" />
            Showing {filteredRows.length}/{rowsWithTier.length} sources
          </div>
        </div>

        <div className="relative mb-4 grid gap-3 md:grid-cols-6">
          <label className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isProAccess ? "Search asset, field, URL, notes..." : "Search asset, field, domain..."}
              className="w-full rounded-lg border border-[#00D1FF]/15 bg-[#080D19]/90 py-2 pl-9 pr-3 text-sm text-white outline-none transition focus:border-[var(--accent-cyan)] focus:bg-[#0B1426] focus:shadow-[0_0_24px_rgba(0,209,255,0.12)]"
            />
          </label>
          <select value={assetSlug} onChange={(event) => setAssetSlug(event.target.value)} className="rounded-lg border border-[#00D1FF]/15 bg-[#080D19]/90 px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--accent-cyan)]">
            <option value="">All assets</option>
            {uniqueValues(rowsWithTier, "assetSlug").map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={layer} onChange={(event) => setLayer(event.target.value)} className="rounded-lg border border-[#00D1FF]/15 bg-[#080D19]/90 px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--accent-cyan)]">
            <option value="">All layers</option>
            {uniqueValues(rowsWithTier, "layer").map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={tier} onChange={(event) => setTier(event.target.value)} className="rounded-lg border border-[#00D1FF]/15 bg-[#080D19]/90 px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--accent-cyan)]">
            <option value="">All tiers</option>
            {["Tier 1", "Tier 2", "Tier 3"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-[#00D1FF]/15 bg-[#080D19]/90 px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--accent-cyan)]">
            <option value="">All status</option>
            {["healthy", "redirected", "restricted", "broken", "manual_required", "unchecked", "timeout", "error"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>

        <div className="relative mb-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB800]/20 bg-[#FFB800]/[0.06] px-3 py-1.5 text-xs text-[var(--text-secondary)]"><Filter className="size-4 text-[var(--accent-amber)]" /> Source type</div>
          <select value={sourceType} onChange={(event) => setSourceType(event.target.value)} className="rounded-lg border border-[#FFB800]/20 bg-[#080D19]/90 px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--accent-amber)]">
            <option value="">All source types</option>
            {uniqueValues(rowsWithTier, "sourceType").map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>

        <div className="relative overflow-x-auto rounded-xl border border-[#00D1FF]/15 bg-[#050A14]/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="border-b border-[#00D1FF]/15 bg-[#00D1FF]/[0.035] text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Asset</th><th className="px-4 py-3 font-medium">Layer</th><th className="px-4 py-3 font-medium">Field</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Tier</th><th className="px-4 py-3 font-medium">Reliability</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Checked</th><th className="px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-[var(--text-secondary)]">No sources match the current filters.</td></tr>
              ) : filteredRows.map((row) => (
                <tr key={`${row.id ?? "source"}-${row.assetSlug}-${row.layer}-${row.field}-${row.sourceUrl}`} className="border-b border-[rgba(30,42,58,0.55)] transition hover:bg-[#00D1FF]/[0.045] hover:shadow-[inset_3px_0_0_rgba(0,209,255,0.45)] last:border-0">
                  <td className="px-4 py-3 terminal-data text-white">{row.assetSlug}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{row.layer}</td>
                  <td className="px-4 py-3 text-white">{row.field}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{row.sourceType}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${tierClass(row.tier)}`}>{row.tier}</span></td>
                  <td className="px-4 py-3"><span className="terminal-data text-white">{isProAccess ? row.reliability : reliabilityLabel(row.reliability, false)}</span><span className="ml-2 text-xs text-[var(--text-muted)]">{reliabilityLabel(row.reliability, isProAccess)}</span></td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(row.status)}`}>{row.status}</span></td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{isProAccess ? formatDate(row.lastCheckedAt ?? row.checkedAt) : <span className="inline-flex items-center gap-1"><Lock className="size-3" /> Pro</span>}</td>
                  <td className="max-w-[240px] px-4 py-3">
                    {isProAccess ? (
                      <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-[240px] items-center gap-1 truncate text-[var(--accent-cyan)] transition hover:text-[#8DEBFF] hover:underline"><span className="truncate">{row.sourceUrl}</span><ExternalLink className="size-3 shrink-0" /></a>
                    ) : (
                      <span className="inline-flex max-w-[220px] items-center gap-1 truncate text-[var(--text-secondary)]"><span className="truncate">{hostname(row.sourceUrl)}</span><Lock className="size-3 shrink-0 text-[#FFB800]" /></span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="terminal-panel relative overflow-hidden border-[#B983FF]/20 p-5 shadow-[0_0_38px_rgba(185,131,255,0.06)]">
        <div className="pointer-events-none absolute right-[-140px] top-[-120px] h-72 w-72 rounded-full bg-[#B983FF]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-140px] left-[-120px] h-72 w-72 rounded-full bg-[#FFB800]/8 blur-3xl" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="terminal-label text-[#E6D0FF]">Manual Review Needed</p>
            <h2 className="mt-1 text-base font-semibold text-white">Sources excluded from automatic broken status</h2>
          </div>
          {!isProAccess ? <button type="button" onClick={() => void requestProAccess()} className="inline-flex items-center gap-2 rounded-lg border border-[#B983FF]/35 bg-[#B983FF]/10 px-3 py-2 text-xs font-medium text-[#E6D0FF] transition hover:bg-[#B983FF]/20 hover:shadow-[0_0_24px_rgba(185,131,255,0.14)]"><Lock className="size-3.5" /> Unlock notes</button> : null}
        </div>
        <div className="relative mt-4 grid gap-3 md:grid-cols-2">
          {manualRows.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">No manual-required sources in current filters.</p> : manualRows.map((row) => (
            <div key={`${row.assetSlug}-${row.field}-${row.sourceUrl}`} className="relative overflow-hidden rounded-xl border border-[#B983FF]/25 bg-[linear-gradient(145deg,rgba(185,131,255,0.11),rgba(255,184,0,0.04),rgba(255,255,255,0.025))] p-4 shadow-[0_0_28px_rgba(185,131,255,0.07)] transition hover:border-[#B983FF]/40 hover:bg-[#B983FF]/[0.1]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#B983FF]/65 via-[#FFB800]/35 to-transparent" />
              <div className="flex items-start justify-between gap-3"><div><p className="terminal-data text-white">{row.assetSlug}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{row.layer}.{row.field}</p></div><span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(row.status)}`}>{row.status}</span></div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{isProAccess ? (row.notes ?? row.errorMessage ?? "Manual verification is required before this source can be treated as production-grade.") : "Manual review note is locked for Pro users. Free users can see the count and affected field only."}</p>
              {isProAccess ? <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--accent-cyan)] hover:underline">{hostname(row.sourceUrl)} <ExternalLink className="size-3" /></a> : <span className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--text-muted)]"><Lock className="size-3" /> {hostname(row.sourceUrl)}</span>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3"><p className="terminal-label text-[#FFD36A]">Source Methodology</p><h2 className="mt-1 text-base font-semibold text-white">Evidence tiers</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          {sourceTiers.map(({ tier: tierName, title, description, icon: Icon }) => (
            <div key={tierName} className="terminal-panel relative overflow-hidden border-[#FFB800]/15 p-5 transition hover:border-[#FFB800]/30 hover:shadow-[0_0_28px_rgba(255,184,0,0.08)]"><div className="absolute right-[-80px] top-[-80px] h-40 w-40 rounded-full bg-[#FFB800]/8 blur-3xl" /><Icon className="relative size-5 text-[var(--accent-amber)]" /><p className="terminal-label relative mt-4 text-[#FFD36A]">{tierName}</p><h3 className="relative mt-1 font-semibold text-white">{title}</h3><p className="relative mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p></div>
          ))}
        </div>
      </section>

      <section className="terminal-panel border-[#FFB800]/15 p-5 shadow-[0_0_28px_rgba(255,184,0,0.04)]">
        <p className="terminal-label text-[#FFD36A]">Source policy</p>
        <h2 className="mt-1 text-base font-semibold text-white">Rules for production-grade asset data</h2>
        <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
          {checks.map((check) => <li key={check} className="flex gap-2 leading-relaxed"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent-amber)] shadow-[0_0_10px_rgba(255,184,0,0.7)]" />{check}</li>)}
        </ul>
      </section>

      {paymentData ? (
        <PaywallModal
          isOpen={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          x402Data={paymentData}
          requiredTier="pro"
          onPaymentSuccess={onPaymentSuccess}
        />
      ) : null}
    </div>
  );
}
