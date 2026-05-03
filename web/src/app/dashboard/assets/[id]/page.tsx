"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  ExternalLink,
  Lock,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import type { RiskBadgeProps } from "@/components/dashboard/RiskBadge";

type RiskLevel = RiskBadgeProps["level"];
type Period = "7d" | "30d" | "90d";

type AssetDetailMock = {
  id: string;
  name: string;
  symbol: string;
  protocol: string;
  category: string;
  chain: string;
  contractAddress: string;
  accent: string;
  /** Annual yield as fraction */
  currentYield: number;
  tvl: number;
  /** TVL change fraction 7d */
  tvlChange7d: number;
  riskLevel: RiskLevel;
  holders: number;
  riskBreakdown: {
    liquidity: number;
    concentration: number;
    protocolAge: number;
    yieldVolatility: number;
  };
  holdersIntel: {
    total: number;
    top10Concentration: number;
    whaleCount: number;
    retailCount: number;
  };
};

function slugTitle(id: string): string {
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Mock detail rows aligned with `api/prisma/seed.ts` asset ids. */
const ASSET_DETAIL_BY_ID: Record<string, AssetDetailMock> = {
  "ondo-usdy": {
    id: "ondo-usdy",
    name: "Ondo USDY",
    symbol: "USDY",
    protocol: "Ondo Finance",
    category: "Treasury",
    chain: "Base",
    contractAddress: "0x96F6ef951840721AdBF46Ac996b59E0235CB985C",
    accent: "#00D4FF",
    currentYield: 0.0482,
    tvl: 1_842_000_000,
    tvlChange7d: 0.012,
    riskLevel: "LOW",
    holders: 128_400,
    riskBreakdown: {
      liquidity: 0.22,
      concentration: 0.38,
      protocolAge: 0.18,
      yieldVolatility: 0.26,
    },
    holdersIntel: {
      total: 128_400,
      top10Concentration: 34.2,
      whaleCount: 412,
      retailCount: 121_800,
    },
  },
  "maple-usdc": {
    id: "maple-usdc",
    name: "Maple USDC",
    symbol: "mUSDC",
    protocol: "Maple Finance",
    category: "Credit",
    chain: "Ethereum",
    contractAddress: "0x36d8c79B4c18D3b39d9aA27C7Fde5f04CeBc9D7",
    accent: "#7C3AED",
    currentYield: 0.089,
    tvl: 412_000_000,
    tvlChange7d: -0.021,
    riskLevel: "MEDIUM",
    holders: 38_200,
    riskBreakdown: {
      liquidity: 0.41,
      concentration: 0.52,
      protocolAge: 0.28,
      yieldVolatility: 0.48,
    },
    holdersIntel: {
      total: 38_200,
      top10Concentration: 41.8,
      whaleCount: 156,
      retailCount: 35_900,
    },
  },
  "centrifuge-drop": {
    id: "centrifuge-drop",
    name: "Centrifuge DROP",
    symbol: "DROP",
    protocol: "Centrifuge",
    category: "Credit",
    chain: "Ethereum",
    contractAddress: "0x0C32Fa1FA1513C4C2cB34e0C1e81c5A8D16e3a02",
    accent: "#A78BFA",
    currentYield: 0.071,
    tvl: 96_500_000,
    tvlChange7d: 0.008,
    riskLevel: "HIGH",
    holders: 9_840,
    riskBreakdown: {
      liquidity: 0.55,
      concentration: 0.62,
      protocolAge: 0.44,
      yieldVolatility: 0.58,
    },
    holdersIntel: {
      total: 9_840,
      top10Concentration: 48.1,
      whaleCount: 42,
      retailCount: 9_020,
    },
  },
  "backed-buidl": {
    id: "backed-buidl",
    name: "Backed BUIDL",
    symbol: "bBUIDL",
    protocol: "Backed Finance",
    category: "Treasury",
    chain: "Ethereum",
    contractAddress: "0x7712c34205737192402172409a8F7ccef8aA2AEc",
    accent: "#00D4FF",
    currentYield: 0.0415,
    tvl: 1_120_000_000,
    tvlChange7d: 0.004,
    riskLevel: "LOW",
    holders: 54_100,
    riskBreakdown: {
      liquidity: 0.2,
      concentration: 0.31,
      protocolAge: 0.35,
      yieldVolatility: 0.19,
    },
    holdersIntel: {
      total: 54_100,
      top10Concentration: 29.4,
      whaleCount: 198,
      retailCount: 51_200,
    },
  },
  "openedon-ousg": {
    id: "openedon-ousg",
    name: "OpenEden OUSG",
    symbol: "OUSG",
    protocol: "OpenEden",
    category: "Treasury",
    chain: "Ethereum",
    contractAddress: "0x4eB405CD7e6AF70E54E4853a81D17A4bF3a0BA78",
    accent: "#38BDF8",
    currentYield: 0.039,
    tvl: 268_000_000,
    tvlChange7d: -0.003,
    riskLevel: "LOW",
    holders: 21_300,
    riskBreakdown: {
      liquidity: 0.24,
      concentration: 0.33,
      protocolAge: 0.21,
      yieldVolatility: 0.22,
    },
    holdersIntel: {
      total: 21_300,
      top10Concentration: 31.0,
      whaleCount: 88,
      retailCount: 19_900,
    },
  },
  "ondo-ousg": {
    id: "ondo-ousg",
    name: "Ondo OUSG",
    symbol: "OUSG2",
    protocol: "Ondo Finance",
    category: "Treasury",
    chain: "Ethereum",
    contractAddress: "0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92",
    accent: "#00D4FF",
    currentYield: 0.0402,
    tvl: 445_000_000,
    tvlChange7d: 0.006,
    riskLevel: "LOW",
    holders: 33_600,
    riskBreakdown: {
      liquidity: 0.23,
      concentration: 0.3,
      protocolAge: 0.26,
      yieldVolatility: 0.2,
    },
    holdersIntel: {
      total: 33_600,
      top10Concentration: 30.2,
      whaleCount: 124,
      retailCount: 31_200,
    },
  },
  "realt-token": {
    id: "realt-token",
    name: "RealT Token",
    symbol: "REALT",
    protocol: "RealT",
    category: "Real Estate",
    chain: "Ethereum",
    contractAddress: "0x9C2023636A4f7a00E85a4C60b27F28bD5Ef24b0d",
    accent: "#00FF88",
    currentYield: 0.056,
    tvl: 52_800_000,
    tvlChange7d: 0.015,
    riskLevel: "MEDIUM",
    holders: 182_000,
    riskBreakdown: {
      liquidity: 0.36,
      concentration: 0.44,
      protocolAge: 0.52,
      yieldVolatility: 0.41,
    },
    holdersIntel: {
      total: 182_000,
      top10Concentration: 36.7,
      whaleCount: 890,
      retailCount: 168_000,
    },
  },
  "goldfinch-gfi": {
    id: "goldfinch-gfi",
    name: "Goldfinch GFI",
    symbol: "GFI",
    protocol: "Goldfinch",
    category: "Credit",
    chain: "Ethereum",
    contractAddress: "0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b",
    accent: "#F472B6",
    currentYield: 0.112,
    tvl: 74_200_000,
    tvlChange7d: -0.018,
    riskLevel: "HIGH",
    holders: 6_120,
    riskBreakdown: {
      liquidity: 0.58,
      concentration: 0.64,
      protocolAge: 0.48,
      yieldVolatility: 0.61,
    },
    holdersIntel: {
      total: 6_120,
      top10Concentration: 52.3,
      whaleCount: 28,
      retailCount: 5_720,
    },
  },
};

function resolveAsset(id: string): AssetDetailMock {
  const known = ASSET_DETAIL_BY_ID[id];
  if (known) return known;
  const base = 0.045 + (id.length % 7) * 0.004;
  return {
    id,
    name: slugTitle(id),
    symbol: id.split("-").pop()?.toUpperCase().slice(0, 6) ?? "RWA",
    protocol: "Unknown Protocol",
    category: "Treasury",
    chain: "Base",
    contractAddress: "0x0000000000000000000000000000000000000000",
    accent: "#8892A4",
    currentYield: base,
    tvl: 25_000_000,
    tvlChange7d: 0.001,
    riskLevel: "MEDIUM",
    holders: 5_000,
    riskBreakdown: {
      liquidity: 0.4,
      concentration: 0.45,
      protocolAge: 0.35,
      yieldVolatility: 0.42,
    },
    holdersIntel: {
      total: 5_000,
      top10Concentration: 40,
      whaleCount: 12,
      retailCount: 4_800,
    },
  };
}

function hash01(id: string, i: number): number {
  let h = 0;
  const s = `${id}:${i}`;
  for (let j = 0; j < s.length; j++) h = (h << 5) - h + s.charCodeAt(j);
  return (Math.sin(h) * 10000) % 1;
}

// TODO: Fetch from /v1/assets/:id/yield via X402
function buildYieldHistory(
  id: string,
  period: Period,
  baseYieldFraction: number,
): { date: string; yieldPct: number }[] {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const out: { date: string; yieldPct: number }[] = [];
  const basePct = baseYieldFraction * 100;
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const wobble = (hash01(id, i) - 0.5) * 0.35;
    const drift = (i / days) * 0.12 * (hash01(id, days + i) - 0.5);
    out.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      yieldPct: Math.max(0.5, basePct + wobble + drift),
    });
  }
  return out;
}

