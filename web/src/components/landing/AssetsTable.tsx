"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FadeUp } from "@/components/landing/primitives";
import { FieldInfo } from "@/components/common/FieldInfo";
import { useAssetSummaries } from "@/hooks/use-asset-summaries";
import { formatTvl } from "@/lib/api/assets";
import { formatYield } from "@/lib/shared";
import type { AssetCategory, RiskLevel } from "@/lib/shared";
import type { FieldKey } from "@/lib/field-definitions";

type HeaderCell = {
  label: string;
  fieldKey?: FieldKey;
};

const categoryLabels: Record<AssetCategory, string> = {
  TREASURY: "Treasury",
  CREDIT: "Credit",
  REAL_ESTATE: "Real Estate",
  COMMODITIES: "Commodities",
  EQUITY: "Equity",
};

const categoryColors: Record<AssetCategory, string> = {
  TREASURY: "#00D4FF",
  CREDIT: "#A78BFA",
  REAL_ESTATE: "#FF6666",
  COMMODITIES: "#FFB800",
  EQUITY: "#00FF88",
};

const riskStyle: Record<RiskLevel, { bg: string; color: string }> = {
  LOW: { bg: "rgba(0,255,136,0.1)", color: "#00FF88" },
  MEDIUM: { bg: "rgba(255,184,0,0.1)", color: "#FFB800" },
  HIGH: { bg: "rgba(255,68,68,0.1)", color: "#FF6666" },
  CRITICAL: { bg: "rgba(255,68,68,0.18)", color: "#FFA0A0" },
};

const filters = ["All", "Treasury", "Credit", "Real Estate", "Commodities", "Equity"] as const;

const headers: HeaderCell[] = [
  { label: "#" },
  { label: "Asset", fieldKey: "name" },
  { label: "Protocol" },
  { label: "Category", fieldKey: "category" },
  { label: "TVL", fieldKey: "tvl" },
  { label: "Yield", fieldKey: "currentYield" },
  { label: "Risk", fieldKey: "riskScore" },
  { label: "7D Change", fieldKey: "change7d" },
  { label: "Status" },
];

function formatChange(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

export function AssetsTable() {
  const { data: assets = [], isLoading, isError } = useAssetSummaries();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      assets.map((asset, index) => {
        const category = asset.category ?? "TREASURY";
        return {
          n: index + 1,
          color: categoryColors[category],
          name: asset.name,
          sym: asset.symbol || asset.id,
          protocol: asset.protocol ?? "—",
          cat: category,
          tvl: formatTvl(asset.tvl),
          yld: Number.isFinite(asset.yieldRate) ? formatYield(asset.yieldRate * 100) : "—",
          risk: asset.riskScore,
          chg: formatChange(asset.change7d),
          up: Number.isFinite(asset.change7d) ? asset.change7d >= 0 : null,
          status: asset._meta.sources.length > 0 ? "Sourced" : "Source unavailable",
        };
      }),
    [assets],
  );

  const filtered = rows.filter((r) => {
    if (filter !== "All" && categoryLabels[r.cat] !== filter) return false;
    if (q && !r.name.toLowerCase().includes(q.toLowerCase()) && !r.sym.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <section className="py-24 px-6" id="assets">
      <div className="max-w-[1400px] mx-auto">
        <FadeUp className="text-center mb-10">
          <span
            className="inline-block px-3 py-1 rounded-full text-[11px] label-eyebrow"
            style={{
              background: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.3)",
              color: "var(--accent-cyan)",
            }}
          >
            Asset Intelligence
          </span>
          <h2 className="mt-5 text-4xl md:text-[40px] font-extrabold tracking-tight text-gradient">
            Current Nexus RWA Asset Coverage
          </h2>
          <p className="mt-3 text-base max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Landing table uses the same asset API as the dashboard. Missing market, yield, source, or change fields are shown as unavailable.
          </p>
        </FadeUp>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex flex-wrap items-center gap-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  filter === f ? "text-white" : "hover:text-white"
                }`}
                style={{
                  color: filter === f ? "#fff" : "#8892A4",
                  borderColor: filter === f ? "var(--accent-cyan)" : "transparent",
                  background: filter === f ? "rgba(0,212,255,0.05)" : "transparent",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--accent-cyan)" }}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-all focus:ring-1"
              style={{
                background: "rgba(15,22,41,0.8)",
                border: "1px solid var(--border-line)",
                color: "#fff",
              }}
            />
          </div>
        </div>

        <FadeUp className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(10,14,26,0.6)" }}>
                  {headers.map((h) => (
                    <th
                      key={h.label}
                      className="px-5 py-3 text-left text-[11px] label-eyebrow"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {h.fieldKey ? <FieldInfo fieldKey={h.fieldKey} label={h.label} /> : h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={9} className="px-5 py-8 text-center" style={{ color: "var(--text-secondary)" }}>Loading asset coverage...</td></tr>
                ) : isError ? (
                  <tr><td colSpan={9} className="px-5 py-8 text-center" style={{ color: "var(--text-secondary)" }}>Asset coverage is unavailable.</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-8 text-center" style={{ color: "var(--text-secondary)" }}>No assets match the current filters.</td></tr>
                ) : filtered.map((r) => (
                  <tr
                    key={r.sym}
                    className="group transition-colors border-t"
                    style={{ borderColor: "var(--border-line)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <td className="px-5 py-4 tabular" style={{ color: "#8892A4" }}>{r.n}</td>
                    <td className="px-5 py-4 min-w-[300px]">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${r.color}, ${r.color}80)`,
                            boxShadow: `0 0 12px ${r.color}40`,
                          }}
                        />
                        <div>
                          <div className="text-white font-bold">{r.name}</div>
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{r.sym}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-white">{r.protocol}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full" style={{ background: `${r.color}22`, color: r.color }}>
                        {categoryLabels[r.cat]}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold tabular text-white">{r.tvl}</td>
                    <td className="px-5 py-4 text-white font-bold tabular">{r.yld}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full" style={riskStyle[r.risk]}>
                        • {r.risk}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 tabular font-semibold"
                      style={{ color: r.up === null ? "var(--text-muted)" : r.up ? "var(--accent-green)" : "var(--accent-red)" }}
                    >
                      {r.chg} {r.up === null ? "" : r.up ? "↑" : "↓"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="px-2.5 py-1 text-xs font-semibold rounded-full"
                        style={{
                          background: r.status === "Sourced" ? "rgba(0,255,136,0.1)" : "rgba(255,184,0,0.1)",
                          color: r.status === "Sourced" ? "var(--accent-green)" : "#FFB800",
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center py-4 text-sm font-semibold" style={{ borderTop: "1px solid var(--border-line)", color: "var(--accent-cyan)" }}>
            Explore asset coverage →
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
