import { Bot, Code2, BarChart3 } from "lucide-react";
import { FadeUp } from "@/components/landing/primitives";

const cards = [
  {
    Icon: Bot,
    color: "#00D4FF",
    bg: "rgba(0,212,255,0.1)",
    title: "AI-Agent Experiments",
    body: "Use Nexus RWA as an early structured data layer for agent prototypes. Agents can read bulk JSON data, inspect selected asset context, and query Ask Nexus beta — with full agent SDKs and manifests still in development.",
    noteTitle: "Available now",
    note: "Bulk JSON export, selected asset context, and Ask Nexus beta for early testing.",
    tags: ["JSON Data ✓", "Ask Nexus Beta", "SDK Roadmap"],
  },
  {
    Icon: Code2,
    color: "#A78BFA",
    bg: "rgba(124,58,237,0.15)",
    title: "RWA Builders",
    body: "Build proof-of-concepts, internal tools, and RWA-aware dashboards using the current API preview. The infrastructure supports Free, Pro, and Enterprise access, while self-serve onboarding and higher-rate usage are still being built.",
    noteTitle: "Best for MVPs",
    note: "Prototype dashboards, asset comparison tools, and data workflows before production integration.",
    tags: ["REST API ✓", "API Keys ✓", "Rate Limits Soon"],
  },
  {
    Icon: BarChart3,
    color: "#00FF88",
    bg: "rgba(0,255,136,0.1)",
    title: "RWA Analysts",
    body: "Compare tokenized assets across market, yield, reserve, compliance, liquidity, source trail, and risk layers. Use public data for discovery, Pro for full asset research, and Enterprise Preview for machine-readable exports.",
    noteTitle: "Research workflow",
    note: "Move from public discovery to full 12-layer analysis, then export structured data when needed.",
    tags: ["12 Layers ✓", "Source Trail ✓", "JSON Export ✓"],
  },
];

export function UseCases() {
  return (
    <section className="py-24 px-6" style={{ background: "var(--bg-secondary)" }}>
      <div className="max-w-[1400px] mx-auto">
        <FadeUp className="text-center mb-12">
          <h2 className="text-4xl md:text-[40px] font-extrabold tracking-tight text-gradient">
            Built for RWA Research, Builders, and API Experiments
          </h2>
          <p className="mt-3 text-base max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Nexus RWA is currently focused on credible asset intelligence first: structured data,
            source-backed layers, early API access, and Ask Nexus beta. Enterprise workflows are available as an MVP,
            not yet a fully self-serve enterprise platform.
          </p>
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
                  <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: c.color }}>
                    {c.noteTitle}
                  </p>
                  <p className="mt-2 text-white">{c.note}</p>
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
