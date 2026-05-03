"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Shield, TrendingUp, Users } from "lucide-react";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { LockedDataCard } from "@/components/dashboard/LockedDataCard";
import type { RiskBadgeProps } from "@/components/dashboard/RiskBadge";
import type {
  Asset,
  AssetSnapshot,
  HolderData,
  RiskData,
} from "@/lib/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AssetDetailPayload = Asset & {
  snapshot: AssetSnapshot | null;
  risk: RiskData | null;
  holder: HolderData | null;
};

function categoryAccent(category: string): string {
  switch (category) {
    case "TREASURY":
      return "#00D4FF";
    case "CREDIT":
      return "#7C3AED";
    case "REAL_ESTATE":
      return "#00FF88";
    case "COMMODITIES":
      return "#FFB800";
    case "EQUITY":
      return "#FF6B9D";
    default:
      return "#8892A4";
  }
}

function formatCategoryLabel(category: string): string {
  return category
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function formatTvl(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function truncateAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function blockExplorerAddressUrl(chain: string, address: string): string {
  const c = chain.toLowerCase();
  if (c === "base") return `https://basescan.org/address/${address}`;
  if (c === "polygon") return `https://polygonscan.com/address/${address}`;
  if (c === "arbitrum") return `https://arbiscan.io/address/${address}`;
  return `https://etherscan.io/address/${address}`;
}

function toRiskLevel(
  s: string | undefined,
): RiskBadgeProps["level"] {
  const u = (s ?? "MEDIUM").toUpperCase();
  if (u === "LOW" || u === "MEDIUM" || u === "HIGH" || u === "CRITICAL") {
    return u;
  }
  return "MEDIUM";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchAssetDetail() {
      setLoading(true);
      try {
        setError(null);
        const base = (API_URL ?? "").trim().replace(/\/$/, "");
        if (!id || !base) {
          setAsset(null);
          setError("Failed to load asset");
          return;
        }
        const res = await fetch(`${base}/v1/assets/${id}`);
        const json: unknown = await res.json();
        const body = json as { success?: boolean; data?: AssetDetailPayload };
        if (!res.ok || !body.success || !body.data) {
          setAsset(null);
          setError("Failed to load asset");
          return;
        }
        setAsset(body.data);
        setError(null);
      } catch {
        setError("Failed to load asset");
        setAsset(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) void fetchAssetDetail();
  }, [id]);

  const apiBase = useMemo(
    () => (API_URL ?? "").trim().replace(/\/$/, ""),
    [],
  );

  const snapshot = asset?.snapshot ?? null;
  const riskLevel = toRiskLevel(
    asset?.risk?.overallScore ?? snapshot?.riskScore,
  );

  const accent = asset ? categoryAccent(asset.category) : "#8892A4";
  const tvl = snapshot?.tvl ?? 0;
  const yieldPct = snapshot?.yieldRate ?? 0;
  const holders = snapshot?.holderCount ?? 0;

  async function copyAddress() {
    if (!asset?.contractAddress) return;
    try {
      await navigator.clipboard.writeText(asset.contractAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!id) {
    return (
      <div className="space-y-4 pb-10">
        <p className="text-[#8892A4]">Invalid asset id.</p>
        <Link
          href="/dashboard/assets"
          className="text-sm text-[#00D4FF] hover:underline"
        >
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
            <MetricCard
              key={i}
              title="—"
              value="—"
              isLoading
            />
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

  const explorerHref = blockExplorerAddressUrl(asset.chain, asset.contractAddress);

  return (
    <div className="space-y-8 pb-10">
      {/* 1. BREADCRUMB + BACK */}
      <div>
        <Link
          href="/dashboard/assets"
          className="inline-flex items-center gap-2 text-sm text-[#8892A4] transition-colors hover:text-[#00D4FF]"
        >
          <ArrowLeft className="size-4" />
          <span>
            <span className="text-[#8892A4]">Assets</span>
            <span className="mx-1.5 text-[#4A5568]">/</span>
            <span className="font-medium text-white">{asset.name}</span>
          </span>
        </Link>
      </div>

      {/* 2. ASSET HEADER */}
      <section className="flex flex-col gap-8 border-b border-[rgba(30,42,58,0.8)] pb-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            <div
              className="size-16 shrink-0 rounded-full ring-2 ring-white/10"
              style={{ background: accent }}
              aria-hidden
            />
            <div className="min-w-0">
              <h1 className="text-[32px] font-bold leading-tight tracking-tight text-white">
                {asset.name}
              </h1>
              <p className="mt-1 text-lg text-[#8892A4]">{asset.symbol}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[rgba(30,42,58,0.9)] bg-[rgba(15,22,41,0.8)] px-3 py-1 text-xs font-semibold text-white">
              {asset.protocol}
            </span>
            <span className="rounded-full border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.08)] px-3 py-1 text-xs font-semibold text-[#00D4FF]">
              {formatCategoryLabel(asset.category)}
            </span>
            <span className="rounded-full border border-[rgba(124,58,237,0.35)] bg-[rgba(124,58,237,0.1)] px-3 py-1 text-xs font-semibold text-[#A78BFA]">
              {asset.chain}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] px-3 py-2 font-mono text-xs text-[#8892A4]">
              {truncateAddress(asset.contractAddress)}
            </code>
            <button
              type="button"
              onClick={() => void copyAddress()}
              className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.8)] px-3 py-2 text-xs font-medium text-[#00D4FF] transition-colors hover:border-[rgba(0,212,255,0.35)]"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={explorerHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-[rgba(30,42,58,0.8)] px-3 py-2 text-xs font-medium text-[#8892A4] hover:text-white"
            >
              Explorer
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col items-start gap-4 lg:w-auto lg:min-w-[280px] lg:items-end">
          <p
            className="font-bold tabular-nums leading-none text-[#00FF88]"
            style={{ fontSize: 48 }}
          >
            {snapshot ? `${yieldPct.toFixed(2)}%` : "—"}
          </p>
          <p className="text-right text-sm text-[#8892A4]">
            Current yield (APY)
          </p>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums text-white">
              {snapshot ? formatTvl(tvl) : "—"}
            </p>
            <p className="text-sm text-[#8892A4]">Latest snapshot TVL</p>
          </div>
          <div className="scale-125 origin-top-right">
            <RiskBadge level={riskLevel} showDot />
          </div>
        </div>
      </section>

      {/* 3. METRICS ROW — snapshot[0] + risk overall */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Current TVL"
          value={snapshot ? formatTvl(tvl) : "—"}
          subtitle="From latest snapshot"
          icon={<TrendingUp className="text-[#00D4FF]" />}
        />
        <MetricCard
          title="Yield Rate (APY)"
          value={snapshot ? `${yieldPct.toFixed(2)}%` : "—"}
          subtitle="From latest snapshot"
          icon={<TrendingUp className="text-[#00D4FF]" />}
        />
        <MetricCard
          title="Total Holders"
          value={
            snapshot
              ? holders.toLocaleString("en-US")
              : "—"
          }
          subtitle="From latest snapshot"
          icon={<Users className="text-[#00D4FF]" />}
        />
        <MetricCard
          title="Risk Score"
          value={riskLevel}
          subtitle="Latest risk assessment"
          icon={<Shield className="text-[#00D4FF]" />}
        />
      </div>

      {/* 4. YIELD CHART — locked (X402) */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Yield History</h2>
        <LockedDataCard apiBaseUrl={apiBase} assetId={asset.id} endpoint="yield" />
      </section>

      {/* 5. RISK BREAKDOWN — locked (X402) */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Risk Analysis</h2>
        <LockedDataCard apiBaseUrl={apiBase} assetId={asset.id} endpoint="risk" />
      </section>

      {/* 6. HOLDER DISTRIBUTION — locked (X402) */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Holder Intelligence</h2>
        <LockedDataCard apiBaseUrl={apiBase} assetId={asset.id} endpoint="holders" />
      </section>
    </div>
  );
}
