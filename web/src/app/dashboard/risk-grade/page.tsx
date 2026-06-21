"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  FileSearch,
  GitBranch,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { RiskHeatmap } from "@/components/charts/RiskHeatmap";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { useAssetSummaries } from "@/hooks/use-asset-summaries";
import {
  categoryDisplayLabel,
  filterAssetsByHeatmapCell,
  type HeatmapFilter,
} from "@/lib/risk-heatmap";
import type { AssetSummary } from "@/lib/shared";

const METHODOLOGY_DIMENSIONS = [
  "Source Quality",
  "Legal Clarity",
  "Reserve Proof",
  "Liquidity Access",
  "Compliance",
  "Market Depth",
] as const;

const UPGRADE_PATHS = [
  {
    title: "Research → Analytic",
    description:
      "Complete core identity, blockchain, reserve/compliance context, and market evidence so the asset can be compared with caveats.",
    items: ["Source coverage", "Layer completeness", "Risk factors", "Market data"],
  },
  {
    title: "Analytic → Institutional",
    description:
      "Strengthen legal structure, reserve transparency, compliance framework, and liquidity terms until blockers are cleared.",
    items: ["Legal clarity", "Reserve evidence", "Compliance proof", "Liquidity terms"],
  },
] as const;

type GradeBand = "Institutional" | "Analytic" | "Research" | "Unavailable";
type EvidenceQuality = "Strong" | "Medium" | "Partial" | "Unavailable";
type BlockerSummary = { label: string; count: number };

function toBadgeLevel(level: string): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  const u = level.toUpperCase();
  if (u === "LOW" || u === "MEDIUM" || u === "HIGH" || u === "CRITICAL") return u;
  return "MEDIUM";
}

function gradeScore(asset: AssetSummary): number | null {
  return asset.grade?.score != null && Number.isFinite(asset.grade.score)
    ? asset.grade.score
    : null;
}

function gradeLabelFromScore(score: number): GradeBand {
  if (score >= 85) return "Institutional";
  if (score >= 70) return "Analytic";
  return "Research";
}

function gradeLabel(asset: AssetSummary): GradeBand {
  const raw = asset.grade?.grade?.toLowerCase();
  if (raw === "institutional") return "Institutional";
  if (raw === "analytics" || raw === "analytic") return "Analytic";
  if (raw === "research") return "Research";
  const score = gradeScore(asset);
  return score == null ? "Unavailable" : gradeLabelFromScore(score);
}

function gradeTone(grade: GradeBand): string {
  if (grade === "Institutional") return "border-[#00FF88]/45 bg-[#00FF88]/15 text-[#74FFB8] shadow-[0_0_18px_rgba(0,255,136,0.12)]";
  if (grade === "Analytic") return "border-[#FFB800]/45 bg-[#FFB800]/15 text-[#FFD36A] shadow-[0_0_18px_rgba(255,184,0,0.1)]";
  if (grade === "Unavailable") return "border-white/10 bg-white/[0.04] text-[var(--text-label)]";
  return "border-[#FF4444]/45 bg-[#FF4444]/15 text-[#FFA0A0] shadow-[0_0_18px_rgba(255,68,68,0.12)]";
}

function evidenceQuality(asset: AssetSummary): EvidenceQuality {
  if (asset.grade) {
    const strong = asset.grade.completenessScore >= 90 && asset.grade.sourceScore >= 90 && asset.grade.blockers.length === 0;
    if (strong) return "Strong";
    const medium = asset.grade.completenessScore >= 65 && asset.grade.sourceScore >= 65 && asset.grade.blockers.length <= 2;
    if (medium) return "Medium";
    return "Partial";
  }

  return "Unavailable";
}

function evidenceTone(quality: EvidenceQuality): string {
  if (quality === "Strong") return "border-[#00FF88]/35 bg-[#00FF88]/15 text-[#74FFB8]";
  if (quality === "Medium") return "border-[#FFB800]/35 bg-[#FFB800]/15 text-[#FFD36A]";
  if (quality === "Unavailable") return "border-white/10 bg-white/[0.04] text-[var(--text-label)]";
  return "border-white/10 bg-white/[0.04] text-[var(--text-label)]";
}

