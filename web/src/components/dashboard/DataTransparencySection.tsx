"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { AssetDataMeta } from "@/lib/shared";
import {
  formatMinutesAgo,
  sourceDisplayName,
  sourceRawUrl,
} from "@/lib/assetDetailUtils";

const confidenceStyles = {
  HIGH: "text-[#00FF88]",
  MEDIUM: "text-[#FFB800]",
  LOW: "text-[#FF8888]",
} as const;

export type DataTransparencySectionProps = {
  meta: AssetDataMeta;
  protocol: string;
  symbol: string;
};

export function DataTransparencySection({
  meta,
  protocol,
  symbol,
}: DataTransparencySectionProps) {
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Data Transparency</h2>
        <p className="mt-1 text-sm text-[#8892A4]">
          Sources, freshness, and how metrics are computed
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.65)]">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[rgba(30,42,58,0.8)] text-[11px] font-semibold uppercase tracking-wide text-[#8892A4]">
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Last updated</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3 text-right">Raw data</th>
            </tr>
          </thead>
          <tbody>
            {meta.sources.map((sourceId) => (
              <tr
                key={sourceId}
                className="border-b border-[rgba(30,42,58,0.5)] last:border-0"
              >
                <td className="px-4 py-3 font-medium text-white">
                  {sourceDisplayName(sourceId)}
                </td>
                <td className="px-4 py-3 text-[#8892A4]">
                  {formatMinutesAgo(meta.lastUpdated)}
                </td>
                <td
                  className={`px-4 py-3 font-semibold ${
                    confidenceStyles[meta.confidence] ?? confidenceStyles.MEDIUM
                  }`}
                >
                  {meta.confidence}
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={sourceRawUrl(sourceId, protocol, symbol)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#00D4FF] hover:underline"
                  >
                    View
                    <ExternalLink className="size-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.65)]">
        <button
          type="button"
          onClick={() => setMethodologyOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
          aria-expanded={methodologyOpen}
        >
          <span className="font-semibold text-white">Methodology</span>
          <ChevronDown
            className={`size-5 shrink-0 text-[#8892A4] transition-transform ${
              methodologyOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {methodologyOpen ? (
          <div className="border-t border-[rgba(30,42,58,0.6)] px-5 pb-5 pt-2">
            <p className="text-sm leading-relaxed text-[#8892A4]">{meta.methodology}</p>
            <p className="mt-3 text-xs text-[#4A5568]">
              TVL and yield are reconciled across listed sources. When only one
              source is available, confidence is capped at MEDIUM. Large TVL gaps
              between DeFi Llama and rwa.xyz trigger a review flag.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
