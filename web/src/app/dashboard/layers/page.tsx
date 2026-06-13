import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, CircleDashed } from "lucide-react";

const statusStyles = {
  Required:
    "border-[rgba(255,184,77,0.28)] bg-[rgba(255,184,77,0.08)] text-[var(--accent-amber)]",
  Dynamic:
    "border-[rgba(0,212,255,0.28)] bg-[rgba(0,212,255,0.08)] text-[#00D4FF]",
  Derived:
    "border-[rgba(45,212,191,0.28)] bg-[rgba(45,212,191,0.08)] text-[var(--data-positive)]",
} as const;

const layers = [
  {
    title: "Identity",
    description: "Core asset identity, category, issuer naming, and official references.",
    file: "identity.json",
    status: "Required",
    usedIn: "Completeness Score, Source Score",
    active: true,
  },
  {
    title: "Institutional",
    description: "Issuer, manager, custodian, auditor, and institutional counterparties.",
    file: "institutional.json",
    status: "Required",
    usedIn: "Legal Score, Source Score",
    active: true,
  },
  {
    title: "Compliance",
    description: "KYC, accreditation, transfer controls, jurisdictions, AML and sanctions signals.",
    file: "compliance.json",
    status: "Required",
    usedIn: "Legal Score, Risk Score",
    active: true,
  },
  {
    title: "Reserve",
    description: "Backing type, custody, collateralization, audits, and proof-of-reserves.",
    file: "reserve.json",
    status: "Required",
    usedIn: "Reserve Score, Risk Score",
    active: true,
  },
  {
    title: "Blockchain",
    description: "Chains, contracts, token standard, verification, whitelist and transfer restrictions.",
    file: "blockchain.json",
    status: "Required",
    usedIn: "Source Score, Risk Score",
    active: true,
  },
  {
    title: "Liquidity",
    description: "Redemption terms, lockups, market depth, and exit quality.",
    file: "liquidity.json",
    status: "Dynamic",
    usedIn: "Liquidity Score, Risk Score",
    active: true,
  },
  {
    title: "Market",
    description: "TVL, market cap, price, volume, supply, holders, and adoption metrics.",
    file: "market.json",
    status: "Dynamic",
    usedIn: "Completeness Score, Market Context",
    active: true,
  },
  {
    title: "Yield",
    description: "Current yield, benchmark, history, volatility, frequency, and distribution model.",
    file: "yield.json",
    status: "Dynamic",
    usedIn: "Yield Context, Risk Score",
    active: true,
  },
  {
    title: "Risk",
    description: "Risk score, factors, mitigants, blockers, warnings, and assessment date.",
    file: "risk.json",
    status: "Derived",
    usedIn: "Risk Score, Final Grade",
    active: true,
  },
  {
    title: "Sources",
    description: "Field-level source trail, source tier, reliability, freshness, and data gaps.",
    file: "sources.json",
    status: "Required",
    usedIn: "Source Score, Audit Trail",
    active: true,
  },
  {
    title: "Events",
    description: "Launches, audits, incidents, migrations, integrations, and relevant updates.",
    file: "events.json",
    status: "Dynamic",
    usedIn: "Monitoring, Risk Review",
    active: false,
  },
  {
    title: "Grade",
    description: "Final institutional / analytic / research grade and scoring baseline.",
    file: "grade-baseline.json",
    status: "Derived",
    usedIn: "Public Grade, Asset Profile",
    active: false,
  },
] as const;

const evidenceRules = [
  "Official sources are prioritized before aggregators.",
  "Unverified fields stay null instead of being guessed.",
  "Every non-null field must be traceable to a source.",
  "Smart contract audits are not treated as reserve audits.",
  "Proof-of-reserves is only marked true when explicitly confirmed.",
];

export default function LayersPage() {
  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-5 border-b border-[var(--border-line)] pb-5 xl:flex-row xl:items-end xl:justify-between">
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

        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[520px] xl:grid-cols-4">
          {[
            ["12", "research layers"],
            ["10", "active data files"],
            ["100%", "evidence-based"],
            ["0", "manual guessing"],
          ].map(([value, label]) => (
            <div key={label} className="terminal-panel px-4 py-3">
              <p className="text-lg font-semibold text-white">{value}</p>
              <p className="terminal-label mt-1">{label}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {layers.map((layer, index) => (
          <div key={layer.title} className="terminal-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="terminal-label">Layer {index + 1}</p>
                <h2 className="mt-1 text-base font-semibold text-white">{layer.title}</h2>
              </div>
              {layer.active ? (
                <CheckCircle2 className="size-5 text-[var(--data-positive)]" />
              ) : (
                <CircleDashed className="size-5 text-[var(--text-label)]" />
              )}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              {layer.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusStyles[layer.status]}`}
              >
                {layer.status}
              </span>
              <span className="rounded-full border border-[var(--border-line)] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-[var(--text-secondary)]">
                {layer.file}
              </span>
            </div>

            <div className="mt-4 border-t border-[var(--border-line)] pt-3">
              <p className="terminal-label">Used in scoring</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                {layer.usedIn}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="terminal-panel p-5">
        <p className="terminal-label">Methodology flow</p>
        <h2 className="mt-1 text-lg font-semibold text-white">
          From raw layer data to public asset grade
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {["Layer Data", "Source Validation", "Risk Scoring", "Grade Baseline", "Asset Profile"].map(
            (step, index, items) => (
              <div key={step} className="flex items-center gap-3">
                <div className="min-h-16 flex-1 rounded-xl border border-[var(--border-line)] bg-white/[0.03] p-3">
                  <p className="terminal-label">Step {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{step}</p>
                </div>
                {index < items.length - 1 ? (
                  <ArrowRight className="hidden size-4 shrink-0 text-[var(--text-label)] md:block" />
                ) : null}
              </div>
            ),
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-[rgba(0,212,255,0.22)] bg-[rgba(0,212,255,0.06)] p-5">
          <p className="text-sm font-semibold text-[#00D4FF]">Evidence rules</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {evidenceRules.map((rule) => (
              <div key={rule} className="flex gap-3 rounded-lg border border-[rgba(0,212,255,0.14)] bg-black/10 p-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#00D4FF]" />
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="terminal-panel flex flex-col justify-between p-5">
          <div>
            <p className="terminal-label">Next workflow</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Review the scoring output</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              After the layer dataset is complete, Nexus RWA converts evidence quality,
              reserve strength, liquidity, legal structure, and risk signals into a
              transparent asset grade.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/risk-grade"
              className="terminal-label inline-flex items-center gap-1 text-[var(--accent-amber)] hover:underline"
            >
              View risk & grade
              <ArrowUpRight className="size-3.5" />
            </Link>
            <Link
              href="/dashboard/assets"
              className="terminal-label inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-white"
            >
              Explore assets
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
