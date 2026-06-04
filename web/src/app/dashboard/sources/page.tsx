import Link from "next/link";
import { ArrowUpRight, FileSearch, ShieldCheck, TriangleAlert } from "lucide-react";

const sourceTiers = [
  {
    tier: "Tier 1",
    title: "Primary evidence",
    description: "Issuer docs, legal documents, reserve reports, SEC filings, official transparency pages, and verified contracts.",
    icon: ShieldCheck,
  },
  {
    tier: "Tier 2",
    title: "Market data sources",
    description: "rwa.xyz, DeFiLlama, explorers, analytics dashboards, and official ecosystem integrations.",
    icon: FileSearch,
  },
  {
    tier: "Tier 3",
    title: "Context only",
    description: "Reputable media, commentary, and secondary references that should not override primary documents.",
    icon: TriangleAlert,
  },
];

const checks = [
  "Every non-null field should have a source URL.",
  "Reserve claims must come from official transparency, audit, legal, or custody documents.",
  "Smart-contract audits must not be treated as reserve audits.",
  "Conflicting values should preserve the higher-reliability source and document the conflict.",
  "Missing evidence should become a data gap, not an estimate.",
];

export default function SourcesPage() {
  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-3 border-b border-[var(--border-line)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5">Source library</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            Evidence trail and source reliability
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            The source layer is the audit trail for every asset field, score,
            warning, blocker, and final grade in Nexus RWA.
          </p>
        </div>
        <Link
          href="/dashboard/layers"
          className="terminal-label inline-flex items-center gap-1 text-[var(--accent-amber)] hover:underline"
        >
          View 12-layer model
          <ArrowUpRight className="size-3.5" />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {sourceTiers.map(({ tier, title, description, icon: Icon }) => (
          <div key={tier} className="terminal-panel p-5">
            <Icon className="size-5 text-[var(--accent-amber)]" />
            <p className="terminal-label mt-4">{tier}</p>
            <h2 className="mt-1 font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          </div>
        ))}
      </section>

      <section className="terminal-panel p-5">
        <p className="terminal-label">Source policy</p>
        <h2 className="mt-1 text-base font-semibold text-white">
          Rules for production-grade asset data
        </h2>
        <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
          {checks.map((check) => (
            <li key={check} className="flex gap-2 leading-relaxed">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent-amber)]" />
              {check}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[rgba(255,184,0,0.22)] bg-[rgba(255,184,0,0.06)] p-5">
        <p className="text-sm font-semibold text-[#FFB800]">Next build target</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Convert this page into a searchable source library with field-level URLs,
          reliability scores, data gaps, last verified dates, and per-asset source
          completeness.
        </p>
      </section>
    </div>
  );
}
