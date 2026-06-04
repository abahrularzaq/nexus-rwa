"use client";

import { ExternalLink, FileSearch, Lock, ShieldCheck, TriangleAlert } from "lucide-react";

import type { AssetDataMeta } from "@/lib/shared";
import {
  formatMinutesAgo,
  sourceDisplayName,
  sourceRawUrl,
} from "@/lib/assetDetailUtils";
import type { AssetWithLayers } from "@/types/asset";

type EvidenceStatus = "verified" | "partial" | "pro" | "missing";

type EvidenceRow = {
  layer: string;
  field: string;
  value: string;
  source: string;
  tier: "Tier 1" | "Tier 2" | "Tier 3" | "Pro" | "Gap";
  status: EvidenceStatus;
  url?: string | null;
};

function displayValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? value.toLocaleString("en-US") : "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return String(value);
}

function evidenceStatusClass(status: EvidenceStatus): string {
  if (status === "verified") return "text-[#00FF88]";
  if (status === "pro") return "text-[#00D4FF]";
  if (status === "partial") return "text-[#FFB800]";
  return "text-[#FF8888]";
}

function tierClass(tier: EvidenceRow["tier"]): string {
  if (tier === "Tier 1") return "border-[rgba(0,255,136,0.28)] bg-[rgba(0,255,136,0.08)] text-[#00FF88]";
  if (tier === "Tier 2") return "border-[rgba(0,212,255,0.28)] bg-[rgba(0,212,255,0.08)] text-[#00D4FF]";
  if (tier === "Tier 3") return "border-[rgba(255,184,0,0.28)] bg-[rgba(255,184,0,0.08)] text-[#FFB800]";
  if (tier === "Pro") return "border-[rgba(0,212,255,0.28)] bg-[rgba(0,212,255,0.08)] text-[#00D4FF]";
  return "border-[rgba(255,136,136,0.28)] bg-[rgba(255,136,136,0.08)] text-[#FF8888]";
}

function buildEvidenceRows({
  asset,
  meta,
  protocol,
  symbol,
}: {
  asset: AssetWithLayers;
  meta: AssetDataMeta;
  protocol: string;
  symbol: string;
}): EvidenceRow[] {
  const primarySource = meta.sources[0] ?? "nexus";
  const primaryUrl = sourceRawUrl(primarySource, protocol, symbol);
  const websiteUrl = asset.identity?.websiteUrl ?? null;
  const docsUrl = asset.identity?.docsUrl ?? websiteUrl;
  const explorerUrl = asset.blockchain?.find((row) => row.explorerUrl)?.explorerUrl ?? null;

  const rows: EvidenceRow[] = [
    {
      layer: "Identity",
      field: "Official website",
      value: displayValue(asset.identity?.websiteUrl),
      source: websiteUrl ? "Issuer official website" : "Missing official website",
      tier: websiteUrl ? "Tier 1" : "Gap",
      status: websiteUrl ? "verified" : "missing",
      url: websiteUrl,
    },
    {
      layer: "Identity",
      field: "Documentation",
      value: displayValue(asset.identity?.docsUrl),
      source: docsUrl ? "Issuer documentation" : "Missing documentation URL",
      tier: docsUrl ? "Tier 1" : "Gap",
      status: docsUrl ? "verified" : "missing",
      url: docsUrl,
    },
    {
      layer: "Market",
      field: "TVL / holders / market snapshot",
      value: `${displayValue(asset.market?.tvl)} TVL · ${displayValue(asset.market?.holderCount)} holders`,
      source: sourceDisplayName(primarySource),
      tier: "Tier 2",
      status: asset.market ? "verified" : "missing",
      url: primaryUrl,
    },
    {
      layer: "Yield",
      field: "Current yield",
      value: displayValue(asset.yield?.currentYield),
      source: sourceDisplayName(primarySource),
      tier: asset.yield?.currentYield != null ? "Tier 2" : "Gap",
      status: asset.yield?.currentYield != null ? "partial" : "missing",
      url: primaryUrl,
    },
    {
      layer: "Blockchain",
      field: "Verified contract / explorer",
      value: displayValue(asset.blockchain?.[0]?.contractAddress),
      source: explorerUrl ? "Official block explorer" : "Missing explorer URL",
      tier: explorerUrl ? "Tier 2" : "Gap",
      status: explorerUrl ? "verified" : "missing",
      url: explorerUrl,
    },
    {
      layer: "Compliance",
      field: "KYC / access requirements",
      value: asset.compliance
        ? `KYC: ${displayValue(asset.compliance.kycRequired)} · Accredited: ${displayValue(asset.compliance.accreditedOnly)}`
        : "—",
      source: asset.compliance ? "Asset compliance layer" : "Missing compliance layer",
      tier: asset.compliance ? "Pro" : "Gap",
      status: asset.compliance ? "pro" : "missing",
    },
    {
      layer: "Reserve",
      field: "Backing / custodian / audit",
      value: asset.reserve
        ? `${displayValue(asset.reserve.backingType)} · ${displayValue(asset.reserve.custodian)}`
        : "—",
      source: asset.reserve ? "Reserve evidence layer" : "Reserve source required",
      tier: asset.reserve ? "Pro" : "Gap",
      status: asset.reserve ? "pro" : "missing",
      url: asset.reserve?.lastAuditUrl ?? asset.reserve?.custodianUrl ?? null,
    },
    {
      layer: "Liquidity",
      field: "Redemption / liquidity score",
      value: asset.liquidity
        ? `${displayValue(asset.liquidity.redemptionType)} · score ${displayValue(asset.liquidity.liquidityScore)}`
        : "—",
      source: asset.liquidity ? "Liquidity layer" : "Liquidity source required",
      tier: asset.liquidity ? "Pro" : "Gap",
      status: asset.liquidity ? "pro" : "missing",
    },
    {
      layer: "Risk",
      field: "Risk score / factors",
      value: asset.risk
        ? `${displayValue(asset.risk.overallScore)} · ${displayValue(asset.risk.overallLevel)}`
        : "—",
      source: asset.risk ? "Nexus risk model + evidence layer" : "Risk model output required",
      tier: asset.risk ? "Pro" : "Gap",
      status: asset.risk ? "pro" : "missing",
    },
    {
      layer: "Grade",
      field: "Grade baseline",
      value: asset.grade ? `${asset.grade.grade} · ${asset.grade.score}/100` : "—",
      source: asset.grade ? "Nexus grading baseline" : "Grade baseline required",
      tier: asset.grade ? "Pro" : "Gap",
      status: asset.grade ? "pro" : "missing",
    },
  ];

  return rows;
}

