"use client";

import { useState } from "react";
import { Check, X, Bot } from "lucide-react";
import { FadeUp } from "@/components/landing/primitives";

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

const passes: Tier[] = [
  {
    name: "Free",
    price: "$0",
    per: "forever",
    badge: "PUBLIC DISCOVERY",
    features: [
      { t: "Public asset catalog", ok: true },
      { t: "Market summary and current yield", ok: true },
      { t: "Risk level and grade label", ok: true },
      { t: "Public asset events", ok: true },
      { t: "Reserve, compliance, and source trail", ok: false },
      { t: "Historical data and AI insight", ok: false },
    ],
    cta: "Start Free",
  },
  {
    name: "Pro 24h Pass",
    price: "$3",
    per: "/24h",
    sub: "Current x402 settlement: 0.001 ETH",
    badge: "ANALYST ACCESS",
    highlight: true,
    features: [
      { t: "Everything in Free", ok: true },
      { t: "Full 12-layer asset profile", ok: true },
      { t: "Risk breakdown and grade context", ok: true },
      { t: "Reserve, compliance, liquidity", ok: true },
      { t: "Field-level source trail", ok: true },
      { t: "History and AI asset insight", ok: true },
    ],
    cta: "Unlock Pro",
  },
  {
    name: "Enterprise 7d Pass",
    price: "$29",
    per: "/7d",
    sub: "Current x402 settlement: 0.01 ETH",
    features: [
      { t: "Everything in Pro", ok: true },
      { t: "Bulk analytics endpoint", ok: true },
      { t: "Full dataset export", ok: true },
      { t: "Ask Nexus API", ok: true },
      { t: "Machine-readable workflows", ok: true },
      { t: "Commercial integration path", ok: true },
    ],
    cta: "Start API Access",
  },
];

const subscriptions: Tier[] = [
  {
    name: "Pro Early Access",
    price: "$9",
    per: "/mo",
    badge: "FOR RESEARCHERS",
    highlight: true,
    features: [
      { t: "Full analyst-grade asset profiles", ok: true },
      { t: "Reserve, compliance, liquidity", ok: true },
      { t: "Source trail and AI insights", ok: true },
      { t: "Individual research workflow", ok: true },
      { t: "Bulk API export", ok: false },
    ],
    cta: "Join Early Access",
  },
  {
    name: "API Starter",
    price: "$99",
    per: "/mo",
    badge: "FOR BUILDERS",
    features: [
      { t: "Machine-readable RWA dataset", ok: true },
      { t: "API integration workflow", ok: true },
      { t: "Bulk asset access", ok: true },
      { t: "AI-agent friendly endpoints", ok: true },
      { t: "Custom SLA", ok: false },
    ],
    cta: "Request API Access",
  },
  {
    name: "Enterprise",
    price: "Custom",
    per: "",
    features: [
      { t: "Commercial data licensing", ok: true },
      { t: "Custom asset coverage", ok: true },
      { t: "Higher rate limits", ok: true },
      { t: "Priority support", ok: true },
      { t: "Dedicated integration path", ok: true },
    ],
    cta: "Contact Sales",
  },
];

export function Pricing() {
  const [mode, setMode] = useState<"passes" | "sub">("passes");
  const tiers = mode === "passes" ? passes : subscriptions;

  return (
    <section className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <FadeUp className="text-center mb-10">
          <h2 className="text-4xl md:text-[40px] font-extrabold tracking-tight text-gradient">
            Pricing Built Around Access
          </h2>
          <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Free for discovery, Pro for analyst-grade profiles, and Enterprise for API, export, and AI-agent workflows.
          </p>
        </FadeUp>

        <div className="flex justify-center mb-10">
          <div
            className="inline-flex p-1 rounded-full"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-line)" }}
          >
            {(["passes", "sub"] as const).map((m) => (
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
                {m === "passes" ? "x402 Access Passes" : "Subscriptions"}
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
                    {t.badge ?? "MOST POPULAR"}
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
              <strong className="text-white">Building an AI Agent?</strong> Enterprise unlocks bulk export,
              Ask Nexus, and machine-readable institutional RWA data. Current x402 responses also expose
              <span className="font-mono"> pricing.displayPrice</span> and <span className="font-mono">priceUsd</span>
              for clean frontend display.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
