"use client";

import type { AssetDataMeta, DataConfidence } from "@/lib/shared";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SOURCE_LABELS: Record<string, string> = {
  defillama: "DeFi Llama",
  rwa_xyz: "rwa.xyz",
  onchain: "On-chain",
};

const confidenceStyles: Record<
  DataConfidence,
  { wrap: string; dot: string }
> = {
  HIGH: {
    wrap:
      "border-[rgba(0,255,136,0.35)] bg-[rgba(0,255,136,0.08)] text-[#00FF88]",
    dot: "bg-[#00FF88]",
  },
  MEDIUM: {
    wrap:
      "border-[rgba(255,184,0,0.35)] bg-[rgba(255,184,0,0.08)] text-[#FFB800]",
    dot: "bg-[#FFB800]",
  },
  LOW: {
    wrap:
      "border-[rgba(255,68,68,0.35)] bg-[rgba(255,68,68,0.08)] text-[#FF8888]",
    dot: "bg-[#FF4444]",
  },
};

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "unknown";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sourceLabel(sourceId: string): string {
  return SOURCE_LABELS[sourceId] ?? sourceId;
}

export interface DataSourceBadgeProps {
  meta: AssetDataMeta;
  /** Which source id to show in the badge label (defaults to first in meta.sources). */
  sourceId?: string;
  className?: string;
}

export function DataSourceBadge({
  meta,
  sourceId,
  className = "",
}: DataSourceBadgeProps) {
  const primaryId = sourceId ?? meta.sources[0] ?? "defillama";
  const { wrap, dot } = confidenceStyles[meta.confidence] ?? confidenceStyles.MEDIUM;
  const label = sourceLabel(primaryId);
  const ago = formatRelativeTime(meta.lastUpdated);
  const allSources = meta.sources.map(sourceLabel).join(", ");

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={[
              "inline-flex max-w-full items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-medium leading-tight transition-opacity hover:opacity-90",
              wrap,
              className,
            ].join(" ")}
            aria-label={`Data source: ${label}, updated ${ago}. ${meta.methodology}`}
          >
            <span className={`size-1 shrink-0 rounded-full ${dot}`} aria-hidden />
            <span className="truncate">
              {label} · {ago}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-left text-xs">
          <p className="font-semibold text-white">Data sources</p>
          <p className="mt-1 text-[#8892A4]">{allSources || label}</p>
          <p className="mt-2 font-medium text-white">Confidence: {meta.confidence}</p>
          <p className="mt-1 text-[#8892A4]">{meta.methodology}</p>
          <p className="mt-2 text-[10px] text-[#4A5568]">
            Updated {new Date(meta.lastUpdated).toLocaleString()}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
