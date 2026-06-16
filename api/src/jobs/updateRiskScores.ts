import { logger } from '../lib/logger.js';
import { runSchedulerJob } from '../lib/scheduler.js';
import { getAssetRepository } from '../services/asset.service.js';
import { getSyncService } from '../services/sync.service.js';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/**
 * Recomputes risk scores for all active assets via SyncService.
 */
export async function updateRiskScores(): Promise<{
  updated: number;
  errors: number;
}> {
  const assets = await getAssetRepository().findActiveAssets();

  if (assets.length === 0) {
    logger.info('Risk score update: no active assets');
    return { updated: 0, errors: 0 };
  }

  const syncService = getSyncService();
  let updated = 0;
  let errors = 0;
  const now = new Date();

  for (const asset of assets) {
    try {
      const result = await syncService.syncRiskScore(asset.slug);
      if (result.success) {
        updated += 1;
      } else {
        errors += 1;
        logger.warn(
          { assetId: asset.id, slug: asset.slug, error: result.error },
          'Failed to update asset risk score',
        );
      }
    } catch (err) {
      errors += 1;
      logger.warn({ err, assetId: asset.id, slug: asset.slug }, 'Failed to update asset risk score');
    }
  }

  logger.info(
    { updated, errors, total: assets.length, timestamp: now },
    'Risk score update completed',
  );

  return { updated, errors };
}

/** Runs risk scoring immediately, then every 6 hours. */
export function startRiskScoreScheduler(): void {
  const runOnce = async (): Promise<void> => {
    try {
      await runSchedulerJob('risk-score', updateRiskScores);
    } catch (err) {
      logger.error({ err }, 'Risk score job failed (non-fatal)');
    }
  };

  void runOnce();

  setInterval(() => {
    void runOnce();
  }, SIX_HOURS_MS);
}
