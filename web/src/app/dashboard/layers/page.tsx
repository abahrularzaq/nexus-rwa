import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Database,
  FileJson,
  GitBranch,
  Layers3,
  ShieldCheck,
} from "lucide-react";

const statusStyles = {
  Required:
    "border-[#FFB800]/40 bg-[#FFB800]/15 text-[#FFD36A] shadow-[0_0_18px_rgba(255,184,0,0.1)]",
  Dynamic:
    "border-[#00D1FF]/40 bg-[#00D1FF]/15 text-[#8DEBFF] shadow-[0_0_18px_rgba(0,209,255,0.12)]",
  Derived:
    "border-[#00FF88]/40 bg-[#00FF88]/15 text-[#74FFB8] shadow-[0_0_18px_rgba(0,255,136,0.14)]",
} as const;

const layerAccentStyles = {
  Required: "border-[#FFB800]/20 bg-[linear-gradient(145deg,rgba(255,184,0,0.08),rgba(255,255,255,0.025))]",
  Dynamic: "border-[#00D1FF]/20 bg-[linear-gradient(145deg,rgba(0,209,255,0.08),rgba(255,255,255,0.025))]",
  Derived: "border-[#00FF88]/20 bg-[linear-gradient(145deg,rgba(0,255,136,0.08),rgba(255,255,255,0.025))]",
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

const stats = [
  { value: "12", label: "data layers", icon: Layers3 },
  { value: "10", label: "active data files", icon: FileJson },
  { value: "100%", label: "evidence-based", icon: ShieldCheck },
  { value: "0", label: "manual guessing", icon: Database },
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
    <div className="relative isolate space-y-8 overflow-hidden pb-10">
      <div className="pointer-events-none absolute inset-x-[-18%] top-[-180px] -z-10 h-[520px] bg-[radial-gradient(circle_at_28%_22%,rgba(0,209,255,0.18),transparent_34%),radial-gradient(circle_at_72%_18%,rgba(185,131,255,0.13),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(255,184,0,0.08),transparent_36%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-[-12%] top-[560px] -z-10 h-[420px] bg-[radial-gradient(circle_at_18%_20%,rgba(0,255,136,0.09),transparent_30%),radial-gradient(circle_at_88%_60%,rgba(255,68,68,0.08),transparent_32%)] blur-3xl" />

      <header className="relative flex flex-col gap-3 border-b border-[#00D1FF]/15 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5 text-[#8DEBFF]">Dataset architecture</p>
          <h1 className="bg-gradient-to-r from-white via-[#DDF9FF] to-[#8DEBFF] bg-clip-text text-2xl font-semibold leading-tight tracking-tight text-transparent">
            12-Layer Data Control Center
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Review the operational data structure behind every Nexus RWA asset profile:
            JSON files, layer status, scoring usage, and evidence rules.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/sources"
            className="inline-flex items-center gap-2 rounded-lg border border-[#00D1FF]/20 bg-[#00D1FF]/[0.04] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-cyan)] hover:bg-[#00D1FF]/10 hover:text-white hover:shadow-[0_0_24px_rgba(0,209,255,0.16)]"
          >
            <GitBranch className="size-3.5" />
            Open Sources
          </Link>
          <Link href="/dashboard/risk-grade" className="terminal-label inline-flex items-center gap-1 text-[var(--accent-amber)] transition hover:text-[#FFD36A] hover:underline">
            View risk & grade
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-xl border border-[#B983FF]/20 bg-[linear-gradient(135deg,rgba(8,13,25,0.96),rgba(11,20,38,0.88))] p-4 shadow-[0_0_40px_rgba(0,209,255,0.06)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_100%_0%,rgba(185,131,255,0.16),transparent_45%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#00D1FF]/40 bg-[#00D1FF]/15 px-2.5 py-1 text-xs font-medium text-[#8DEBFF] shadow-[0_0_18px_rgba(0,209,255,0.12)]">
                Dashboard-only architecture
              </span>
              <span className="rounded-full border border-[#00FF88]/40 bg-[#00FF88]/15 px-2.5 py-1 text-xs font-medium text-[#74FFB8] shadow-[0_0_18px_rgba(0,255,136,0.14)]">
                Machine-readable dataset
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
              Unlike the public Methodology page, Data Layers is the analyst workspace for how asset records are structured, validated, and converted into scoring outputs.
            </p>
          </div>
          <Link
            href="/methodology"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#B983FF]/40 bg-[#B983FF]/15 px-4 py-2 text-sm font-medium text-[#E6D0FF] shadow-[0_0_24px_rgba(185,131,255,0.12)] transition hover:bg-[#B983FF]/25 hover:shadow-[0_0_34px_rgba(185,131,255,0.2)]"
          >
            Public methodology
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map(({ value, label, icon: Icon }) => (
          <div
            key={label}
            className="data-surface border-[#00D1FF]/20 bg-[linear-gradient(145deg,rgba(0,209,255,0.08),rgba(255,255,255,0.025))] p-4 shadow-[0_0_28px_rgba(0,209,255,0.06)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold text-white">{value}</p>
                <p className="terminal-label mt-1 text-[#8DEBFF]">{label}</p>
              </div>
              <Icon className="size-5 text-[#8DEBFF]" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {layers.map((layer, index) => (
          <div
            key={layer.title}
            className={`group relative overflow-hidden rounded-xl border p-5 shadow-[0_0_28px_rgba(0,209,255,0.04)] transition hover:-translate-y-0.5 hover:border-[#00D1FF]/35 hover:shadow-[0_0_34px_rgba(0,209,255,0.1)] ${layerAccentStyles[layer.status]}`}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D1FF]/50 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="terminal-label text-[#8DEBFF]">Layer {String(index + 1).padStart(2, "0")}</p>
                <h2 className="mt-1 text-base font-semibold text-white">{layer.title}</h2>
              </div>
              {layer.active ? (
                <CheckCircle2 className="size-5 text-[#74FFB8]" />
              ) : (
                <CircleDashed className="size-5 text-[var(--text-label)]" />
              )}
            </div>

            <p className="mt-3 min-h-[66px] text-sm leading-relaxed text-[var(--text-secondary)]">
              {layer.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusStyles[layer.status]}`}
              >
                {layer.status}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-[var(--text-secondary)]">
                {layer.file}
              </span>
            </div>

            <div className="mt-4 border-t border-white/10 pt-3">
              <p className="terminal-label text-[var(--text-label)]">Used in scoring</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                {layer.usedIn}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="relative overflow-hidden rounded-xl border border-[#00D1FF]/20 bg-[linear-gradient(145deg,rgba(0,209,255,0.08),rgba(255,255,255,0.025))] p-5 shadow-[0_0_32px_rgba(0,209,255,0.06)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_100%_0%,rgba(0,209,255,0.14),transparent_45%)]" />
        <div className="relative">
          <p className="terminal-label text-[#8DEBFF]">Dataset workflow</p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            From structured data files to public asset grade
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {["Data Layers", "Source Validation", "Risk Scoring", "Grade Baseline", "Asset Profile"].map(
              (step, index, items) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="min-h-16 flex-1 rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="terminal-label text-[var(--text-label)]">Step {index + 1}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{step}</p>
                  </div>
                  {index < items.length - 1 ? (
                    <ArrowRight className="hidden size-4 shrink-0 text-[#8DEBFF] md:block" />
                  ) : null}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-[#00D1FF]/20 bg-[linear-gradient(145deg,rgba(0,209,255,0.08),rgba(255,255,255,0.025))] p-5 shadow-[0_0_32px_rgba(0,209,255,0.06)]">
          <p className="text-sm font-semibold text-[#8DEBFF]">Evidence rules</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {evidenceRules.map((rule) => (
              <div key={rule} className="flex gap-3 rounded-lg border border-[#00D1FF]/15 bg-black/10 p-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#8DEBFF]" />
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-[#B983FF]/20 bg-[linear-gradient(135deg,rgba(8,13,25,0.96),rgba(22,14,38,0.78))] p-5 shadow-[0_0_36px_rgba(185,131,255,0.08)]">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_100%_0%,rgba(185,131,255,0.18),transparent_45%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <p className="terminal-label text-[#E6D0FF]">Next workflow</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Review the scoring output</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                After the asset dataset is complete, Nexus RWA converts evidence quality,
                reserve strength, liquidity, legal structure, and risk signals into a
                transparent asset grade.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard/risk-grade"
                className="terminal-label inline-flex items-center gap-1 text-[var(--accent-amber)] transition hover:text-[#FFD36A] hover:underline"
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
        </div>
      </section>
    </div>
  );
}
