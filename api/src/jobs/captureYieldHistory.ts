import { logger } from '../lib/logger.js';
import { captureYieldHistory } from '../services/yieldHistory.service.js';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/** Runs yield history capture immediately, then every 6 hours. */
export function startYieldHistoryScheduler(): void {
  const runOnce = async (): Promise<void> => {
    logger.info({ timestamp: new Date() }, 'Yield history capture started');
    try {
      await captureYieldHistory();
    } catch (err) {
      logger.error({ err }, 'Yield history capture failed (non-fatal)');
    }
  };

  void runOnce();

  setInterval(() => {
    void runOnce();
  }, SIX_HOURS_MS);
}
