import { createRequire } from 'module';

const require = createRequire(import.meta.url);
require('dotenv').config();

import {
  fetchAllAssetCompleteness,
  formatAssetDetail,
  formatCompletenessTable,
} from '../lib/asset-completeness.js';
import { GAP_FIELDS } from '../lib/asset-field-map.js';

const slugArg = process.argv.find((a) => a.startsWith('--slug='))?.split('=')[1];
const showGaps = process.argv.includes('--gaps');
const jsonOut = process.argv.includes('--json');

async function main(): Promise<void> {
  const reports = await fetchAllAssetCompleteness({
    slug: slugArg,
    activeOnly: true,
  });

  if (reports.length === 0) {
    console.log(slugArg ? `No active asset found for slug: ${slugArg}` : 'No active assets found.');
    process.exit(slugArg ? 1 : 0);
  }

  if (jsonOut) {
    console.log(JSON.stringify(reports, null, 2));
    process.exit(0);
  }

  console.log(formatCompletenessTable(reports));

  if (slugArg || reports.length === 1) {
    console.log(formatAssetDetail(reports[0]!));
  }

  if (showGaps) {
    console.log('Ideal schema fields not yet in Prisma (backlog):');
    for (const f of GAP_FIELDS) {
      console.log(`  - ${f.ideal} (${f.layer})${f.notes ? ` — ${f.notes}` : ''}`);
    }
    console.log('');
  }

  const incomplete = reports.filter((r) => r.overallPct < 100);
  process.exit(incomplete.length > 0 && process.argv.includes('--strict') ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
