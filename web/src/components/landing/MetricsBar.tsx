import { TrendingUp, Layers, Percent, Zap } from "lucide-react";
import { CountUp } from "./primitives";

const cards = [
  {
    Icon: TrendingUp,
    label: "TOTAL RWA TVL",
    value: <CountUp to={2.84} decimals={2} prefix="$" suffix="B" />,
    sub: "+12.4% this month",
    pos: true,
  },
  {
    Icon: Layers,
    label: "ASSETS TRACKED",
    value: <CountUp to={47} />,
    sub: "Across 6 protocols",
    pos: null,
  },
  {
    Icon: Percent,
    label: "AVG YIELD RATE",
    value: <CountUp to={6.73} decimals={2} suffix="%" />,
    sub: "+0.31% vs last week",
    pos: true,
  },
  {
    Icon: Zap,
    label: "API CALLS (24H)",
    value: <CountUp to={128439} />,
    sub: "Via X402 Protocol",
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
