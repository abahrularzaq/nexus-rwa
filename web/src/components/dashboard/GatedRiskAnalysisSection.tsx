"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { BlurredPreview } from "@/components/paywall/BlurredPreview";
import { PaywallGuard } from "@/components/paywall/PaywallGuard";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import type { RiskBadgeProps } from "@/components/dashboard/RiskBadge";
import type { ApiResponse, RiskData } from "@/lib/shared";

type GatedRiskPayload = RiskData | {
  risk?: {
    overallScore?: number | null;
    overallLevel?: string | null;
    riskFactors?: string[] | null;
    lastAssessed?: string | null;
  } | null;
  grade?: unknown;
};

function toRiskLevel(level: string | undefined): RiskBadgeProps["level"] {
  const u = (level ?? "MEDIUM").toUpperCase();
  if (u === "LOW" || u === "MEDIUM" || u === "HIGH" || u === "CRITICAL") {
    return u;
  }
  return "MEDIUM";
}

function normalizeRiskLevel(level: string | null | undefined): RiskData["level"] {
  const u = (level ?? "MEDIUM").toUpperCase();
  if (u === "LOW") return "LOW";
  if (u === "HIGH" || u === "CRITICAL") return "HIGH";
  return "MEDIUM";
}

function toRiskData(payload: GatedRiskPayload | null | undefined, fallback: RiskData | null): RiskData | null {
  if (!payload || typeof payload !== "object") return fallback;

  if (
    "score" in payload &&
    typeof payload.score === "number" &&
    "level" in payload &&
    typeof payload.level === "string"
  ) {
    return payload as RiskData;
  }

  if ("risk" in payload) {
    const risk = payload.risk;
    if (!risk) return fallback;
    return {
      assetId: fallback?.assetId ?? "unknown",
      score: risk.overallScore ?? fallback?.score ?? 50,
      level: normalizeRiskLevel(risk.overallLevel),
      factors: risk.riskFactors ?? fallback?.factors ?? [],
      updatedAt: risk.lastAssessed ?? fallback?.updatedAt ?? null,
      _meta: fallback?._meta ?? {
        sources: ["nexus-risk"],
        lastUpdated: risk.lastAssessed ?? new Date().toISOString(),
        confidence: "MEDIUM",
        methodology: "Nexus risk + grade endpoint",
      },
    };
  }

  return fallback;
}

function gaugeColor(score: number): string {
  if (score >= 70) return "#00FF88";
  if (score >= 45) return "#FFB800";
  return "#FF4444";
}

function RiskGauge({ score, level }: { score: number; level: string }) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 50));
  const stroke = gaugeColor(clamped);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex size-36 shrink-0 items-center justify-center">
      <svg
        className="-rotate-90"
        width="144"
        height="144"
        viewBox="0 0 144 144"
        aria-hidden
      >
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="rgba(30,42,58,0.9)"
          strokeWidth="10"
        />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold tabular-nums text-white">{clamped}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8892A4]">
          / 100
        </span>
        <span className="mt-0.5 text-[10px] font-medium text-[#8892A4]">{level}</span>
      </div>
    </div>
  );
}

