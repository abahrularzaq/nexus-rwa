import { createRequire } from 'module';

const require = createRequire(import.meta.url);
require('dotenv').config();

import { db } from '../lib/database.js';
import {
  detectConflicts,
  importPayloadSummary,
  mapAssetFilesToImportPayload,
  SYNC_OWNED_LAYERS,
  SYNC_OWNED_YIELD_FIELDS,
  validateAssetFileBundle,
} from '../lib/asset-file-import.js';

type ImportOptions = {
  slug: string;
  dryRun: boolean;
  force: boolean;
};

function parseArgs(argv: string[]): ImportOptions | null {
  let slug: string | null = null;
  let dryRun = false;
  let force = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--slug' && argv[i + 1]) {
      slug = argv[i + 1]!;
      i += 1;
    } else if (arg.startsWith('--slug=')) {
      slug = arg.slice('--slug='.length);
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--force') {
      force = true;
    }
  }

  if (!slug) return null;
  return { slug, dryRun, force };
}

async function importAsset(options: ImportOptions): Promise<boolean> {
  const { slug, dryRun, force } = options;

  console.log(`\n=== Import: ${slug}${dryRun ? ' (dry-run)' : ''} ===`);

  const issues = validateAssetFileBundle(slug);
  const errors = issues.filter((i) => i.severity === 'error');
  if (errors.length > 0) {
    console.error('Validation failed — run validate-asset-files first');
    for (const issue of errors) {
      console.error(`  [error] ${issue.layer}: ${issue.message}`);
    }
    return false;
  }

  const payload = mapAssetFilesToImportPayload(slug);

  const existing = await db.asset.findUnique({
    where: { slug },
    include: {
      identity: true,
      reserve: true,
      risk: true,
      institutional: true,
      compliance: true,
      liquidity: true,
      yield: true,
      blockchain: true,
    },
  });

  if (!existing) {
    console.error(`Asset "${slug}" not found in database. Seed the asset first (npm run seed).`);
    return false;
  }

  const conflicts = detectConflicts(payload, {
    slug: existing.slug,
    dataVersion: existing.dataVersion,
    identity: existing.identity,
    reserve: existing.reserve,
    risk: existing.risk,
    institutional: existing.institutional,
    compliance: existing.compliance,
    liquidity: existing.liquidity,
    yield: existing.yield,
    blockchain: existing.blockchain.map((b) => ({
      chain: b.chain,
      contractAddress: b.contractAddress,
    })),
  });

  if (conflicts.length > 0) {
    console.log('\nConflicts (file vs database):');
    for (const c of conflicts) {
      console.log(`  ${c.layer}.${c.field}: file=${JSON.stringify(c.fileValue)} db=${JSON.stringify(c.dbValue)}`);
    }
    if (!force && !dryRun) {
      console.error('\nRe-run with --force to overwrite database with file data.');
      return false;
    }
  }

  console.log('\nImport plan:');
  for (const line of importPayloadSummary(payload)) {
    console.log(`  ${line}`);
  }
  console.log(`  Skipped layers: ${SYNC_OWNED_LAYERS.join(', ')}`);
  console.log(`  Skipped yield fields: ${SYNC_OWNED_YIELD_FIELDS.join(', ')}`);

  if (dryRun) {
    console.log('\nDry-run complete — no database changes.');
    return true;
  }

  await db.asset.update({
    where: { slug },
    data: {
      isActive: payload.asset.isActive as boolean,
      dataVersion: payload.asset.dataVersion as number,
      identity: { update: payload.identity },
      reserve: { update: payload.reserve },
      risk: { update: payload.risk },
      yield: { update: payload.yield },
      institutional: { update: payload.institutional },
      compliance: { update: payload.compliance },
      liquidity: { update: payload.liquidity },
      blockchain: {
        deleteMany: {},
        create: payload.blockchain,
      },
    },
  });

  console.log('\n✓ Import completed');
  console.log('  Next: POST /admin/assets/:slug/sync (or npm run test:sync) for market/yield data');
  return true;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    console.error('Usage: npx tsx src/scripts/import-from-files.ts --slug=<slug> [--dry-run] [--force]');
    process.exit(1);
  }

  const ok = await importAsset(options);
  if (!ok) {
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
