"use client";

import Link from "next/link";
import { AssetInsightTeaser } from "@/components/dashboard/AssetInsightTeaser";
import { DataSourceBadge } from "@/components/dashboard/DataSourceBadge";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { buildDataQuality } from "@/components/dashboard/DataQualityPanel";
import type { RiskBadgeProps } from "@/components/dashboard/RiskBadge";
import {
  formatTvl,
  formatYield,
  getRiskColor,
} from "@/lib/api/assets";
import {
  getProtocolLabel,
  normalizeCategory,
  normalizeRiskLevel,
} from "@/lib/asset-mapper";
import { categoryAccent, formatChange7d } from "@/lib/assetDetailUtils";
import type { AssetDataMeta } from "@/lib/shared";
import type { AssetWithLayers } from "@/types/asset";

function toRiskLevel(s: string | undefined): RiskBadgeProps["level"] {
  const u = (s ?? "MEDIUM").toUpperCase();
  if (u === "LOW" || u === "MEDIUM" || u === "HIGH" || u === "CRITICAL") {
    return u;
  }
  return "MEDIUM";
}

function categoryPillLabel(c: string): string {
  return c
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function formatHolders(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US");
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

export type AssetCardProps = {
  asset: AssetWithLayers;
  index?: number;
  showInsightTeaser?: boolean;
};

export function AssetCard({
  asset,
  index = 0,
  showInsightTeaser = true,
}: AssetCardProps) {
  const category = normalizeCategory(asset.identity?.category);
  const accent = categoryAccent(category);
  const riskLevel = toRiskLevel(
    normalizeRiskLevel(asset.risk?.overallLevel),
  );
  const change7d = (asset.market?.tvl7dChange ?? 0) / 100;
  const up = change7d >= 0;
  const protocolLabel = getProtocolLabel(asset);
  const meta = marketMeta(asset);
  const kycRequired = asset.compliance?.kycRequired === true;
  const quality = buildDataQuality(asset);

  return (
    <article
      className="group flex flex-col rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.65)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[rgba(0,212,255,0.45)] hover:shadow-[0_0_24px_rgba(0,212,255,0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="size-11 shrink-0 rounded-full ring-2 ring-white/10"
            style={{ background: accent }}
            aria-hidden
          />
          <div className="min-w-0">
            <h2 className="truncate font-bold text-white">
              {asset.identity?.name ?? asset.slug}
            </h2>
            <p className="text-sm text-[#8892A4]">
              {asset.identity?.symbol ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <RiskBadge level={riskLevel} showDot />
          {kycRequired ? (
            <span className="rounded-md border border-[rgba(255,184,0,0.35)] bg-[rgba(255,184,0,0.08)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FFB800]">
              KYC Required
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[rgba(30,42,58,0.6)] pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8892A4]">
            TVL
          </p>
          <p
            className={`mt-1 text-sm font-bold tabular-nums ${getRiskColor(asset.risk?.overallLevel) === "gray" && asset.market?.tvl == null ? "text-[#8892A4]" : "text-white"}`}
          >
            {formatTvl(asset.market?.tvl)}
          </p>
          <DataSourceBadge meta={meta} className="mt-1.5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8892A4]">
            Yield
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums text-[#00FF88]">
            {formatYield(asset.yield?.currentYield)}
          </p>
          <DataSourceBadge meta={meta} className="mt-1.5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8892A4]">
            Holders
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums text-white">
            {formatHolders(asset.market?.holderCount)}
          </p>
          <DataSourceBadge meta={meta} className="mt-1.5" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[rgba(30,42,58,0.6)] pt-4 text-sm">
        <span className="font-medium text-white">
          {protocolLabel.trim() ? protocolLabel : "—"}
        </span>
        <span className="rounded-full border border-[rgba(30,42,58,0.9)] bg-[rgba(10,14,26,0.5)] px-2 py-0.5 text-[11px] font-medium text-[#8892A4]">
          {categoryPillLabel(category)}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#C9D4E5]">
          {quality.status} · {quality.sourceCount} src
        </span>
        <span
          className={`ml-auto font-semibold tabular-nums ${up ? "text-[#00FF88]" : "text-[#FF4444]"}`}
        >
          {formatChange7d(change7d)}
        </span>
      </div>

      {showInsightTeaser ? (
        <AssetInsightTeaser assetId={asset.slug} enabled={index < 12} />
      ) : null}

      <Link
        href={`/dashboard/assets/${asset.slug}`}
        className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.08)] py-2.5 text-sm font-semibold text-[#00D4FF] transition-colors hover:bg-[rgba(0,212,255,0.14)]"
      >
        View Details →
      </Link>
    </article>
  );
}

export function AssetCardSkeleton() {
  return (
    <div className="asset-card-skeleton rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.5)] p-5">
      <div className="h-10 w-[85%] max-w-md rounded-lg bg-[rgba(30,42,58,0.9)]" />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="h-12 rounded bg-[rgba(30,42,58,0.7)]" />
        <div className="h-12 rounded bg-[rgba(30,42,58,0.7)]" />
        <div className="h-12 rounded bg-[rgba(30,42,58,0.7)]" />
      </div>
      <div className="mt-4 h-8 w-full rounded bg-[rgba(30,42,58,0.7)]" />
      <div className="mt-4 h-10 w-full rounded-lg bg-[rgba(30,42,58,0.75)]" />
    </div>
  );
}
