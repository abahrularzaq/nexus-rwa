"use client";

import type { ReactNode } from "react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  subtitle?: string;
  isLoading?: boolean;
}

const changeStyles = {
  positive: "text-[#00FF88]",
  negative: "text-[#FF4444]",
  neutral: "text-[#8892A4]",
} as const;

function formatValue(value: string | number) {
  if (typeof value === "number") {
    return value.toLocaleString("en-US");
  }
  return value;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  subtitle,
  isLoading = false,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div
        className="relative overflow-hidden rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.8)] p-6 transition-all duration-200 ease-in-out"
        aria-busy
        aria-label="Loading metric"
      >
        <div className="flex items-start gap-3">
          <div className="size-10 shrink-0 rounded-full bg-[rgba(30,42,58,0.9)]" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
            <div className="h-3 w-24 rounded bg-[rgba(30,42,58,0.9)]" />
            <div className="h-8 w-40 max-w-full rounded bg-[rgba(30,42,58,0.9)]" />
            <div className="h-3 w-32 rounded bg-[rgba(30,42,58,0.9)]" />
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
          style={{
            animation: "nexus-metric-card-shimmer 1.5s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  const changeColor = changeStyles[changeType];
  const arrow =
    changeType === "positive" ? "↑" : changeType === "negative" ? "↓" : "";

  return (
    <div
      className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.8)] p-6 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-[rgba(0,212,255,0.3)]"
    >
      <div className="flex items-center gap-3">
        {icon ? (
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[rgba(0,212,255,0.12)] text-[#00D4FF]"
            aria-hidden
          >
            <span className="flex [&>svg]:size-[18px]">{icon}</span>
          </div>
        ) : null}
        <p className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-wide text-[#8892A4]">
          {title}
        </p>
      </div>

      <p className="mt-4 text-2xl font-bold tabular-nums tracking-tight text-white">
        {formatValue(value)}
      </p>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
        {change ? (
          <span className={`font-medium tabular-nums ${changeColor}`}>
            {arrow}
            {arrow ? "\u00A0" : null}
            {change}
          </span>
        ) : null}
        {change && subtitle ? (
          <span className="text-[#4A5568]" aria-hidden>
            ·
          </span>
        ) : null}
        {subtitle ? (
          <span className="text-[#8892A4]">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
}
