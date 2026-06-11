import Link from "next/link";

import { HexLogo } from "@/components/landing/primitives";
import { FIELD_DEFINITIONS, type FieldCategory, type FieldDefinition } from "@/lib/field-definitions";
import { GLOSSARY_TERMS } from "@nexus-rwa/shared";

import { GlossaryExplorer } from "./glossary-explorer";

const categoryOrder: FieldCategory[] = [
  "Identity",
  "Classification",
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
  Classification: "Asset class, instrument type, claim type, grading profile, and public segmentation context.",
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
  const totalTerms = GLOSSARY_TERMS.length;

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
              RWA Intelligence Dictionary
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gradient md:text-6xl">
              Glossary for RWA terms and Nexus data fields
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Understand RWA concepts, market metrics, reserve evidence, legal structure, yield terms, and the data fields used by Nexus RWA to classify and grade assets.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(15,22,41,0.62)", border: "1px solid var(--border-line)" }}>
              <div className="text-4xl font-extrabold text-white">{totalTerms}</div>
              <div className="mt-1 text-xs label-eyebrow" style={{ color: "var(--text-secondary)" }}>
                RWA terms
              </div>
            </div>
            <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(15,22,41,0.62)", border: "1px solid var(--border-line)" }}>
              <div className="text-4xl font-extrabold text-white">{totalFields}</div>
              <div className="mt-1 text-xs label-eyebrow" style={{ color: "var(--text-secondary)" }}>
                tracked fields
              </div>
            </div>
          </div>
        </header>

        <GlossaryExplorer />

        <section className="mt-12 border-t pt-10" style={{ borderColor: "var(--border-line)" }}>
          <div className="mb-6">
            <div
              className="inline-block rounded-full px-3 py-1 text-[11px] label-eyebrow"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-line)",
                color: "var(--text-secondary)",
              }}
            >
              Nexus Field Dictionary
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Data fields used across the Nexus RWA asset layers
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              These definitions explain the structured fields used in identity, blockchain, market, yield, reserve, institutional, compliance, liquidity, risk, grading, and source layers.
            </p>
          </div>

          <div className="space-y-8">
            {categoryOrder.map((category) => {
              const fields = grouped[category];
              if (!fields.length) return null;

              return (
                <section key={category} className="rounded-2xl p-5 md:p-6" style={{ background: "rgba(15,22,41,0.62)", border: "1px solid var(--border-line)" }}>
                  <div className="mb-5">
                    <h3 className="text-2xl font-bold text-white">{category}</h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {categoryDescriptions[category]}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {fields.map(({ key, definition }) => (
                      <div key={key} className="rounded-xl p-4" style={{ background: "rgba(10,14,26,0.58)", border: "1px solid var(--border-line)" }}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="text-base font-bold text-white">{definition.label}</h4>
                          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ background: "rgba(0,212,255,0.1)", color: "var(--accent-cyan)", border: "1px solid rgba(0,212,255,0.25)" }}>
                            {definition.valueType}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {definition.shortDescription}
                        </p>
                        <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          <span className="font-semibold text-white">Why it matters:</span> {definition.whyItMatters}
                        </p>
                        {definition.example ? (
                          <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            <span className="font-semibold text-white">Example:</span> {definition.example}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
