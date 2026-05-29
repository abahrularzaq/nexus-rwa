"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

export type LockedDataEndpoint = "yield" | "risk" | "holders";

const ENDPOINT_PATH: Record<LockedDataEndpoint, string> = {
  yield: "yield",
  risk: "risk",
  holders: "holders",
};

const PRICE_BADGE: Record<LockedDataEndpoint, string> = {
  yield: "$0.005 USDC per request",
  risk: "$0.005 USDC per request",
  holders: "$0.005 USDC per request",
};

export interface LockedDataCardProps {
  apiBaseUrl: string;
  assetId: string;
  endpoint: LockedDataEndpoint;
}

export function LockedDataCard({
  apiBaseUrl,
  assetId,
  endpoint,
}: LockedDataCardProps) {
  const path = ENDPOINT_PATH[endpoint];
  const displayBase = apiBaseUrl.trim().replace(/\/$/, "") || "$NEXT_PUBLIC_API_URL";
  const curlSnippet = `curl ${displayBase}/v1/assets/${assetId}/${path} \\
  -H "X-Payment: {...}"`;

  return (
    <div
      className="rounded-xl border border-[rgba(0,212,255,0.2)] p-6"
      style={{ background: "rgba(15,22,41,0.8)" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.08)]"
            aria-hidden
          >
            <Lock className="size-5 text-[#00D4FF]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Advanced Analytics</h3>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-[#8892A4]">
              Access this data via X402 micropayment
            </p>
            <span className="mt-3 inline-flex rounded-full border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.1)] px-3 py-1 text-xs font-semibold text-[#00D4FF]">
              {PRICE_BADGE[endpoint]}
            </span>
          </div>
        </div>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] p-4 text-left font-mono text-[11px] leading-relaxed text-[#8892A4]">
        {curlSnippet}
      </pre>
      <Link
        href="/dashboard/api-docs"
        className="mt-4 inline-flex items-center justify-center rounded-lg border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.12)] px-5 py-2.5 text-sm font-bold text-[#00D4FF] transition-colors hover:bg-[rgba(0,212,255,0.18)]"
      >
        View in API Docs
      </Link>
    </div>
  );
}
