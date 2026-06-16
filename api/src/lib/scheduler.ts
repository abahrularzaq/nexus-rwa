import { db } from './database.js';
import { logger } from './logger.js';
import { recordSyncJobMetric } from './monitoring.js';

export type SchedulerJobMetric = {
  job: string;
  status: 'started' | 'success' | 'failure' | 'skipped';
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  lockAcquired?: boolean;
};

type AdvisoryLockResult = {
  acquired: boolean;
};

export function isSchedulersEnabled(): boolean {
  return process.env.ENABLE_SCHEDULERS !== 'false';
}

function lockKey(jobName: string): string {
  return `nexus-rwa:scheduler:${jobName}`;
}

/**
 * Runs a scheduler job behind a Postgres transaction-level advisory lock.
 *
 * This keeps horizontally scaled production API instances from executing the same
 * scheduler job concurrently while still allowing all instances to serve HTTP.
 */
export async function runSchedulerJob<T>(
  jobName: string,
  handler: () => Promise<T>,
): Promise<T | undefined> {
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();

  recordSyncJobMetric({ job: jobName, status: 'started' });

  logger.info(
    {
      metric: { job: jobName, status: 'started', startedAt } satisfies SchedulerJobMetric,
    },
    'Scheduler job started',
  );

  try {
    const result = await db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<AdvisoryLockResult[]>`
        SELECT pg_try_advisory_xact_lock(hashtext(${lockKey(jobName)})) AS acquired
      `;
      const acquired = rows[0]?.acquired === true;

      if (!acquired) {
        const finishedAt = new Date().toISOString();
        const durationMs = Date.now() - startedAtDate.getTime();
        recordSyncJobMetric({ job: jobName, status: 'skipped', durationMs, lockAcquired: false });
        logger.info(
          {
            metric: {
              job: jobName,
              status: 'skipped',
              startedAt,
              finishedAt,
              durationMs,
              lockAcquired: false,
            } satisfies SchedulerJobMetric,
          },
          'Scheduler job skipped because another instance holds the lock',
        );
        return undefined;
      }

      return handler();
    }, { timeout: 30 * 60 * 1000 });

    if (result !== undefined) {
      const finishedAt = new Date().toISOString();
      const durationMs = Date.now() - startedAtDate.getTime();
      recordSyncJobMetric({ job: jobName, status: 'success', durationMs, lockAcquired: true });
      logger.info(
        {
          metric: {
            job: jobName,
            status: 'success',
            startedAt,
            finishedAt,
            durationMs,
            lockAcquired: true,
          } satisfies SchedulerJobMetric,
        },
        'Scheduler job completed successfully',
      );
    }

    return result;
  } catch (err) {
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAtDate.getTime();
    recordSyncJobMetric({ job: jobName, status: 'failure', durationMs, lockAcquired: true });
    logger.error(
      {
        err,
        metric: {
          job: jobName,
          status: 'failure',
          startedAt,
          finishedAt,
          durationMs,
          lockAcquired: true,
        } satisfies SchedulerJobMetric,
      },
      'Scheduler job failed',
    );
    throw err;
  }
}