function MockRiskPanel({
  yieldPct,
  categoryAvgPct,
}: {
  yieldPct: number;
  categoryAvgPct: number | null;
}) {
  return (
    <div className="pointer-events-none select-none blur-[4px]">
      <div className="flex flex-wrap gap-8">
        <RiskGauge score={62} level="MEDIUM" />
        <div className="min-w-0 flex-1 space-y-3">
          <ul className="space-y-2 text-sm text-[#FFB800]">
            <li className="flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Yield volatility above category median
            </li>
            <li className="flex items-center gap-2">
              <AlertTriangle className="size-4" />
              TVL concentration signal
            </li>
          </ul>
          <p className="text-sm text-[#8892A4]">
            Yield{" "}
            {(yieldPct <= 1 && yieldPct >= 0 ? yieldPct * 100 : yieldPct).toFixed(2)}%
            {" vs category avg "}
            {categoryAvgPct != null ? `${categoryAvgPct.toFixed(2)}%` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function RiskAnalysisContent({
  risk,
  yieldPct,
  categoryAvgPct,
}: {
  risk: RiskData;
  yieldPct: number;
  categoryAvgPct: number | null;
}) {
  const badgeLevel = toRiskLevel(risk.level);
  const displayYield =
    yieldPct <= 1 && yieldPct >= 0 ? yieldPct * 100 : yieldPct;
  const vsAvg =
    categoryAvgPct != null ? displayYield - categoryAvgPct : null;
  const factors = Array.isArray(risk.factors) ? risk.factors : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-8">
        <RiskGauge score={risk.score} level={risk.level} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <RiskBadge level={badgeLevel} showDot />
            <span className="text-xs text-[#8892A4]">
              Composite score — higher is safer
            </span>
          </div>

          {factors.length > 0 ? (
            <ul className="mt-5 space-y-2.5">
              {factors.map((factor) => (
                <li
                  key={factor}
                  className="flex items-start gap-2.5 text-sm text-[#FFB800]"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 flex items-center gap-2 text-sm text-[#00FF88]">
              <CheckCircle2 className="size-4 shrink-0" />
              No elevated risk factors detected.
            </p>
          )}
        </div>
      </div>

      <div
        className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.55)] px-4 py-3"
        role="status"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8892A4]">
          Benchmark
        </p>
        <p className="mt-1 text-sm text-white">
          Yield{" "}
          <span className="font-bold tabular-nums text-[#00FF88]">
            {displayYield.toFixed(2)}%
          </span>{" "}
          vs category avg{" "}
          <span className="font-bold tabular-nums text-[#00D4FF]">
            {categoryAvgPct != null ? `${categoryAvgPct.toFixed(2)}%` : "—"}
          </span>
          {vsAvg != null ? (
            <span
              className={`ml-2 inline-flex items-center gap-0.5 text-xs font-semibold ${
                vsAvg >= 0 ? "text-[#00FF88]" : "text-[#FF4444]"
              }`}
            >
              {vsAvg >= 0 ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {vsAvg >= 0 ? "+" : ""}
              {vsAvg.toFixed(2)} pp
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export type GatedRiskAnalysisSectionProps = {
  apiBaseUrl: string;
  assetId: string;
  yieldPct: number;
  categoryAvgPct: number | null;
  initialRisk?: RiskData | null;
};

export function GatedRiskAnalysisSection({
  apiBaseUrl,
  assetId,
  yieldPct,
  categoryAvgPct,
  initialRisk = null,
}: GatedRiskAnalysisSectionProps) {
  const base = apiBaseUrl.trim().replace(/\/$/, "");
  const endpoint = `${base}/v1/assets/${assetId}/risk`;

  return (
    <div
      className="rounded-xl border border-[rgba(30,42,58,0.8)] p-6"
      style={{ background: "rgba(15,22,41,0.65)" }}
    >
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-lg border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.08)]"
          aria-hidden
        >
          <Shield className="size-5 text-[#00D4FF]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Risk Analysis</h2>
          <p className="text-sm text-[#8892A4]">
            Score gauge, factor breakdown, and category benchmark
          </p>
        </div>
      </div>

      <PaywallGuard
        endpoint={endpoint}
        fallback={({ openPaywall }) => (
          <div className="space-y-4">
            <MockRiskPanel
              yieldPct={yieldPct}
              categoryAvgPct={categoryAvgPct}
            />
            <BlurredPreview
              title="Risk Analysis"
              priceLabel="$0.005 USDC"
              onUnlock={openPaywall}
            />
          </div>
        )}
      >
        {(payload) => {
          const body = payload as ApiResponse<GatedRiskPayload>;
          const risk =
            body && typeof body === "object" && "success" in body && body.success
              ? toRiskData(body.data, initialRisk)
              : initialRisk;
          if (!risk) {
            return <p className="text-sm text-[#8892A4]">Risk data unavailable.</p>;
          }
          return (
            <RiskAnalysisContent
              risk={risk}
              yieldPct={yieldPct}
              categoryAvgPct={categoryAvgPct}
            />
          );
        }}
      </PaywallGuard>
    </div>
  );
}
