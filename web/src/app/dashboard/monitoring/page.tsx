"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  DatabaseZap,
  Download,
  ExternalLink,
  Eye,
  FileJson,
  Filter,
  KeyRound,
  Link as LinkIcon,
  ListChecks,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  XCircle,
} from "lucide-react";

const MONITORING_OVERVIEW_PROXY_URL = "/api/admin/monitoring/overview";
const MONITORING_DETAIL_PROXY_BASE = "/api/admin/monitoring";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const ADMIN_KEY_STORAGE = "nexus_admin_key";

type DetailResource = "health-checks" | "source-health" | "review-tasks" | "sync-logs" | "sources";

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

type QueueShortcut = {
  label: string;
  count: number;
  resource: DetailResource;
  status: string;
  helper: string;
};

const resourceLabels: Record<DetailResource, string> = {
  "health-checks": "Layer health",
  "source-health": "Source health",
  "review-tasks": "Review tasks",
  "sync-logs": "Sync logs",
  sources: "Source library",
};

const csvColumns = [
  "id",
  "assetSlug",
  "layer",
  "status",
  "severity",
  "priority",
  "field",
  "provider",
  "reason",
  "errorMessage",
  "url",
  "sourceUrl",
  "httpStatus",
  "lastCheckedAt",
  "createdAt",
  "startedAt",
  "resolvedAt",
] as const;

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

function getRowId(row: Record<string, unknown>): string | null {
  return typeof row.id === "string" && row.id.trim() ? row.id : null;
}

function getRowUrl(row: Record<string, unknown>): string | null {
  const url = row.url ?? row.sourceUrl;
  return typeof url === "string" && url.startsWith("http") ? url : null;
}

function rowIssue(row: Record<string, unknown>): string {
  return asText(row.reason ?? row.errorMessage ?? row.message ?? row.notes ?? row.value);
}

function rowStatus(row: Record<string, unknown>): string {
  return asText(row.status ?? row.priority ?? row.severity);
}

function statusClass(status: string): string {
  if (["healthy", "current", "success", "redirected", "closed", "resolved"].includes(status)) {
    return "border-[#00FF88]/30 bg-[#00FF88]/10 text-[#00FF88]";
  }
  if (["broken", "failed", "critical", "error", "high"].includes(status)) {
    return "border-[#FF4444]/30 bg-[#FF4444]/10 text-[#FF8888]";
  }
  return "border-[#FFB800]/30 bg-[#FFB800]/10 text-[#FFB800]";
}

function priorityScore(row: Record<string, unknown>): number {
  const status = rowStatus(row).toLowerCase();
  const priority = asText(row.priority).toLowerCase();
  const severity = asText(row.severity).toLowerCase();
  const text = `${status} ${priority} ${severity}`;

  if (text.includes("critical") || text.includes("error") || text.includes("broken") || text.includes("high")) return 0;
  if (text.includes("timeout") || text.includes("needs-sync") || text.includes("medium")) return 1;
  if (text.includes("restricted") || text.includes("missing") || text.includes("low")) return 2;
  return 3;
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

function buildDetailUrl(resource: DetailResource, assetSlug: string, status: string): string {
  const params = new URLSearchParams({ limit: "250" });
  if (assetSlug.trim()) params.set("assetSlug", assetSlug.trim());
  if (status.trim()) params.set("status", status.trim());
  return `${MONITORING_DETAIL_PROXY_BASE}/${resource}?${params.toString()}`;
}

function buildAssetHref(assetSlug: unknown): string | null {
  const slug = asText(assetSlug);
  if (slug === "—") return null;
  return `/dashboard/assets/${encodeURIComponent(slug)}`;
}

function buildLayerHref(assetSlug: unknown, layer: unknown): string | null {
  const slug = asText(assetSlug);
  const layerName = asText(layer);
  if (slug === "—" || layerName === "—") return null;
  return `/dashboard/layers?assetSlug=${encodeURIComponent(slug)}&layer=${encodeURIComponent(layerName)}`;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/\r?\n|\r/g, " ");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function buildCsv(rows: Array<Record<string, unknown>>): string {
  const header = csvColumns.join(",");
  const body = rows.map((row) => csvColumns.map((column) => csvEscape(row[column])).join(","));
  return [header, ...body].join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

function QueueShortcuts({
  items,
  onSelect,
}: {
  items: QueueShortcut[];
  onSelect: (item: QueueShortcut) => void;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <button
          key={`${item.resource}-${item.status}-${item.label}`}
          type="button"
          onClick={() => onSelect(item)}
          className="data-surface p-4 text-left transition hover:border-[var(--accent-cyan)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="terminal-label mb-2">{item.label}</p>
              <div className="terminal-data text-xl font-semibold text-white">{item.count}</div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">{item.helper}</p>
            </div>
            <PlayCircle className="size-5 text-[var(--accent-cyan)]" />
          </div>
        </button>
      ))}
    </section>
  );
}

