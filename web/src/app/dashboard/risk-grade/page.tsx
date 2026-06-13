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
import type { AssetSummary, RiskLevel } from "@/lib/shared";

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

type GradeBand = "Institutional" | "Analytic" | "Research";
type EvidenceQuality = "Strong" | "Medium" | "Partial";

type BlockerSummary = {
  label: string;
  count: number;
};

function toBadgeLevel(
  level: string,
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  const u = level.toUpperCase();
  if (u === "LOW" || u === "MEDIUM" || u === "HIGH" || u === "CRITICAL") {
    return u;
  }
  return "MEDIUM";
}

function riskToBaseScore(level: RiskLevel): number {
  if (level === "LOW") return 88;
  if (level === "MEDIUM") return 76;
  if (level === "HIGH") return 62;
  return 48;
}

function hasUsefulNumber(value: number | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isFresh(asset: AssetSummary): boolean {
  const updatedAt = new Date(asset._meta?.lastUpdated ?? "").getTime();
  if (!Number.isFinite(updatedAt)) return false;
  return (Date.now() - updatedAt) / 86_400_000 <= 30;
}

function fallbackGradeScore(asset: AssetSummary): number {
  let score = riskToBaseScore(toBadgeLevel(String(asset.riskScore)));

  if (asset._meta?.sources?.length) score += 3;
  if (asset._meta?.confidence === "HIGH") score += 3;
  if (hasUsefulNumber(asset.tvl)) score += 2;
  if (hasUsefulNumber(asset.holderCount)) score += 2;
  if (Number.isFinite(asset.yieldRate)) score += 1;
  if (isFresh(asset)) score += 1;

  if (!asset._meta?.sources?.length) score -= 5;
  if (!hasUsefulNumber(asset.tvl)) score -= 4;
  if (!hasUsefulNumber(asset.holderCount)) score -= 3;
  if (!isFresh(asset)) score -= 2;

  return Math.max(35, Math.min(95, Math.round(score)));
}

function gradeScore(asset: AssetSummary): number {
  return asset.grade?.score != null && Number.isFinite(asset.grade.score)
    ? asset.grade.score
    : fallbackGradeScore(asset);
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
  return gradeLabelFromScore(gradeScore(asset));
}

function gradeTone(grade: GradeBand): string {
  if (grade === "Institutional") {
    return "border-[rgba(0,255,136,0.25)] bg-[rgba(0,255,136,0.08)] text-[var(--data-positive)]";
  }
  if (grade === "Analytic") {
    return "border-[var(--accent-amber)]/25 bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]";
  }
  return "border-[rgba(255,107,107,0.25)] bg-[rgba(255,107,107,0.08)] text-[#FF6B6B]";
}

function evidenceQuality(asset: AssetSummary): EvidenceQuality {
  if (asset.grade) {
    const strong =
      asset.grade.completenessScore >= 90 &&
      asset.grade.sourceScore >= 90 &&
      asset.grade.blockers.length === 0;
    if (strong) return "Strong";

    const medium =
      asset.grade.completenessScore >= 65 &&
      asset.grade.sourceScore >= 65 &&
      asset.grade.blockers.length <= 2;
    if (medium) return "Medium";

    return "Partial";
  }

  const evidencePoints = [
    asset._meta?.sources?.length ? 1 : 0,
    asset._meta?.confidence === "HIGH" ? 1 : 0,
    hasUsefulNumber(asset.tvl) ? 1 : 0,
    hasUsefulNumber(asset.holderCount) ? 1 : 0,
    isFresh(asset) ? 1 : 0,
  ].reduce((sum, n) => sum + n, 0);

  if (evidencePoints >= 4) return "Strong";
  if (evidencePoints >= 2) return "Medium";
  return "Partial";
}

function evidenceTone(quality: EvidenceQuality): string {
  if (quality === "Strong") {
    return "border-[rgba(0,255,136,0.25)] bg-[rgba(0,255,136,0.08)] text-[var(--data-positive)]";
  }
  if (quality === "Medium") {
    return "border-[var(--accent-amber)]/25 bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]";
  }
  return "border-[var(--border-panel)] bg-[var(--bg-panel)] text-[var(--text-label)]";
}

function fallbackBlockers(asset: AssetSummary): string[] {
  const blockers: string[] = [];
  const risk = toBadgeLevel(String(asset.riskScore));

  if (risk === "HIGH" || risk === "CRITICAL") blockers.push("High risk exposure");
  if (!asset._meta?.sources?.length) blockers.push("Source gap");
  if (!hasUsefulNumber(asset.tvl)) blockers.push("Market depth missing");
  if (!hasUsefulNumber(asset.holderCount)) blockers.push("Holder data missing");
  if (!isFresh(asset)) blockers.push("Stale evidence");

  return blockers;
}

function assetBlockers(asset: AssetSummary): string[] {
  const explicit = asset.grade?.blockers ?? [];
  if (explicit.length > 0) return explicit;

  const fallback = fallbackBlockers(asset);
  return fallback.length ? fallback : ["No major blocker"];
}

function assetWarnings(asset: AssetSummary): string[] {
  return asset.grade?.warnings ?? [];
}

function keyBlocker(asset: AssetSummary): string {
  const blockers = assetBlockers(asset);
  if (blockers[0] && blockers[0] !== "No major blocker") return blockers[0];
  const warning = assetWarnings(asset)[0];
  return warning ? `Warning: ${warning}` : "No major blocker";
}

function buildBlockerSummary(assets: AssetSummary[]): BlockerSummary[] {
  const counts = new Map<string, number>();

  for (const asset of assets) {
    const blockers = assetBlockers(asset).filter((b) => b !== "No major blocker");
    const warnings = assetWarnings(asset).map((warning) => `Warning: ${warning}`);
    for (const label of [...blockers, ...warnings]) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function openBlockerCount(assets: AssetSummary[]): number {
  return assets.reduce((sum, asset) => {
    const blockers = asset.grade?.blockers;
    if (blockers) return sum + blockers.length;
    return sum + fallbackBlockers(asset).length;
  }, 0);
}

export default function RiskGradePage() {
  const { data: assets = [], isLoading, isError, error, refetch } =
    useAssetSummaries();
  const [cellFilter, setCellFilter] = useState<HeatmapFilter>(null);

  const filteredAssets = useMemo(
    () => filterAssetsByHeatmapCell(assets, cellFilter),
    [assets, cellFilter],
  );

  const gradeCounts = useMemo(() => {
    const counts = { institutional: 0, analytic: 0, research: 0 };
    for (const asset of assets) {
      const label = gradeLabel(asset);
      if (label === "Institutional") counts.institutional += 1;
      else if (label === "Analytic") counts.analytic += 1;
      else counts.research += 1;
    }
    return counts;
  }, [assets]);

  const avgGradeScore = useMemo(() => {
    if (assets.length === 0) return 0;
    return Math.round(
      assets.reduce((sum, asset) => sum + gradeScore(asset), 0) / assets.length,
    );
  }, [assets]);

  const blockerSummary = useMemo(() => buildBlockerSummary(assets), [assets]);
  const openBlockers = useMemo(() => openBlockerCount(assets), [assets]);

  const sortedAssets = useMemo(
    () => [...filteredAssets].sort((a, b) => gradeScore(b) - gradeScore(a)),
    [filteredAssets],
  );

  const filterLabel =
    cellFilter != null
      ? `${categoryDisplayLabel(cellFilter.category)} · ${cellFilter.riskLevel}`
      : null;

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-3 border-b border-[var(--border-line)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="terminal-label mb-1.5">Risk & grade workspace</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            RWA Grade Intelligence
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--text-secondary)]">
            Evaluate institutional readiness, risk exposure, blockers, warnings,
            and evidence quality across tokenized real-world assets.
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <GradeMetricCard
          icon={<Award className="size-5 text-[var(--accent-amber)]" />}
          label="Institutional"
          value={isLoading ? "—" : String(gradeCounts.institutional)}
          helper="Score 85+ • production-grade"
        />
        <GradeMetricCard
          icon={<ShieldCheck className="size-5 text-[var(--accent-amber)]" />}
          label="Analytic"
          value={isLoading ? "—" : String(gradeCounts.analytic)}
          helper="Score 70–84 • usable with caveats"
        />
        <GradeMetricCard
          icon={<TriangleAlert className="size-5 text-[var(--accent-amber)]" />}
          label="Research"
          value={isLoading ? "—" : String(gradeCounts.research)}
          helper="Needs more evidence"
        />
        <GradeMetricCard
          icon={<Scale className="size-5 text-[var(--accent-amber)]" />}
          label="Avg grade score"
          value={isLoading ? "—" : `${avgGradeScore}/100`}
          helper="From AssetGrade baseline"
        />
        <GradeMetricCard
          icon={<ShieldAlert className="size-5 text-[var(--accent-amber)]" />}
          label="Open blockers"
          value={isLoading ? "—" : String(openBlockers)}
          helper="From grade blockers"
        />
      </section>

      <section className="terminal-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="terminal-label">Grade methodology</p>
            <h2 className="mt-1 text-base font-semibold text-white">
              Evidence-weighted institutional readiness
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-[var(--text-secondary)]">
              Nexus RWA grade combines source quality, legal clarity, reserve transparency,
              liquidity access, compliance evidence, market depth, and risk exposure.
            </p>
          </div>
          <span className="terminal-label rounded border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2 py-1">
            12-layer scoring model
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {METHODOLOGY_DIMENSIONS.map((dimension) => (
            <span
              key={dimension}
              className="rounded border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-[var(--text-secondary)]"
            >
              {dimension}
            </span>
          ))}
        </div>
      </section>

      <RiskHeatmap
        assets={assets}
        isLoading={isLoading}
        error={isError ? (error instanceof Error ? error.message : "Failed to load") : null}
        onRetry={() => void refetch()}
        selected={cellFilter}
        onSelectCell={setCellFilter}
      />

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="terminal-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-panel)] px-5 py-4">
            <div>
              <p className="terminal-label">Grade decision table</p>
              <h2 className="mt-1 text-base font-semibold text-white">
                {cellFilter ? "Filtered grading decisions" : "All tracked assets"}
              </h2>
              {filterLabel ? (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Showing {sortedAssets.length} in{" "}
                  <span className="font-medium text-white">{filterLabel}</span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {sortedAssets.length} listings sorted by grade score
                </p>
              )}
            </div>
            {cellFilter ? (
              <button
                type="button"
                onClick={() => setCellFilter(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-panel)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-amber)]/40 hover:text-white"
              >
                <X className="size-3.5" />
                Clear filter
              </button>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-line)]">
                  <th className="terminal-label px-5 py-2.5">Asset</th>
                  <th className="terminal-label px-4 py-2.5">Category</th>
                  <th className="terminal-label px-4 py-2.5">Grade</th>
                  <th className="terminal-label px-4 py-2.5 text-right">Score</th>
                  <th className="terminal-label px-4 py-2.5">Risk</th>
                  <th className="terminal-label px-4 py-2.5">Key blocker</th>
                  <th className="terminal-label px-4 py-2.5">Evidence</th>
                  <th className="terminal-label px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-[var(--border-line)]">
                        <td className="px-5 py-3" colSpan={8}>
                          <div className="h-4 w-full max-w-md animate-pulse rounded bg-[rgba(30,42,58,0.7)]" />
                        </td>
                      </tr>
                    ))
                  : sortedAssets.length === 0
                    ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-5 py-10 text-center text-sm text-[var(--text-secondary)]"
                        >
                          No assets in this matrix cell.
                        </td>
                      </tr>
                    )
                    : sortedAssets.map((row: AssetSummary) => (
                        <GradeDecisionRow key={row.id} row={row} />
                      ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="terminal-panel p-5">
          <div className="flex items-center gap-2">
            <FileSearch className="size-5 text-[var(--accent-amber)]" />
            <div>
              <p className="terminal-label">Blockers & warnings</p>
              <h2 className="text-base font-semibold text-white">Top evidence gaps</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-11 animate-pulse rounded bg-[rgba(30,42,58,0.55)]"
                />
              ))
            ) : blockerSummary.length === 0 ? (
              <div className="rounded-lg border border-[rgba(0,255,136,0.2)] bg-[rgba(0,255,136,0.06)] p-4">
                <p className="text-sm font-medium text-[var(--data-positive)]">
                  No major blocker detected in the current grade dataset.
                </p>
              </div>
            ) : (
              blockerSummary.map((blocker) => (
                <div
                  key={blocker.label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-2.5"
                >
                  <span className="text-sm text-[var(--text-secondary)]">
                    {blocker.label}
                  </span>
                  <span className="rounded border border-[var(--accent-amber)]/25 bg-[var(--accent-amber-dim)] px-2 py-1 font-mono text-xs text-[var(--accent-amber)]">
                    {blocker.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="terminal-panel p-5">
        <div className="flex items-center gap-2">
          <GitBranch className="size-5 text-[var(--accent-amber)]" />
          <div>
            <p className="terminal-label">Upgrade path</p>
            <h2 className="text-base font-semibold text-white">
              How assets move up the grade ladder
            </h2>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {UPGRADE_PATHS.map((path) => (
            <div
              key={path.title}
              className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-4"
            >
              <h3 className="font-semibold text-white">{path.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {path.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {path.items.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded border border-[var(--border-panel)] px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-[var(--text-label)]"
                  >
                    <CheckCircle2 className="size-3" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="data-surface rounded-lg border border-[var(--border-panel)] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="terminal-label">API</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Public matrix uses <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[var(--accent-amber)]">GET /v1/assets</code>.
              Pro factor breakdown and grade context use <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 font-mono text-xs text-[var(--accent-amber)]">GET /v1/assets/:id/risk</code>.
            </p>
          </div>
          <Link
            href="/dashboard/layers"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--accent-amber)]/35 bg-[var(--accent-amber-dim)] px-4 py-2 text-sm font-medium text-[var(--accent-amber)] transition-colors hover:bg-[var(--accent-amber)]/20"
          >
            Open Layer Model
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function GradeMetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="terminal-panel p-5">
      {icon}
      <p className="terminal-label mt-4">{label}</p>
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
    <tr className="border-b border-[var(--border-line)] last:border-0 hover:bg-[rgba(255,255,255,0.02)]">
      <td className="px-5 py-3">
        <p className="font-medium text-white">{row.name}</p>
        <p className="text-xs text-[var(--text-secondary)]">{row.symbol}</p>
      </td>
      <td className="px-4 py-3 text-[var(--text-secondary)]">
        {row.category ? categoryDisplayLabel(row.category) : "—"}
      </td>
      <td className="px-4 py-3">
        <span className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${gradeTone(grade)}`}>
          {grade}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
        {score}
      </td>
      <td className="px-4 py-3">
        <RiskBadge level={toBadgeLevel(String(row.riskScore))} showDot />
      </td>
      <td className="max-w-[260px] px-4 py-3 text-[var(--text-secondary)]">
        <span className="line-clamp-2">{blocker}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${evidenceTone(evidence)}`}>
          {evidence}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/dashboard/assets/${row.id}`}
          className="terminal-label text-[var(--accent-amber)] hover:underline"
        >
          Detail
        </Link>
      </td>
    </tr>
  );
}
