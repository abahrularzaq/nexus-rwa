"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useAccount } from "wagmi";

import { useSession } from "@/hooks/useSession";
import type { ApiResponse, AssetInsight } from "@/lib/shared";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");

function apiKeyHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const apiKey = localStorage.getItem("nexus_api_key");
  return apiKey ? { "X-API-Key": apiKey } : {};
}

function teaserFromSummary(summary: string): string {
  const trimmed = summary.trim();
  const match = trimmed.match(/^[^.!?]+[.!?]?/);
  const first = (match?.[0] ?? trimmed).trim();
  if (first.length <= 140) return first;
  return `${first.slice(0, 137).trimEnd()}…`;
}

export type AssetInsightTeaserProps = {
  assetId: string;
  /** Skip fetch when false (e.g. limit parallel insight calls on long lists). */
  enabled?: boolean;
};

export function AssetInsightTeaser({
  assetId,
  enabled = true,
}: AssetInsightTeaserProps) {
  const { isPro } = useSession();
  const { address, isConnected } = useAccount();
  const [teaser, setTeaser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !isPro || !isConnected || !address || !API_URL || !assetId) {
      setTeaser(null);
      setLoading(false);
      return;
    }

    const wallet = address;
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const res = await fetch(`${API_URL}/v1/assets/${assetId}/insight`, {
          headers: {
            Accept: "application/json",
            "X-Wallet-Address": wallet,
            ...apiKeyHeader(),
          },
        });
        const body = (await res.json()) as ApiResponse<AssetInsight>;
        if (cancelled) return;

        if (res.ok && body.success && body.data.summary) {
          setTeaser(teaserFromSummary(body.data.summary));
        } else {
          setTeaser(null);
        }
      } catch {
        if (!cancelled) setTeaser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, isPro, isConnected, address, assetId]);

  if (!enabled) return null;

  const lockedLabel = isPro
    ? isConnected
      ? "AI insight loading…"
      : "Connect wallet for AI insight"
    : "Unlock AI insight — Pro";

  return (
    <p
      className="mt-3 flex items-start gap-1.5 border-t border-[rgba(30,42,58,0.6)] pt-3 text-xs leading-snug text-[#8892A4]"
      title={teaser ?? lockedLabel}
    >
      <Sparkles
        className="mt-0.5 size-3.5 shrink-0 text-[#FFB800]"
        aria-hidden
      />
      <span className="line-clamp-2">
        {loading ? (
          <span className="inline-block h-3 w-[85%] animate-pulse rounded bg-[rgba(30,42,58,0.9)]" />
        ) : teaser ? (
          <span className="text-[#C5CDD8]">{teaser}</span>
        ) : (
          lockedLabel
        )}
      </span>
    </p>
  );
}