function WorkflowRail() {
  const steps = [
    { title: "1. Triage", body: "Mulai dari broken/error source, high review, lalu needs-sync." },
    { title: "2. Verify", body: "Buka source, cek official URL, final redirect, field, dan layer evidence." },
    { title: "3. Repair", body: "Replace source di data layer, sync ulang, atau tandai restricted/deprecated." },
    { title: "4. Close", body: "Close task hanya setelah source valid, layer current, dan audit trail jelas." },
  ];

  return (
    <section className="data-surface p-4">
      <div className="mb-4 flex items-center gap-2">
        <ListChecks className="size-4 text-[var(--accent-cyan)]" />
        <p className="terminal-label">Admin repair workflow</p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step) => (
          <div key={step.title} className="rounded-lg border border-[var(--border-line)] bg-white/[0.025] p-3">
            <p className="text-sm font-semibold text-white">{step.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function IssueTable({
  title,
  rows,
  resource,
  actionLoadingId,
  onView,
  onClose,
  onSourceStatus,
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  resource: DetailResource;
  actionLoadingId: string | null;
  onView: (row: Record<string, unknown>) => void;
  onClose: (row: Record<string, unknown>) => void;
  onSourceStatus: (row: Record<string, unknown>, status: string) => void;
}) {
  return (
    <div className="data-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border-line)] px-4 py-3">
        <p className="terminal-label">{title}</p>
        <span className="text-xs text-[var(--text-secondary)]">{rows.length} rows</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="border-b border-[var(--border-line)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Layer</th>
              <th className="px-4 py-3 font-medium">Issue</th>
              <th className="px-4 py-3 font-medium">Source / Status</th>
              <th className="px-4 py-3 font-medium">Checked</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[var(--text-secondary)]">
                  No records match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const status = rowStatus(row);
                const url = getRowUrl(row);
                const id = getRowId(row);
                const assetHref = buildAssetHref(row.assetSlug);
                const layerHref = buildLayerHref(row.assetSlug, row.layer);
                const loading = Boolean(id && actionLoadingId === id);

                return (
                  <tr key={`${resource}-${id ?? index}`} className="border-b border-[rgba(30,42,58,0.55)] last:border-0">
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-1 text-xs ${statusClass(asText(row.priority ?? row.severity ?? status))}`}>
                        {asText(row.priority ?? row.severity ?? status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 terminal-data text-white">
                      {assetHref ? (
                        <a href={assetHref} className="hover:text-[var(--accent-cyan)] hover:underline">
                          {asText(row.assetSlug)}
                        </a>
                      ) : (
                        asText(row.assetSlug)
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {layerHref ? (
                        <a href={layerHref} className="hover:text-[var(--accent-cyan)] hover:underline">
                          {asText(row.layer)}
                        </a>
                      ) : (
                        asText(row.layer)
                      )}
                    </td>
                    <td className="max-w-[320px] px-4 py-3 text-[var(--text-secondary)]">
                      <span className="line-clamp-2">{rowIssue(row)}</span>
                    </td>
                    <td className="max-w-[360px] px-4 py-3 text-[var(--text-secondary)]">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit rounded-full border px-2 py-1 text-xs ${statusClass(status)}`}>{status}</span>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex max-w-[340px] items-center gap-1 truncate text-xs text-[var(--accent-cyan)] hover:underline"
                          >
                            <span className="truncate">{url}</span>
                            <ExternalLink className="size-3 shrink-0" />
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {formatDate(row.lastCheckedAt ?? row.checkedAt ?? row.createdAt ?? row.startedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onView(row)}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--border-line)] bg-white/[0.03] px-2 py-1 text-xs text-white hover:border-[var(--accent-cyan)]"
                        >
                          <Eye className="size-3" />
                          Detail
                        </button>
                        {resource === "source-health" && id ? (
                          <button
                            type="button"
                            onClick={() => onSourceStatus(row, "healthy")}
                            disabled={loading}
                            className="inline-flex items-center gap-1 rounded-md border border-[#00FF88]/25 bg-[#00FF88]/10 px-2 py-1 text-xs text-[#00FF88] disabled:opacity-60"
                          >
                            <CheckCircle2 className="size-3" />
                            Healthy
                          </button>
                        ) : null}
                        {(resource === "review-tasks" || resource === "health-checks") && id ? (
                          <button
                            type="button"
                            onClick={() => onClose(row)}
                            disabled={loading}
                            className="inline-flex items-center gap-1 rounded-md border border-[#00FF88]/25 bg-[#00FF88]/10 px-2 py-1 text-xs text-[#00FF88] disabled:opacity-60"
                          >
                            <ClipboardCheck className="size-3" />
                            Close
                          </button>
                        ) : null}
                        {resource === "source-health" && id ? (
                          <button
                            type="button"
                            onClick={() => onSourceStatus(row, "deprecated")}
                            disabled={loading}
                            className="inline-flex items-center gap-1 rounded-md border border-[var(--border-line)] bg-white/[0.03] px-2 py-1 text-xs text-[var(--text-secondary)] disabled:opacity-60"
                          >
                            <XCircle className="size-3" />
                            Deprecate
                          </button>
                        ) : null}
                      </div>
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

function DetailPanel({
  row,
  resource,
  onClear,
  onClose,
  onSourceStatus,
  actionLoadingId,
}: {
  row: Record<string, unknown> | null;
  resource: DetailResource;
  onClear: () => void;
  onClose: (row: Record<string, unknown>) => void;
  onSourceStatus: (row: Record<string, unknown>, status: string) => void;
  actionLoadingId: string | null;
}) {
  if (!row) return null;

  const id = getRowId(row);
  const url = getRowUrl(row);
  const assetHref = buildAssetHref(row.assetSlug);
  const layerHref = buildLayerHref(row.assetSlug, row.layer);
  const loading = Boolean(id && actionLoadingId === id);
  const closeNote = JSON.stringify(
    {
      resolvedBy: "admin",
      resolvedAt: new Date().toISOString(),
      action: resource === "source-health" ? "source_status_reviewed" : "monitoring_task_closed",
      assetSlug: asText(row.assetSlug),
      layer: asText(row.layer),
      issue: rowIssue(row),
      sourceUrl: url,
    },
    null,
    2,
  );

  return (
    <section className="data-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border-line)] px-4 py-3">
        <div>
          <p className="terminal-label">Selected work item</p>
          <p className="mt-1 text-sm text-white">
            {asText(row.assetSlug)} · {asText(row.layer)} · {rowStatus(row)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-[var(--border-line)] bg-white/[0.03] px-3 py-1.5 text-xs text-white hover:border-[var(--accent-cyan)]"
        >
          Close panel
        </button>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--border-line)] bg-white/[0.025] p-3">
            <p className="terminal-label mb-2">Issue detail</p>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{rowIssue(row)}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-[var(--border-line)] bg-white/[0.025] p-3">
              <p className="terminal-label mb-2">Asset</p>
              <p className="terminal-data text-white">{asText(row.assetSlug)}</p>
            </div>
            <div className="rounded-lg border border-[var(--border-line)] bg-white/[0.025] p-3">
              <p className="terminal-label mb-2">Layer</p>
              <p className="terminal-data text-white">{asText(row.layer)}</p>
            </div>
            <div className="rounded-lg border border-[var(--border-line)] bg-white/[0.025] p-3">
              <p className="terminal-label mb-2">Field</p>
              <p className="terminal-data text-white">{asText(row.field ?? row.provider ?? "—")}</p>
            </div>
          </div>
          <div className="rounded-lg border border-[var(--border-line)] bg-white/[0.025] p-3">
            <p className="terminal-label mb-2">Resolution audit note</p>
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-[#070B14] p-3 text-xs text-[var(--text-secondary)]">
              {closeNote}
            </pre>
          </div>
        </div>
        <div className="space-y-3">
          <p className="terminal-label">Available actions</p>
          <div className="grid gap-2">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-line)] bg-white/[0.03] px-3 py-2 text-sm text-white hover:border-[var(--accent-cyan)]"
              >
                <LinkIcon className="size-4" />
                Open source
              </a>
            ) : null}
            {assetHref ? (
              <a
                href={assetHref}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-line)] bg-white/[0.03] px-3 py-2 text-sm text-white hover:border-[var(--accent-cyan)]"
              >
                <Wrench className="size-4" />
                Open asset
              </a>
            ) : null}
            {layerHref ? (
              <a
                href={layerHref}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-line)] bg-white/[0.03] px-3 py-2 text-sm text-white hover:border-[var(--accent-cyan)]"
              >
                <FileJson className="size-4" />
                Open layer
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(closeNote)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-line)] bg-white/[0.03] px-3 py-2 text-sm text-white hover:border-[var(--accent-cyan)]"
            >
              <ClipboardCheck className="size-4" />
              Copy close log
            </button>
            {resource === "source-health" && id ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onSourceStatus(row, "healthy")}
                  disabled={loading}
                  className="rounded-md bg-[var(--accent-cyan)] px-3 py-2 text-sm font-semibold text-[#0A0E1A] disabled:opacity-60"
                >
                  Mark healthy
                </button>
                <button
                  type="button"
                  onClick={() => onSourceStatus(row, "restricted")}
                  disabled={loading}
                  className="rounded-md border border-[#FFB800]/30 bg-[#FFB800]/10 px-3 py-2 text-sm font-semibold text-[#FFB800] disabled:opacity-60"
                >
                  Mark restricted
                </button>
                <button
                  type="button"
                  onClick={() => onSourceStatus(row, "deprecated")}
                  disabled={loading}
                  className="rounded-md border border-[var(--border-line)] bg-white/[0.03] px-3 py-2 text-sm text-white disabled:opacity-60 sm:col-span-2"
                >
                  Mark deprecated
                </button>
              </div>
            ) : null}
            {(resource === "review-tasks" || resource === "health-checks") && id ? (
              <button
                type="button"
                onClick={() => onClose(row)}
                disabled={loading}
                className="rounded-md bg-[var(--accent-cyan)] px-3 py-2 text-sm font-semibold text-[#0A0E1A] disabled:opacity-60"
              >
                Close after validation
              </button>
            ) : null}
          </div>
          <div className="rounded-lg border border-[#FFB800]/20 bg-[#FFB800]/5 p-3 text-xs leading-relaxed text-[var(--text-secondary)]">
            Close hanya setelah source valid, data layer sudah diperbaiki, sync/import berhasil, dan audit note sudah aman.
          </div>
        </div>
      </div>
    </section>
  );
}

