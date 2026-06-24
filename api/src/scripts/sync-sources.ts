import { db } from '../lib/database.js';
import { syncCanonicalSourceEvidence } from '../services/source-evidence-sync.service.js';

const dryRun = process.argv.includes('--dry-run');
const slugArg = process.argv.find((arg) => arg.startsWith('--asset='));
const assetSlugs = slugArg ? slugArg.slice('--asset='.length).split(',').map((slug) => slug.trim()).filter(Boolean) : undefined;

syncCanonicalSourceEvidence({ dryRun, assetSlugs })
  .then((result) => {
    for (const warning of result.warnings) console.warn(`[sources] ${warning.assetSlug}[${warning.index}]: ${warning.message}`);
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
