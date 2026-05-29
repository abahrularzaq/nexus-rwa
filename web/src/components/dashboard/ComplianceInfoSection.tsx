"use client";

import { ShieldCheck, ShieldOff } from "lucide-react";
import type { AssetCompliance } from "@/types/asset";

function statusLabel(status?: string | null): string {
  if (!status) return "Unknown";
  return status
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function statusStyles(status?: string | null): string {
  const s = (status ?? "").toLowerCase();
  if (s === "registered") {
    return "border-[rgba(0,255,136,0.35)] bg-[rgba(0,255,136,0.08)] text-[#00FF88]";
  }
  if (s === "exempt") {
    return "border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.08)] text-[#00D4FF]";
  }
  return "border-[rgba(255,184,0,0.35)] bg-[rgba(255,184,0,0.08)] text-[#FFB800]";
}

export function ComplianceInfoSection({
  compliance,
}: {
  compliance?: AssetCompliance | null;
}) {
  if (!compliance) {
    return (
      <p className="text-sm text-[#8892A4]">Compliance data not available.</p>
    );
  }

  const blocked = compliance.blockedJurisdictions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold ${statusStyles(compliance.regulatoryStatus)}`}
        >
          <ShieldCheck className="size-3.5" aria-hidden />
          {statusLabel(compliance.regulatoryStatus)}
        </span>
        {compliance.primaryRegulator ? (
          <span className="text-xs text-[#8892A4]">
            Regulator:{" "}
            <span className="text-white">{compliance.primaryRegulator}</span>
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.5)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-[#8892A4]">
            KYC
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium text-white">
            {compliance.kycRequired ? (
              <>
                <ShieldCheck className="size-4 text-[#FFB800]" />
                Required
              </>
            ) : (
              <>
                <ShieldOff className="size-4 text-[#8892A4]" />
                Not required
              </>
            )}
          </p>
        </div>
        <div className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.5)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-[#8892A4]">
            Accredited only
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {compliance.accreditedOnly ? "Yes" : "No"}
          </p>
        </div>
      </div>

      {blocked.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase text-[#8892A4]">
            Blocked jurisdictions
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {blocked.map((code) => (
              <span
                key={code}
                className="rounded-md border border-[rgba(255,68,68,0.25)] bg-[rgba(255,68,68,0.06)] px-2 py-0.5 text-xs font-medium text-[#FF8888]"
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
