"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  DatabaseZap,
  ExternalLink,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const ADMIN_KEY_STORAGE = "nexus_admin_key";

type MonitoringOverview = {
  generatedAt: string;
  overview: {
    totalHealthChecks: number;
    totalSourceChecks: number;
    openReviewTasks: number;
    failedOrNonSuccessSyncLogs: number;
  };
  healthStatusSummary: Record<string, number>;
  healthSeveritySummary: Record<string, number>;
  sourceStatusSummary: Record<string, number>;
  reviewPrioritySummary: Record<string, number>;
  recentHealthIssues: Array<Record<string, unknown>>;
  recentSourceIssues: Array<Record<string, unknown>>;
  recentReviewTasks: Array<Record<string, unknown>>;
  failedSyncLogs: Array<Record<string, unknown>>;
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function apiBase(): string {
  return API_URL.trim().replace(/\/$/, "");
}

function formatDate(value: unknown): string {
  if (!value || typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function asText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function statusClass(status: string): string {
  if (["healthy", "current", "success", "redirected"].includes(status)) {
    return "border-[#00FF88]/30 bg-[#00FF88]/10 text-[#00FF88]";
  }
  if (["broken", "failed", "critical"].includes(status)) {
    return "border-[#FF4444]/30 bg-[#FF4444]/10 text-[#FF8888]";
  }
  return "border-[#FFB800]/30 bg-[#FFB800]/10 text-[#FFB800]";
}

function getErrorMessage(body: unknown, fallback: string): string {
  if (
    body &&
    typeof body === "object" &&
    "success" in body &&
    (body as { success?: unknown }).success === false &&
    "error" in body
  ) {
    const error = (body as { error?: unknown }).error;
    if (error && typeof error === "object" && "message" in error) {
      return String((error as { message?: unknown }).message ?? fallback);
    }
  }
  return fallback;
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  helper: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="data-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="terminal-label mb-2">{label}</p>
          <div className="terminal-data text-2xl font-semibold text-white">{value}</div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">{helper}</p>
        </div>
        <div className="rounded-lg border border-[var(--border-line)] bg-white/[0.03] p-2 text-[var(--accent-cyan)]">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function SummaryPills({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data ?? {});

  return (
    <div className="data-surface p-4">
      <p className="terminal-label mb-3">{title}</p>
      <div className="flex flex-wrap gap-2">
        {entries.length === 0 ? (
          <span className="text-sm text-[var(--text-secondary)]">No data</span>
        ) : (
          entries.map(([key, value]) => (
            <span
              key={key}
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(key)}`}
            >
              <span>{key}</span>
              <span className="terminal-data">{value}</span>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function IssueTable({
  title,
  rows,
  type,
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  type: "health" | "source" | "task" | "sync";
}) {
  return (
    <div className="data-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border-line)] px-4 py-3">
        <p className="terminal-label">{title}</p>
        <span className="text-xs text-[var(--text-secondary)]">{rows.length} shown</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[var(--border-line)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Layer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Field / Priority</th>
              <th className="px-4 py-3 font-medium">Reason / URL</th>
              <th className="px-4 py-3 font-medium">Checked</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[var(--text-secondary)]">
                  No records.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const status = asText(row.status ?? row.priority);
                const url = typeof row.url === "string" ? row.url : null;
                return (
                  <tr key={`${type}-${index}`} className="border-b border-[rgba(30,42,58,0.55)] last:border-0">
                    <td className="px-4 py-3 terminal-data text-white">{asText(row.assetSlug)}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{asText(row.layer)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-1 text-xs ${statusClass(status)}`}>{status}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {asText(row.field ?? row.priority ?? row.provider)}
                    </td>
                    <td className="max-w-[360px] px-4 py-3 text-[var(--text-secondary)]">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-[340px] items-center gap-1 truncate text-[var(--accent-cyan)] hover:underline"
                        >
                          <span className="truncate">{url}</span>
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="line-clamp-2">{asText(row.reason ?? row.errorMessage)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {formatDate(row.lastCheckedAt ?? row.createdAt ?? row.startedAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  const [adminKey, setAdminKey] = useState("");
  const [savedKey, setSavedKey] = useState(false);
  const [data, setData] = useState<MonitoringOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
    setAdminKey(stored);
    setSavedKey(Boolean(stored));
  }, []);

  const healthScore = useMemo(() => {
    if (!data) return "—";
    const healthy = data.healthStatusSummary.current ?? 0;
    const total = data.overview.totalHealthChecks || 1;
    return `${Math.round((healthy / total) * 100)}%`;
  }, [data]);

  const sourceScore = useMemo(() => {
    if (!data) return "—";
    const ok = (data.sourceStatusSummary.healthy ?? 0) + (data.sourceStatusSummary.redirected ?? 0);
    const total = data.overview.totalSourceChecks || 1;
    return `${Math.round((ok / total) * 100)}%`;
  }, [data]);

  const loadOverview = useCallback(async () => {
    const key = adminKey.trim();
    const url = `${apiBase()}/v1/admin/monitoring/overview`;

    if (!key) {
      setError("Enter X-Admin-Key first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Admin-Key": key,
        },
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type") ?? "";
      const rawText = await response.text();
      let body: unknown = null;

      if (rawText) {
        try {
          body = JSON.parse(rawText) as ApiResponse<MonitoringOverview>;
        } catch {
          const preview = rawText.slice(0, 180).replace(/\s+/g, " ");
          throw new Error(
            `Monitoring API returned non-JSON response. HTTP ${response.status}. URL: ${url}. Preview: ${preview}`,
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          `${getErrorMessage(body, response.statusText || "Monitoring request failed")} ` +
            `(HTTP ${response.status}, API: ${url})`,
        );
      }

      if (!contentType.includes("application/json")) {
        throw new Error(`Monitoring API did not return JSON. Content-Type: ${contentType || "empty"}. API: ${url}`);
      }

      if (!body || typeof body !== "object" || !("success" in body)) {
        throw new Error(`Unexpected monitoring response shape. API: ${url}`);
      }

      const parsed = body as ApiResponse<MonitoringOverview>;
      if (!parsed.success) {
        throw new Error(`${parsed.error.message} (API: ${url})`);
      }

      setData(parsed.data);
      window.localStorage.setItem(ADMIN_KEY_STORAGE, key);
      setSavedKey(true);
    } catch (err) {
      setData(null);
      setError(
        err instanceof TypeError
          ? `Network/CORS error while calling ${url}. Check NEXT_PUBLIC_API_URL, FRONTEND_URL, and allowed CORS headers on the API.`
          : err instanceof Error
            ? err.message
            : "Monitoring request failed",
      );
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (!adminKey) return;
    void loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-[var(--border-line)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="terminal-label mb-1.5">Admin monitoring</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">Data Health Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Freshness, source health, review queue, and sync monitoring for Nexus RWA dataset.
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            API target: <span className="terminal-data text-[var(--accent-cyan)]">{apiBase()}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOverview()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-line)] bg-white/[0.03] px-3 py-2 text-sm text-white transition hover:border-[var(--accent-cyan)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <section className="data-surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="terminal-label mb-2 block">X-Admin-Key</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={adminKey}
                  onChange={(event) => setAdminKey(event.target.value)}
                  type="password"
                  placeholder="Paste local ADMIN_API_KEY"
                  autoComplete="off"
                  className="w-full rounded-md border border-[var(--border-line)] bg-[#0A0E1A] py-2 pl-9 pr-3 text-sm text-white outline-none transition focus:border-[var(--accent-cyan)]"
                />
              </div>
              <button
                type="button"
                onClick={() => void loadOverview()}
                disabled={loading}
                className="rounded-md bg-[var(--accent-cyan)] px-4 py-2 text-sm font-semibold text-[#0A0E1A] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Load monitoring
              </button>
            </div>
          </div>
          <p className="max-w-md text-xs text-[var(--text-secondary)]">
            The key is stored only in this browser localStorage as <span className="terminal-data">nexus_admin_key</span>.
          </p>
        </div>
        {error ? (
          <div className="mt-3 rounded-md border border-[#FF4444]/30 bg-[#FF4444]/10 px-3 py-2 text-sm text-[#FF8888]">
            {error}
          </div>
        ) : null}
      </section>

      {data ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Dataset health"
              value={healthScore}
              helper={`${data.healthStatusSummary.current ?? 0}/${data.overview.totalHealthChecks} layers current`}
              icon={ShieldCheck}
            />
            <StatCard
              label="Source health"
              value={sourceScore}
              helper={`${data.sourceStatusSummary.healthy ?? 0} healthy, ${data.sourceStatusSummary.broken ?? 0} broken`}
              icon={DatabaseZap}
            />
            <StatCard
              label="Open tasks"
              value={data.overview.openReviewTasks}
              helper="Manual review queue"
              icon={AlertTriangle}
            />
            <StatCard
              label="Sync issues"
              value={data.overview.failedOrNonSuccessSyncLogs}
              helper="Non-success sync logs"
              icon={ShieldAlert}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <SummaryPills title="Health status" data={data.healthStatusSummary} />
            <SummaryPills title="Source status" data={data.sourceStatusSummary} />
            <SummaryPills title="Health severity" data={data.healthSeveritySummary} />
            <SummaryPills title="Review priority" data={data.reviewPrioritySummary} />
          </section>

          <section className="grid gap-4">
            <IssueTable title="Recent health issues" rows={data.recentHealthIssues} type="health" />
            <IssueTable title="Recent source issues" rows={data.recentSourceIssues} type="source" />
            <IssueTable title="Recent open review tasks" rows={data.recentReviewTasks} type="task" />
            <IssueTable title="Recent failed sync logs" rows={data.failedSyncLogs} type="sync" />
          </section>

          <p className="text-xs text-[var(--text-muted)]">Last generated: {formatDate(data.generatedAt)}</p>
        </>
      ) : (
        <div className="data-surface p-8 text-center text-sm text-[var(--text-secondary)]">
          Enter admin key and load monitoring overview.
        </div>
      )}
    </div>
  );
}
