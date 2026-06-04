import Link from "next/link";
import { ArrowUpRight, Filter, Search, SlidersHorizontal } from "lucide-react";

const filterGroups = [
  {
    title: "Asset quality",
    items: ["Institutional grade", "Analytics grade", "Research grade", "Has blockers", "Has warnings"],
  },
  {
    title: "Access & compliance",
    items: ["KYC required", "Accredited only", "Transfer restrictions", "Sanctions screening"],
  },
  {
    title: "Reserve & transparency",
    items: ["Proof of reserves", "Named custodian", "Recent audit", "Tier 1 source trail"],
  },
  {
    title: "Market profile",
    items: ["Treasury", "Credit", "Commodity", "High TVL", "Positive 7D change"],
  },
];

export default function ScreenerPage() {
  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-3 border-b border-[var(--border-line)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5">Asset screener</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            Filter RWAs by institutional readiness
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            A planned 12-layer screener for filtering assets by grade, compliance,
            reserve evidence, liquidity, source quality, and market profile.
          </p>
        </div>
        <Link
          href="/dashboard/assets"
          className="terminal-label inline-flex items-center gap-1 text-[var(--accent-amber)] hover:underline"
        >
          Browse asset catalog
          <ArrowUpRight className="size-3.5" />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="terminal-panel p-5">
          <Search className="size-5 text-[var(--accent-amber)]" />
          <h2 className="mt-3 font-semibold text-white">Search</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Find assets by name, symbol, issuer, category, chain, or source trail.
          </p>
        </div>
        <div className="terminal-panel p-5">
          <Filter className="size-5 text-[var(--accent-amber)]" />
          <h2 className="mt-3 font-semibold text-white">Filter</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Combine compliance, reserve, liquidity, market, and grading filters.
          </p>
        </div>
        <div className="terminal-panel p-5">
          <SlidersHorizontal className="size-5 text-[var(--accent-amber)]" />
          <h2 className="mt-3 font-semibold text-white">Compare</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Shortlist assets and compare evidence completeness side by side.
          </p>
        </div>
      </section>

      <section className="terminal-panel p-5">
        <p className="terminal-label">Suggested filter groups</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filterGroups.map((group) => (
            <div key={group.title} className="data-surface rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white">{group.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                {group.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-[var(--accent-amber)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