export default function MonitoringPage() {
  const [adminKey, setAdminKey] = useState("");
  const [savedKey, setSavedKey] = useState(false);
  const [data, setData] = useState<MonitoringOverview | null>(null);
  const [detailRows, setDetailRows] = useState<Array<Record<string, unknown>>>([]);
  const [resource, setResource] = useState<DetailResource>("review-tasks");
  const [assetSlug, setAssetSlug] = useState("");
  const [status, setStatus] = useState("open");
  const [layer, setLayer] = useState("");
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const filteredRows = useMemo(() => {
    const layerQuery = layer.trim().toLowerCase();
    const rows = layerQuery
      ? detailRows.filter((row) => asText(row.layer).toLowerCase().includes(layerQuery))
      : detailRows;
    return [...rows].sort((a, b) => priorityScore(a) - priorityScore(b));
  }, [detailRows, layer]);

  const statusOptions = useMemo(() => {
    const values = new Set<string>();
    for (const row of detailRows) {
      const value = rowStatus(row);
      if (value !== "—") values.add(value);
    }
    return Array.from(values).sort();
  }, [detailRows]);

  const queueShortcuts = useMemo<QueueShortcut[]>(() => {
    if (!data) return [];
    return [
      {
        label: "Fix broken sources",
        count: (data.sourceStatusSummary.error ?? 0) + (data.sourceStatusSummary.broken ?? 0),
        resource: "source-health",
        status: data.sourceStatusSummary.error ? "error" : "broken",
        helper: "Open source, replace/deprecate, then mark healthy.",
      },
      {
        label: "Retry timeout sources",
        count: data.sourceStatusSummary.timeout ?? 0,
        resource: "source-health",
        status: "timeout",
        helper: "Timeout should be rechecked before marked broken.",
      },
      {
        label: "Sync stale layers",
        count: data.healthStatusSummary["needs-sync"] ?? 0,
        resource: "health-checks",
        status: "needs-sync",
        helper: "Run import/sync, validate frontend, then close.",
      },
      {
        label: "Manual review queue",
        count: data.overview.openReviewTasks,
        resource: "review-tasks",
        status: "open",
        helper: "Resolve evidence conflicts and missing source notes.",
      },
    ];
  }, [data]);

  const loadDetailRows = useCallback(
    async (
      key: string,
      selectedResource = resource,
      selectedAssetSlug = assetSlug,
      selectedStatus = status,
    ) => {
      const url = buildDetailUrl(selectedResource, selectedAssetSlug, selectedStatus);
      setDetailLoading(true);
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

        const body = (await response.json()) as ApiResponse<Array<Record<string, unknown>>>;
        if (!response.ok || !body.success) {
          throw new Error(
            `${getErrorMessage(body, response.statusText || "Monitoring detail request failed")} ` +
              `(HTTP ${response.status}, proxy: ${url})`,
          );
        }

        setDetailRows(body.data);
      } finally {
        setDetailLoading(false);
      }
    },
    [assetSlug, resource, status],
  );

  const loadOverview = useCallback(async () => {
    const key = adminKey.trim();

    if (!key) {
      setError("Enter X-Admin-Key first.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(MONITORING_OVERVIEW_PROXY_URL, {
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
            `Monitoring proxy returned non-JSON response. HTTP ${response.status}. Preview: ${preview}`,
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          `${getErrorMessage(body, response.statusText || "Monitoring request failed")} ` +
            `(HTTP ${response.status}, proxy: ${MONITORING_OVERVIEW_PROXY_URL}, upstream API: ${apiBase()})`,
        );
      }

      if (!contentType.includes("application/json")) {
        throw new Error(`Monitoring proxy did not return JSON. Content-Type: ${contentType || "empty"}.`);
      }

      if (!body || typeof body !== "object" || !("success" in body)) {
        throw new Error("Unexpected monitoring response shape.");
      }

      const parsed = body as ApiResponse<MonitoringOverview>;
      if (!parsed.success) {
        throw new Error(`${parsed.error.message} (proxy: ${MONITORING_OVERVIEW_PROXY_URL})`);
      }

      setData(parsed.data);
      window.localStorage.setItem(ADMIN_KEY_STORAGE, key);
      setSavedKey(true);
      await loadDetailRows(key);
    } catch (err) {
      setData(null);
      setDetailRows([]);
      setSelectedRow(null);
      setError(
        err instanceof TypeError
          ? `Network error while calling monitoring proxy. Check that the Next.js web server is running.`
          : err instanceof Error
            ? err.message
            : "Monitoring request failed",
      );
    } finally {
      setLoading(false);
    }
  }, [adminKey, loadDetailRows]);

  const applyQuickFilter = useCallback(
    async (item: QueueShortcut) => {
      setResource(item.resource);
      setStatus(item.status);
      setLayer("");
      setSelectedRow(null);
      await loadDetailRows(adminKey.trim(), item.resource, assetSlug, item.status);
    },
    [adminKey, assetSlug, loadDetailRows],
  );

  const handleExportCsv = useCallback(() => {
    if (filteredRows.length === 0) {
      setError("No filtered monitoring rows to export.");
      return;
    }

    const date = new Date().toISOString().slice(0, 10);
    const parts = ["nexus-rwa-monitoring", resource, date];
    if (assetSlug.trim()) parts.splice(2, 0, assetSlug.trim());
    if (status.trim()) parts.splice(2, 0, status.trim());
    if (layer.trim()) parts.splice(2, 0, layer.trim());

    const safeFilename = `${parts.join("-").replace(/[^a-zA-Z0-9._-]+/g, "-")}.csv`;
    downloadCsv(safeFilename, buildCsv(filteredRows));
  }, [assetSlug, filteredRows, layer, resource, status]);

  const handleCloseRow = useCallback(
    async (row: Record<string, unknown>) => {
      const id = getRowId(row);
      if (!id) {
        setError("This row has no id, so it cannot be closed from the workbench.");
        return;
      }
      if (resource !== "review-tasks" && resource !== "health-checks") {
        setError("Close action is only available for review tasks and layer health checks.");
        return;
      }

      setActionLoadingId(id);
      setError(null);
      setNotice(null);

      try {
        const response = await fetch(`${MONITORING_DETAIL_PROXY_BASE}/${resource}/${encodeURIComponent(id)}/close`, {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "X-Admin-Key": adminKey.trim(),
          },
          cache: "no-store",
        });
        const body = (await response.json()) as ApiResponse<Record<string, unknown>>;
        if (!response.ok || !body.success) {
          throw new Error(getErrorMessage(body, response.statusText || "Close action failed"));
        }

        setNotice(resource === "review-tasks" ? "Review task closed." : "Health check marked current.");
        await loadDetailRows(adminKey.trim());
        setSelectedRow(body.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Close action failed");
      } finally {
        setActionLoadingId(null);
      }
    },
    [adminKey, loadDetailRows, resource],
  );

  const handleSourceStatus = useCallback(
    async (row: Record<string, unknown>, nextStatus: string) => {
      const id = getRowId(row);
      if (!id) {
        setError("This source row has no id, so it cannot be updated from the workbench.");
        return;
      }

      setActionLoadingId(id);
      setError(null);
      setNotice(null);

      try {
        const response = await fetch(`${MONITORING_DETAIL_PROXY_BASE}/source-health/${encodeURIComponent(id)}/status`, {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Admin-Key": adminKey.trim(),
          },
          body: JSON.stringify({ status: nextStatus }),
          cache: "no-store",
        });
        const body = (await response.json()) as ApiResponse<Record<string, unknown>>;
        if (!response.ok || !body.success) {
          throw new Error(getErrorMessage(body, response.statusText || "Source status update failed"));
        }

        setNotice(`Source marked ${nextStatus}.`);
        await loadDetailRows(adminKey.trim());
        setSelectedRow(body.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Source status update failed");
      } finally {
        setActionLoadingId(null);
      }
    },
    [adminKey, loadDetailRows],
  );

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
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">Data Repair Workbench</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Triage source errors, review stale layers, run sync checks, and close resolved dataset issues.
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Monitoring proxy: <span className="terminal-data text-[var(--accent-cyan)]">{MONITORING_OVERVIEW_PROXY_URL}</span>
            <span className="mx-2 text-[var(--text-muted)]">→</span>
            Upstream API: <span className="terminal-data text-[var(--accent-cyan)]">{apiBase()}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOverview()}
          disabled={loading || detailLoading}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-line)] bg-white/[0.03] px-3 py-2 text-sm text-white transition hover:border-[var(--accent-cyan)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${loading || detailLoading ? "animate-spin" : ""}`} />
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
                disabled={loading || detailLoading}
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
        {notice ? (
          <div className="mt-3 rounded-md border border-[#00FF88]/30 bg-[#00FF88]/10 px-3 py-2 text-sm text-[#00FF88]">
            {notice}
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

          <QueueShortcuts items={queueShortcuts} onSelect={(item) => void applyQuickFilter(item)} />

          <WorkflowRail />

          <section className="grid gap-4 lg:grid-cols-2">
            <SummaryPills title="Health status" data={data.healthStatusSummary} />
            <SummaryPills title="Source status" data={data.sourceStatusSummary} />
            <SummaryPills title="Health severity" data={data.healthSeveritySummary} />
            <SummaryPills title="Review priority" data={data.reviewPrioritySummary} />
          </section>

          <section className="data-surface p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-[var(--accent-cyan)]" />
                <p className="terminal-label">Monitoring filters</p>
              </div>
              <span className="text-xs text-[var(--text-secondary)] sm:ml-auto">
                Showing {filteredRows.length}/{detailRows.length} rows
              </span>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredRows.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-line)] bg-white/[0.03] px-3 py-2 text-sm text-white transition hover:border-[var(--accent-cyan)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="size-4" />
                Export CSV
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <label className="terminal-label mb-2 block">Dataset</label>
                <select
                  value={resource}
                  onChange={(event) => {
                    setResource(event.target.value as DetailResource);
                    setSelectedRow(null);
                  }}
                  className="w-full rounded-md border border-[var(--border-line)] bg-[#0A0E1A] px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--accent-cyan)]"
                >
                  {Object.entries(resourceLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="terminal-label mb-2 block">Asset slug</label>
                <input
                  value={assetSlug}
                  onChange={(event) => setAssetSlug(event.target.value)}
                  placeholder="ondo-ousg"
                  className="w-full rounded-md border border-[var(--border-line)] bg-[#0A0E1A] px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--accent-cyan)]"
                />
              </div>
              <div>
                <label className="terminal-label mb-2 block">Status / priority</label>
                <input
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  list="monitoring-status-options"
                  placeholder="broken / open / current"
                  className="w-full rounded-md border border-[var(--border-line)] bg-[#0A0E1A] px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--accent-cyan)]"
                />
                <datalist id="monitoring-status-options">
                  {statusOptions.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="terminal-label mb-2 block">Layer</label>
                <input
                  value={layer}
                  onChange={(event) => setLayer(event.target.value)}
                  placeholder="reserve / market"
                  className="w-full rounded-md border border-[var(--border-line)] bg-[#0A0E1A] px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--accent-cyan)]"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => void loadDetailRows(adminKey.trim())}
                  disabled={detailLoading || !adminKey.trim()}
                  className="flex-1 rounded-md bg-[var(--accent-cyan)] px-4 py-2 text-sm font-semibold text-[#0A0E1A] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssetSlug("");
                    setStatus("");
                    setLayer("");
                    setSelectedRow(null);
                  }}
                  className="rounded-md border border-[var(--border-line)] bg-white/[0.03] px-3 py-2 text-sm text-white transition hover:border-[var(--accent-cyan)]"
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <DetailPanel
            row={selectedRow}
            resource={resource}
            onClear={() => setSelectedRow(null)}
            onClose={handleCloseRow}
            onSourceStatus={handleSourceStatus}
            actionLoadingId={actionLoadingId}
          />

          <section className="grid gap-4">
            <IssueTable
              title={`${resourceLabels[resource]} work queue`}
              rows={filteredRows}
              resource={resource}
              actionLoadingId={actionLoadingId}
              onView={setSelectedRow}
              onClose={handleCloseRow}
              onSourceStatus={handleSourceStatus}
            />
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
