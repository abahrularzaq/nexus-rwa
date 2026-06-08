"use client";

import { useState } from "react";
import {
  BlurredPreview,
  RedactedPremiumPreview,
} from "@/components/paywall/BlurredPreview";
import { PaywallGuard } from "@/components/paywall/PaywallGuard";
import { YieldChart } from "@/components/charts/YieldChart";
import type {
  ApiResponse,
  YieldHistoryPeriod,
  YieldHistoryPoint,
  YieldHistoryResponse,
} from "@/lib/shared";

const PERIODS: { key: YieldHistoryPeriod; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
];

type HistoryApiData = YieldHistoryResponse | YieldHistoryPoint[];

function normalizeHistoryData(
  data: HistoryApiData | null | undefined,
): { history: YieldHistoryPoint[]; limitedHistory: boolean } {
  if (Array.isArray(data)) {
    return { history: data, limitedHistory: data.length > 0 && data.length < 7 };
  }

  if (data && typeof data === "object" && Array.isArray(data.history)) {
    return {
      history: data.history,
      limitedHistory: Boolean(data.limited_history),
    };
  }

  return { history: [], limitedHistory: false };
}

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
        className="rounded-xl border border-[rgba(30,42,58,0.8)] p-5"
        style={{ background: "rgba(15,22,41,0.65)" }}
      >
        <PaywallGuard
          endpoint={endpoint}
          fallback={({ openPaywall }) => (
            <div className="space-y-4">
              <RedactedPremiumPreview rows={4} />
              <BlurredPreview
                title="Yield & TVL history"
                priceLabel="$3 / 24h"
                onUnlock={openPaywall}
              />
            </div>
          )}
        >
          {(payload) => {
            const body = payload as ApiResponse<HistoryApiData>;
            if (!body || typeof body !== "object" || !("success" in body)) {
              return <YieldChart data={[]} period={period} isLocked={false} />;
            }
            if (!body.success) {
              return <p className="text-sm text-[#FF8888]">{body.error.message}</p>;
            }

            const { history, limitedHistory } = normalizeHistoryData(body.data);
            return (
              <YieldChart
                data={history}
                period={period}
                isLocked={false}
                limitedHistory={limitedHistory}
              />
            );
          }}
        </PaywallGuard>
      </div>
    </div>
  );
}
