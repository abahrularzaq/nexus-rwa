import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { runSchedulerJob } from '../lib/scheduler.js';
import { getSyncService } from '../services/sync.service.js';

export function startSyncCron(): void {
  const syncService = getSyncService();

  cron.schedule('0 */6 * * *', () => {
    void (async () => {
      try {
        const result = await runSchedulerJob('data-sync-full', () => syncService.syncAll());
        if (!result) return;
        logger.info(
          {
            finishedAt: new Date().toISOString(),
            success: result.success,
            failed: result.failed,
            durationMs: result.durationMs,
          },
          '[cron] syncAll — finished',
        );
      } catch (err) {
        logger.error({ err, finishedAt: new Date().toISOString() }, '[cron] syncAll — failed');
      }
    })();
  });

  cron.schedule('0 * * * *', () => {
    void (async () => {
      try {
        const result = await runSchedulerJob('data-sync-top-market', () => syncService.syncTopMarketData(5));
        if (!result) return;
        logger.info(
          {
            finishedAt: new Date().toISOString(),
            success: result.success,
            failed: result.failed,
            durationMs: result.durationMs,
            slugs: result.results.map((r) => r.slug),
          },
          '[cron] top-5 market sync — finished',
        );
      } catch (err) {
        logger.error(
          { err, finishedAt: new Date().toISOString() },
          '[cron] top-5 market sync — failed',
        );
      }
    })();
  });

  cron.schedule('0 3 * * *', () => {
    void (async () => {
      try {
        const result = await runSchedulerJob('data-sync-blockchain', () => syncService.syncAllBlockchainData());
        if (!result) return;
        logger.info(
          {
            finishedAt: new Date().toISOString(),
            success: result.success,
            failed: result.failed,
            durationMs: result.durationMs,
          },
          '[cron] daily blockchain sync — finished',
        );
      } catch (err) {
        logger.error(
          { err, finishedAt: new Date().toISOString() },
          '[cron] daily blockchain sync — failed',
        );
      }
    })();
  });

  logger.info(
    'Sync cron registered (full sync every 6h, top-5 market every 1h, blockchain every 24h)',
  );
}
