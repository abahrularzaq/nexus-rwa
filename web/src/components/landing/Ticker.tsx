"use client";

import { useAssetSummaries } from "@/hooks/use-asset-summaries";
import { formatYield } from "@/lib/shared";

function formatChange(value: number): string {
  if (!Number.isFinite(value)) return "unavailable";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

export function Ticker() {
  const { data: assets = [], isLoading, isError } = useAssetSummaries();
  const items = assets.slice(0, 12).map((asset) => ({
    sym: asset.symbol || asset.id,
    yield: Number.isFinite(asset.yieldRate) ? formatYield(asset.yieldRate * 100) : "—",
    chg: formatChange(asset.change7d),
    up: Number.isFinite(asset.change7d) ? asset.change7d >= 0 : null,
  }));

  const row = (
    <div className="flex items-center shrink-0">
      {items.length === 0 ? (
        <div className="flex items-center px-8 text-[13px] font-medium shrink-0" style={{ color: "var(--text-secondary)" }}>
          {isLoading ? "Loading asset ticker..." : isError ? "Asset ticker unavailable" : "No asset ticker data available"}
        </div>
      ) : items.map((it) => (
        <div key={it.sym} className="flex items-center px-8 text-[13px] font-medium shrink-0">
          <span className="text-white">{it.sym}</span>
          <span className="mx-2 text-white tabular">{it.yield}</span>
          <span
            className="tabular"
            style={{
              color:
                it.up === null
                  ? "var(--text-secondary)"
                  : it.up
                    ? "var(--accent-green)"
                    : "var(--accent-red)",
            }}
          >
            {it.chg} {it.up === null ? "" : it.up ? "↑" : "↓"}
          </span>
          <span className="ml-8" style={{ color: "var(--text-muted)" }}>·</span>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="relative h-12 overflow-hidden flex items-center"
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-line)",
        borderBottom: "1px solid var(--border-line)",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-6 gap-2"
        style={{
          background:
            "linear-gradient(90deg, var(--bg-secondary) 75%, transparent)",
        }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent-cyan)", boxShadow: "0 0 8px #00D4FF" }} />
        <span className="text-[13px] font-bold" style={{ color: "var(--accent-cyan)" }}>
          LIVE API
        </span>
      </div>
      <div className="ticker-track flex">
        {row}
        {row}
      </div>
    </div>
  );
}
