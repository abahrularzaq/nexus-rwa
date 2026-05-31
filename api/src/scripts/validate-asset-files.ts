import { createRequire } from 'module';

const require = createRequire(import.meta.url);
require('dotenv').config();

import { db } from '../lib/database.js';
import {
  ASSET_DATA_ROOT,
  ASSET_LAYER_FILES,
  assetDirForSlug,
} from '../lib/asset-file-parser.js';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  detectConflicts,
  importPayloadSummary,
  mapAssetFilesToImportPayload,
  validateAssetFileBundle,
} from '../lib/asset-file-import.js';

function parseArgs(argv: string[]): { slug: string | null; all: boolean } {
  let slug: string | null = null;
  let all = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--slug' && argv[i + 1]) {
      slug = argv[i + 1]!;
      i += 1;
    } else if (arg.startsWith('--slug=')) {
      slug = arg.slice('--slug='.length);
    } else if (arg === '--all') {
      all = true;
    }
  }

  return { slug, all };
}

function listAssetSlugs(): string[] {
  return readdirSync(ASSET_DATA_ROOT)
    .filter((name: string) => !name.startsWith('_') && name !== 'ASSET_PROMPTS.md')
    .filter((name: string) => statSync(join(ASSET_DATA_ROOT, name)).isDirectory());
}

async function main(): Promise<void> {
  const { slug, all } = parseArgs(process.argv.slice(2));

  if (!slug && !all) {
    console.error('Usage: npx tsx src/scripts/validate-asset-files.ts --slug=<slug>');
    console.error('       npx tsx src/scripts/validate-asset-files.ts --all');
    process.exit(1);
  }

  const slugs = all ? listAssetSlugs() : [slug!];
  let hasError = false;

  for (const s of slugs) {
    console.log(`\n=== Validate: ${s} ===`);
    console.log(`Folder: ${assetDirForSlug(s)}`);
    console.log(`Expected files: ${ASSET_LAYER_FILES.join(', ')}`);

    const issues = validateAssetFileBundle(s);
    const errors = issues.filter((i) => i.severity === 'error');
    const warnings = issues.filter((i) => i.severity === 'warning');

    if (errors.length === 0) {
      console.log('✓ Validation passed');
      try {
        const payload = mapAssetFilesToImportPayload(s);
        for (const line of importPayloadSummary(payload)) {
          console.log(`  ${line}`);
        }
      } catch (err) {
        hasError = true;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`✗ Mapping failed: ${message}`);
      }
    } else {
      hasError = true;
      console.error(`✗ ${errors.length} error(s)`);
      for (const issue of errors) {
        console.error(`  [error] ${issue.layer}${issue.field ? `.${issue.field}` : ''}: ${issue.message}`);
      }
    }

    for (const issue of warnings) {
      console.warn(`  [warn] ${issue.layer}${issue.field ? `.${issue.field}` : ''}: ${issue.message}`);
    }
  }

  if (hasError) {
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
