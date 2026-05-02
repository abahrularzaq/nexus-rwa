import { BarChart2, Shield, Users, TrendingUp, Globe, Search } from "lucide-react";
import { FadeUp } from "./primitives";

const cards = [
  { Icon: BarChart2, title: "Yield Analytics", body: "Historical and real-time yield data. Daily, weekly, monthly aggregations for all tracked assets.", badge: "REST API", badgeStyle: { bg: "rgba(0,255,136,0.1)", color: "#00FF88" }, endpoint: "GET /v1/assets/:id/yield" },
  { Icon: Shield, title: "Risk Scoring Engine", body: "Proprietary 4-factor risk model: liquidity, concentration, protocol age, yield volatility.", badge: "Proprietary", badgeStyle: { bg: "rgba(124,58,237,0.15)", color: "#A78BFA" }, endpoint: "GET /v1/assets/:id/risk" },
  { Icon: Users, title: "Holder Intelligence", body: "Total holders, whale concentration, retail distribution, and top-10 concentration metrics.", badge: "On-chain", badgeStyle: { bg: "rgba(0,212,255,0.1)", color: "#00D4FF" }, endpoint: "GET /v1/assets/:id/holders" },
  { Icon: TrendingUp, title: "TVL Tracking", body: "Real-time and 90-day historical TVL. Protocol breakdown, chain distribution, and growth metrics.", badge: "Real-time", badgeStyle: { bg: "rgba(0,255,136,0.1)", color: "#00FF88" }, endpoint: "GET /v1/assets" },
  { Icon: Globe, title: "Market Overview", body: "Aggregated market stats, top movers, gainers and losers across the entire RWA landscape.", badge: "FREE", badgeStyle: { bg: "rgba(255,184,0,0.15)", color: "#FFB800" }, endpoint: "GET /v1/market/overview" },
  { Icon: Search, title: "Asset Search", body: "Full-text search across all assets by name, symbol, or protocol. Instant results.", badge: "REST API", badgeStyle: { bg: "rgba(0,255,136,0.1)", color: "#00FF88" }, endpoint: "GET /v1/search?q={query}" },
];

export function ApiFeatures() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <FadeUp className="text-center mb-12">
          <h2 className="text-4xl md:text-[40px] font-extrabold tracking-tight text-gradient">
            Everything You Need to Build
          </h2>
          <p className="mt-3 text-base" style={{ color: "var(--text-secondary)" }}>
            Production-grade RWA data infrastructure
          </p>
        </FadeUp>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((c, i) => (
            <FadeUp key={c.title} delay={i * 0.05}>
              <div
                className="glass-card p-7 h-full transition-all duration-200 hover:-translate-y-1 group"
                style={{}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,212,255,0.4)";
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3), 0 0 30px rgba(0,212,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-line)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                  style={{
                    background: "rgba(0,212,255,0.1)",
                    border: "1px solid rgba(0,212,255,0.25)",
                  }}
                >
                  <c.Icon size={22} style={{ color: "var(--accent-cyan)" }} />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-white">{c.title}</h3>
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                    style={{ background: c.badgeStyle.bg, color: c.badgeStyle.color }}
                  >
                    {c.badge}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {c.body}
                </p>
                <div
                  className="inline-block mt-4 px-2.5 py-1.5 rounded text-[11px] font-mono"
                  style={{
                    background: "rgba(10,14,26,0.6)",
                    color: "var(--accent-cyan)",
                    border: "1px solid var(--border-line)",
                  }}
                >
                  {c.endpoint}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
