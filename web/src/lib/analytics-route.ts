import { NextRequest, NextResponse } from "next/server";

import type { MarketOverview } from "@/lib/shared";
import type { AccessTier, X402ErrorResponse } from "@/types/x402";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(
  /\/$/,
  "",
);

const TIER_AMOUNTS: Record<"pro" | "enterprise", string> = {
  pro: "0.001",
  enterprise: "0.01",
};

function tierForAnalytics(kind: "yield" | "risk"): AccessTier {
  return "pro";
}

function buildX402Required(
  endpointPath: string,
  tier: "pro" | "enterprise",
): X402ErrorResponse {
  const price = TIER_AMOUNTS[tier];
  return {
    error: "Payment required",
    tier: { tier, price, duration: tier === "pro" ? "24h" : "7d" },
    x402: {
      price,
      currency: "ETH",
      network: (process.env.X402_NETWORK ?? "base-sepolia").trim() || "base-sepolia",
      recipient:
        process.env.PAYMENT_RECIPIENT?.trim() ||
        process.env.X402_RECEIVING_ADDRESS?.trim() ||
        "0x0000000000000000000000000000000000000001",
      endpoint: endpointPath,
      tier,
      duration: tier === "pro" ? "24h" : "7d",
    },
  };
}

async function enrichX402FromApi(
  required: X402ErrorResponse,
): Promise<X402ErrorResponse> {
  try {
    const res = await fetch(`${API_URL}/v1/gated/data`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status !== 402) return required;
    const body = (await res.json()) as {
      network?: string;
      accepts?: Array<{ network?: string; payTo?: string }>;
      x402?: { recipient?: string; network?: string };
    };
    const accept = body.accepts?.[0];
    const recipient = accept?.payTo ?? body.x402?.recipient;
    if (!recipient) return required;
    return {
      ...required,
      x402: {
        ...required.x402,
        network: String(accept?.network ?? body.network ?? required.x402.network),
        recipient: String(recipient),
      },
    };
  } catch {
    return required;
  }
}

async function verifyPaymentTx(
  txHash: string,
  tier: "pro" | "enterprise",
  wallet?: string | null,
): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Payment-Tx": txHash,
    };
    if (wallet) headers["X-Wallet-Address"] = wallet;

    const res = await fetch(
      `${API_URL}/v1/session/verify?tier=${tier}`,
      { headers, cache: "no-store" },
    );
    const body = (await res.json()) as {
      success?: boolean;
      data?: { verified?: boolean };
    };
    return Boolean(res.ok && body.data?.verified);
  } catch {
    return false;
  }
}

async function fetchMarketOverview(): Promise<MarketOverview> {
  const res = await fetch(`${API_URL}/v1/market/overview`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const body = (await res.json()) as {
    success?: boolean;
    data?: MarketOverview;
  };
  if (!res.ok || !body.success || !body.data) {
    throw new Error("Market overview unavailable");
  }
  return body.data;
}

export type AnalyticsKind = "yield" | "risk";

function buildAnalyticsPayload(
  kind: AnalyticsKind,
  overview: MarketOverview,
): Record<string, unknown> {
  const updatedAt =
    typeof overview.updatedAt === "string"
      ? overview.updatedAt
      : new Date(overview.updatedAt).toISOString();

  if (kind === "yield") {
    return {
      kind: "yield",
      updatedAt,
      avgYieldRate: overview.avgYieldRate,
      totalTvl: overview.totalTvl,
      topGainers: overview.topGainers ?? [],
      topLosers: overview.topLosers ?? [],
      note: "Aggregate yield snapshot from market overview (premium preview).",
    };
  }

  const movers = [
    ...(overview.topGainers ?? []),
    ...(overview.topLosers ?? []),
  ];
  return {
    kind: "risk",
    updatedAt,
    totalAssets: overview.totalAssets,
    riskDistribution: movers.reduce<Record<string, number>>((acc, asset) => {
      const key = asset.riskScore ?? "MEDIUM";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
    movers: movers.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      riskScore: a.riskScore,
      change7d: a.change7d,
    })),
    note: "Market risk snapshot derived from top movers (premium preview).",
  };
}

export async function handleAnalyticsGet(
  req: NextRequest,
  kind: AnalyticsKind,
  endpointPath: string,
): Promise<NextResponse> {
  const tier = tierForAnalytics(kind);
  const tx = req.headers.get("X-Payment-Tx")?.trim();
  const wallet = req.headers.get("X-Wallet-Address")?.trim();

  if (!tx) {
    const required = await enrichX402FromApi(
      buildX402Required(endpointPath, tier),
    );
    return NextResponse.json(required, { status: 402 });
  }

  const verified = await verifyPaymentTx(tx, tier, wallet);
  if (!verified) {
    const required = await enrichX402FromApi(
      buildX402Required(endpointPath, tier),
    );
    return NextResponse.json(
      { error: "PAYMENT_VERIFICATION_FAILED", ...required },
      { status: 402 },
    );
  }

  try {
    const overview = await fetchMarketOverview();
    return NextResponse.json(buildAnalyticsPayload(kind, overview));
  } catch {
    return NextResponse.json(
      { error: "Failed to load analytics data from API" },
      { status: 502 },
    );
  }
}
