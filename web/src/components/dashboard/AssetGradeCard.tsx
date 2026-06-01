import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import type { AssetGrade } from "@/types/asset";

type AssetGradeCardProps = {
  grade?: AssetGrade | null;
};

const SCORE_ITEMS = [
  { key: "completenessScore", label: "Completeness" },
  { key: "sourceScore", label: "Source" },
  { key: "legalScore", label: "Legal" },
  { key: "reserveScore", label: "Reserve" },
  { key: "liquidityScore", label: "Liquidity" },
  { key: "riskScore", label: "Risk" },
] as const;

function gradeLabel(value: string): string {
  if (value === "institutional") return "Institutional";
  if (value === "analytics") return "Analytics";
  return "Research";
}

function gradeTone(value: string): string {
  if (value === "institutional") return "border-[rgba(0,255,136,0.35)] bg-[rgba(0,255,136,0.08)] text-[#00FF88]";
  if (value === "analytics") return "border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.08)] text-[#00D4FF]";
  return "border-[rgba(255,184,0,0.35)] bg-[rgba(255,184,0,0.08)] text-[#FFB800]";
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function AssetGradeCard({ grade }: AssetGradeCardProps) {
  if (!grade) {
    return (
      <section className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6">
        <h2 className="text-lg font-bold text-white">Institutional grading</h2>
        <p className="mt-2 text-sm text-[#8892A4]">
          Grade data is not available for this asset yet.
        </p>
      </section>
    );
  }

  const normalizedGrade = grade.grade?.toLowerCase?.() ?? "research";
  const score = clampScore(grade.score);
  const warnings = grade.warnings ?? [];
  const blockers = grade.blockers ?? [];

  return (
    <section className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-white">Institutional grading</h2>
            <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${gradeTone(normalizedGrade)}`}>
              <ShieldCheck className="size-3.5" />
              {gradeLabel(normalizedGrade)} grade
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8892A4]">
            Nexus RWA grading combines data completeness, source quality, legal clarity,
            reserve transparency, liquidity, and risk assessment. Institutional grade
            requires stronger reserve and source evidence with no blockers.
          </p>
        </div>

        <div className="shrink-0 rounded-xl border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.06)] px-5 py-4 text-left lg:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8892A4]">
            Grade score
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-white">
            {score}<span className="text-xl text-[#8892A4]">/100</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {SCORE_ITEMS.map(({ key, label }) => {
          const value = clampScore(grade[key]);
          return (
            <div
              key={key}
              className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.5)] p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8892A4]">
                  {label}
                </span>
                <span className="text-sm font-bold tabular-nums text-white">{value}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgba(30,42,58,0.9)]">
                <div
                  className="h-full rounded-full bg-[#00D4FF]"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[rgba(0,255,136,0.18)] bg-[rgba(0,255,136,0.05)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#00FF88]">
            <CheckCircle2 className="size-4" />
            Blockers
          </div>
          {blockers.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-[#C9D4E5]">
              {blockers.map((item) => (
                <li key={item} className="leading-relaxed">• {item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[#8892A4]">
              No hard blockers detected for the current grade level.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-[rgba(255,184,0,0.22)] bg-[rgba(255,184,0,0.06)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#FFB800]">
            <AlertTriangle className="size-4" />
            Warnings
          </div>
          {warnings.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-[#C9D4E5]">
              {warnings.map((item) => (
                <li key={item} className="leading-relaxed">• {item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[#8892A4]">
              No warnings detected in the current grading snapshot.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
