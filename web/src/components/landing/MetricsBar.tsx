"use client";

import { TrendingUp, Layers, Percent, Zap } from "lucide-react";
import { CountUpClient } from "./CountUpClient";

const cards = [
  {
    Icon: TrendingUp,
    label: "VERIFIED MARKET TVL",
    value: <CountUpClient to={4.42} decimals={2} prefix="$" suffix="B" />,
    sub: "From 3 seeded market rows",
    pos: null,
  },
  {
    Icon: Layers,
    label: "ACTIVE ASSETS",
    value: <CountUpClient to={13} />,
    sub: "Current dashboard coverage",
    pos: null,
  },
  {
    Icon: Percent,
    label: "AVG SEED YIELD",
    value: <CountUpClient to={7.21} decimals={2} suffix="%" />,
    sub: "Indicative dataset baseline",
    pos: null,
  },
  {
    Icon: Zap,
    label: "API STATUS",
    value: <span>Preview</span>,
    sub: "x402 + API-key MVP",
    pos: null,
  },
];

export function MetricsBar() {
  return (
    <section className="py-10 px-6" style={{ background: "var(--bg-secondary)" }}>
      <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: "var(--border-line)" }}>
        {cards.map(({ Icon, label, value, sub, pos }, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon size={20} style={{ color: "var(--accent-cyan)" }} />
              <span
                className="text-[11px] label-eyebrow"
                style={{ color: "var(--text-secondary)" }}
              >
                {label}
              </span>
            </div>
            <div className="text-3xl md:text-[40px] font-bold tabular text-white leading-tight">
              {value}
            </div>
            <div
              className="text-[13px] mt-1"
              style={{
                color:
                  pos === true
                    ? "var(--accent-green)"
                    : "var(--text-secondary)",
              }}
            >
              {pos === true ? "↑ " : ""}
              {sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
