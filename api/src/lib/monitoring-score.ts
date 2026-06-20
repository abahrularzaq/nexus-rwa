export type MonitoringStatus = 'fresh' | 'watch' | 'stale' | 'incomplete';
export type MonitoringPriority = 'high' | 'medium' | 'low';

export type MonitoringAssetScore = {
  assetSlug: string;
  status: MonitoringStatus;
  score: number;
  staleData: number;
  missingSource: number;
  lowConfidenceSource: number;
  incompleteLayer: number;
  totalIssues: number;
};

type HealthLike = { assetSlug: string; status: string; layer: string };
type SourceLike = { assetSlug: string; status: string; reliability?: number | null; url?: string | null; layer?: string | null };

type SourceRowLike = { sourceUrl?: string | null; reliability?: number | null; layer?: string | null };

type Options = {
  expectedLayersByAsset?: Map<string, string[]>;
  sourceRowsByAsset?: Map<string, SourceRowLike[]>;
  assetPriorityByAsset?: Map<string, string | null | undefined>;
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

function weightedPenalty(basePenalty: number, layer?: string | null, priority: MonitoringPriority = 'medium'): number {
  return basePenalty * layerWeight(layer) * PRIORITY_WEIGHTS[priority];
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

  return [...assetSlugs].sort().map((assetSlug) => {
    const latestHealth = uniqueLatestBy(
      healthChecks.filter((row) => row.assetSlug === assetSlug),
      (row) => `${row.layer}`,
    );
    const assetSources = sourceHealth.filter((row) => row.assetSlug === assetSlug);
    const sourceRows = options.sourceRowsByAsset?.get(assetSlug) ?? [];
    const expectedLayers = options.expectedLayersByAsset?.get(assetSlug) ?? [];
    const presentLayers = new Set(latestHealth.map((row) => row.layer));
    const priority = normalizePriority(options.assetPriorityByAsset?.get(assetSlug));

    const staleRows = latestHealth.filter((row) => row.status === 'stale');
    const healthWatchRows = latestHealth.filter((row) => !['current', 'stale'].includes(row.status));
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

    return { assetSlug, status, score, staleData, missingSource, lowConfidenceSource, incompleteLayer, totalIssues };
  });
}
