"use client";

import Link from "next/link";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import type { RiskBadgeProps } from "@/components/dashboard/RiskBadge";
import type { AssetSummary } from "@/lib/shared";
import {
  categoryAccent,
  formatCategoryLabel,
  formatTvl,
  formatYieldFraction,
} from "@/lib/assetDetailUtils";

function toRiskLevel(s: string | undefined): RiskBadgeProps["level"] {
  const u = (s ?? "MEDIUM").toUpperCase();
  if (u === "LOW" || u === "MEDIUM" || u === "HIGH" || u === "CRITICAL") {
    return u;
  }
  return "MEDIUM";
}

export type RelatedAssetsSectionProps = {
  assets: AssetSummary[];
  currentId: string;
  category: string;
  loading?: boolean;
};

export function RelatedAssetsSection({
  assets,
  currentId,
  category,
  loading = false,
}: RelatedAssetsSectionProps) {
  const related = assets
    .filter((a) => a.id !== currentId && a.category === category)
    .slice(0, 3);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Related Assets</h2>
        <p className="mt-1 text-sm text-[#8892A4]">
          Other {formatCategoryLabel(category)} listings on Nexus
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.65)]"
            />
          ))}
        </div>
      ) : related.length === 0 ? (
        <p className="text-sm text-[#8892A4]">No other assets in this category yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {related.map((asset) => {
            const accent = categoryAccent(asset.category ?? category);
            return (
              <Link
                key={asset.id}
                href={`/dashboard/assets/${asset.id}`}
                className="group flex flex-col rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.65)] p-4 transition-all hover:-translate-y-0.5 hover:border-[rgba(0,212,255,0.35)]"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="size-9 shrink-0 rounded-full ring-2 ring-white/10"
                    style={{ background: accent }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white group-hover:text-[#00D4FF]">
                      {asset.name}
                    </p>
                    <p className="text-xs text-[#8892A4]">{asset.symbol}</p>
                  </div>
                  <RiskBadge level={toRiskLevel(asset.riskScore)} showDot />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[rgba(30,42,58,0.6)] pt-3 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-[#8892A4]">
                      TVL
                    </p>
                    <p className="mt-0.5 font-bold tabular-nums text-white">
                      {formatTvl(asset.tvl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-[#8892A4]">
                      Yield
                    </p>
                    <p className="mt-0.5 font-bold tabular-nums text-[#00FF88]">
                      {formatYieldFraction(asset.yieldRate)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
