"use client";

import { useId, useState } from "react";
import { Info, X } from "lucide-react";
import { FIELD_DEFINITIONS, type FieldKey } from "@/lib/field-definitions";

type FieldInfoProps = {
  fieldKey: FieldKey;
  label?: string;
  className?: string;
};

export function FieldInfo({ fieldKey, label, className = "" }: FieldInfoProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const definition = FIELD_DEFINITIONS[fieldKey];

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
          className="absolute left-0 top-6 z-50 block w-72 rounded-xl p-4 text-left normal-case tracking-normal shadow-2xl"
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
        </span>
      ) : null}
    </span>
  );
}
