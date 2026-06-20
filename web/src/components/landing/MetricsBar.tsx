"use client";

import { TrendingUp, Layers, Percent, Zap } from "lucide-react";
import { CountUpClient } from "./CountUpClient";
import { useAssetSummaries } from "@/hooks/use-asset-summaries";

function availableNumber(value: number): value is number {
  return Number.isFinite(value);
}

export function MetricsBar() {
  const { data: assets = [], isLoading, isError } = useAssetSummaries();
  const tvl = assets.map((asset) => asset.tvl).filter(availableNumber).reduce((sum, value) => sum + value, 0);
  const yields = assets.map((asset) => asset.yieldRate).filter(availableNumber);
  const avgYield = yields.length ? yields.reduce((sum, value) => sum + value, 0) / yields.length : null;

  const cards = [
    {
      Icon: TrendingUp,
      label: "AVAILABLE MARKET TVL",
      value: isLoading ? "…" : isError || tvl === 0 ? "—" : <CountUpClient to={tvl / 1_000_000_000} decimals={2} prefix="$" suffix="B" />,
      sub: "From assets with TVL data",
    },
    {
      Icon: Layers,
      label: "ACTIVE ASSETS",
      value: isLoading ? "…" : isError ? "—" : <CountUpClient to={assets.length} />,
      sub: "Current API coverage",
    },
    {
      Icon: Percent,
      label: "AVG AVAILABLE YIELD",
      value: isLoading ? "…" : avgYield == null ? "—" : <CountUpClient to={avgYield * 100} decimals={2} suffix="%" />,
      sub: "Only assets with yield data",
    },
    {
      Icon: Zap,
      label: "API STATUS",
      value: <span>{isError ? "Unavailable" : "Live"}</span>,
      sub: "No fallback rows",
    },
  ];

  return (
    <section className="py-10 px-6" style={{ background: "var(--bg-secondary)" }}>
      <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: "var(--border-line)" }}>
        {cards.map(({ Icon, label, value, sub }, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon size={20} style={{ color: "var(--accent-cyan)" }} />
              <span className="text-[11px] label-eyebrow" style={{ color: "var(--text-secondary)" }}>
                {label}
              </span>
            </div>
            <div className="text-3xl md:text-[40px] font-bold tabular text-white leading-tight">
              {value}
            </div>
            <div className="text-[13px] mt-1" style={{ color: "var(--text-secondary)" }}>
              {sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
