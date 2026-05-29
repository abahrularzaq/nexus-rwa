"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Shield } from "lucide-react";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import type { RiskBadgeProps } from "@/components/dashboard/RiskBadge";
import type { ApiResponse, RiskData } from "@/lib/shared";

function apiKeyHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const apiKey = localStorage.getItem("nexus_api_key");
  return apiKey ? { "X-API-Key": apiKey } : {};
}

function toRiskLevel(level: string | undefined): RiskBadgeProps["level"] {
  const u = (level ?? "MEDIUM").toUpperCase();
  if (u === "LOW" || u === "MEDIUM" || u === "HIGH" || u === "CRITICAL") {
    return u;
  }
  return "MEDIUM";
}

function formatUpdatedAt(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface RiskAnalysisCardProps {
  apiBaseUrl: string;
  assetId: string;
  /** Risk from GET /v1/assets/:id detail when already loaded. */
  initialRisk?: RiskData | null;
}

export function RiskAnalysisCard({
  apiBaseUrl,
  assetId,
  initialRisk = null,
}: RiskAnalysisCardProps) {
  const [risk, setRisk] = useState<RiskData | null>(initialRisk);
  const [loading, setLoading] = useState(!initialRisk);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    if (initialRisk) {
      setRisk(initialRisk);
      setLoading(false);
      setError(null);
    }
  }, [initialRisk]);

  useEffect(() => {
    const base = apiBaseUrl.trim().replace(/\/$/, "");
    if (!base || !assetId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${base}/v1/assets/${assetId}/risk`, {
          headers: { Accept: "application/json", ...apiKeyHeader() },
        });
        const body = (await res.json()) as ApiResponse<RiskData>;
        if (cancelled) return;

        if (!res.ok || !body.success) {
          const msg =
            body.success === false
              ? body.error.message
              : "Risk data unavailable";
          if (!initialRisk) {
            setError(msg);
            setRisk(null);
          }
          return;
        }

        setRisk(body.data);
        setCached(body.meta?.cached ?? false);
      } catch {
        if (!cancelled && !initialRisk) {
          setError("Failed to load risk data");
          setRisk(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, assetId, initialRisk]);

  if (loading && !risk) {
    return (
      <div
        className="rounded-xl border border-[rgba(30,42,58,0.8)] p-6"
        style={{ background: "rgba(15,22,41,0.8)" }}
      >
        <div className="h-6 w-40 animate-pulse rounded bg-[rgba(30,42,58,0.9)]" />
        <div className="mt-4 h-16 w-full animate-pulse rounded bg-[rgba(30,42,58,0.85)]" />
      </div>
    );
  }

  if (error && !risk) {
    return (
      <div
        className="rounded-xl border border-[rgba(255,184,0,0.25)] p-6"
        style={{ background: "rgba(255,184,0,0.06)" }}
        role="alert"
      >
        <p className="text-sm text-[#FFB800]">{error}</p>
        <p className="mt-2 text-xs text-[#8892A4]">
          Risk scores refresh every 6 hours after the server sync job runs.
        </p>
      </div>
    );
  }

  if (!risk) {
    return null;
  }

  const badgeLevel = toRiskLevel(risk.level);

  return (
    <div
      className="rounded-xl border border-[rgba(30,42,58,0.8)] p-6"
      style={{ background: "rgba(15,22,41,0.8)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.08)]"
            aria-hidden
          >
            <Shield className="size-5 text-[#00D4FF]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Risk Analysis</h3>
            <p className="mt-1 text-sm text-[#8892A4]">
              Composite score (0–100, higher = safer)
            </p>
            <span className="mt-2 inline-flex rounded-full border border-[rgba(0,255,136,0.35)] bg-[rgba(0,255,136,0.1)] px-3 py-1 text-xs font-semibold text-[#00FF88]">
              Free · no payment required
            </span>
            {cached && (
              <span className="ml-2 inline-flex rounded-full border border-[rgba(30,42,58,0.9)] px-2 py-0.5 text-[10px] text-[#8892A4]">
                Cached
              </span>
            )}
          </div>
        </div>
        <RiskBadge level={badgeLevel} showDot />
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8892A4]">
            Score
          </p>
          <p
            className="mt-1 font-bold tabular-nums leading-none text-white"
            style={{ fontSize: 40 }}
          >
            {risk.score}
            <span className="text-lg font-medium text-[#8892A4]">/100</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8892A4]">
            Level
          </p>
          <p className="mt-1 text-xl font-bold text-white">{risk.level}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8892A4]">
            Updated
          </p>
          <p className="mt-1 text-sm text-[#8892A4]">
            {formatUpdatedAt(risk.updatedAt)}
          </p>
        </div>
      </div>

      {risk.factors.length > 0 ? (
        <div className="mt-6 border-t border-[rgba(30,42,58,0.6)] pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8892A4]">
            Risk factors
          </p>
          <ul className="mt-3 space-y-2">
            {risk.factors.map((factor) => (
              <li
                key={factor}
                className="flex items-start gap-2 text-sm text-[#FFB800]"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-6 border-t border-[rgba(30,42,58,0.6)] pt-4 text-sm text-[#00FF88]">
          No elevated risk factors detected.
        </p>
      )}
    </div>
  );
}
