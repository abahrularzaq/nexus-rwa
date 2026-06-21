import { fileURLToPath } from 'node:url';
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
import { syncCanonicalSourceEvidence } from '../services/source-evidence-sync.service.js';

type SourceSync = typeof syncCanonicalSourceEvidence;
let sourceSync: SourceSync = syncCanonicalSourceEvidence;

export function setSourceEvidenceSyncForTests(sync: SourceSync | null): void {
  sourceSync = sync ?? syncCanonicalSourceEvidence;
}

export type ImportOptions = {
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

export async function importAssetFromFiles(options: ImportOptions): Promise<boolean> {
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

  console.log('\nImport plan:');
  for (const line of importPayloadSummary(payload)) {
    console.log(`  ${line}`);
  }
  console.log(`  Skipped layers: ${SYNC_OWNED_LAYERS.join(', ') || 'none'}`);
  console.log(`  Skipped yield fields: ${SYNC_OWNED_YIELD_FIELDS.join(', ')}`);

  if (dryRun) {
    const sourceSyncResult = await sourceSync({ assetSlugs: [slug], dryRun: true });
    for (const warning of sourceSyncResult.warnings) {
      console.warn(`[sources] ${warning.assetSlug}[${warning.index}]: ${warning.message}`);
    }
    console.log(`  Source evidence dry-run: discovered=${sourceSyncResult.discovered}, duplicates=${sourceSyncResult.duplicateRowsPrevented}, skippedInvalid=${sourceSyncResult.skippedInvalid}`);
    console.log('\nDry-run complete — no database changes.');
    return true;
  }

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
      market: true,
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

  await db.asset.update({
    where: { slug },
    data: {
      isActive: payload.asset.isActive as boolean,
      dataVersion: payload.asset.dataVersion as number,
      identity: { upsert: { create: payload.identity, update: payload.identity } },
      reserve: { upsert: { create: payload.reserve, update: payload.reserve } },
      risk: { upsert: { create: payload.risk, update: payload.risk } },
      yield: { upsert: { create: payload.yield, update: payload.yield } },
      institutional: { upsert: { create: payload.institutional, update: payload.institutional } },
      compliance: { upsert: { create: payload.compliance, update: payload.compliance } },
      liquidity: { upsert: { create: payload.liquidity, update: payload.liquidity } },
      market: { upsert: { create: payload.market, update: payload.market } },
      blockchain: {
        deleteMany: {},
        create: payload.blockchain,
      },
    },
  });

  const sourceSyncResult = await sourceSync({ assetSlugs: [slug] });
  for (const warning of sourceSyncResult.warnings) {
    console.warn(`[sources] ${warning.assetSlug}[${warning.index}]: ${warning.message}`);
  }

  console.log('\n✓ Import completed');
  console.log(`  Source evidence sync: discovered=${sourceSyncResult.discovered}, inserted=${sourceSyncResult.inserted}, updated=${sourceSyncResult.updated}, duplicates=${sourceSyncResult.duplicateRowsPrevented}, skippedInvalid=${sourceSyncResult.skippedInvalid}`);
  console.log('  Next: POST /admin/assets/:slug/sync (or npm run test:sync) for market/yield data');
  return true;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    console.error('Usage: npx tsx src/scripts/import-from-files.ts --slug=<slug> [--dry-run] [--force]');
    process.exit(1);
  }

  const ok = await importAssetFromFiles(options);
  if (!ok) {
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => db.$disconnect());
}
