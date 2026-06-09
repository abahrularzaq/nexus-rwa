import Link from "next/link";
import { HexLogo } from "@/components/landing/primitives";

const dataLayers = [
  {
    title: "Identity",
    description:
      "Defines the asset name, symbol, category, issuer reference, official website, and core public identity.",
  },
  {
    title: "Blockchain",
    description:
      "Tracks chain deployment, token contracts, explorer links, transfer model, and on-chain verification status.",
  },
  {
    title: "Reserve",
    description:
      "Reviews backing assets, custody, audit evidence, proof-of-reserves status, collateral details, and redemption asset.",
  },
  {
    title: "Institutional",
    description:
      "Maps issuer structure, fund vehicle, service providers, target investors, fee model, and operating framework.",
  },
  {
    title: "Compliance",
    description:
      "Captures KYC, investor eligibility, sanctions screening, jurisdiction, transfer restrictions, and regulatory disclosures.",
  },
  {
    title: "Market",
    description:
      "Measures asset scale, TVL, AUM, price, volume, supply, holder count, and market adoption indicators.",
  },
  {
    title: "Yield",
    description:
      "Reviews reported yield, benchmark context, distribution schedule, yield type, history, and stability indicators.",
  },
  {
    title: "Liquidity",
    description:
      "Evaluates redemption period, lock-up, minimum redemption, exit channels, DEX liquidity, and practical exit quality.",
  },
  {
    title: "Risk",
    description:
      "Consolidates smart contract, reserve, legal, market, liquidity, concentration, and operational risk signals.",
  },
  {
    title: "Sources",
    description:
      "Creates an audit trail of official sources, secondary sources, reliability tier, freshness, and known data gaps.",
  },
  {
    title: "Grading",
    description:
      "Translates evidence quality and risk signals into research, analytics, or institutional-grade readiness.",
  },
  {
    title: "Review",
    description:
      "Records blockers, warnings, next actions, baseline date, and production-readiness review notes.",
  },
];

const principles = [
  {
    title: "Evidence first",
    description:
      "Every non-null field should be supported by a traceable source. Official issuer, regulator, audit, filing, and explorer sources are preferred.",
  },
  {
    title: "No unsupported assumptions",
    description:
      "Missing or unverifiable data should remain null instead of being estimated. This protects the dataset from false precision.",
  },
  {
    title: "Source quality matters",
    description:
      "Official documents and primary sources carry more weight than aggregators or media references. Aggregators are useful, but not treated as final authority.",
  },
  {
    title: "Risk is contextual",
    description:
      "A high TVL or strong yield does not automatically mean institutional quality. Legal clarity, reserves, liquidity, and source credibility matter together.",
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
            How Nexus RWA Evaluates Real World Assets
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-relaxed md:text-lg" style={{ color: "var(--text-secondary)" }}>
            Nexus RWA uses a structured, evidence-based methodology to transform fragmented RWA information into comparable asset intelligence across reserves, compliance, liquidity, yield, risk, and source credibility.
          </p>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { value: "12", label: "Data Layers" },
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
            <h2 className="text-2xl font-extrabold text-white">12-Layer Asset Review</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Each RWA asset is reviewed as a layered dataset, not only as a token price or yield product.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dataLayers.map((layer, index) => (
              <article
                key={layer.title}
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(15,22,41,0.62)",
                  border: "1px solid var(--border-line)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                    style={{
                      background: "rgba(0,212,255,0.1)",
                      color: "var(--accent-cyan)",
                      border: "1px solid rgba(0,212,255,0.25)",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-bold text-white">{layer.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {layer.description}
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
              href="/glossary"
              className="w-fit rounded-[10px] px-6 py-3 text-sm font-semibold"
              style={{
                border: "1px solid rgba(0,212,255,0.4)",
                color: "var(--accent-cyan)",
              }}
            >
              View Field Glossary
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
