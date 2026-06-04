"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { FadeUp } from "@/components/landing/primitives";
import { FieldInfo } from "@/components/common/FieldInfo";
import type { FieldKey } from "@/lib/field-definitions";

type Cat = "Treasury" | "Credit" | "Real Estate" | "Commodities";
type Risk = "LOW" | "MEDIUM" | "HIGH";

type HeaderCell = {
  label: string;
  fieldKey?: FieldKey;
};

const rows: {
  n: number;
  color: string;
  name: string;
  sym: string;
  protocol: string;
  cat: Cat;
  tvl: string;
  yld: string;
  risk: Risk;
  chg: string;
  up: boolean;
}[] = [
  { n: 1, color: "#00D4FF", name: "Ondo USDY", sym: "USDY", protocol: "Ondo Finance", cat: "Treasury", tvl: "$892.4M", yld: "5.42%", risk: "LOW", chg: "+3.2%", up: true },
  { n: 2, color: "#3B82F6", name: "Maple USDC", sym: "mUSDC", protocol: "Maple Finance", cat: "Credit", tvl: "$324.1M", yld: "8.91%", risk: "MEDIUM", chg: "-1.8%", up: false },
  { n: 3, color: "#F97316", name: "Centrifuge DROP", sym: "DROP", protocol: "Centrifuge", cat: "Credit", tvl: "$198.7M", yld: "9.34%", risk: "MEDIUM", chg: "+5.1%", up: true },
  { n: 4, color: "#22C55E", name: "Backed BUIDL", sym: "bBUIDL", protocol: "Backed Finance", cat: "Treasury", tvl: "$456.2M", yld: "4.88%", risk: "LOW", chg: "+0.9%", up: true },
  { n: 5, color: "#7C3AED", name: "OpenEden OUSG", sym: "OUSG", protocol: "OpenEden", cat: "Treasury", tvl: "$234.5M", yld: "5.15%", risk: "LOW", chg: "-0.4%", up: false },
  { n: 6, color: "#06B6D4", name: "Ondo OUSG", sym: "OUSG2", protocol: "Ondo Finance", cat: "Treasury", tvl: "$567.8M", yld: "5.28%", risk: "LOW", chg: "+1.2%", up: true },
  { n: 7, color: "#EF4444", name: "RealT Token", sym: "REALT", protocol: "RealT", cat: "Real Estate", tvl: "$45.3M", yld: "11.20%", risk: "HIGH", chg: "+8.4%", up: true },
  { n: 8, color: "#FACC15", name: "Goldfinch GFI", sym: "GFI", protocol: "Goldfinch", cat: "Credit", tvl: "$89.1M", yld: "12.40%", risk: "HIGH", chg: "-3.1%", up: false },
];

const catStyle: Record<Cat, { bg: string; color: string }> = {
  Treasury: { bg: "rgba(0,212,255,0.1)", color: "#00D4FF" },
  Credit: { bg: "rgba(124,58,237,0.15)", color: "#A78BFA" },
  "Real Estate": { bg: "rgba(255,68,68,0.1)", color: "#FF8888" },
  Commodities: { bg: "rgba(255,184,0,0.1)", color: "#FFB800" },
};

const riskStyle: Record<Risk, { bg: string; color: string }> = {
  LOW: { bg: "rgba(0,255,136,0.1)", color: "#00FF88" },
  MEDIUM: { bg: "rgba(255,184,0,0.1)", color: "#FFB800" },
  HIGH: { bg: "rgba(255,68,68,0.1)", color: "#FF6666" },
};

const filters = ["All", "Treasury", "Credit", "Real Estate", "Commodities"] as const;

const headers: HeaderCell[] = [
  { label: "#" },
  { label: "Asset", fieldKey: "name" },
  { label: "Protocol" },
  { label: "Category", fieldKey: "category" },
  { label: "TVL", fieldKey: "tvl" },
  { label: "Yield (APY)", fieldKey: "currentYield" },
  { label: "Risk", fieldKey: "riskScore" },
  { label: "7D Change", fieldKey: "marketCap" },
  { label: "Action" },
];

export function AssetsTable() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [q, setQ] = useState("");

  const filtered = rows.filter((r) => {
    if (filter !== "All" && r.cat !== filter) return false;
    if (q && !r.name.toLowerCase().includes(q.toLowerCase()) && !r.sym.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <section className="py-24 px-6">
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
            Live Data
          </span>
          <h2 className="mt-5 text-4xl md:text-[40px] font-extrabold tracking-tight text-gradient">
            Real-Time RWA Intelligence
          </h2>
          <p className="mt-3 text-base" style={{ color: "var(--text-secondary)" }}>
            Live analytics for 47 tracked assets across major RWA protocols
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
                {filtered.map((r) => (
                  <tr
                    key={r.n}
                    className="group transition-colors border-t"
                    style={{ borderColor: "var(--border-line)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <td className="px-5 py-4 tabular text-text-secondary" style={{ color: "#8892A4" }}>
                      {r.n}
                    </td>
                    <td className="px-5 py-4">
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
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {r.sym}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-white">{r.protocol}</td>
                    <td className="px-5 py-4">
                      <span
                        className="px-2.5 py-1 text-xs font-semibold rounded-full"
                        style={catStyle[r.cat]}
                      >
                        {r.cat}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white font-bold tabular">{r.tvl}</td>
                    <td className="px-5 py-4 text-white font-bold tabular">{r.yld}</td>
                    <td className="px-5 py-4">
                      <span
                        className="px-2.5 py-1 text-xs font-bold rounded-full"
                        style={riskStyle[r.risk]}
                      >
                        ● {r.risk}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 tabular font-semibold"
                      style={{ color: r.up ? "var(--accent-green)" : "var(--accent-red)" }}
                    >
                      {r.chg} {r.up ? "↑" : "↓"}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        className="px-3 py-1 text-xs font-semibold rounded-md transition-colors"
                        style={{
                          border: "1px solid rgba(0,212,255,0.4)",
                          color: "var(--accent-cyan)",
                        }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            className="text-center py-4 text-sm font-semibold"
            style={{
              borderTop: "1px solid var(--border-line)",
              color: "var(--accent-cyan)",
            }}
          >
            View all 47 assets →
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
