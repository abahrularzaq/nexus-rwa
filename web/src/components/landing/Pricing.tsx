"use client";

import Link from "next/link";
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
  href: string;
  helper: string;
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
    href: "/dashboard/assets",
    helper: "Browse the public RWA catalog first.",
  },
  {
    name: "Pro 24h Pass",
    price: "$3",
    per: "/24h",
    sub: "x402 settlement target: 3.00 USDC",
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
    href: "/dashboard/assets/franklin-benji",
    helper: "Open BENJI, the strongest current flagship asset.",
  },
  {
    name: "Enterprise API Preview",
    price: "$29",
    per: "/7d",
    sub: "MVP access target: 29.00 USDC",
    badge: "MVP / IN DEVELOPMENT",
    features: [
      { t: "Everything in Pro", ok: true },
      { t: "Bulk asset snapshot endpoint", ok: true },
      { t: "JSON dataset export", ok: true },
      { t: "Ask Nexus API beta", ok: true },
      { t: "AI-agent-ready data blocks", ok: true },
      { t: "Self-serve enterprise onboarding", ok: false },
    ],
    cta: "Explore API Docs",
    href: "/dashboard/api-docs",
    helper: "Enterprise is in MVP: core API routes exist, full onboarding is still being built.",
  },
];

export function Pricing() {
  const tiers = passes;

  return (
    <section className="py-24 px-6" id="pricing">
      <div className="max-w-[1400px] mx-auto">
        <FadeUp className="text-center mb-10">
          <h2 className="text-4xl md:text-[40px] font-extrabold tracking-tight text-gradient">
            x402 USDC Access Passes
          </h2>
          <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Unlock institutional RWA data with USDC-based x402 access passes. Free for discovery,
            Pro 24h for analyst-grade profiles, and Enterprise Preview for early API, export,
            and AI-agent-ready workflows.
          </p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.05}>
              <div
                className="relative rounded-xl p-7 h-full flex flex-col"
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
                    className="inline-block w-fit px-2 py-0.5 rounded-full text-[10px] font-bold mb-3"
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
                <div className="mt-auto pt-7">
                  <Link
                    href={t.href}
                    className="block w-full py-3 rounded-[10px] font-bold text-sm text-center transition-all hover:-translate-y-0.5"
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
                  </Link>
                  <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                    {t.helper}
                  </p>
                </div>
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
              <strong className="text-white">Building an AI Agent?</strong> Enterprise is currently an API preview,
              not a fully automated agent platform. The available building blocks are bulk JSON data,
              dataset export, and Ask Nexus beta. Agent manifests, SDKs, usage analytics, higher rate limits,
              and self-serve commercial onboarding are still in development.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
