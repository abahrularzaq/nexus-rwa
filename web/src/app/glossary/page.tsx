import Link from "next/link";
import { FIELD_DEFINITIONS, type FieldCategory, type FieldDefinition } from "@/lib/field-definitions";
import { HexLogo } from "@/components/landing/primitives";

const categoryOrder: FieldCategory[] = [
  "Identity",
  "Blockchain",
  "Market",
  "Yield",
  "Reserve",
  "Institutional",
  "Compliance",
  "Liquidity",
  "Risk",
  "Grading",
  "Source",
];

const categoryDescriptions: Record<FieldCategory, string> = {
  Identity: "Core asset identity, naming, classification, and official references.",
  Blockchain: "On-chain deployment, token contract, transfer mechanics, and explorer verification.",
  Market: "Scale, price, volume, holder, TVL, AUM, and short-term movement indicators.",
  Yield: "Reported yield, benchmark context, frequency, stability, and distribution timing.",
  Reserve: "Backing asset, custody, audit, proof-of-reserves, and redemption asset details.",
  Institutional: "Issuer, legal structure, fund service providers, fees, and target investor profile.",
  Compliance: "KYC, investor eligibility, sanctions screening, jurisdiction, and regulatory disclosures.",
  Liquidity: "Redemption terms, lock-ups, minimums, DEX liquidity, and exit quality indicators.",
  Risk: "Risk dimensions related to smart contracts, legal clarity, market adoption, and concentration.",
  Grading: "Data quality, review state, blockers, warnings, and production-readiness indicators.",
  Source: "Source reliability, evidence traceability, freshness, and known data gaps.",
};

type GroupedField = {
  key: string;
  definition: FieldDefinition;
};

function getGroupedDefinitions() {
  const grouped = categoryOrder.reduce(
    (acc, category) => {
      acc[category] = [];
      return acc;
    },
    {} as Record<FieldCategory, GroupedField[]>,
  );

  Object.entries(FIELD_DEFINITIONS).forEach(([key, definition]) => {
    grouped[definition.category].push({ key, definition });
  });

  return grouped;
}

export default function GlossaryPage() {
  const grouped = getGroupedDefinitions();
  const totalFields = Object.keys(FIELD_DEFINITIONS).length;

  return (
    <main className="min-h-screen px-6 py-10 md:px-12" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-[1200px]">
        <header className="flex flex-col gap-8 border-b pb-10 md:flex-row md:items-center md:justify-between" style={{ borderColor: "var(--border-line)" }}>
          <div>
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
              Methodology Glossary
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gradient md:text-6xl">
              Nexus RWA Field Definitions
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed md:text-lg" style={{ color: "var(--text-secondary)" }}>
              A transparent data dictionary for the parameters used across Nexus RWA asset profiles,
              dashboards, grading, compliance, reserve, liquidity, and source-quality layers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-64">
            <StatCard label="Fields" value={totalFields.toString()} />
            <StatCard label="Categories" value={categoryOrder.length.toString()} />
          </div>
        </header>

        <section className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {categoryOrder.map((category) => (
            <a
              key={category}
              href={`#${category.toLowerCase()}`}
              className="rounded-xl p-4 transition-transform hover:-translate-y-0.5"
              style={{
                background: "rgba(15,22,41,0.62)",
                border: "1px solid var(--border-line)",
              }}
            >
              <div className="text-sm font-bold text-white">{category}</div>
              <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {grouped[category].length} fields
              </div>
            </a>
          ))}
        </section>

        <div className="mt-12 space-y-10">
          {categoryOrder.map((category) => (
            <section key={category} id={category.toLowerCase()} className="scroll-mt-24">
              <div className="mb-4">
                <h2 className="text-2xl font-extrabold text-white">{category}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {categoryDescriptions[category]}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {grouped[category].map(({ key, definition }) => (
                  <article
                    key={key}
                    className="rounded-2xl p-5"
                    style={{
                      background: "rgba(15,22,41,0.62)",
                      border: "1px solid var(--border-line)",
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{definition.label}</h3>
                        <code
                          className="mt-2 inline-block rounded-md px-2 py-1 text-xs"
                          style={{
                            background: "rgba(0,212,255,0.08)",
                            color: "var(--accent-cyan)",
                            border: "1px solid rgba(0,212,255,0.18)",
                          }}
                        >
                          {key}
                        </code>
                      </div>
                      <span
                        className="w-fit rounded-full px-2.5 py-1 text-[11px] font-bold capitalize"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          color: "#CBD5E1",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {definition.valueType}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {definition.shortDescription}
                    </p>

                    <div className="mt-4 rounded-xl p-3" style={{ background: "rgba(10,14,26,0.58)" }}>
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                        Why it matters
                      </div>
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: "#CBD5E1" }}>
                        {definition.whyItMatters}
                      </p>
                    </div>

                    {definition.example ? (
                      <div className="mt-4 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        <span className="font-bold text-white">Example:</span> {definition.example}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{
        background: "rgba(15,22,41,0.62)",
        border: "1px solid var(--border-line)",
      }}
    >
      <div className="text-3xl font-extrabold text-white">{value}</div>
      <div className="mt-1 text-[11px] label-eyebrow" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
    </div>
  );
}
