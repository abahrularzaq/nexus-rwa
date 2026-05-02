import { useState } from "react";
import { Check, X, Bot } from "lucide-react";
import { FadeUp } from "./primitives";

type Tier = {
  name: string;
  price: string;
  per: string;
  sub?: string;
  badge?: string;
  features: { t: string; ok: boolean }[];
  cta: string;
  highlight?: boolean;
};

const ppr: Tier[] = [
  {
    name: "Public Data",
    price: "$0",
    per: "/request",
    badge: "FREE FOREVER",
    features: [
      { t: "Market overview endpoint", ok: true },
      { t: "Protocol directory", ok: true },
      { t: "Public asset list (basic)", ok: true },
      { t: "System health status", ok: true },
      { t: "Historical data", ok: false },
      { t: "Risk scoring", ok: false },
      { t: "Holder data", ok: false },
    ],
    cta: "Start Free",
  },
  {
    name: "Standard Data",
    price: "$0.001",
    per: "/request",
    sub: "≈ $1 per 1,000 calls",
    badge: "MOST POPULAR",
    highlight: true,
    features: [
      { t: "Everything in Free", ok: true },
      { t: "Asset detail endpoint", ok: true },
      { t: "Current yield rates", ok: true },
      { t: "Basic risk scores", ok: true },
      { t: "Real-time TVL data", ok: true },
      { t: "Historical analysis", ok: false },
      { t: "Holder intelligence", ok: false },
    ],
    cta: "Start Building",
  },
  {
    name: "Deep Analytics",
    price: "$0.005",
    per: "/request",
    sub: "≈ $5 per 1,000 calls",
    features: [
      { t: "Everything in Standard", ok: true },
      { t: "90-day yield history", ok: true },
      { t: "Holder distribution", ok: true },
      { t: "Advanced risk engine", ok: true },
      { t: "Whale alerts", ok: true },
      { t: "Search endpoint", ok: true },
    ],
    cta: "Go Premium",
  },
];

const monthly: Tier[] = [
  { name: "Starter", price: "$49", per: "/mo", badge: "FOR INDIE BUILDERS", features: [{ t: "10K requests / month", ok: true }, { t: "All public endpoints", ok: true }, { t: "Email support", ok: true }, { t: "Historical data", ok: false }, { t: "Risk scoring", ok: false }], cta: "Start Free Trial" },
  { name: "Growth", price: "$199", per: "/mo", sub: "Most teams pick this", badge: "MOST POPULAR", highlight: true, features: [{ t: "100K requests / month", ok: true }, { t: "All endpoints incl. risk", ok: true }, { t: "Priority support", ok: true }, { t: "WebSocket streams", ok: true }, { t: "Dedicated account mgr", ok: false }], cta: "Start Free Trial" },
  { name: "Enterprise", price: "Custom", per: "", features: [{ t: "Unlimited requests", ok: true }, { t: "Custom SLAs", ok: true }, { t: "On-prem option", ok: true }, { t: "Dedicated support", ok: true }, { t: "Custom integrations", ok: true }], cta: "Contact Sales" },
];

export function Pricing() {
  const [mode, setMode] = useState<"ppr" | "sub">("ppr");
  const tiers = mode === "ppr" ? ppr : monthly;

  return (
    <section className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <FadeUp className="text-center mb-10">
          <h2 className="text-4xl md:text-[40px] font-extrabold tracking-tight text-gradient">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-3 text-base" style={{ color: "var(--text-secondary)" }}>
            Pay per request with X402, or subscribe for predictable costs
          </p>
        </FadeUp>

        <div className="flex justify-center mb-10">
          <div
            className="inline-flex p-1 rounded-full"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-line)" }}
          >
            {(["ppr", "sub"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-5 py-2 text-sm font-semibold rounded-full transition-all"
                style={{
                  background: mode === m ? "linear-gradient(135deg,#00D4FF,#7C3AED)" : "transparent",
                  color: mode === m ? "#fff" : "#8892A4",
                  boxShadow: mode === m ? "0 0 20px rgba(0,212,255,0.3)" : "none",
                }}
              >
                {m === "ppr" ? "Pay Per Request" : "Monthly Subscription"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t, i) => (
            <FadeUp key={t.name + mode} delay={i * 0.05}>
              <div
                className="relative rounded-xl p-7 h-full"
                style={{
                  background: "rgba(15,22,41,0.8)",
                  border: t.highlight ? "2px solid var(--accent-cyan)" : "1px solid var(--border-line)",
                  boxShadow: t.highlight ? "0 0 40px rgba(0,212,255,0.2)" : "none",
                }}
              >
                {t.highlight && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#00D4FF,#7C3AED)" }}
                  >
                    MOST POPULAR
                  </div>
                )}
                {!t.highlight && t.badge && (
                  <div
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-3"
                    style={{ background: "rgba(0,212,255,0.1)", color: "var(--accent-cyan)" }}
                  >
                    {t.badge}
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white">{t.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className="text-5xl font-extrabold tabular"
                    style={{ color: t.highlight ? "var(--accent-cyan)" : "#fff" }}
                  >
                    {t.price}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {t.per}
                  </span>
                </div>
                {t.sub && (
                  <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    {t.sub}
                  </div>
                )}
                <div className="my-5 h-px" style={{ background: "rgba(0,212,255,0.2)" }} />
                <ul className="space-y-3">
                  {t.features.map((f) => (
                    <li key={f.t} className="flex items-start gap-2.5 text-sm">
                      {f.ok ? (
                        <Check size={16} className="mt-0.5 shrink-0" style={{ color: "var(--accent-cyan)" }} />
                      ) : (
                        <X size={16} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                      )}
                      <span style={{ color: f.ok ? "#CBD5E1" : "var(--text-muted)", textDecoration: f.ok ? "none" : "line-through" }}>
                        {f.t}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  className="mt-7 w-full py-3 rounded-[10px] font-bold text-sm transition-all"
                  style={
                    t.highlight
                      ? {
                          background: "linear-gradient(135deg,#00D4FF,#7C3AED)",
                          color: "#fff",
                          boxShadow: "0 0 24px rgba(0,212,255,0.4)",
                        }
                      : {
                          border: "1px solid rgba(0,212,255,0.4)",
                          color: "var(--accent-cyan)",
                          background: "transparent",
                        }
                  }
                >
                  {t.cta}
                </button>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.2}>
          <div
            className="mt-10 flex items-center gap-4 px-6 py-4 rounded-[10px]"
            style={{
              background: "rgba(0,212,255,0.05)",
              border: "1px solid rgba(0,212,255,0.2)",
            }}
          >
            <Bot size={22} style={{ color: "var(--accent-cyan)" }} className="shrink-0" />
            <p className="text-sm" style={{ color: "#CBD5E1" }}>
              <strong className="text-white">Building an AI Agent?</strong> X402 Protocol handles
              payments automatically — no API keys, no credit cards, no human intervention required.{" "}
              <a className="font-semibold" style={{ color: "var(--accent-cyan)" }} href="#">
                Learn about X402 →
              </a>
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
