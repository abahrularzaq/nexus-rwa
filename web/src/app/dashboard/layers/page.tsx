import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleDashed } from "lucide-react";

const layers = [
  ["Identity", "Core asset identity, category, issuer naming, and official references."],
  ["Institutional", "Issuer, manager, custodian, auditor, and institutional counterparties."],
  ["Compliance", "KYC, accreditation, transfer controls, jurisdictions, AML and sanctions signals."],
  ["Reserve", "Backing type, custody, collateralization, audits, and proof-of-reserves."],
  ["Blockchain", "Chains, contracts, token standard, verification, whitelist and transfer restrictions."],
  ["Liquidity", "Redemption terms, lockups, market depth, and exit quality."],
  ["Market", "TVL, market cap, price, volume, supply, holders, and adoption metrics."],
  ["Yield", "Current yield, benchmark, history, volatility, frequency, and distribution model."],
  ["Risk", "Risk score, factors, mitigants, blockers, warnings, and assessment date."],
  ["Sources", "Field-level source trail, source tier, reliability, freshness, and data gaps."],
  ["Events", "Launches, audits, incidents, migrations, integrations, and relevant updates."],
  ["Grade", "Final institutional / analytics / research grade and scoring baseline."],
];

export default function LayersPage() {
  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-3 border-b border-[var(--border-line)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5">Research methodology</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            12-layer asset intelligence model
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Nexus RWA evaluates each asset using a structured 12-layer dataset so
            every score can be traced back to verifiable evidence.
          </p>
        </div>
        <Link
          href="/dashboard/assets"
          className="terminal-label inline-flex items-center gap-1 text-[var(--accent-amber)] hover:underline"
        >
          Open asset catalog
          <ArrowUpRight className="size-3.5" />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {layers.map(([title, description], index) => (
          <div key={title} className="terminal-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="terminal-label">Layer {index + 1}</p>
                <h2 className="mt-1 text-base font-semibold text-white">{title}</h2>
              </div>
              {index < 10 ? (
                <CheckCircle2 className="size-5 text-[var(--data-positive)]" />
              ) : (
                <CircleDashed className="size-5 text-[var(--text-label)]" />
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-[rgba(0,212,255,0.22)] bg-[rgba(0,212,255,0.06)] p-5">
        <p className="text-sm font-semibold text-[#00D4FF]">Design principle</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          The sidebar is now organized around platform workflows, while the full
          12-layer model belongs inside asset detail pages, grading views, source
          trails, and completeness matrices.
        </p>
      </section>
    </div>
  );
}
