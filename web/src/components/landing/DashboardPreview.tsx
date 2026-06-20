"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Check } from "lucide-react";
import { FadeUp, HexLogo } from "@/components/landing/primitives";
import { useAssetSummaries } from "@/hooks/use-asset-summaries";
import type { AssetCategory, RiskLevel } from "@/lib/shared";

const categoryLabels: Record<AssetCategory, string> = {
  TREASURY: "Treasury",
  CREDIT: "Credit",
  REAL_ESTATE: "Real Estate",
  COMMODITIES: "Commodities",
  EQUITY: "Equity",
};

const categoryColors: Record<AssetCategory, string> = {
  TREASURY: "#00D4FF",
  CREDIT: "#7C3AED",
  REAL_ESTATE: "#FF4444",
  COMMODITIES: "#FFB800",
  EQUITY: "#00FF88",
};

const riskColors: Record<RiskLevel, string> = {
  LOW: "#00FF88",
  MEDIUM: "#FFB800",
  HIGH: "#FF4444",
  CRITICAL: "#FFA0A0",
};

export function DashboardPreview() {
  const { data: assets = [], isLoading, isError } = useAssetSummaries();
  const yieldByAsset = assets
    .filter((asset) => Number.isFinite(asset.yieldRate))
    .slice(0, 5)
    .map((asset) => ({
      p: asset.symbol || asset.id,
      v: Math.round(asset.yieldRate * 10_000) / 100,
      c: categoryColors[asset.category ?? "TREASURY"],
    }));
  const catMix = Object.entries(
    assets.reduce<Partial<Record<AssetCategory, number>>>((acc, asset) => {
      const category = asset.category ?? "TREASURY";
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([category, count]) => ({
    name: categoryLabels[category as AssetCategory],
    v: count,
    c: categoryColors[category as AssetCategory],
  }));
  const riskMix = Object.entries(
    assets.reduce<Partial<Record<RiskLevel, number>>>((acc, asset) => {
      acc[asset.riskScore] = (acc[asset.riskScore] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([risk, count]) => ({
    p: risk,
    v: count,
    c: riskColors[risk as RiskLevel],
  }));

  const unavailableLabel = isLoading ? "Loading..." : isError ? "Dashboard data unavailable" : "No data available";

  return (
    <section className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <FadeUp>
          <span
            className="inline-block px-3 py-1 rounded-full text-[11px] label-eyebrow"
            style={{
              background: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.3)",
              color: "var(--accent-cyan)",
            }}
          >
            Dashboard MVP
          </span>
          <h2 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">
            <span className="text-gradient-cyan block">Structured RWA Data.</span>
            <span className="text-gradient-cp block">One Research View.</span>
          </h2>
          <p className="mt-5 text-base leading-[1.8] max-w-lg" style={{ color: "var(--text-secondary)" }}>
            Explore tokenized asset profiles across market, yield, risk, source, reserve,
            compliance, and liquidity layers. Coverage grows asset by asset as verified sources are added.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Public catalog with available market and yield summaries",
              "12-layer asset profiles for Pro research",
              "Evidence-based risk and grade context",
              "Source trail for verified fields",
              "Asset comparison and category discovery",
              "JSON export and API preview for builders",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm" style={{ color: "#CBD5E1" }}>
                <Check size={16} className="mt-0.5 shrink-0" style={{ color: "var(--accent-cyan)" }} />
                {f}
              </li>
            ))}
          </ul>
          <button
            className="mt-8 px-7 py-3 rounded-[10px] text-white font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, #00D4FF 0%, #0099BB 100%)",
              boxShadow: "0 0 24px rgba(0,212,255,0.35)",
            }}
          >
            Explore Dashboard →
          </button>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid rgba(0,212,255,0.2)",
              transform: "perspective(1200px) rotateX(4deg) rotateY(-4deg)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,212,255,0.15)",
            }}
          >
            <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background: "#0A0E1A", borderBottom: "1px solid var(--border-line)" }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F56" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#27C93F" }} />
              <span className="ml-3 text-[11px]" style={{ color: "var(--text-muted)" }}>app.nexusrwa.xyz/dashboard</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] min-h-[420px]">
              <div className="p-3 border-r flex flex-col gap-1" style={{ background: "#0A0E1A", borderColor: "var(--border-line)" }}>
                <div className="flex items-center gap-2 px-2 py-2 mb-2">
                  <HexLogo size={20} />
                  <span className="text-[11px] font-bold text-white">NEXUS</span>
                </div>
                {[
                  { l: "Overview", a: true },
                  { l: "Assets" },
                  { l: "Yield" },
                  { l: "Risk" },
                  { l: "Sources" },
                  { l: "API" },
                ].map((it) => (
                  <div
                    key={it.l}
                    className="px-2 py-1.5 text-[11px] rounded"
                    style={{
                      color: it.a ? "var(--accent-cyan)" : "var(--text-secondary)",
                      borderLeft: it.a ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                      background: it.a ? "rgba(0,212,255,0.05)" : "transparent",
                    }}
                  >
                    {it.l}
                  </div>
                ))}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] text-white font-semibold">Welcome, Analyst</div>
                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: isError ? "var(--accent-red)" : "var(--accent-green)" }}>
                    <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: isError ? "var(--accent-red)" : "var(--accent-green)" }} />
                    API
                  </div>
                </div>
                <div className="grid grid-cols-2 grid-rows-2 gap-2 h-[340px]">
                  <MiniChart title="TVL History">
                    <Unavailable label="Historical TVL series unavailable" />
                  </MiniChart>
                  <MiniChart title="Available Yield">
                    {yieldByAsset.length ? (
                      <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={yieldByAsset}>
                          <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                            {yieldByAsset.map((d) => <Cell key={d.p} fill={d.c} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <Unavailable label={unavailableLabel} />}
                  </MiniChart>
                  <MiniChart title="Category Mix">
                    {catMix.length ? (
                      <ResponsiveContainer width="100%" height={100}>
                        <PieChart>
                          <Pie data={catMix} dataKey="v" innerRadius={22} outerRadius={42} stroke="none">
                            {catMix.map((d) => <Cell key={d.name} fill={d.c} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <Unavailable label={unavailableLabel} />}
                  </MiniChart>
                  <MiniChart title="Risk Mix">
                    {riskMix.length ? (
                      <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={riskMix}>
                          <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                            {riskMix.map((d) => <Cell key={d.p} fill={d.c} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <Unavailable label={unavailableLabel} />}
                  </MiniChart>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function MiniChart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-md p-2 flex flex-col"
      style={{ background: "rgba(10,14,26,0.6)", border: "1px solid var(--border-line)" }}
    >
      <div className="text-[9px] label-eyebrow" style={{ color: "var(--text-secondary)" }}>
        {title}
      </div>
      <div className="mt-1 h-[100px] w-full min-w-0 shrink-0">{children}</div>
    </div>
  );
}

function Unavailable({ label }: { label: string }) {
  return <div className="flex h-full items-center justify-center px-3 text-center text-[10px]" style={{ color: "var(--text-secondary)" }}>{label}</div>;
}
