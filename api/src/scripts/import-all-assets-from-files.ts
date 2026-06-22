import { createRequire } from 'module';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
require('dotenv').config();

import { db } from '../lib/database.js';
import { ASSET_DATA_ROOT } from '../lib/asset-file-parser.js';
import { importAssetFromFiles } from './import-from-files.js';

type ImportAllOptions = {
  dryRun: boolean;
  force: boolean;
};

type AssetFileImporter = typeof importAssetFromFiles;
let assetFileImporter: AssetFileImporter = importAssetFromFiles;

export function setAssetFileImporterForTests(importer: AssetFileImporter | null): void {
  assetFileImporter = importer ?? importAssetFromFiles;
}

type ImportResult = {
  slug: string;
  ok: boolean;
  error?: string;
};

function parseArgs(argv: string[]): ImportAllOptions {
  return {
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
  };
}

function discoverAssetSlugs(): string[] {
  return readdirSync(ASSET_DATA_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('_') && !name.startsWith('.'))
    .sort((a, b) => a.localeCompare(b));
}

export async function importAllAssets(options: ImportAllOptions): Promise<ImportResult[]> {
  const slugs = discoverAssetSlugs();
  const results: ImportResult[] = [];

  console.log(`Asset data root: ${ASSET_DATA_ROOT}`);
  console.log(`Discovered ${slugs.length} asset folder(s).`);

  for (const slug of slugs) {
    try {
      const ok = await assetFileImporter({ slug, ...options });
      results.push({ slug, ok });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`\n✗ Import failed unexpectedly for ${slug}: ${error}`);
      results.push({ slug, ok: false, error });
    }
  }

  return results;
}

function printSummary(results: ImportResult[], options: ImportAllOptions): void {
  const imported = results.filter((result) => result.ok);
  const failed = results.filter((result) => !result.ok);

  console.log('\n=== Import all asset files summary ===');
  console.log(`Mode: ${options.dryRun ? 'dry-run' : 'write'}${options.force ? ' + force' : ''}`);
  console.log(`Succeeded: ${imported.length}`);
  console.log(`Failed/skipped: ${failed.length}`);

  if (imported.length > 0) {
    console.log(`Imported: ${imported.map((result) => result.slug).join(', ')}`);
  }
  if (failed.length > 0) {
    console.log(`Failed/skipped: ${failed.map((result) => result.slug).join(', ')}`);
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const results = await importAllAssets(options);
  printSummary(results, options);

  if (results.some((result) => !result.ok)) {
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
