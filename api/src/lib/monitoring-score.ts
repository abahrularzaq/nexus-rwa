export type MonitoringStatus = 'fresh' | 'watch' | 'stale' | 'incomplete';

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
type SourceLike = { assetSlug: string; status: string; reliability?: number | null; url?: string | null };

type Options = {
  expectedLayersByAsset?: Map<string, string[]>;
  sourceRowsByAsset?: Map<string, Array<{ sourceUrl?: string | null; reliability?: number | null }>>;
};

function uniqueLatestBy<T>(items: T[], keyFor: (item: T) => string): T[] {
  const unique = new Map<string, T>();
  for (const item of items) {
    const key = keyFor(item);
    if (!unique.has(key)) unique.set(key, item);
  }
  return [...unique.values()];
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

  return [...assetSlugs].sort().map((assetSlug) => {
    const latestHealth = uniqueLatestBy(
      healthChecks.filter((row) => row.assetSlug === assetSlug),
      (row) => `${row.layer}`,
    );
    const assetSources = sourceHealth.filter((row) => row.assetSlug === assetSlug);
    const sourceRows = options.sourceRowsByAsset?.get(assetSlug) ?? [];
    const expectedLayers = options.expectedLayersByAsset?.get(assetSlug) ?? [];
    const presentLayers = new Set(latestHealth.map((row) => row.layer));

    const staleData = latestHealth.filter((row) => row.status === 'stale').length;
    const healthWatch = latestHealth.filter((row) => !['current', 'stale'].includes(row.status)).length;
    const missingSource = sourceRows.filter((source) => !source.sourceUrl).length + (sourceRows.length === 0 ? 1 : 0);
    const lowConfidenceSource = sourceRows.filter((source) => typeof source.reliability === 'number' && source.reliability < 3).length;
    const sourceWatch = assetSources.filter((source) => source.status === 'restricted').length;
    const sourceIssues = assetSources.filter((source) => ['deprecated', 'broken', 'error'].includes(source.status)).length;
    const incompleteLayer = expectedLayers.filter((layer) => !presentLayers.has(layer)).length;
    const totalIssues = staleData + healthWatch + missingSource + lowConfidenceSource + sourceWatch + sourceIssues + incompleteLayer;
    const score = Math.max(0, 100 - staleData * 20 - healthWatch * 10 - missingSource * 20 - lowConfidenceSource * 8 - sourceIssues * 12 - incompleteLayer * 20);
    const status: MonitoringStatus = incompleteLayer > 0 || missingSource > 0 ? 'incomplete' : staleData > 0 || sourceIssues > 0 ? 'stale' : healthWatch > 0 || sourceWatch > 0 || lowConfidenceSource > 0 || score < 90 ? 'watch' : 'fresh';

    return { assetSlug, status, score, staleData, missingSource, lowConfidenceSource, incompleteLayer, totalIssues };
  });
}
