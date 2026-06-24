export type MonitoringStatus = 'fresh' | 'watch' | 'stale' | 'incomplete';
export type MonitoringPriority = 'high' | 'medium' | 'low';
export type MonitoringSeverity = 'critical' | 'high' | 'medium' | 'low';

export type MonitoringAssetScore = {
  assetSlug: string;
  status: MonitoringStatus;
  score: number;
  staleData: number;
  missingSource: number;
  lowConfidenceSource: number;
  incompleteLayer: number;
  totalIssues: number;
  primaryReason: string | null;
  openIssueCount: number;
  highestSeverity: MonitoringSeverity | null;
  lastCheckedAt: string | null;
};

type HealthLike = { assetSlug: string; status: string; layer: string; severity?: string | null; reason?: string | null; lastCheckedAt?: Date | string | null };
type SourceLike = { assetSlug: string; status: string; reliability?: number | null; url?: string | null; layer?: string | null; field?: string | null; errorMessage?: string | null; lastCheckedAt?: Date | string | null };

type SourceRowLike = { sourceUrl?: string | null; reliability?: number | null; layer?: string | null; checkedAt?: Date | string | null };
type ReviewTaskLike = { assetSlug: string; priority?: string | null; layer?: string | null; reason?: string | null; status?: string | null; createdAt?: Date | string | null; reopenedAt?: Date | string | null };
type SyncLogLike = { assetSlug: string; status: string; layer?: string | null; provider?: string | null; errorMessage?: string | null; startedAt?: Date | string | null };

type Options = {
  expectedLayersByAsset?: Map<string, string[]>;
  sourceRowsByAsset?: Map<string, SourceRowLike[]>;
  assetPriorityByAsset?: Map<string, string | null | undefined>;
  reviewTasks?: ReviewTaskLike[];
  syncLogs?: SyncLogLike[];
};

type ReasonCandidate = {
  priority: number;
  severity: MonitoringSeverity;
  reason: string;
  checkedAt?: Date | string | null;
};

const LAYER_WEIGHTS: Record<string, number> = {
  legal: 1.6,
  reserve: 1.6,
  compliance: 1.6,
  market: 1.15,
  liquidity: 1.15,
  metadata: 0.65,
};

const PRIORITY_WEIGHTS: Record<MonitoringPriority, number> = {
  high: 1.25,
  medium: 1,
  low: 0.75,
};

function uniqueLatestBy<T>(items: T[], keyFor: (item: T) => string): T[] {
  const unique = new Map<string, T>();
  for (const item of items) {
    const key = keyFor(item);
    if (!unique.has(key)) unique.set(key, item);
  }
  return [...unique.values()];
}

function layerWeight(layer?: string | null): number {
  if (!layer) return 1;
  return LAYER_WEIGHTS[layer.toLowerCase()] ?? 1;
}

function normalizePriority(priority?: string | null): MonitoringPriority {
  const normalized = priority?.trim().toLowerCase();
  return normalized === 'high' || normalized === 'low' ? normalized : 'medium';
}

function normalizeSeverity(value?: string | null): MonitoringSeverity {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'critical' || normalized === 'high' || normalized === 'low') return normalized;
  return 'medium';
}

function severityRank(severity: MonitoringSeverity): number {
  return ({ critical: 4, high: 3, medium: 2, low: 1 })[severity];
}

function weightedPenalty(basePenalty: number, layer?: string | null, priority: MonitoringPriority = 'medium'): number {
  return basePenalty * layerWeight(layer) * PRIORITY_WEIGHTS[priority];
}

function layerLabel(layer?: string | null): string {
  return layer?.trim() || 'asset';
}

function formatReason(prefix: string, layer?: string | null, detail?: string | null): string {
  return detail?.trim() ? `${prefix}: ${layerLabel(layer)} (${detail.trim()})` : `${prefix}: ${layerLabel(layer)}`;
}

function toTimestamp(value?: Date | string | null): number {
  if (!value) return 0;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function latestIso(values: Array<Date | string | null | undefined>): string | null {
  const latest = values.reduce((max, value) => Math.max(max, toTimestamp(value)), 0);
  return latest > 0 ? new Date(latest).toISOString() : null;
}

function pickPrimaryReason(candidates: ReasonCandidate[]): string | null {
  const [primary] = [...candidates].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const severityDiff = severityRank(b.severity) - severityRank(a.severity);
    if (severityDiff !== 0) return severityDiff;
    return toTimestamp(b.checkedAt) - toTimestamp(a.checkedAt);
  });
  return primary?.reason ?? null;
}

