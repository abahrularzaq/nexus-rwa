export type MonitoringReviewContext = {
  issueId: string;
  issueType: string;
  assetSlug: string;
  layer: string;
  fieldPath: string;
  problem: string;
  suggestedAction: string;
  timestamp: string;
  sourceUrl: string | null;
};

type ReviewableMonitoringRow = {
  id?: unknown;
  type?: unknown;
  resource?: unknown;
  assetSlug?: unknown;
  layer?: unknown;
  problem?: unknown;
  suggestedAction?: unknown;
  sourceUrl?: unknown;
  createdAt?: unknown;
  lastCheckedAt?: unknown;
  raw?: Record<string, unknown>;
};

const EMPTY_TEXT_VALUES = new Set(["", "-", "\u2014", "\u00e2\u20ac\u201d", "\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u009d"]);

function displayText(value: unknown): string {
  if (value === null || value === undefined) return "N/A";
  const text = String(value).trim();
  return EMPTY_TEXT_VALUES.has(text) ? "N/A" : text;
}

function firstDisplayText(...values: unknown[]): string {
  for (const value of values) {
    const text = displayText(value);
    if (text !== "N/A") return text;
  }
  return "N/A";
}

function sourceUrlFrom(row: ReviewableMonitoringRow): string | null {
  const url = row.sourceUrl ?? row.raw?.sourceUrl ?? row.raw?.url;
  return typeof url === "string" && /^https?:\/\//i.test(url) ? url : null;
}

export function buildMonitoringReviewContext(row: ReviewableMonitoringRow): MonitoringReviewContext {
  const raw = row.raw ?? {};
  const issueId = firstDisplayText(row.id, raw.id);
  const issueType = firstDisplayText(row.type, row.resource, raw.type, raw.resource);
  const assetSlug = firstDisplayText(row.assetSlug, raw.assetSlug, raw.asset, raw.slug);
  const layer = firstDisplayText(row.layer, raw.layer, raw.layerName, raw.provider, raw.jobName);
  const fieldPath = firstDisplayText(raw.field, raw.fieldPath, raw.path, raw.provider, raw.jobName);
  const problem = firstDisplayText(row.problem, raw.problem, raw.reason, raw.errorMessage, raw.message, raw.notes, raw.value);
  const suggestedAction = firstDisplayText(row.suggestedAction, raw.suggestedAction);
  const timestamp = firstDisplayText(row.lastCheckedAt, row.createdAt, raw.lastCheckedAt, raw.checkedAt, raw.createdAt, raw.startedAt);

  return {
    issueId,
    issueType,
    assetSlug,
    layer,
    fieldPath,
    problem,
    suggestedAction,
    timestamp,
    sourceUrl: sourceUrlFrom(row),
  };
}

export function withMonitoringReviewContext<T extends ReviewableMonitoringRow>(row: T): T & { reviewContext: MonitoringReviewContext } {
  return {
    ...row,
    reviewContext: buildMonitoringReviewContext(row),
  };
}
