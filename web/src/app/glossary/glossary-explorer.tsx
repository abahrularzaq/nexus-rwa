"use client";

import { useMemo, useState } from "react";

import {
  GLOSSARY_CATEGORY_DESCRIPTIONS,
  GLOSSARY_CATEGORY_LABELS,
  GLOSSARY_CATEGORY_ORDER,
  GLOSSARY_TERMS,
  type GlossaryCategory,
  type GlossaryTerm,
} from "@nexus-rwa/shared";

type GroupedGlossaryTerms = Record<GlossaryCategory, GlossaryTerm[]>;

const allCategoriesLabel = "All categories";

function matchesSearch(term: GlossaryTerm, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    term.term,
    term.shortDefinition,
    term.fullDefinition,
    term.nexusContext,
    term.riskNote,
    term.example,
    ...(term.relatedTerms ?? []),
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(normalizedQuery));
}

function groupTerms(terms: GlossaryTerm[]) {
  return GLOSSARY_CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = terms
      .filter((term) => term.category === category)
      .sort((a, b) => a.term.localeCompare(b.term));
    return acc;
  }, {} as GroupedGlossaryTerms);
}

export function GlossaryExplorer() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GlossaryCategory | "all">("all");

  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter((term) => {
      const categoryMatches = selectedCategory === "all" || term.category === selectedCategory;
      return categoryMatches && matchesSearch(term, query);
    });
  }, [query, selectedCategory]);

  const groupedTerms = useMemo(() => groupTerms(filteredTerms), [filteredTerms]);

  return (
    <section className="mt-10">
      <div
        className="rounded-2xl p-4 md:p-5"
        style={{ background: "rgba(15,22,41,0.62)", border: "1px solid var(--border-line)" }}
      >
        <div className="grid gap-3 md:grid-cols-[1fr_260px]">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
              Search terms
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search TVL, reserve, KYC, APY, institutional grade..."
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(10,14,26,0.86)", border: "1px solid var(--border-line)" }}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
              Category
            </span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value as GlossaryCategory | "all")}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(10,14,26,0.86)", border: "1px solid var(--border-line)" }}
            >
              <option value="all">{allCategoriesLabel}</option>
              {GLOSSARY_CATEGORY_ORDER.map((category) => (
                <option key={category} value={category}>
                  {GLOSSARY_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="rounded-full px-3 py-1.5 text-xs font-bold transition"
            style={{
              background: selectedCategory === "all" ? "rgba(0,212,255,0.14)" : "rgba(10,14,26,0.64)",
              color: selectedCategory === "all" ? "var(--accent-cyan)" : "var(--text-secondary)",
              border: selectedCategory === "all" ? "1px solid rgba(0,212,255,0.35)" : "1px solid var(--border-line)",
            }}
          >
            All
          </button>
          {GLOSSARY_CATEGORY_ORDER.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition"
              style={{
                background: selectedCategory === category ? "rgba(0,212,255,0.14)" : "rgba(10,14,26,0.64)",
                color: selectedCategory === category ? "var(--accent-cyan)" : "var(--text-secondary)",
                border: selectedCategory === category ? "1px solid rgba(0,212,255,0.35)" : "1px solid var(--border-line)",
              }}
            >
              {GLOSSARY_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {filteredTerms.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(15,22,41,0.62)", border: "1px solid var(--border-line)" }}
          >
            <h2 className="text-xl font-bold text-white">No glossary term found</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              Try a broader keyword or switch back to all categories.
            </p>
          </div>
        ) : null}

        {GLOSSARY_CATEGORY_ORDER.map((category) => {
          const terms = groupedTerms[category];
          if (!terms.length) return null;

          return (
            <section
              key={category}
              className="rounded-2xl p-5 md:p-6"
              style={{ background: "rgba(15,22,41,0.62)", border: "1px solid var(--border-line)" }}
            >
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{GLOSSARY_CATEGORY_LABELS[category]}</h2>
                  <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--text-secondary)" }}>
                    {GLOSSARY_CATEGORY_DESCRIPTIONS[category]}
                  </p>
                </div>
                <div className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                  {terms.length} terms
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {terms.map((term) => (
                  <article
                    key={term.slug}
                    id={term.slug}
                    className="rounded-xl p-4"
                    style={{ background: "rgba(10,14,26,0.58)", border: "1px solid var(--border-line)" }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-bold text-white">{term.term}</h3>
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: "rgba(0,212,255,0.1)", color: "var(--accent-cyan)", border: "1px solid rgba(0,212,255,0.25)" }}
                      >
                        {GLOSSARY_CATEGORY_LABELS[term.category]}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-medium leading-relaxed text-white">{term.shortDefinition}</p>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {term.fullDefinition}
                    </p>

                    <div className="mt-4 space-y-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      <p>
                        <span className="font-semibold text-white">Nexus context:</span> {term.nexusContext}
                      </p>
                      {term.example ? (
                        <p>
                          <span className="font-semibold text-white">Example:</span> {term.example}
                        </p>
                      ) : null}
                      {term.riskNote ? (
                        <p>
                          <span className="font-semibold text-white">Risk note:</span> {term.riskNote}
                        </p>
                      ) : null}
                    </div>

                    {term.relatedTerms?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {term.relatedTerms.map((relatedTerm) => (
                          <span
                            key={relatedTerm}
                            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                            style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)", border: "1px solid var(--border-line)" }}
                          >
                            {relatedTerm.replaceAll("-", " ")}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
