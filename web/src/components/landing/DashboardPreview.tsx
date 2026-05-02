import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Check, BarChart3, Layers, Percent, Shield, Users, Code2, Sparkles } from "lucide-react";
import { FadeUp, Sparkline, HexLogo } from "./primitives";

const tvlData = [
  { m: "Dec", v: 1.8 }, { m: "Jan", v: 2.0 }, { m: "Feb", v: 2.1 },
  { m: "Mar", v: 2.4 }, { m: "Apr", v: 2.6 }, { m: "May", v: 2.84 },
];
const yieldByProto = [
  { p: "Ondo", v: 5.4, c: "#00D4FF" },
  { p: "Maple", v: 8.9, c: "#7C3AED" },
  { p: "Centri", v: 9.3, c: "#00FF88" },
  { p: "Backed", v: 4.9, c: "#FFB800" },
  { p: "RealT", v: 11.2, c: "#FF4444" },
];
const catMix = [
  { name: "Treasury", v: 65, c: "#00D4FF" },
  { name: "Credit", v: 22, c: "#7C3AED" },
  { name: "RE", v: 8, c: "#FF4444" },
  { name: "Comm.", v: 5, c: "#FFB800" },
];
const riskTrend = [
  { d: 1, v: 2 }, { d: 2, v: 2.1 }, { d: 3, v: 2.4 }, { d: 4, v: 2.3 },
  { d: 5, v: 2.6 }, { d: 6, v: 2.5 }, { d: 7, v: 2.8 },
];

export function DashboardPreview() {
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
            Dashboard
          </span>
          <h2 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">
            <span className="text-gradient-cyan block">Every Metric.</span>
            <span className="text-gradient-cp block">One Platform.</span>
          </h2>
          <p
            className="mt-5 text-base leading-[1.8] max-w-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Track TVL, yield rates, risk scores, and holder distribution for all major RWA
            protocols. On-chain data refreshed every 60 seconds.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Real-time TVL aggregation across protocols",
              "Historical yield analytics (up to 365 days)",
              "Proprietary risk scoring engine",
              "Holder concentration analysis",
              "Multi-protocol comparison tools",
              "Export to CSV / JSON via API",
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
              boxShadow:
                "0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,212,255,0.15)",
            }}
          >
            {/* chrome */}
            <div
              className="flex items-center gap-1.5 px-4 py-2.5"
              style={{ background: "#0A0E1A", borderBottom: "1px solid var(--border-line)" }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F56" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#27C93F" }} />
              <span className="ml-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
                app.nexusrwa.xyz/dashboard
              </span>
            </div>
            <div className="grid grid-cols-[140px_1fr] min-h-[420px]">
              {/* sidebar */}
              <div
                className="p-3 border-r flex flex-col gap-1"
                style={{ background: "#0A0E1A", borderColor: "var(--border-line)" }}
              >
                <div className="flex items-center gap-2 px-2 py-2 mb-2">
                  <HexLogo size={20} />
                  <span className="text-[11px] font-bold text-white">NEXUS</span>
                </div>
                {[
                  { l: "Overview", a: true },
                  { l: "Assets" },
                  { l: "Yield" },
                  { l: "Risk" },
                  { l: "Holders" },
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
              {/* main */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] text-white font-semibold">Welcome, Analyst</div>
                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--accent-green)" }}>
                    <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: "var(--accent-green)" }} />
                    Connected
                  </div>
                </div>
                <div className="grid grid-cols-2 grid-rows-2 gap-2 h-[340px]">
                  <MiniChart title="TVL Over Time">
                    <ResponsiveContainer>
                      <AreaChart data={tvlData}>
                        <defs>
                          <linearGradient id="tvlg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area dataKey="v" stroke="#00D4FF" strokeWidth={1.5} fill="url(#tvlg)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </MiniChart>
                  <MiniChart title="Yield by Protocol">
                    <ResponsiveContainer>
                      <BarChart data={yieldByProto}>
                        <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                          {yieldByProto.map((d, i) => <Cell key={i} fill={d.c} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </MiniChart>
                  <MiniChart title="Category Mix">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={catMix} dataKey="v" innerRadius={22} outerRadius={42} stroke="none">
                          {catMix.map((d, i) => <Cell key={i} fill={d.c} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </MiniChart>
                  <MiniChart title="Risk Trend">
                    <ResponsiveContainer>
                      <AreaChart data={riskTrend}>
                        <defs>
                          <linearGradient id="riskg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00FF88" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#FFB800" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area dataKey="v" stroke="#00FF88" strokeWidth={1.5} fill="url(#riskg)" />
                      </AreaChart>
                    </ResponsiveContainer>
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
      style={{
        background: "rgba(10,14,26,0.6)",
        border: "1px solid var(--border-line)",
      }}
    >
      <div className="text-[9px] label-eyebrow" style={{ color: "var(--text-secondary)" }}>
        {title}
      </div>
      <div className="flex-1 mt-1">{children}</div>
    </div>
  );
}
