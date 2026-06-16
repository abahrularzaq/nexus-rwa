"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Clock, KeyRound, RefreshCw, ShieldCheck, type LucideIcon } from "lucide-react";

const USAGE_SUMMARY_PROXY_URL = "/api/admin/usage/summary";
const ADMIN_KEY_STORAGE = "nexus_admin_key";

type UsageSummary = {
  generatedAt: string;
  window: { days: number; since: string };
  totals: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    uniqueApiKeys: number;
    averageResponseTimeMs: number;
  };
  byEndpoint: Array<{ endpoint: string; method: string; count: number; averageResponseTimeMs: number }>;
  byTier: Array<{ tier: string; count: number }>;
  byStatus: Array<{ statusCode: number; count: number }>;
  recent: Array<{
    id: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTimeMs: number;
    apiKeyId: string | null;
    tier: string;
    timestamp: string;
  }>;
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusClass(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 400) return "text-[#00FF88]";
  if (statusCode >= 500) return "text-[#FF8888]";
  return "text-[#FFB800]";
}

function maskId(id: string | null): string {
  if (!id) return "anonymous";
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export default function UsageDashboardPage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const successRate = useMemo(() => {
    if (!summary || summary.totals.totalRequests === 0) return 0;
    return Math.round((summary.totals.successfulRequests / summary.totals.totalRequests) * 100);
  }, [summary]);

  async function loadSummary() {
    const adminKey = window.localStorage.getItem(ADMIN_KEY_STORAGE)?.trim();
    if (!adminKey) {
      setError("Add your admin key in the dashboard header before viewing usage analytics.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${USAGE_SUMMARY_PROXY_URL}?days=${days}&limit=10`, {
        headers: { "X-Admin-Key": adminKey },
        cache: "no-store",
      });
      const body = (await response.json()) as ApiResponse<UsageSummary>;
      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Failed to load usage summary" : body.error.message);
      }
      setSummary(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load usage summary");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSummary();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const metricCards: Array<{ icon: LucideIcon; label: string; value: number | string }> = [
    { icon: Activity, label: "Requests", value: summary?.totals.totalRequests ?? 0 },
    { icon: ShieldCheck, label: "Success rate", value: `${successRate}%` },
    { icon: AlertTriangle, label: "Failures", value: summary?.totals.failedRequests ?? 0 },
    { icon: Clock, label: "Avg latency", value: `${summary?.totals.averageResponseTimeMs ?? 0}ms` },
    { icon: KeyRound, label: "API keys", value: summary?.totals.uniqueApiKeys ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00D4FF]">Usage telemetry</p>
          <h1 className="mt-2 text-3xl font-bold text-white">API Usage Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#8A94A6]">
            Track endpoint, method, status code, response time, API key ID, tier, and timestamp without storing raw API keys or request payloads.
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((value) => (
            <button key={value} type="button" onClick={() => setDays(value)} className={`rounded-lg border px-3 py-2 text-sm ${days === value ? "border-[#00D4FF] bg-[#00D4FF]/10 text-[#00D4FF]" : "border-[var(--border-line)] text-[#8A94A6]"}`}>
              {value}d
            </button>
          ))}
          <button type="button" onClick={loadSummary} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-line)] px-3 py-2 text-sm text-white">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#FFB800]/30 bg-[#FFB800]/10 p-4 text-sm text-[#FFD36A]">
          <AlertTriangle className="h-5 w-5" /> {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metricCards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-[var(--border-line)] bg-[#111827]/70 p-5">
            <Icon className="h-5 w-5 text-[#00D4FF]" />
            <p className="mt-4 text-sm text-[#8A94A6]">{label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{typeof value === "number" ? formatNumber(value) : value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border-line)] bg-[#111827]/70 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><BarChart3 className="h-5 w-5 text-[#00D4FF]" /> Top endpoints</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-[#8A94A6]"><tr><th className="py-2">Endpoint</th><th>Method</th><th>Count</th><th>Avg</th></tr></thead>
              <tbody className="divide-y divide-[var(--border-line)]">
                {(summary?.byEndpoint ?? []).map((row) => (
                  <tr key={`${row.method}:${row.endpoint}`} className="text-white"><td className="max-w-[280px] truncate py-3 text-[#C7D0DD]">{row.endpoint}</td><td>{row.method}</td><td>{formatNumber(row.count)}</td><td>{row.averageResponseTimeMs}ms</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-line)] bg-[#111827]/70 p-5">
          <h2 className="text-lg font-semibold text-white">Recent requests</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-[#8A94A6]"><tr><th className="py-2">Time</th><th>Endpoint</th><th>Status</th><th>Tier</th><th>API key</th><th>Latency</th></tr></thead>
              <tbody className="divide-y divide-[var(--border-line)]">
                {(summary?.recent ?? []).map((row) => (
                  <tr key={row.id} className="text-white"><td className="py-3 text-[#8A94A6]">{formatDate(row.timestamp)}</td><td className="max-w-[220px] truncate text-[#C7D0DD]">{row.method} {row.endpoint}</td><td className={statusClass(row.statusCode)}>{row.statusCode}</td><td>{row.tier}</td><td className="font-mono text-xs text-[#8A94A6]">{maskId(row.apiKeyId)}</td><td>{row.responseTimeMs}ms</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
