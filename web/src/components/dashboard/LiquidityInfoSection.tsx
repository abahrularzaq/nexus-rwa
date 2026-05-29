"use client";

import { formatTvl } from "@/lib/api/assets";
import type { AssetLiquidity } from "@/types/asset";

function liquidityBarColor(score: number): string {
  if (score >= 70) return "#00FF88";
  if (score >= 45) return "#FFB800";
  return "#FF4444";
}

export function LiquidityInfoSection({
  liquidity,
}: {
  liquidity?: AssetLiquidity | null;
}) {
  if (!liquidity) {
    return (
      <p className="text-sm text-[#8892A4]">Liquidity data not available.</p>
    );
  }

  const score =
    liquidity.liquidityScore != null && Number.isFinite(liquidity.liquidityScore)
      ? Math.min(100, Math.max(0, liquidity.liquidityScore))
      : null;

  const redemptionLabel = [
    liquidity.redemptionType,
    liquidity.redemptionPeriodDays != null
      ? `${liquidity.redemptionPeriodDays}d`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.5)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-[#8892A4]">
            Redemption
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {redemptionLabel || "—"}
          </p>
          {liquidity.lockupPeriodDays != null && liquidity.lockupPeriodDays > 0 ? (
            <p className="mt-1 text-xs text-[#8892A4]">
              Lock-up: {liquidity.lockupPeriodDays} days
            </p>
          ) : null}
        </div>
        {liquidity.onchainLiquidity != null ? (
          <div className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.5)] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase text-[#8892A4]">
              On-chain liquidity
            </p>
            <p className="mt-1 text-sm font-bold tabular-nums text-white">
              {formatTvl(liquidity.onchainLiquidity)}
            </p>
          </div>
        ) : null}
      </div>

      {score != null ? (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-semibold uppercase text-[#8892A4]">
              Liquidity score
            </span>
            <span className="font-bold tabular-nums text-white">{score}/100</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(30,42,58,0.9)]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${score}%`,
                background: liquidityBarColor(score),
              }}
            />
          </div>
        </div>
      ) : null}

      {liquidity.liquidityNotes ? (
        <p className="text-sm leading-relaxed text-[#8892A4]">
          {liquidity.liquidityNotes}
        </p>
      ) : null}
    </div>
  );
}