function pickHighestSeverity(candidates: ReasonCandidate[]): MonitoringSeverity | null {
  const [highest] = [...candidates].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  return highest?.severity ?? null;
}

export function buildAssetMonitoringScores(
  healthChecks: HealthLike[],
  sourceHealth: SourceLike[],
  options: Options = {},
): MonitoringAssetScore[] {
  const assetSlugs = new Set<string>();
  for (const row of healthChecks) assetSlugs.add(row.assetSlug);
  for (const row of sourceHealth) assetSlugs.add(row.assetSlug);
  for (const assetSlug of options.expectedLayersByAsset?.keys() ?? []) assetSlugs.add(assetSlug);
  for (const assetSlug of options.sourceRowsByAsset?.keys() ?? []) assetSlugs.add(assetSlug);
  for (const assetSlug of options.assetPriorityByAsset?.keys() ?? []) assetSlugs.add(assetSlug);
  for (const row of options.reviewTasks ?? []) assetSlugs.add(row.assetSlug);
  for (const row of options.syncLogs ?? []) assetSlugs.add(row.assetSlug);

  return [...assetSlugs].sort().map((assetSlug) => {
    const latestHealth = uniqueLatestBy(
      healthChecks.filter((row) => row.assetSlug === assetSlug),
      (row) => `${row.layer}`,
    );
    const assetSources = sourceHealth.filter((row) => row.assetSlug === assetSlug);
    const sourceRows = options.sourceRowsByAsset?.get(assetSlug) ?? [];
    const reviewTasks = (options.reviewTasks ?? []).filter((row) => row.assetSlug === assetSlug);
    const syncLogs = (options.syncLogs ?? []).filter((row) => row.assetSlug === assetSlug);
    const expectedLayers = options.expectedLayersByAsset?.get(assetSlug) ?? [];
    const presentLayers = new Set(latestHealth.map((row) => row.layer));
    const priority = normalizePriority(options.assetPriorityByAsset?.get(assetSlug));

    const staleRows = latestHealth.filter((row) => row.status === 'stale');
    const healthWatchRows = latestHealth.filter((row) => !['current', 'resolved', 'stale'].includes(row.status));
    const missingSourceRows = sourceRows.filter((source) => !source.sourceUrl);
    const missingSource = missingSourceRows.length + (sourceRows.length === 0 ? 1 : 0);
    const lowConfidenceRows = sourceRows.filter((source) => typeof source.reliability === 'number' && source.reliability < 3);
    const sourceWatchRows = assetSources.filter((source) => source.status === 'restricted');
    const sourceIssueRows = assetSources.filter((source) => ['deprecated', 'broken', 'error'].includes(source.status));
    const incompleteLayers = expectedLayers.filter((layer) => !presentLayers.has(layer));

    const staleData = staleRows.length;
    const healthWatch = healthWatchRows.length;
    const lowConfidenceSource = lowConfidenceRows.length;
    const sourceWatch = sourceWatchRows.length;
    const sourceIssues = sourceIssueRows.length;
    const incompleteLayer = incompleteLayers.length;
    const totalIssues = staleData + healthWatch + missingSource + lowConfidenceSource + sourceWatch + sourceIssues + incompleteLayer;
    const reasonCandidates: ReasonCandidate[] = [
      ...reviewTasks
        .filter((row) => ['critical', 'high'].includes(row.priority?.toLowerCase() ?? ''))
        .map((row) => ({
          priority: 10,
          severity: normalizeSeverity(row.priority),
          reason: formatReason(`${normalizeSeverity(row.priority)} review issue`, row.layer, row.reason),
          checkedAt: row.reopenedAt ?? row.createdAt,
        })),
      ...reviewTasks
        .filter((row) => !['critical', 'high'].includes(row.priority?.toLowerCase() ?? ''))
        .map((row) => ({
          priority: 95,
          severity: normalizeSeverity(row.priority),
          reason: formatReason(`${normalizeSeverity(row.priority)} review issue`, row.layer, row.reason),
          checkedAt: row.reopenedAt ?? row.createdAt,
        })),
      ...sourceIssueRows.map((row) => ({
        priority: 20,
        severity: normalizeSeverity(row.status === 'broken' || row.status === 'error' ? 'high' : 'medium'),
        reason: formatReason(`${row.status} source`, row.layer, row.errorMessage ?? row.url),
        checkedAt: row.lastCheckedAt,
      })),
      ...syncLogs.map((row) => ({
        priority: 30,
        severity: normalizeSeverity(row.status === 'failed' || row.status === 'error' ? 'high' : 'medium'),
        reason: formatReason(`${row.status} sync`, row.layer, row.errorMessage ?? row.provider),
        checkedAt: row.startedAt,
      })),
      ...staleRows.map((row) => ({
        priority: 40,
        severity: normalizeSeverity(row.severity),
        reason: formatReason('stale layer', row.layer, row.reason ?? row.status),
        checkedAt: row.lastCheckedAt,
      })),
      ...missingSourceRows.map((row) => ({
        priority: 50,
        severity: normalizeSeverity('medium'),
        reason: formatReason('missing source', row.layer),
        checkedAt: row.checkedAt,
      })),
      ...(sourceRows.length === 0
        ? [{
            priority: 50,
            severity: normalizeSeverity('medium'),
            reason: 'missing source: asset has no source records',
          }]
        : []),
      ...lowConfidenceRows.map((row) => ({
        priority: 60,
        severity: normalizeSeverity('low'),
        reason: formatReason('low confidence source', row.layer, typeof row.reliability === 'number' ? `reliability ${row.reliability}` : null),
        checkedAt: row.checkedAt,
      })),
      ...incompleteLayers.map((layer) => ({
        priority: 70,
        severity: normalizeSeverity('medium'),
        reason: formatReason('incomplete layer', layer),
      })),
      ...healthWatchRows.map((row) => ({
        priority: 80,
        severity: normalizeSeverity(row.severity),
        reason: formatReason('layer needs review', row.layer, row.reason ?? row.status),
        checkedAt: row.lastCheckedAt,
      })),
      ...sourceWatchRows.map((row) => ({
        priority: 90,
        severity: normalizeSeverity('low'),
        reason: formatReason('restricted source', row.layer, row.url),
        checkedAt: row.lastCheckedAt,
      })),
    ];

    const penalty = [
      ...staleRows.map((row) => weightedPenalty(20, row.layer, priority)),
      ...healthWatchRows.map((row) => weightedPenalty(10, row.layer, priority)),
      ...missingSourceRows.map((row) => weightedPenalty(20, row.layer, priority)),
      sourceRows.length === 0 ? weightedPenalty(20, undefined, priority) : 0,
      ...lowConfidenceRows.map((row) => weightedPenalty(8, row.layer, priority)),
      ...sourceIssueRows.map((row) => weightedPenalty(12, row.layer, priority)),
      ...incompleteLayers.map((layer) => weightedPenalty(20, layer, priority)),
    ].reduce((sum, value) => sum + value, 0);

    const score = Math.max(0, Math.round(100 - penalty));
    const status: MonitoringStatus = incompleteLayer > 0 || missingSource > 0 ? 'incomplete' : staleData > 0 || sourceIssues > 0 ? 'stale' : healthWatch > 0 || sourceWatch > 0 || lowConfidenceSource > 0 || score < 90 ? 'watch' : 'fresh';
    const openIssueCount = totalIssues + reviewTasks.length + syncLogs.length;
    const lastCheckedAt = latestIso([
      ...latestHealth.map((row) => row.lastCheckedAt),
      ...assetSources.map((row) => row.lastCheckedAt),
      ...sourceRows.map((row) => row.checkedAt),
      ...reviewTasks.map((row) => row.reopenedAt ?? row.createdAt),
      ...syncLogs.map((row) => row.startedAt),
    ]);

    return {
      assetSlug,
      status,
      score,
      staleData,
      missingSource,
      lowConfidenceSource,
      incompleteLayer,
      totalIssues,
      primaryReason: status === 'fresh' ? null : pickPrimaryReason(reasonCandidates),
      openIssueCount,
      highestSeverity: openIssueCount > 0 ? pickHighestSeverity(reasonCandidates) : null,
      lastCheckedAt,
    };
  });
}
