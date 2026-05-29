"use client";

import { useState } from "react";
import { BlurredPreview } from "@/components/paywall/BlurredPreview";
import { PaywallGuard } from "@/components/paywall/PaywallGuard";
import {
  buildMockYieldHistory,
  YieldChart,
} from "@/components/charts/YieldChart";
import type {
  ApiResponse,
  YieldHistoryPeriod,
  YieldHistoryResponse,
} from "@/lib/shared";

const PERIODS: { key: YieldHistoryPeriod; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
];

export type YieldHistorySectionProps = {
  apiBaseUrl: string;
  assetId: string;
};

export function YieldHistorySection({
  apiBaseUrl,
  assetId,
}: YieldHistorySectionProps) {
  const [period, setPeriod] = useState<YieldHistoryPeriod>("30d");
  const base = apiBaseUrl.trim().replace(/\/$/, "");
  const endpoint = `${base}/v1/assets/${assetId}/history?period=${period}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={
              period === p.key
                ? "rounded-lg border border-[rgba(0,212,255,0.45)] bg-[rgba(0,212,255,0.14)] px-3 py-1.5 text-xs font-semibold text-[#00D4FF]"
                : "rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.6)] px-3 py-1.5 text-xs font-medium text-[#8892A4] hover:text-white"
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        className="relative rounded-xl border border-[rgba(30,42,58,0.8)] p-5"
        style={{ background: "rgba(15,22,41,0.65)" }}
      >
        <PaywallGuard
          endpoint={endpoint}
          fallback={({ openPaywall }) => (
            <div className="relative">
              <YieldChart
                data={buildMockYieldHistory(period)}
                period={period}
                isLocked
              />
              <div className="pointer-events-auto absolute inset-0 flex items-center justify-center p-4">
                <BlurredPreview
                  title="Yield & TVL History"
                  priceLabel="$0.005 USDC"
                  onUnlock={openPaywall}
                  className="max-w-md border-0 bg-transparent"
                />
              </div>
            </div>
          )}
        >
          {(payload) => {
            const body = payload as ApiResponse<YieldHistoryResponse>;
            if (!body || typeof body !== "object" || !("success" in body)) {
              return (
                <YieldChart data={[]} period={period} isLocked={false} />
              );
            }
            if (!body.success) {
              return (
                <p className="text-sm text-[#FF8888]">{body.error.message}</p>
              );
            }
            return (
              <YieldChart
                data={body.data.history}
                period={period}
                isLocked={false}
                limitedHistory={body.data.limited_history}
              />
            );
          }}
        </PaywallGuard>
      </div>
    </div>
  );
}