function assetBlockers(asset: AssetSummary): string[] {
  const explicit = asset.grade?.blockers ?? [];
  if (explicit.length > 0) return explicit;
  return [];
}

function assetWarnings(asset: AssetSummary): string[] {
  return asset.grade?.warnings ?? [];
}

function keyBlocker(asset: AssetSummary): string {
  const blockers = assetBlockers(asset);
  if (blockers[0] && blockers[0] !== "No major blocker") return blockers[0];
  const warning = assetWarnings(asset)[0];
  return warning ? `Warning: ${warning}` : "—";
}

function buildBlockerSummary(assets: AssetSummary[]): BlockerSummary[] {
  const counts = new Map<string, number>();
  for (const asset of assets) {
    const blockers = assetBlockers(asset).filter((b) => b !== "No major blocker");
    const warnings = assetWarnings(asset).map((warning) => `Warning: ${warning}`);
    for (const label of [...blockers, ...warnings]) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function openBlockerCount(assets: AssetSummary[]): number {
  return assets.reduce((sum, asset) => {
    return sum + (asset.grade?.blockers?.length ?? 0);
  }, 0);
}

export default function RiskGradePage() {
  const { data: assets = [], isLoading, isError, error, refetch } = useAssetSummaries();
  const [cellFilter, setCellFilter] = useState<HeatmapFilter>(null);

  const filteredAssets = useMemo(() => filterAssetsByHeatmapCell(assets, cellFilter), [assets, cellFilter]);

  const gradeCounts = useMemo(() => {
    const counts = { institutional: 0, analytic: 0, research: 0 };
    for (const asset of assets) {
      const label = gradeLabel(asset);
      if (label === "Institutional") counts.institutional += 1;
      else if (label === "Analytic") counts.analytic += 1;
      else if (label === "Research") counts.research += 1;
    }
    return counts;
  }, [assets]);

  const avgGradeScore = useMemo(() => {
    const scores = assets.map(gradeScore).filter((score): score is number => score != null);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [assets]);

  const blockerSummary = useMemo(() => buildBlockerSummary(assets), [assets]);
  const openBlockers = useMemo(() => openBlockerCount(assets), [assets]);
  const sortedAssets = useMemo(() => [...filteredAssets].sort((a, b) => (gradeScore(b) ?? -1) - (gradeScore(a) ?? -1)), [filteredAssets]);

  const filterLabel = cellFilter != null ? `${categoryDisplayLabel(cellFilter.category)} · ${cellFilter.riskLevel}` : null;

  return (
    <div className="relative isolate space-y-8 overflow-hidden pb-10">
      <div className="pointer-events-none absolute inset-x-[-18%] top-[-180px] -z-10 h-[520px] bg-[radial-gradient(circle_at_28%_22%,rgba(0,209,255,0.18),transparent_34%),radial-gradient(circle_at_72%_18%,rgba(185,131,255,0.13),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(255,184,0,0.08),transparent_36%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-[-12%] top-[760px] -z-10 h-[420px] bg-[radial-gradient(circle_at_18%_20%,rgba(0,255,136,0.09),transparent_30%),radial-gradient(circle_at_88%_60%,rgba(255,68,68,0.08),transparent_32%)] blur-3xl" />

      <header className="relative flex flex-col gap-3 border-b border-[#00D1FF]/15 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5 text-[#8DEBFF]">Risk & grade workspace</p>
          <h1 className="bg-gradient-to-r from-white via-[#DDF9FF] to-[#8DEBFF] bg-clip-text text-2xl font-semibold leading-tight tracking-tight text-transparent">
            RWA Grade Intelligence
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--text-secondary)]">
            Evaluate institutional readiness, risk exposure, blockers, warnings, and evidence quality across tokenized real-world assets.
          </p>
        </div>
        <Link
          href="/dashboard/layers"
          className="inline-flex items-center gap-2 rounded-lg border border-[#00D1FF]/20 bg-[#00D1FF]/[0.04] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-cyan)] hover:bg-[#00D1FF]/10 hover:text-white hover:shadow-[0_0_24px_rgba(0,209,255,0.16)]"
        >
          <GitBranch className="size-3.5" />
          View 12-layer model
        </Link>
      </header>

      <section className="relative overflow-hidden rounded-xl border border-[#B983FF]/20 bg-[linear-gradient(135deg,rgba(8,13,25,0.96),rgba(11,20,38,0.88))] p-4 shadow-[0_0_40px_rgba(0,209,255,0.06)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_100%_0%,rgba(185,131,255,0.16),transparent_45%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#00D1FF]/40 bg-[#00D1FF]/15 px-2.5 py-1 text-xs font-medium text-[#8DEBFF] shadow-[0_0_18px_rgba(0,209,255,0.12)]">
                AssetGrade baseline active
              </span>
              <span className="rounded-full border border-[#00FF88]/40 bg-[#00FF88]/15 px-2.5 py-1 text-xs font-medium text-[#74FFB8] shadow-[0_0_18px_rgba(0,255,136,0.14)]">
                Risk ≠ grade separated
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
              This workspace reads grade score, blockers, warnings, and evidence status from AssetGrade output, while risk level remains dedicated to exposure mapping.
            </p>
          </div>
          <Link
            href="/dashboard/sources"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#B983FF]/40 bg-[#B983FF]/15 px-4 py-2 text-sm font-medium text-[#E6D0FF] shadow-[0_0_24px_rgba(185,131,255,0.12)] transition hover:bg-[#B983FF]/25 hover:shadow-[0_0_34px_rgba(185,131,255,0.2)]"
          >
            Open Sources
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <GradeMetricCard icon={<Award className="size-5 text-[#74FFB8]" />} label="Institutional" value={isLoading ? "—" : String(gradeCounts.institutional)} helper="Score 85+ • production-grade" variant="green" />
        <GradeMetricCard icon={<ShieldCheck className="size-5 text-[#FFD36A]" />} label="Analytic" value={isLoading ? "—" : String(gradeCounts.analytic)} helper="Score 70–84 • usable with caveats" variant="amber" />
        <GradeMetricCard icon={<TriangleAlert className="size-5 text-[#FFA0A0]" />} label="Research" value={isLoading ? "—" : String(gradeCounts.research)} helper="Needs more evidence" variant="red" />
        <GradeMetricCard icon={<Scale className="size-5 text-[#8DEBFF]" />} label="Avg grade score" value={isLoading ? "—" : avgGradeScore == null ? "—" : `${avgGradeScore}/100`} helper="From AssetGrade baseline" />
        <GradeMetricCard icon={<ShieldAlert className="size-5 text-[#E6D0FF]" />} label="Open blockers" value={isLoading ? "—" : String(openBlockers)} helper="From grade blockers" variant="purple" />
      </section>

      <section className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_38px_rgba(0,209,255,0.06)]">
        <div className="pointer-events-none absolute right-[-120px] top-[-140px] h-72 w-72 rounded-full bg-[#00D1FF]/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="terminal-label text-[#8DEBFF]">Grade methodology</p>
            <h2 className="mt-1 text-base font-semibold text-white">Evidence-weighted institutional readiness</h2>
            <p className="mt-1 max-w-3xl text-sm text-[var(--text-secondary)]">
              Nexus RWA grade combines source quality, legal clarity, reserve transparency, liquidity access, compliance evidence, market depth, and risk exposure.
            </p>
          </div>
          <span className="terminal-label rounded border border-[#00D1FF]/20 bg-[#00D1FF]/[0.06] px-2 py-1 text-[#8DEBFF]">
            12-layer scoring model
          </span>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2">
          {METHODOLOGY_DIMENSIONS.map((dimension) => (
            <span key={dimension} className="rounded border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
              {dimension}
            </span>
          ))}
        </div>
      </section>

      <RiskHeatmap assets={assets} isLoading={isLoading} error={isError ? (error instanceof Error ? error.message : "Failed to load") : null} onRetry={() => void refetch()} selected={cellFilter} onSelectCell={setCellFilter} />

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_38px_rgba(0,209,255,0.06)]">
          <div className="pointer-events-none absolute bottom-[-160px] left-[-120px] h-72 w-72 rounded-full bg-[#00FF88]/8 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-[#00D1FF]/15 pb-4">
            <div>
              <p className="terminal-label text-[#8DEBFF]">Grade decision table</p>
              <h2 className="mt-1 text-base font-semibold text-white">{cellFilter ? "Filtered grading decisions" : "All tracked assets"}</h2>
              {filterLabel ? (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Showing {sortedAssets.length} in <span className="font-medium text-white">{filterLabel}</span></p>
              ) : (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{sortedAssets.length} listings sorted by available grade score</p>
              )}
            </div>
            {cellFilter ? (
              <button type="button" onClick={() => setCellFilter(null)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#00D1FF]/20 bg-[#00D1FF]/[0.04] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-cyan)] hover:text-white">
                <X className="size-3.5" />
                Clear filter
              </button>
            ) : null}
          </div>

          <div className="relative mt-4 overflow-x-auto rounded-xl border border-[#00D1FF]/15 bg-[#050A14]/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="border-b border-[#00D1FF]/15 bg-[#00D1FF]/[0.035] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Grade</th>
                  <th className="px-4 py-3 text-right font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Key blocker</th>
                  <th className="px-4 py-3 font-medium">Evidence</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-[rgba(30,42,58,0.55)]"><td className="px-4 py-3" colSpan={8}><div className="h-4 w-full max-w-md animate-pulse rounded bg-[rgba(30,42,58,0.7)]" /></td></tr>
                    ))
                  : sortedAssets.length === 0
                    ? <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">No assets in this matrix cell.</td></tr>
                    : sortedAssets.map((row) => <GradeDecisionRow key={row.id} row={row} />)}
              </tbody>
            </table>
          </div>
        </section>

        <section className="terminal-panel relative overflow-hidden border-[#B983FF]/15 p-5 shadow-[0_0_38px_rgba(185,131,255,0.06)]">
          <div className="pointer-events-none absolute right-[-120px] top-[-140px] h-72 w-72 rounded-full bg-[#B983FF]/10 blur-3xl" />
          <div className="relative flex items-center gap-2">
            <FileSearch className="size-5 text-[#E6D0FF]" />
            <div>
              <p className="terminal-label text-[#E6D0FF]">Blockers & warnings</p>
              <h2 className="text-base font-semibold text-white">Top evidence gaps</h2>
            </div>
          </div>
          <div className="relative mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-11 animate-pulse rounded bg-[rgba(30,42,58,0.55)]" />)
            ) : blockerSummary.length === 0 ? (
              <div className="rounded-lg border border-[#00FF88]/20 bg-[#00FF88]/[0.06] p-4"><p className="text-sm font-medium text-[#74FFB8]">No major blocker detected in the current grade dataset.</p></div>
            ) : (
              blockerSummary.map((blocker) => (
                <div key={blocker.label} className="flex items-center justify-between gap-3 rounded-lg border border-[#B983FF]/15 bg-[#050A14]/55 px-3 py-2.5 transition hover:bg-[#B983FF]/[0.05]">
                  <span className="text-sm text-[var(--text-secondary)]">{blocker.label}</span>
                  <span className="rounded border border-[#FFB800]/35 bg-[#FFB800]/15 px-2 py-1 font-mono text-xs text-[#FFD36A]">{blocker.count}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="terminal-panel relative overflow-hidden border-[#00D1FF]/15 p-5 shadow-[0_0_38px_rgba(0,209,255,0.06)]">
        <div className="flex items-center gap-2">
          <GitBranch className="size-5 text-[#8DEBFF]" />
          <div>
            <p className="terminal-label text-[#8DEBFF]">Upgrade path</p>
            <h2 className="text-base font-semibold text-white">How assets move up the grade ladder</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {UPGRADE_PATHS.map((path) => (
            <div key={path.title} className="rounded-xl border border-[#00D1FF]/15 bg-[#050A14]/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <h3 className="font-semibold text-white">{path.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{path.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {path.items.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-[var(--text-label)]">
                    <CheckCircle2 className="size-3 text-[#74FFB8]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="data-surface rounded-lg border border-[#00D1FF]/15 bg-[linear-gradient(145deg,rgba(0,209,255,0.08),rgba(255,255,255,0.025))] p-5 shadow-[0_0_28px_rgba(0,209,255,0.06)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="terminal-label text-[#8DEBFF]">API</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Public matrix uses <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[#8DEBFF]">GET /v1/assets</code>.
              Pro factor breakdown and grade context use <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[#8DEBFF]">GET /v1/assets/:slug/risk</code>.
            </p>
          </div>
          <Link href="/dashboard/layers" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#B983FF]/40 bg-[#B983FF]/15 px-4 py-2 text-sm font-medium text-[#E6D0FF] shadow-[0_0_24px_rgba(185,131,255,0.12)] transition hover:bg-[#B983FF]/25 hover:shadow-[0_0_34px_rgba(185,131,255,0.2)]">
            Open Layer Model
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function GradeMetricCard({ icon, label, value, helper, variant = "cyan" }: { icon: ReactNode; label: string; value: string; helper: string; variant?: "cyan" | "green" | "amber" | "purple" | "red" }) {
  const styles = {
    cyan: "border-[#00D1FF]/20 bg-[linear-gradient(145deg,rgba(0,209,255,0.08),rgba(255,255,255,0.025))] shadow-[0_0_28px_rgba(0,209,255,0.06)]",
    green: "border-[#00FF88]/20 bg-[linear-gradient(145deg,rgba(0,255,136,0.08),rgba(255,255,255,0.025))] shadow-[0_0_28px_rgba(0,255,136,0.06)]",
    amber: "border-[#FFB800]/20 bg-[linear-gradient(145deg,rgba(255,184,0,0.08),rgba(255,255,255,0.025))] shadow-[0_0_28px_rgba(255,184,0,0.06)]",
    purple: "border-[#B983FF]/20 bg-[linear-gradient(145deg,rgba(185,131,255,0.09),rgba(255,184,0,0.035))] shadow-[0_0_28px_rgba(185,131,255,0.06)]",
    red: "border-[#FF4444]/20 bg-[linear-gradient(145deg,rgba(255,68,68,0.08),rgba(255,255,255,0.025))] shadow-[0_0_28px_rgba(255,68,68,0.06)]",
  } as const;
  return (
    <div className={`data-surface p-5 ${styles[variant]}`}>
      {icon}
      <p className="terminal-label mt-4 text-[#8DEBFF]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{helper}</p>
    </div>
  );
}

function GradeDecisionRow({ row }: { row: AssetSummary }) {
  const score = gradeScore(row);
  const grade = gradeLabel(row);
  const evidence = evidenceQuality(row);
  const blocker = keyBlocker(row);
  return (
    <tr className="border-b border-[rgba(30,42,58,0.55)] transition hover:bg-[#00D1FF]/[0.045] hover:shadow-[inset_3px_0_0_rgba(0,209,255,0.45)] last:border-0">
      <td className="px-4 py-3"><p className="font-medium text-white">{row.name}</p><p className="text-xs text-[var(--text-secondary)]">{row.symbol}</p></td>
      <td className="px-4 py-3 text-[var(--text-secondary)]">{row.category ? categoryDisplayLabel(row.category) : "—"}</td>
      <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${gradeTone(grade)}`}>{grade}</span></td>
      <td className="px-4 py-3 text-right font-mono tabular-nums text-white">{score ?? "—"}</td>
      <td className="px-4 py-3"><RiskBadge level={toBadgeLevel(String(row.riskScore))} showDot /></td>
      <td className="max-w-[260px] px-4 py-3 text-[var(--text-secondary)]"><span className="line-clamp-2">{blocker}</span></td>
      <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${evidenceTone(evidence)}`}>{evidence}</span></td>
      <td className="px-4 py-3 text-right"><Link href={`/dashboard/assets/${row.id}`} className="terminal-label text-[#8DEBFF] transition hover:text-white hover:underline">Detail</Link></td>
    </tr>
  );
}
