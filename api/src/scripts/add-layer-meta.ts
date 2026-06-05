import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, '..', 'data', 'assets');

const OBJECT_LAYER_FILES = [
  'identity.json',
  'market.json',
  'risk.json',
  'reserve.json',
  'yield.json',
  'institutional.json',
  'compliance.json',
  'liquidity.json',
] as const;

type LayerFile = (typeof OBJECT_LAYER_FILES)[number];

type Options = {
  all: boolean;
  slug: string | null;
  write: boolean;
  reviewDate: string;
  autoSyncDate: string | null;
};

const MANUAL_LAYER_CONFIG: Record<string, { reviewFrequencyDays: number }> = {
  identity: { reviewFrequencyDays: 90 },
  reserve: { reviewFrequencyDays: 30 },
  risk: { reviewFrequencyDays: 30 },
  institutional: { reviewFrequencyDays: 30 },
  compliance: { reviewFrequencyDays: 30 },
  liquidity: { reviewFrequencyDays: 30 },
};

const AUTO_LAYER_CONFIG: Record<string, { syncFrequencyHours: number }> = {
  market: { syncFrequencyHours: 24 },
  yield: { syncFrequencyHours: 24 },
};

function parseArgs(argv: string[]): Options {
  let all = false;
  let slug: string | null = null;
  let write = false;
  let reviewDate = new Date().toISOString().slice(0, 10);
  let autoSyncDate: string | null = null;

  for (const arg of argv) {
    if (arg === '--all') {
      all = true;
    } else if (arg === '--write') {
      write = true;
    } else if (arg.startsWith('--slug=')) {
      slug = arg.slice('--slug='.length);
    } else if (arg.startsWith('--review-date=')) {
      reviewDate = arg.slice('--review-date='.length);
    } else if (arg.startsWith('--auto-sync-date=')) {
      autoSyncDate = arg.slice('--auto-sync-date='.length);
    }
  }

  if (!all && !slug) {
    throw new Error('Usage: npm run meta:add -- --all [--write] or npm run meta:add -- --slug=<asset-slug> [--write]');
  }

  return { all, slug, write, reviewDate, autoSyncDate };
}

function listAssetSlugs(): string[] {
  return fs
    .readdirSync(ASSETS_DIR)
    .filter((name) => !name.startsWith('_') && name !== 'README.md')
    .filter((name) => fs.statSync(path.join(ASSETS_DIR, name)).isDirectory())
    .sort();
}

function layerName(file: LayerFile): string {
  return file.replace('.json', '');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildManualMeta(layer: string, reviewDate: string, existingMeta: Record<string, unknown>) {
  const config = MANUAL_LAYER_CONFIG[layer] ?? { reviewFrequencyDays: 30 };

  return {
    dataOwner: existingMeta.dataOwner ?? 'manual-research',
    lastManualReview: existingMeta.lastManualReview ?? reviewDate,
    reviewFrequencyDays: existingMeta.reviewFrequencyDays ?? config.reviewFrequencyDays,
    sourceTier: existingMeta.sourceTier ?? null,
    confidence: existingMeta.confidence ?? null,
    freshnessStatus: existingMeta.freshnessStatus ?? 'current',
    status: existingMeta.status ?? 'current',
    notes: existingMeta.notes ?? null,
  };
}

function buildAutoMeta(layer: string, autoSyncDate: string | null, existingMeta: Record<string, unknown>) {
  const config = AUTO_LAYER_CONFIG[layer] ?? { syncFrequencyHours: 24 };

  return {
    dataOwner: existingMeta.dataOwner ?? 'auto-sync',
    lastAutoSync: existingMeta.lastAutoSync ?? autoSyncDate,
    syncFrequencyHours: existingMeta.syncFrequencyHours ?? config.syncFrequencyHours,
    syncProvider: existingMeta.syncProvider ?? null,
    syncStatus: existingMeta.syncStatus ?? 'not-configured',
    confidence: existingMeta.confidence ?? null,
    freshnessStatus: existingMeta.freshnessStatus ?? 'needs-sync',
    status: existingMeta.status ?? 'needs-sync',
    notes: existingMeta.notes ?? null,
  };
}

function addMetaToLayer(json: Record<string, unknown>, layer: string, options: Options) {
  const existingMeta = isPlainObject(json._meta) ? json._meta : {};

  if (layer in AUTO_LAYER_CONFIG) {
    return {
      ...json,
      _meta: buildAutoMeta(layer, options.autoSyncDate, existingMeta),
    };
  }

  return {
    ...json,
    _meta: buildManualMeta(layer, options.reviewDate, existingMeta),
  };
}

function processAsset(assetSlug: string, options: Options): number {
  const assetDir = path.join(ASSETS_DIR, assetSlug);
  let changed = 0;

  for (const file of OBJECT_LAYER_FILES) {
    const filePath = path.join(assetDir, file);
    const layer = layerName(file);

    if (!fs.existsSync(filePath)) {
      console.log(`[skip] ${assetSlug}/${file} missing`);
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;

    if (!isPlainObject(parsed)) {
      console.log(`[skip] ${assetSlug}/${file} is not an object JSON layer`);
      continue;
    }

    const updated = addMetaToLayer(parsed, layer, options);
    const next = `${JSON.stringify(updated, null, 2)}\n`;

    if (next !== raw) {
      changed += 1;
      console.log(`${options.write ? '[write]' : '[dry-run]'} ${assetSlug}/${file}`);

      if (options.write) {
        fs.writeFileSync(filePath, next, 'utf8');
      }
    } else {
      console.log(`[ok] ${assetSlug}/${file}`);
    }
  }

  return changed;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const slugs = options.all ? listAssetSlugs() : [options.slug!];

  let changed = 0;

  for (const slug of slugs) {
    changed += processAsset(slug, options);
  }

  console.log(`\nLayer metadata ${options.write ? 'update' : 'dry-run'} completed.`);
  console.log(`Changed files: ${changed}`);

  if (!options.write) {
    console.log('Run again with --write to apply changes.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
