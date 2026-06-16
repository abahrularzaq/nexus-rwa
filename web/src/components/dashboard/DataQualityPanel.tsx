import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleHelp, Clock3, Database, ShieldQuestion } from "lucide-react";
import type { AssetDataQuality, AssetWithLayers, DataVerificationStatus } from "@/types/asset";

type DataQualityPanelProps = {
  asset: AssetWithLayers;
};

const STALE_AFTER_DAYS = 30;

function latestDate(values: Array<string | null | undefined>): string | null {
  const dates = values
    .map((value) => (value ? new Date(value) : null))
    .filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());
  return dates[0]?.toISOString() ?? null;
}

function daysOld(value?: string | null): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

function statusFrom(asset: AssetWithLayers, lastUpdated: string | null, sourceCount: number): DataVerificationStatus {
  if (!asset.market && !asset.grade && !asset.risk) return "unavailable";
  const age = daysOld(lastUpdated);
  if (age != null && age > STALE_AFTER_DAYS) return "stale";
  if ((asset.market?.confidence ?? "").toUpperCase() === "LOW" || sourceCount <= 1) return "estimated";
  return "verified";
}

export function buildDataQuality(asset: AssetWithLayers): AssetDataQuality {
  if (asset.dataQuality) return asset.dataQuality;
  const sourceCount = Math.max(asset.market?.sources?.length ?? 0, 0);
  const lastUpdated = latestDate([
    asset.market?.lastUpdated,
    asset.grade?.updatedAt,
    asset.grade?.reviewedAt,
    asset.risk?.lastAssessed,
  ]);
  const status = statusFrom(asset, lastUpdated, sourceCount);
  const age = daysOld(lastUpdated);
  return {
    lastUpdated,
    sourceCount,
    confidenceLevel: asset.market?.confidence ?? (sourceCount > 1 ? "MEDIUM" : "LOW"),
    riskGrade: asset.grade?.grade ?? asset.risk?.overallLevel ?? null,
    status,
    stale: status === "stale",
    staleReason: age != null && age > STALE_AFTER_DAYS ? `Last refresh is ${age} days old` : null,
  };
}

function statusClass(status: DataVerificationStatus): string {
  if (status === "verified") return "border-[#00FF88]/35 bg-[#00FF88]/10 text-[#74FFB8]";
  if (status === "stale") return "border-[#FFB800]/40 bg-[#FFB800]/12 text-[#FFD36A]";
  if (status === "estimated") return "border-[#B983FF]/40 bg-[#B983FF]/12 text-[#E6D0FF]";
  return "border-white/15 bg-white/[0.04] text-[#8892A4]";
}

function formatDate(value?: string | null): string {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DataQualityPanel({ asset }: DataQualityPanelProps) {
  const quality = buildDataQuality(asset);
  const tooltip = "Grade score combines completeness, source quality, legal clarity, reserve transparency, liquidity, and risk. Source count comes from AssetSource/market sources; freshness is checked against DataHealthCheck and SourceHealth-style status signals when available.";

  return (
    <section className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-white">Data quality & evidence</h2>
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${statusClass(quality.status)}`}>
              {quality.status === "verified" ? <CheckCircle2 className="size-3.5" /> : quality.status === "stale" ? <AlertTriangle className="size-3.5" /> : <ShieldQuestion className="size-3.5" />}
              {quality.status}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#8892A4]">
            Distinguishes verified, stale, estimated, and unavailable data for the current asset profile.
          </p>
        </div>
        <Link href="/methodology" className="inline-flex items-center gap-2 rounded-lg border border-[#00D1FF]/30 bg-[#00D1FF]/10 px-3 py-2 text-sm font-semibold text-[#8DEBFF] hover:bg-[#00D1FF]/20">
          Methodology
        </Link>
      </div>

      {quality.stale ? (
        <div className="mt-4 rounded-lg border border-[#FFB800]/35 bg-[#FFB800]/10 px-4 py-3 text-sm text-[#FFD36A]">
          Stale warning: {quality.staleReason ?? "data is older than the freshness threshold."}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Last updated", formatDate(quality.lastUpdated), Clock3],
          ["Source count", String(quality.sourceCount), Database],
          ["Confidence", quality.confidenceLevel, CheckCircle2],
          ["Risk grade", quality.riskGrade ?? "Unavailable", AlertTriangle],
        ].map(([label, value, Icon]) => (
          <div key={String(label)} className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.45)] p-3">
            <div className="flex items-center justify-between gap-2 text-[#8892A4]">
              <span className="text-[10px] font-semibold uppercase tracking-wide">{String(label)}</span>
              <Icon className="size-4" />
            </div>
            <p className="mt-1 text-sm font-bold text-white">{String(value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-[rgba(0,212,255,0.22)] bg-[rgba(0,212,255,0.06)] p-3 text-xs leading-relaxed text-[#C9D4E5]" title={tooltip}>
        <span className="inline-flex items-center gap-1 font-semibold text-[#8DEBFF]"><CircleHelp className="size-3.5" /> How score is calculated:</span> {tooltip}
      </div>
    </section>
  );
}
