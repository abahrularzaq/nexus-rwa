export type SourceHealthCategory = 'healthy' | 'restricted' | 'broken';

export type SourceHealthSummary = {
  healthy: number;
  restricted: number;
  watch: number;
  broken: number;
  total: number;
  healthPercentage: number;
};

type SourceHealthStatusRow = {
  status?: string | null;
};

const HEALTHY_STATUSES = new Set(['healthy', 'redirected', 'verified']);
const RESTRICTED_WATCH_STATUSES = new Set(['restricted', 'timeout', 'stale', 'conflicting', 'needs_review']);
const BROKEN_STATUSES = new Set(['broken', 'error', 'deprecated', 'unavailable']);

// Canonical Source Health mapping. These are all statuses already used by the
// repo across URL checker health rows and source verification rows.
export const SOURCE_HEALTH_STATUS_MAPPING = {
  healthy: [...HEALTHY_STATUSES],
  restricted: [...RESTRICTED_WATCH_STATUSES],
  broken: [...BROKEN_STATUSES],
} as const;

function normalizeSourceHealthStatus(status: unknown): string {
  return String(status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function classifySourceHealthStatus(status: unknown): SourceHealthCategory | null {
  const normalized = normalizeSourceHealthStatus(status);
  if (HEALTHY_STATUSES.has(normalized)) return 'healthy';
  if (RESTRICTED_WATCH_STATUSES.has(normalized)) return 'restricted';
  if (BROKEN_STATUSES.has(normalized)) return 'broken';
  return null;
}

export function buildSourceHealthSummary(rows: SourceHealthStatusRow[]): SourceHealthSummary {
  const summary = rows.reduce<SourceHealthSummary>((acc, row) => {
    const category = classifySourceHealthStatus(row.status);
    if (!category) return acc;

    acc[category] += 1;
    acc.total += 1;
    return acc;
  }, { healthy: 0, restricted: 0, watch: 0, broken: 0, total: 0, healthPercentage: 0 });

  summary.watch = summary.restricted;
  summary.healthPercentage = summary.total === 0 ? 0 : Math.round((summary.healthy / summary.total) * 100);
  return summary;
}
