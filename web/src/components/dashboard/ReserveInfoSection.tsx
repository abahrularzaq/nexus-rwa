"use client";

import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { BlurredPreview } from "@/components/paywall/BlurredPreview";
import { PaywallGuard } from "@/components/paywall/PaywallGuard";
import { parseAssetWithLayers } from "@/lib/asset-mapper";
import type { ApiResponse } from "@/lib/shared";
import type { AssetReserve, AssetWithLayers } from "@/types/asset";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ReserveContent({ reserve }: { reserve: AssetReserve }) {
  const ratio =
    reserve.collateralizationRatio != null
      ? `${(reserve.collateralizationRatio * 100).toFixed(0)}%`
      : "—";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.5)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-[#8892A4]">
            Custodian
          </p>
          {reserve.custodianUrl ? (
            <a
              href={reserve.custodianUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#00D4FF] hover:underline"
            >
              {reserve.custodian ?? "View custodian"}
              <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <p className="mt-1 text-sm font-medium text-white">
              {reserve.custodian ?? "—"}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.5)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-[#8892A4]">
            Collateralization
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums text-white">
            {ratio}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="inline-flex items-center gap-1.5 text-[#8892A4]">
          Proof of reserves:
          {reserve.hasProofOfReserves ? (
            <span className="inline-flex items-center gap-1 font-medium text-[#00FF88]">
              <CheckCircle2 className="size-4" />
              Yes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-[#FF8888]">
              <XCircle className="size-4" />
              No
            </span>
          )}
        </span>
        <span className="text-[#8892A4]">
          Last audit: <span className="text-white">{formatDate(reserve.lastAuditDate)}</span>
          {reserve.auditor ? (
            <span className="text-[#8892A4]">
              {" "}
              · <span className="text-white">{reserve.auditor}</span>
            </span>
          ) : null}
        </span>
      </div>

      {reserve.backingType ? (
        <p className="text-sm text-[#8892A4]">
          Backing: <span className="text-white">{reserve.backingType}</span>
        </p>
      ) : null}
    </div>
  );
}

function MockReservePreview() {
  return (
    <div className="pointer-events-none select-none blur-[4px]">
      <ReserveContent
        reserve={{
          custodian: "Institutional custodian",
          collateralizationRatio: 1.0,
          hasProofOfReserves: true,
          lastAuditDate: new Date().toISOString(),
          auditor: "Independent auditor",
          backingType: "US Treasury & cash equivalents",
        }}
      />
    </div>
  );
}

export function ReserveInfoSection({
  apiBaseUrl,
  assetSlug,
  reserve,
}: {
  apiBaseUrl: string;
  assetSlug: string;
  reserve?: AssetReserve | null;
}) {
  if (reserve) {
    return <ReserveContent reserve={reserve} />;
  }

  const base = apiBaseUrl.trim().replace(/\/$/, "");
  const endpoint = `${base}/v1/assets/${assetSlug}/full`;

  return (
    <PaywallGuard
      endpoint={endpoint}
      fallback={({ openPaywall }) => (
        <div className="space-y-4">
          <MockReservePreview />
          <BlurredPreview
            title="Reserve & backing"
            priceLabel="$3 / 24h"
            onUnlock={openPaywall}
          />
        </div>
      )}
    >
      {(payload) => {
        const body = payload as ApiResponse<Record<string, unknown>>;
        const data =
          body && typeof body === "object" && "success" in body && body.success
            ? parseAssetWithLayers(body.data as Record<string, unknown>)
            : null;
        const r = data?.reserve;
        if (!r) {
          return (
            <p className="text-sm text-[#8892A4]">
              Reserve data not available for this asset.
            </p>
          );
        }
        return <ReserveContent reserve={r} />;
      }}
    </PaywallGuard>
  );
}
