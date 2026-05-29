"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { YieldHistoryPoint } from "@/lib/shared";

const YIELD_COLOR = "#6366f1";
const TVL_COLOR = "#10b981";

export type YieldChartProps = {
  data: YieldHistoryPoint[];
  period: string;
  isLocked: boolean;
  limitedHistory?: boolean;
};

function formatTvlTooltip(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatYieldTooltip(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}

function formatAxisDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type ChartRow = YieldHistoryPoint & {
  label: string;
};

type TooltipPayloadItem = {
  dataKey?: string;
  value?: number;
  color?: string;
  name?: string;
};

function HistoryTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const yieldEntry = payload.find((p) => p.dataKey === "yield");
  const tvlEntry = payload.find((p) => p.dataKey === "tvl");

  return (
    <div
      className="rounded-lg border border-[rgba(30,42,58,0.9)] px-3 py-2 text-xs shadow-lg"
      style={{ background: "rgba(10,14,26,0.95)" }}
    >
      <p className="mb-2 font-medium text-white">{label}</p>
      {yieldEntry != null && (
        <p className="tabular-nums" style={{ color: YIELD_COLOR }}>
          Yield: {formatYieldTooltip(Number(yieldEntry.value))}
        </p>
      )}
      {tvlEntry != null && (
        <p className="mt-1 tabular-nums" style={{ color: TVL_COLOR }}>
          TVL: {formatTvlTooltip(Number(tvlEntry.value))}
        </p>
      )}
    </div>
  );
}

/** Generates placeholder series for locked / preview state. */
export function buildMockYieldHistory(
  period: string,
  count = 24,
): YieldHistoryPoint[] {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const stepMs = (days * 24 * 60 * 60 * 1000) / Math.max(count - 1, 1);
  const now = Date.now();
  const baseYield = 5.2;
  const baseTvl = 420_000_000;

  return Array.from({ length: count }, (_, i) => {
    const t = now - (count - 1 - i) * stepMs;
    const wave = Math.sin(i / 3) * 0.4;
    return {
      timestamp: new Date(t).toISOString(),
      yield: Math.round((baseYield + wave + i * 0.02) * 100) / 100,
      tvl: baseTvl + i * 8_000_000 + Math.sin(i / 2) * 20_000_000,
    };
  });
}

export function YieldChart({
  data,
  period,
  isLocked,
  limitedHistory = false,
}: YieldChartProps) {
  const chartData: ChartRow[] = useMemo(() => {
    const source =
      data.length > 0 ? data : isLocked ? buildMockYieldHistory(period) : [];
    return source.map((row) => ({
      ...row,
      label: formatAxisDate(row.timestamp),
    }));
  }, [data, isLocked, period]);

  const periodLabel =
    period === "7d" ? "7 days" : period === "90d" ? "90 days" : "30 days";

  return (
    <div className="relative">
      {limitedHistory && !isLocked ? (
        <div
          className="mb-3 rounded-lg border border-[rgba(255,184,0,0.3)] px-3 py-2 text-xs text-[#FFB800]"
          style={{ background: "rgba(255,184,0,0.08)" }}
        >
          Limited history: tracking started less than 7 days ago. Showing all
          available data points.
        </div>
      ) : null}

      <div
        className={
          isLocked
            ? "pointer-events-none select-none blur-md"
            : undefined
        }
        aria-hidden={isLocked}
      >
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-2 text-[#8892A4]">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: YIELD_COLOR }}
            />
            Yield (APY %)
          </span>
          <span className="inline-flex items-center gap-2 text-[#8892A4]">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: TVL_COLOR }}
            />
            TVL (USD)
          </span>
          <span className="text-[#4A5568]">· {periodLabel}</span>
        </div>

        <div className="h-[320px] w-full">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[#8892A4]">
              No historical data yet. Snapshots are captured every 6 hours.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="rgba(30,42,58,0.6)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#8892A4", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(30,42,58,0.8)" }}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  yAxisId="yield"
                  orientation="left"
                  tick={{ fill: YIELD_COLOR, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
                  width={48}
                />
                <YAxis
                  yAxisId="tvl"
                  orientation="right"
                  tick={{ fill: TVL_COLOR, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    const n = Number(v);
                    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
                    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
                    return `$${n}`;
                  }}
                  width={56}
                />
                <Tooltip content={<HistoryTooltip />} />
                <Area
                  yAxisId="tvl"
                  type="monotone"
                  dataKey="tvl"
                  name="TVL"
                  fill={TVL_COLOR}
                  fillOpacity={0.15}
                  stroke={TVL_COLOR}
                  strokeWidth={2}
                  isAnimationActive={!isLocked}
                />
                <Line
                  yAxisId="yield"
                  type="monotone"
                  dataKey="yield"
                  name="Yield"
                  stroke={YIELD_COLOR}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: YIELD_COLOR }}
                  isAnimationActive={!isLocked}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {isLocked ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,14,26,0.1) 0%, rgba(10,14,26,0.55) 100%)",
          }}
        />
      ) : null}
    </div>
  );
}
