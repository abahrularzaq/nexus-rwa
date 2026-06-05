import { db } from '../lib/database.js';

type Options = {
  limit: number;
  json: boolean;
};

function parseArgs(argv: string[]): Options {
  let limit = 20;
  let json = false;

  for (const arg of argv) {
    if (arg.startsWith('--limit=')) {
      limit = Number(arg.slice('--limit='.length));
    } else if (arg === '--json') {
      json = true;
    }
  }

  if (!Number.isFinite(limit) || limit < 1) limit = 20;

  return { limit: Math.floor(limit), json };
}

function groupCount<T extends Record<string, unknown>>(items: T[], key: keyof T): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key] ?? 'unknown');
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function printSection(title: string): void {
  console.log(`\n=== ${title} ===`);
}

function printRows(rows: Array<Record<string, unknown>>): void {
  if (rows.length === 0) {
    console.log('No records.');
    return;
  }

  for (const row of rows) {
    console.log(JSON.stringify(row));
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  const [
    healthChecks,
    sourceHealth,
    openReviewTasks,
    failedSyncLogs,
    recentHealthIssues,
    recentSourceIssues,
    recentReviewTasks,
  ] = await Promise.all([
    db.dataHealthCheck.findMany({
      orderBy: { lastCheckedAt: 'desc' },
      take: 5000,
      select: { status: true, severity: true, assetSlug: true, layer: true },
    }),
    db.sourceHealth.findMany({
      orderBy: { lastCheckedAt: 'desc' },
      take: 5000,
      select: { status: true, assetSlug: true, layer: true, field: true, url: true, httpStatus: true },
    }),
    db.reviewTask.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: 5000,
      select: { priority: true, assetSlug: true, layer: true, reason: true, createdAt: true },
    }),
    db.syncLog.findMany({
      where: { status: { not: 'success' } },
      orderBy: { startedAt: 'desc' },
      take: 5000,
      select: { status: true, assetSlug: true, layer: true, provider: true, errorMessage: true, startedAt: true },
    }),
    db.dataHealthCheck.findMany({
      where: { status: { not: 'current' } },
      orderBy: { lastCheckedAt: 'desc' },
      take: options.limit,
      select: { assetSlug: true, layer: true, status: true, severity: true, reason: true, lastCheckedAt: true },
    }),
    db.sourceHealth.findMany({
      where: { status: { notIn: ['healthy', 'redirected'] } },
      orderBy: { lastCheckedAt: 'desc' },
      take: options.limit,
      select: { assetSlug: true, layer: true, field: true, status: true, httpStatus: true, url: true, errorMessage: true, lastCheckedAt: true },
    }),
    db.reviewTask.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: options.limit,
      select: { assetSlug: true, layer: true, priority: true, reason: true, createdAt: true },
    }),
  ]);

  const report = {
    generatedAt: new Date().toISOString(),
    overview: {
      totalHealthChecks: healthChecks.length,
      totalSourceChecks: sourceHealth.length,
      openReviewTasks: openReviewTasks.length,
      failedOrNonSuccessSyncLogs: failedSyncLogs.length,
    },
    healthStatusSummary: groupCount(healthChecks, 'status'),
    healthSeveritySummary: groupCount(healthChecks, 'severity'),
    sourceStatusSummary: groupCount(sourceHealth, 'status'),
    reviewPrioritySummary: groupCount(openReviewTasks, 'priority'),
    recentHealthIssues,
    recentSourceIssues,
    recentReviewTasks,
    failedSyncLogs: failedSyncLogs.slice(0, options.limit),
  };

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printSection('Nexus RWA Monitoring Overview');
  console.log(`Generated at: ${report.generatedAt}`);
  console.log(`Health checks stored: ${report.overview.totalHealthChecks}`);
  console.log(`Source checks stored: ${report.overview.totalSourceChecks}`);
  console.log(`Open review tasks: ${report.overview.openReviewTasks}`);
  console.log(`Non-success sync logs: ${report.overview.failedOrNonSuccessSyncLogs}`);

  printSection('Health Status Summary');
  console.table(report.healthStatusSummary);

  printSection('Source Status Summary');
  console.table(report.sourceStatusSummary);

  printSection('Review Priority Summary');
  console.table(report.reviewPrioritySummary);

  printSection(`Recent Health Issues (limit ${options.limit})`);
  printRows(report.recentHealthIssues);

  printSection(`Recent Source Issues (limit ${options.limit})`);
  printRows(report.recentSourceIssues);

  printSection(`Recent Open Review Tasks (limit ${options.limit})`);
  printRows(report.recentReviewTasks);

  printSection(`Failed / Non-success Sync Logs (limit ${options.limit})`);
  printRows(report.failedSyncLogs);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
