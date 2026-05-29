"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Minus,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useMarketBrief } from "@/hooks/useMarketBrief";
import type { MarketBriefRiskTone } from "@/lib/shared";

const RISK_TONE_STYLES: Record<
  MarketBriefRiskTone,
  { label: string; className: string; Icon: typeof Minus }
> = {
  elevated: {
    label: "Elevated",
    className:
      "border-[rgba(196,92,92,0.4)] bg-[rgba(196,92,92,0.12)] text-[var(--data-negative)]",
    Icon: AlertTriangle,
  },
  stable: {
    label: "Stable",
    className:
      "border-[var(--border-panel)] bg-[var(--bg-panel)] text-[var(--text-secondary)]",
    Icon: Minus,
  },
  improving: {
    label: "Improving",
    className:
      "border-[rgba(61,154,110,0.4)] bg-[rgba(61,154,110,0.12)] text-[var(--data-positive)]",
    Icon: TrendingUp,
  },
};

function formatGeneratedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BriefSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4" aria-busy="true">
      <div className="h-4 w-24 animate-pulse rounded bg-[rgba(30,42,58,0.85)]" />
      <div className="h-6 w-full animate-pulse rounded bg-[rgba(30,42,58,0.9)]" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-[rgba(30,42,58,0.75)]" />
        <div className="h-3 w-[92%] animate-pulse rounded bg-[rgba(30,42,58,0.7)]" />
        <div className="h-3 w-[80%] animate-pulse rounded bg-[rgba(30,42,58,0.65)]" />
      </div>
      <div className="mt-auto space-y-2 border-t border-[var(--border-panel)] pt-4">
        <div className="h-3 w-28 animate-pulse rounded bg-[rgba(30,42,58,0.8)]" />
        <div className="h-3 w-full animate-pulse rounded bg-[rgba(30,42,58,0.7)]" />
      </div>
    </div>
  );
}

export function MarketBriefCard() {
  const { data: brief, isLoading, error, refetch, isFetching } = useMarketBrief();

  const tone = brief ? RISK_TONE_STYLES[brief.riskTone] : null;
  const ToneIcon = tone?.Icon ?? Minus;

  return (
    <section className="terminal-panel flex h-full min-h-[280px] flex-col p-4 lg:min-h-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="terminal-label">Market brief</p>
          <h2 className="mt-1 text-base font-semibold text-white">Daily narrative</h2>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isLoading || isFetching}
          className="inline-flex shrink-0 items-center gap-1 rounded border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-[var(--text-label)] transition-colors hover:border-[var(--accent-amber)]/40 hover:text-[var(--accent-amber)] disabled:opacity-50"
          aria-label="Refresh market brief"
        >
          <RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="mt-4 flex flex-1 flex-col">
          <BriefSkeleton />
        </div>
      ) : error ? (
        <div className="mt-4 flex flex-1 flex-col">
          <p className="text-sm text-[var(--data-negative)]">
            {error instanceof Error ? error.message : "Could not load market brief"}
          </p>
          <p className="mt-2 flex-1 text-sm text-[var(--text-secondary)]">
            Overview metrics below still refresh from the live API.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 inline-flex w-fit items-center gap-2 rounded border border-[var(--accent-amber)]/35 bg-[var(--accent-amber-dim)] px-3 py-1.5 text-xs font-medium text-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/20"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </button>
        </div>
      ) : brief ? (
        <div className="mt-4 flex flex-1 flex-col gap-4">
          {tone ? (
            <span
              className={`inline-flex w-fit items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${tone.className}`}
            >
              <ToneIcon className="size-3" aria-hidden />
              {tone.label}
            </span>
          ) : null}

          <p className="text-sm font-semibold leading-snug text-white">{brief.headline}</p>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {brief.summary}
          </p>

          {brief.whatChanged.length > 0 ? (
            <div>
              <p className="terminal-label mb-2">What changed (7d)</p>
              <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                {brief.whatChanged.map((item) => (
                  <li key={item} className="flex gap-2 leading-snug">
                    <span
                      className="mt-2 size-1 shrink-0 rounded-full bg-[var(--accent-amber)]"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {brief.watchList.length > 0 ? (
            <div>
              <p className="terminal-label mb-2">Watch</p>
              <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                {brief.watchList.map((item) => (
                  <li key={item} className="flex gap-2 leading-snug">
                    <span
                      className="mt-2 size-1 shrink-0 rounded-full bg-[var(--text-label)]"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="terminal-label mt-auto border-t border-[var(--border-panel)] pt-3">
            Generated {formatGeneratedAt(brief.generatedAt)}
          </p>
        </div>
      ) : (
        <p className="mt-4 flex-1 text-sm text-[var(--text-secondary)]">
          No brief available.
        </p>
      )}

      <Link
        href="/dashboard/risk"
        className="terminal-label mt-3 inline-flex items-center gap-1 text-[var(--accent-amber)] hover:underline"
      >
        Cross-asset risk matrix
        <ArrowUpRight className="size-3" />
      </Link>
    </section>
  );
}
