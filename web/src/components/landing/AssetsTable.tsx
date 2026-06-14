"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { FadeUp } from "@/components/landing/primitives";
import { FieldInfo } from "@/components/common/FieldInfo";
import type { FieldKey } from "@/lib/field-definitions";

type Cat = "Treasury" | "Credit";
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
  up: boolean | null;
  status?: "verified" | "syncing";
}[] = [
  {
    n: 1,
    color: "#00D4FF",
    name: "Ondo Short-Term US Government Treasuries",
    sym: "OUSG",
    protocol: "Ondo Finance",
    cat: "Treasury",
    tvl: "$3.69B",
    yld: "5.20%",
    risk: "MEDIUM",
    chg: "-1.31%",
    up: false,
    status: "verified",
  },
  {
    n: 2,
    color: "#22C55E",
    name: "Franklin OnChain U.S. Government Money Fund",
    sym: "BENJI",
    protocol: "Franklin Templeton",
    cat: "Treasury",
    tvl: "$401.0M",
    yld: "4.85%",
    risk: "LOW",
    chg: "+0.42%",
    up: true,
    status: "verified",
  },
  {
    n: 3,
    color: "#3B82F6",
    name: "Maple USDC Pool",
    sym: "mUSDC",
    protocol: "Maple Finance",
    cat: "Credit",
    tvl: "$324.1M",
    yld: "8.91%",
    risk: "MEDIUM",
    chg: "-1.80%",
    up: false,
    status: "verified",
  },
  {
    n: 4,
    color: "#06B6D4",
    name: "Ondo USDY",
    sym: "USDY",
    protocol: "Ondo Finance",
    cat: "Treasury",
    tvl: "Sync pending",
    yld: "5.10%",
    risk: "MEDIUM",
    chg: "—",
    up: null,
    status: "syncing",
  },
  {
    n: 5,
    color: "#8B5CF6",
    name: "Superstate",
    sym: "USTB",
    protocol: "Superstate",
    cat: "Treasury",
    tvl: "Sync pending",
    yld: "4.92%",
    risk: "MEDIUM",
    chg: "—",
    up: null,
    status: "syncing",
  },
  {
    n: 6,
    color: "#10B981",
    name: "Backed Finance",
    sym: "bC3M",
    protocol: "Backed Finance",
    cat: "Treasury",
    tvl: "Sync pending",
    yld: "5.00%",
    risk: "MEDIUM",
    chg: "—",
    up: null,
    status: "syncing",
  },
  {
    n: 7,
    color: "#14B8A6",
    name: "OpenEden",
    sym: "OUSG",
    protocol: "OpenEden",
    cat: "Treasury",
    tvl: "Sync pending",
    yld: "5.25%",
    risk: "MEDIUM",
    chg: "—",
    up: null,
    status: "syncing",
  },
  {
    n: 8,
    color: "#F97316",
    name: "Centrifuge CFG",
    sym: "CFG",
    protocol: "Centrifuge",
    cat: "Credit",
    tvl: "Sync pending",
    yld: "8.50%",
    risk: "MEDIUM",
    chg: "—",
    up: null,
    status: "syncing",
  },
  {
    n: 9,
    color: "#FACC15",
    name: "Goldfinch",
    sym: "GFI",
    protocol: "Goldfinch",
    cat: "Credit",
    tvl: "Sync pending",
    yld: "10.20%",
    risk: "MEDIUM",
    chg: "—",
    up: null,
    status: "syncing",
  },
  {
    n: 10,
    color: "#38BDF8",
    name: "Clearpool",
    sym: "CPOOL",
    protocol: "Clearpool",
    cat: "Credit",
    tvl: "Sync pending",
    yld: "7.20%",
    risk: "MEDIUM",
    chg: "—",
    up: null,
    status: "syncing",
  },
  {
    n: 11,
    color: "#EF4444",
    name: "TrueFi",
    sym: "TRU",
    protocol: "TrueFi",
    cat: "Credit",
    tvl: "Sync pending",
    yld: "9.10%",
    risk: "MEDIUM",
    chg: "—",
    up: null,
    status: "syncing",
  },
  {
    n: 12,
    color: "#A855F7",
    name: "Credix",
    sym: "CREDIX",
    protocol: "Credix",
    cat: "Credit",
    tvl: "Sync pending",
    yld: "11.50%",
    risk: "MEDIUM",
    chg: "—",
    up: null,
    status: "syncing",
  },
  {
    n: 13,
    color: "#EC4899",
    name: "Ribbon Finance",
    sym: "RBN",
    protocol: "Ribbon Finance",
    cat: "Credit",
    tvl: "Sync pending",
    yld: "8.00%",
    risk: "MEDIUM",
    chg: "—",
    up: null,
    status: "syncing",
  },
];

const catStyle: Record<Cat, { bg: string; color: string }> = {
  Treasury: { bg: "rgba(0,212,255,0.1)", color: "#00D4FF" },
  Credit: { bg: "rgba(124,58,237,0.15)", color: "#A78BFA" },
};

const riskStyle: Record<Risk, { bg: string; color: string }> = {
  LOW: { bg: "rgba(0,255,136,0.1)", color: "#00FF88" },
  MEDIUM: { bg: "rgba(255,184,0,0.1)", color: "#FFB800" },
  HIGH: { bg: "rgba(255,68,68,0.1)", color: "#FF6666" },
};

const filters = ["All", "Treasury", "Credit"] as const;

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

export function AssetsTable() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [q, setQ] = useState("");

  const filtered = rows.filter((r) => {
    if (filter !== "All" && r.cat !== filter) return false;
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
            Landing preview aligned with the current dashboard seed dataset. Verified rows show available market values;
            syncing rows are active assets waiting for refreshed market data.
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
                    <td
                      className="px-5 py-4 font-bold tabular"
                      style={{ color: r.tvl === "Sync pending" ? "var(--text-muted)" : "#fff" }}
                    >
                      {r.tvl}
                    </td>
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
                      style={{
                        color: r.up === null ? "var(--text-muted)" : r.up ? "var(--accent-green)" : "var(--accent-red)",
                      }}
                    >
                      {r.chg} {r.up === null ? "" : r.up ? "↑" : "↓"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="px-2.5 py-1 text-xs font-semibold rounded-full"
                        style={{
                          background: r.status === "verified" ? "rgba(0,255,136,0.1)" : "rgba(255,184,0,0.1)",
                          color: r.status === "verified" ? "var(--accent-green)" : "#FFB800",
                        }}
                      >
                        {r.status === "verified" ? "Verified" : "Syncing"}
                      </span>
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
            Explore asset coverage →
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
