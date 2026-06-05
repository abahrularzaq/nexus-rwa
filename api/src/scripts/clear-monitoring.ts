import { db } from '../lib/database.js';

type Options = {
  yes: boolean;
  keepSyncLogs: boolean;
};

function parseArgs(argv: string[]): Options {
  return {
    yes: argv.includes('--yes'),
    keepSyncLogs: argv.includes('--keep-sync-logs'),
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!options.yes) {
    console.error('This command clears monitoring tables for local/dev cleanup.');
    console.error('Usage: npm run monitoring:clear -- --yes');
    console.error('Optional: npm run monitoring:clear -- --yes --keep-sync-logs');
    process.exit(1);
  }

  const deletedReviewTasks = await db.reviewTask.deleteMany({});
  const deletedSourceHealth = await db.sourceHealth.deleteMany({});
  const deletedDataHealthCheck = await db.dataHealthCheck.deleteMany({});
  const deletedSyncLog = options.keepSyncLogs ? { count: 0 } : await db.syncLog.deleteMany({});

  console.log(
    JSON.stringify(
      {
        cleared: {
          reviewTask: deletedReviewTasks.count,
          sourceHealth: deletedSourceHealth.count,
          dataHealthCheck: deletedDataHealthCheck.count,
          syncLog: deletedSyncLog.count,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
