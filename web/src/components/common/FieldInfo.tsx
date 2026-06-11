"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Info, X } from "lucide-react";
import { FIELD_DEFINITIONS, type FieldKey } from "@/lib/field-definitions";
import {
  GLOSSARY_CATEGORY_LABELS,
  GLOSSARY_TERMS,
  type GlossaryTerm,
} from "../../../../shared/src/glossary";

const FIELD_GLOSSARY_SLUGS: Partial<Record<FieldKey, string>> = {
  assetClass: "real-world-asset",
  backingType: "asset-backed-token",
  claimType: "underlying-asset",
  hasProofOfReserves: "proof-of-reserves",
  custodian: "custodian",
  reserveScore: "reserve",
  reserveApplicability: "reserve",
  tvl: "tvl",
  aumUsd: "aum",
  marketCap: "market-cap",
  liquidityScore: "liquidity",
  redemptionType: "redemption",
  redemptionPeriodDays: "redemption-period",
  lockupPeriodDays: "liquidity",
  currentYield: "yield",
  yieldType: "yield",
  yieldBenchmark: "benchmark-yield",
  riskScore: "risk-score",
  dataQualityGrade: "institutional-grade",
  gradingProfile: "institutional-grade",
  kycRequired: "kyc",
  accreditedOnly: "kyc",
};

type FieldInfoProps = {
  fieldKey: FieldKey;
  label?: string;
  glossarySlug?: string;
  className?: string;
};

function getGlossaryTerm(glossarySlug?: string): GlossaryTerm | undefined {
  if (!glossarySlug) return undefined;
  return GLOSSARY_TERMS.find((term) => term.slug === glossarySlug);
}

export function FieldInfo({ fieldKey, label, glossarySlug, className = "" }: FieldInfoProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const definition = FIELD_DEFINITIONS[fieldKey];
  const term = getGlossaryTerm(glossarySlug ?? FIELD_GLOSSARY_SLUGS[fieldKey]);

  if (!definition) return <>{label ?? fieldKey}</>;

  return (
    <span className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <span>{label ?? definition.label}</span>
      <button
        type="button"
        aria-label={`Explain ${definition.label}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-300/70"
        style={{ color: "var(--accent-cyan)" }}
      >
        <Info size={13} aria-hidden="true" />
      </button>

      {open ? (
        <span
          id={id}
          role="dialog"
          aria-label={`${definition.label} explanation`}
          className="absolute left-0 top-6 z-50 block w-80 rounded-xl p-4 text-left normal-case tracking-normal shadow-2xl"
          style={{
            background: "rgba(10,14,26,0.98)",
            border: "1px solid rgba(0,212,255,0.35)",
            color: "var(--text-secondary)",
            boxShadow: "0 18px 48px rgba(0,0,0,0.45), 0 0 24px rgba(0,212,255,0.12)",
          }}
        >
          <span className="mb-2 flex items-start justify-between gap-3">
            <span>
              <span className="block text-sm font-bold text-white">{definition.label}</span>
              <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(0,212,255,0.1)", color: "var(--accent-cyan)" }}>
                {definition.category} · {definition.valueType}
              </span>
            </span>
            <button
              type="button"
              aria-label="Close explanation"
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
              }}
              className="rounded-md p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </span>
          <span className="block text-xs leading-relaxed">{definition.shortDescription}</span>
          <span className="mt-3 block text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
            Why it matters
          </span>
          <span className="mt-1 block text-xs leading-relaxed">{definition.whyItMatters}</span>
          {definition.example ? (
            <span className="mt-3 block rounded-lg px-3 py-2 text-[11px] leading-relaxed" style={{ background: "rgba(255,255,255,0.04)", color: "#CBD5E1" }}>
              Example: {definition.example}
            </span>
          ) : null}

          {term ? (
            <span className="mt-4 block rounded-xl px-3 py-3" style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.18)" }}>
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--accent-cyan)" }}>
                Glossary context
              </span>
              <span className="mt-2 block text-sm font-bold text-white">{term.term}</span>
              <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)" }}>
                {GLOSSARY_CATEGORY_LABELS[term.category]}
              </span>
              <span className="mt-2 block text-xs leading-relaxed">{term.shortDefinition}</span>
              <span className="mt-2 block text-xs leading-relaxed">
                <span className="font-semibold text-white">Nexus context:</span> {term.nexusContext}
              </span>
              {term.riskNote ? (
                <span className="mt-2 block text-xs leading-relaxed">
                  <span className="font-semibold text-white">Risk note:</span> {term.riskNote}
                </span>
              ) : null}
              <Link
                href={`/glossary#${term.slug}`}
                className="mt-3 inline-flex text-xs font-bold"
                style={{ color: "var(--accent-cyan)" }}
                onMouseDown={(event) => event.preventDefault()}
              >
                Open glossary →
              </Link>
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
