import Link from "next/link";
import { HexLogo } from "@/components/landing/primitives";

const workflow = [
  {
    step: "01",
    title: "Collect verified RWA data",
    description:
      "Nexus RWA starts from issuer pages, regulatory filings, fund documents, attestations, blockchain explorers, and trusted market references.",
  },
  {
    step: "02",
    title: "Validate sources",
    description:
      "Official and primary sources are prioritized. Missing or unverifiable claims are not forced into the dataset.",
  },
  {
    step: "03",
    title: "Score risk and readiness",
    description:
      "Reserve quality, legal structure, compliance signals, liquidity, market data, and source credibility are reviewed together.",
  },
  {
    step: "04",
    title: "Publish transparent grades",
    description:
      "Each asset receives a research, analytics, or institutional-grade baseline with warnings, blockers, and review notes.",
  },
];

const principles = [
  {
    title: "Evidence first",
    description:
      "Every meaningful claim should be traceable. Official issuer, regulator, audit, filing, and explorer sources are preferred.",
  },
  {
    title: "No unsupported assumptions",
    description:
      "Missing or unverifiable data stays empty instead of being estimated. This keeps the platform away from false precision.",
  },
  {
    title: "Source quality matters",
    description:
      "Aggregators are useful, but they are not treated as final authority when official documents are available.",
  },
  {
    title: "Risk is contextual",
    description:
      "A high TVL or attractive yield does not automatically mean institutional quality. Reserves, liquidity, legal clarity, and source quality matter together.",
  },
];

const grades = [
  {
    grade: "Institutional",
    description:
      "Strong source coverage, clear legal and reserve structure, high data completeness, minimal blockers, and suitable for serious institutional-style analysis.",
  },
  {
    grade: "Analytics",
    description:
      "Useful for dashboard-level analysis and comparison, but still has notable warnings, missing evidence, or areas that need further review.",
  },
  {
    grade: "Research",
    description:
      "Early-stage or incomplete coverage. Suitable for watchlists and further investigation, not yet for high-confidence production analysis.",
  },
];

export default function MethodologyPage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-12" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-[1180px]">
        <header
          className="border-b pb-10"
          style={{ borderColor: "var(--border-line)" }}
        >
          <Link href="/" className="inline-flex items-center gap-2.5">
            <HexLogo size={28} />
            <span className="text-base font-bold tracking-tight">
              <span className="text-white">NEXUS</span>{" "}
              <span style={{ color: "var(--accent-cyan)" }}>RWA</span>
            </span>
          </Link>

          <div
            className="mt-8 inline-block rounded-full px-3 py-1 text-[11px] label-eyebrow"
            style={{
              background: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.3)",
              color: "var(--accent-cyan)",
            }}
          >
            Methodology
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-gradient md:text-6xl">
            How Nexus RWA Works
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-relaxed md:text-lg" style={{ color: "var(--text-secondary)" }}>
            Nexus RWA turns fragmented real-world asset information into comparable intelligence by collecting evidence, validating sources, scoring risk, and publishing transparent asset grades.
          </p>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { value: "4", label: "Method Steps" },
            { value: "3", label: "Grade Levels" },
            { value: "0", label: "Guesswork Policy" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl p-6 text-center"
              style={{
                background: "rgba(15,22,41,0.62)",
                border: "1px solid var(--border-line)",
              }}
            >
              <div className="text-4xl font-extrabold text-white">{item.value}</div>
              <div className="mt-2 text-[11px] label-eyebrow" style={{ color: "var(--text-secondary)" }}>
                {item.label}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-14">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-white">From verified sources to transparent RWA grades</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              The public methodology explains the evaluation flow at a high level. The dashboard contains the operational data-layer architecture for deeper review.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map((item) => (
              <article
                key={item.step}
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(15,22,41,0.62)",
                  border: "1px solid var(--border-line)",
                }}
              >
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold"
                  style={{
                    background: "rgba(0,212,255,0.1)",
                    color: "var(--accent-cyan)",
                    border: "1px solid rgba(0,212,255,0.25)",
                  }}
                >
                  {item.step}
                </span>
                <h3 className="mt-5 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-white">Core Principles</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              The methodology is designed to reduce unsupported claims and make every asset profile easier to audit, compare, and improve over time.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {principles.map((principle) => (
              <article
                key={principle.title}
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(15,22,41,0.62)",
                  border: "1px solid var(--border-line)",
                }}
              >
                <h3 className="text-lg font-bold text-white">{principle.title}</h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {principle.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-white">Grade Levels</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Grades are not marketing labels. They indicate how complete, verifiable, and production-ready an asset profile is.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {grades.map((item) => (
              <article
                key={item.grade}
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(15,22,41,0.62)",
                  border: "1px solid var(--border-line)",
                }}
              >
                <h3 className="text-lg font-bold" style={{ color: "var(--accent-green)" }}>
                  {item.grade}
                </h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="mt-14 rounded-3xl p-6 md:p-8"
          style={{
            background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.1))",
            border: "1px solid rgba(0,212,255,0.25)",
          }}
        >
          <h2 className="text-2xl font-extrabold text-white">Why this matters</h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>
            RWA data is often scattered across issuer websites, regulatory filings, audit documents, blockchain explorers, aggregators, and market dashboards. Nexus RWA organizes that evidence into one consistent framework so users can understand not only what an asset is, but also how reliable the available information is.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="w-fit rounded-[10px] px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)",
                boxShadow: "0 0 30px rgba(0,212,255,0.25)",
              }}
            >
              Explore Dashboard →
            </Link>
            <Link
              href="/dashboard/layers"
              className="w-fit rounded-[10px] px-6 py-3 text-sm font-semibold"
              style={{
                border: "1px solid rgba(0,212,255,0.4)",
                color: "var(--accent-cyan)",
              }}
            >
              View Data Layers
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
