import { Bot, Code2, BarChart3 } from "lucide-react";
import { FadeUp } from "./primitives";

const cards = [
  {
    Icon: Bot,
    color: "#00D4FF",
    bg: "rgba(0,212,255,0.1)",
    title: "Autonomous AI Agents",
    body: "AI agents access RWA data on-demand without human intervention. Pay per request with USDC, process the data, make decisions — fully automated at any scale.",
    quote: "Our DeFi agent processes 40,000 API calls per day with zero manual intervention",
    by: "— DeFi Yield Optimizer, Built on AutoGen + Base",
    tags: ["LangChain ✓", "AutoGen ✓", "CrewAI ✓"],
  },
  {
    Icon: Code2,
    color: "#A78BFA",
    bg: "rgba(124,58,237,0.15)",
    title: "DeFi Developers",
    body: "Build RWA-aware protocols, yield aggregators, and risk dashboards with production-grade data. No rate limits, no gatekeeping, no approval required.",
    quote: "Integrated Nexus RWA in 2 hours. The API is exactly what the ecosystem needed.",
    by: "— Protocol Engineer, Yield Aggregator",
    tags: ["REST API ✓", "WebSocket ✓", "OpenAPI ✓"],
  },
  {
    Icon: BarChart3,
    color: "#00FF88",
    bg: "rgba(0,255,136,0.1)",
    title: "On-chain Analysts",
    body: "Track protocol performance, identify yield opportunities, and monitor risk changes across the entire RWA landscape — one API, all protocols.",
    quote: "Bloomberg-quality RWA data. Without Bloomberg pricing.",
    by: "— Independent On-chain Analyst",
    tags: ["CSV Export ✓", "JSON ✓", "Historical ✓"],
  },
];

export function UseCases() {
  return (
    <section className="py-24 px-6" style={{ background: "var(--bg-secondary)" }}>
      <div className="max-w-[1400px] mx-auto">
        <FadeUp className="text-center mb-12">
          <h2 className="text-4xl md:text-[40px] font-extrabold tracking-tight text-gradient">
            Built for the Next Generation of Finance
          </h2>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <FadeUp key={c.title} delay={i * 0.05}>
              <div className="glass-card p-7 h-full flex flex-col">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: c.bg, border: `1px solid ${c.color}40` }}
                >
                  <c.Icon size={36} style={{ color: c.color }} />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-white">{c.title}</h3>
                <p className="mt-3 text-sm leading-[1.7]" style={{ color: "var(--text-secondary)" }}>
                  {c.body}
                </p>
                <div className="my-5 h-px" style={{ background: "var(--border-line)" }} />
                <div
                  className="rounded-md p-4 text-sm"
                  style={{
                    background: "rgba(10,14,26,0.6)",
                    borderLeft: `3px solid ${c.color}`,
                  }}
                >
                  <p className="italic text-white">"{c.quote}"</p>
                  <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {c.by}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-full"
                      style={{
                        border: "1px solid var(--border-line)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