function formatTvl(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatPctChange(f: number): string {
  const pct = f * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function barTone(v: number): string {
  if (v < 0.3) return "bg-[#00FF88]";
  if (v <= 0.6) return "bg-[#FFB800]";
  return "bg-[#FF4444]";
}

function truncateAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const tooltipContentStyle = {
  backgroundColor: "rgba(10,14,26,0.95)",
  border: "1px solid rgba(0,212,255,0.35)",
  borderRadius: 8,
  color: "#fff",
};

export default function AssetDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const asset = useMemo(() => resolveAsset(id || "unknown"), [id]);

  const [period, setPeriod] = useState<Period>("30d");
  const [copied, setCopied] = useState(false);

  const yieldData = useMemo(
    () => buildYieldHistory(asset.id, period, asset.currentYield),
    [asset.id, period, asset.currentYield],
  );

  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const curlSnippet = `curl ${apiBase || "$NEXT_PUBLIC_API_URL"}/v1/assets/${asset.id}/yield \\
  -H "X-Payment: {...}"`;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(asset.contractAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const tvlUp = asset.tvlChange7d >= 0;
  const conc = asset.holdersIntel.top10Concentration;

  return (
    <div className="space-y-8 pb-10">
      {/* 1. BREADCRUMB + BACK */}
      <div>
        <Link
          href="/dashboard/assets"
          className="inline-flex items-center gap-2 text-sm text-[#8892A4] transition-colors hover:text-[#00D4FF]"
        >
          <ArrowLeft className="size-4" />
          <span>
            <span className="text-[#8892A4]">Assets</span>
            <span className="mx-1.5 text-[#4A5568]">/</span>
            <span className="font-medium text-white">{asset.name}</span>
          </span>
        </Link>
      </div>

      {/* 2. ASSET HEADER */}
      <section className="flex flex-col gap-8 border-b border-[rgba(30,42,58,0.8)] pb-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            <div
              className="size-16 shrink-0 rounded-full ring-2 ring-white/10"
              style={{ background: asset.accent }}
              aria-hidden
            />
            <div className="min-w-0">
              <h1 className="text-[32px] font-bold leading-tight tracking-tight text-white">
                {asset.name}
              </h1>
              <p className="mt-1 text-lg text-[#8892A4]">{asset.symbol}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[rgba(30,42,58,0.9)] bg-[rgba(15,22,41,0.8)] px-3 py-1 text-xs font-semibold text-white">
              {asset.protocol}
            </span>
            <span className="rounded-full border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.08)] px-3 py-1 text-xs font-semibold text-[#00D4FF]">
              {asset.category}
            </span>
            <span className="rounded-full border border-[rgba(124,58,237,0.35)] bg-[rgba(124,58,237,0.1)] px-3 py-1 text-xs font-semibold text-[#A78BFA]">
              {asset.chain}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] px-3 py-2 font-mono text-xs text-[#8892A4]">
              {truncateAddress(asset.contractAddress)}
            </code>
            <button
              type="button"
              onClick={() => void copyAddress()}
              className="rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.8)] px-3 py-2 text-xs font-medium text-[#00D4FF] transition-colors hover:border-[rgba(0,212,255,0.35)]"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={`https://etherscan.io/address/${asset.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-[rgba(30,42,58,0.8)] px-3 py-2 text-xs font-medium text-[#8892A4] hover:text-white"
            >
              Explorer
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col items-start gap-4 lg:w-auto lg:min-w-[280px] lg:items-end">
          <p
            className="font-bold tabular-nums leading-none text-[#00FF88]"
            style={{ fontSize: 48 }}
          >
            {(asset.currentYield * 100).toFixed(2)}%
          </p>
          <p className="text-right text-sm text-[#8892A4]">
            Current yield (APY)
          </p>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums text-white">
              {formatTvl(asset.tvl)}
            </p>
            <p
              className={`text-sm font-medium tabular-nums ${tvlUp ? "text-[#00FF88]" : "text-[#FF4444]"}`}
            >
              {formatPctChange(asset.tvlChange7d)} <span className="text-[#8892A4]">7D TVL</span>
            </p>
          </div>
          <div className="scale-125 origin-top-right">
            <RiskBadge level={asset.riskLevel} showDot />
          </div>
        </div>
      </section>

      {/* 3. METRICS ROW */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Current TVL"
          value={formatTvl(asset.tvl)}
          change={formatPctChange(asset.tvlChange7d)}
          changeType={tvlUp ? "positive" : "negative"}
          subtitle="7D change"
          icon={<TrendingUp className="text-[#00D4FF]" />}
        />
        <MetricCard
          title="Yield Rate (APY)"
          value={`${(asset.currentYield * 100).toFixed(2)}%`}
          subtitle="Annualized"
          icon={<TrendingUp className="text-[#00D4FF]" />}
        />
        <MetricCard
          title="Total Holders"
          value={asset.holders.toLocaleString("en-US")}
          subtitle="Unique wallets"
          icon={<Users className="text-[#00D4FF]" />}
        />
        <MetricCard
          title="Risk Score"
          value={asset.riskLevel}
          subtitle="Overall assessment"
          icon={<Shield className="text-[#00D4FF]" />}
        />
      </div>

      {/* 4. YIELD CHART */}
      <section className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-5 backdrop-blur-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-white">Yield History</h2>
          <div className="flex gap-1 rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] p-0.5">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={[
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  period === p
                    ? "bg-[rgba(0,212,255,0.15)] text-[#00D4FF]"
                    : "text-[#8892A4] hover:text-white",
                ].join(" ")}
              >
                {p === "7d" ? "7D" : p === "30d" ? "30D" : "90D"}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yieldData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(30,42,58,0.6)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#8892A4", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#8892A4", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                width={44}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={tooltipContentStyle}
                formatter={(v: number) => [`${v.toFixed(2)}%`, "Yield"]}
                labelStyle={{ color: "#8892A4" }}
              />
              <Area
                type="monotone"
                dataKey="yieldPct"
                stroke="#00D4FF"
                strokeWidth={2}
                fill="rgba(0,212,255,0.1)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 5. RISK BREAKDOWN */}
      <section className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6 backdrop-blur-sm">
        {/* TODO: Fetch from /v1/assets/:id/risk via X402 */}
        <h2 className="text-lg font-bold text-white">Risk Analysis</h2>
        <div className="mt-3 scale-110 origin-left">
          <RiskBadge level={asset.riskLevel} showDot />
        </div>
        <div className="mt-6 space-y-5">
          {(
            [
              ["Liquidity Risk", asset.riskBreakdown.liquidity],
              ["Concentration Risk", asset.riskBreakdown.concentration],
              ["Protocol Age", asset.riskBreakdown.protocolAge],
              ["Yield Volatility", asset.riskBreakdown.yieldVolatility],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-[#8892A4]">{label}</span>
                <span className="tabular-nums text-white">
                  {(value * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[rgba(30,42,58,0.9)]">
                <div
                  className={`h-full rounded-full transition-all ${barTone(value)}`}
                  style={{ width: `${Math.min(100, value * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. HOLDER DISTRIBUTION */}
      <section className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.55)] p-6 backdrop-blur-sm">
        {/* TODO: Fetch from /v1/assets/:id/holders via X402 */}
        <h2 className="text-lg font-bold text-white">Holder Intelligence</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8892A4]">
              Total Holders
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-white">
              {asset.holdersIntel.total.toLocaleString("en-US")}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8892A4]">
              Top 10 Concentration
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-white">
              {conc.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8892A4]">
              Whale Count (&gt;$100k)
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-white">
              {asset.holdersIntel.whaleCount.toLocaleString("en-US")}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8892A4]">
              Retail Count
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-white">
              {asset.holdersIntel.retailCount.toLocaleString("en-US")}
            </p>
          </div>
        </div>
        <div className="mt-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8892A4]">
            Top 10 concentration (share of holders)
          </p>
          <div className="flex h-4 overflow-hidden rounded-full bg-[rgba(30,42,58,0.9)] ring-1 ring-[rgba(30,42,58,0.8)]">
            <div
              className="bg-gradient-to-r from-[#00D4FF] to-[#00D4FF]/70 transition-all"
              style={{ width: `${Math.min(100, conc)}%` }}
              title={`Top 10: ${conc.toFixed(1)}%`}
            />
            <div className="min-w-0 flex-1 bg-transparent" />
          </div>
          <div className="mt-2 flex justify-between text-xs text-[#4A5568]">
            <span>0%</span>
            <span className="text-[#8892A4]">Top 10 wallet group</span>
            <span>100%</span>
          </div>
          <div className="mt-6 h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  {
                    seg: "Whales",
                    pct:
                      (asset.holdersIntel.whaleCount /
                        Math.max(1, asset.holdersIntel.total)) *
                      100,
                  },
                  {
                    seg: "Retail",
                    pct:
                      (asset.holdersIntel.retailCount /
                        Math.max(1, asset.holdersIntel.total)) *
                      100,
                  },
                ]}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="rgba(30,42,58,0.5)" vertical={false} />
                <XAxis dataKey="seg" tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#8892A4", fontSize: 10 }} width={36} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipContentStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, "Share"]} />
                <Line type="monotone" dataKey="pct" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4, fill: "#7C3AED" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 7. API ACCESS */}
      <section
        className="rounded-xl border border-[rgba(0,212,255,0.15)] p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(124,58,237,0.06) 50%, rgba(10,14,26,0.9) 100%)",
        }}
      >
        <div className="mb-2 flex items-center gap-2 text-[#00D4FF]">
          <Lock className="size-4" aria-hidden />
          <h3 className="text-lg font-bold text-white">Access This Data via API</h3>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { path: "/yield", price: "$0.005" },
            { path: "/risk", price: "$0.003" },
            { path: "/holders", price: "$0.005" },
          ].map((row) => (
            <span
              key={row.path}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,212,255,0.25)] bg-[rgba(10,14,26,0.65)] px-3 py-1.5 font-mono text-xs text-[#8892A4]"
            >
              <span className="text-[#00D4FF]">GET {row.path}</span>
              <span className="text-white">{row.price}</span>
            </span>
          ))}
        </div>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] p-4 text-left font-mono text-[11px] leading-relaxed text-[#8892A4]">
          {curlSnippet}
        </pre>
        <Link
          href="/dashboard/api-docs"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#00D4FF] px-5 py-2.5 text-sm font-bold text-[#0A0E1A] transition-opacity hover:opacity-90"
        >
          View Full API Docs
        </Link>
      </section>
    </div>
  );
}