function gapList(asset: AssetWithLayers): string[] {
  const gaps: string[] = [];
  if (!asset.identity?.websiteUrl) gaps.push("Missing official website URL");
  if (!asset.identity?.docsUrl) gaps.push("Missing official documentation URL");
  if (!asset.reserve) gaps.push("Reserve evidence not loaded or not available");
  if (!asset.liquidity) gaps.push("Liquidity evidence not loaded or not available");
  if (!asset.blockchain?.length) gaps.push("Blockchain deployment data incomplete");
  if (!asset.grade) gaps.push("Grade baseline not available");
  return gaps;
}

export type AssetSourcesTabProps = {
  asset: AssetWithLayers;
  meta: AssetDataMeta;
  protocol: string;
  symbol: string;
};

export function AssetSourcesTab({
  asset,
  meta,
  protocol,
  symbol,
}: AssetSourcesTabProps) {
  const rows = buildEvidenceRows({ asset, meta, protocol, symbol });
  const gaps = gapList(asset);
  const verifiedCount = rows.filter((row) => row.status === "verified").length;
  const proCount = rows.filter((row) => row.status === "pro").length;
  const gapCount = rows.filter((row) => row.status === "missing").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[rgba(0,255,136,0.22)] bg-[rgba(0,255,136,0.06)] p-5">
          <ShieldCheck className="size-5 text-[#00FF88]" />
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#8892A4]">
            Verified rows
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">{verifiedCount}</p>
        </div>
        <div className="rounded-xl border border-[rgba(0,212,255,0.22)] bg-[rgba(0,212,255,0.06)] p-5">
          <Lock className="size-5 text-[#00D4FF]" />
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#8892A4]">
            Pro evidence rows
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">{proCount}</p>
        </div>
        <div className="rounded-xl border border-[rgba(255,136,136,0.22)] bg-[rgba(255,136,136,0.06)] p-5">
          <TriangleAlert className="size-5 text-[#FF8888]" />
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#8892A4]">
            Data gaps
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">{gapCount}</p>
        </div>
      </section>

      <section className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Evidence trail</h2>
            <p className="mt-1 text-sm text-[#8892A4]">
              Field-level source status across the 12-layer asset model.
            </p>
          </div>
          <div className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.55)] px-3 py-2 text-xs text-[#8892A4]">
            Last updated: <span className="text-white">{formatMinutesAgo(meta.lastUpdated)}</span>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-lg border border-[rgba(30,42,58,0.8)]">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.5)] text-[11px] font-semibold uppercase tracking-wide text-[#8892A4]">
                <th className="px-4 py-3">Layer</th>
                <th className="px-4 py-3">Field</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Link</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.layer}-${row.field}`}
                  className="border-b border-[rgba(30,42,58,0.5)] last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-white">{row.layer}</td>
                  <td className="px-4 py-3 text-[#C5CDD8]">{row.field}</td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-[#8892A4]" title={row.value}>
                    {row.value}
                  </td>
                  <td className="px-4 py-3 text-[#8892A4]">{row.source}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tierClass(row.tier)}`}>
                      {row.tier}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${evidenceStatusClass(row.status)}`}>
                    {row.status}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.url ? (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#00D4FF] hover:underline"
                      >
                        View
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      <span className="text-[#4A5568]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6">
          <FileSearch className="size-5 text-[#00D4FF]" />
          <h2 className="mt-4 text-lg font-bold text-white">Source policy</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[#8892A4]">
            <li>• Tier 1 sources are official issuer, legal, reserve, audit, custody, filing, or contract documents.</li>
            <li>• Tier 2 sources are market data, explorers, and reputable analytics references.</li>
            <li>• Missing evidence is treated as a data gap, not estimated.</li>
            <li>• Smart-contract audits are not treated as reserve audits.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6">
          <TriangleAlert className="size-5 text-[#FFB800]" />
          <h2 className="mt-4 text-lg font-bold text-white">Data gaps</h2>
          {gaps.length ? (
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[#8892A4]">
              {gaps.map((gap) => (
                <li key={gap}>• {gap}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[#8892A4]">
              No major data gaps detected in the currently loaded asset layers.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
