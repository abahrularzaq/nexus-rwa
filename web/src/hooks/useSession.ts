"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";

import type { AccessTier } from "@/types/x402";

export type SessionData = {
  wallet: string;
  tier: AccessTier;
  active: boolean;
  expiresAt: string | null;
  expiresInSeconds: number;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(
  /\/$/,
  "",
);

export function formatExpiresIn(seconds: number): string {
  if (seconds <= 0) return "expired";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remH = hours % 24;
    return remH > 0 ? `${days}d ${remH}h` : `${days}d`;
  }
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

export function useSession() {
  const { address, isConnected } = useAccount();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address || !isConnected) {
      setSession(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/v1/session`, {
        headers: { "X-Wallet-Address": address },
        cache: "no-store",
      });
      const body = (await res.json()) as {
        success?: boolean;
        data?: SessionData;
      };
      if (!res.ok || !body.success || !body.data) {
        throw new Error("Failed to load session");
      }
      setSession(body.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Session unavailable");
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onPaid = () => void refresh();
    window.addEventListener("nexus-x402-payment", onPaid);
    window.addEventListener("nexus-session-updated", onPaid);
    return () => {
      window.removeEventListener("nexus-x402-payment", onPaid);
      window.removeEventListener("nexus-session-updated", onPaid);
    };
  }, [refresh]);

  const isPro =
    session?.active &&
    (session.tier === "pro" || session.tier === "enterprise");
  const isEnterprise = session?.active && session.tier === "enterprise";

  return {
    session,
    loading,
    error,
    refresh,
    isPro,
    isEnterprise,
    expiresLabel: session?.active
      ? formatExpiresIn(session.expiresInSeconds)
      : null,
  };
}
