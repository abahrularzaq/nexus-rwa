import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { runSchedulerJob } from '../lib/scheduler.js';
import { runSourceHealthChecks } from '../services/source-reliability.service.js';

export function startSourceHealthScheduler(): void {
  cron.schedule('17 */6 * * *', () => {
    void (async () => {
      try {
        const result = await runSchedulerJob('source-health-check', () => runSourceHealthChecks());
        if (!result) return;
        logger.info({ finishedAt: new Date().toISOString(), ...result }, '[cron] source health check — finished');
      } catch (err) {
        logger.error({ err, finishedAt: new Date().toISOString() }, '[cron] source health check — failed');
      }
    })();
  });

  logger.info('Source health cron registered (every 6h at minute 17)');
}
