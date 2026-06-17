import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AssetWithLayers, LayerName } from '../types/asset.types.js';

type JsonRecord = Record<string, unknown>;

const DATA_ASSETS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../data/assets',
);

const LAYER_FILES: Partial<Record<LayerName, string>> = {
  identity: 'identity.json',
  market: 'market.json',
  risk: 'risk.json',
  reserve: 'reserve.json',
  yield: 'yield.json',
  institutional: 'institutional.json',
  blockchain: 'blockchain.json',
  compliance: 'compliance.json',
  liquidity: 'liquidity.json',
  aiNarrative: 'ai-insight.json',
  sources: 'sources.json',
  grade: 'grade-baseline.json',
};

async function readJson<T = unknown>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  } catch (error) {
    if (
      error
      && typeof error === 'object'
      && 'code' in error
      && (error as { code?: string }).code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  }
}

async function listAssetSlugs(): Promise<string[]> {
  try {
    const entries = await readdir(DATA_ASSETS_DIR, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => !name.startsWith('_'))
      .sort();
  } catch (error) {
    if (
      error
      && typeof error === 'object'
      && 'code' in error
      && (error as { code?: string }).code === 'ENOENT'
    ) {
      return [];
    }

    throw error;
  }
}

function withLayerIds(value: unknown, assetId: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      item && typeof item === 'object'
        ? { id: `${assetId}-${index}`, assetId, ...(item as JsonRecord) }
        : item,
    );
  }

  if (value && typeof value === 'object') {
    return { id: assetId, assetId, ...(value as JsonRecord) };
  }

  return value;
}

async function loadLayer(slug: string, layer: LayerName): Promise<unknown> {
  const fileName = LAYER_FILES[layer];
  if (!fileName) return null;

  const primary = await readJson(path.join(DATA_ASSETS_DIR, slug, fileName));
  if (primary || layer !== 'grade') return withLayerIds(primary, slug);

  const legacyGrade = await readJson(path.join(DATA_ASSETS_DIR, slug, 'grade.json'));
  return withLayerIds(legacyGrade, slug);
}

export async function findLocalAssetBySlug(slug: string): Promise<AssetWithLayers | null> {
  const identity = await readJson(path.join(DATA_ASSETS_DIR, slug, 'identity.json'));
  if (!identity) return null;

  const now = new Date();
  const row: JsonRecord = {
    id: slug,
    slug,
    __localDataset: true,
    isActive: true,
    dataVersion: 1,
    createdAt: now,
    updatedAt: now,
  };

  await Promise.all(
    Object.keys(LAYER_FILES).map(async (layerName) => {
      const layer = layerName as LayerName;
      row[layer] = await loadLayer(slug, layer);
    }),
  );

  row.events = [];
  row.history = [];

  return row as AssetWithLayers;
}

export async function findLocalAssets(options: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<AssetWithLayers[]> {
  const { category, search, limit = 50, offset = 0 } = options;
  const searchTerm = search?.trim().toLowerCase();
  const categoryTerm = category?.trim().toLowerCase();
  const rows = (await Promise.all((await listAssetSlugs()).map(findLocalAssetBySlug)))
    .filter((row): row is AssetWithLayers => Boolean(row));

  return rows
    .filter((row) => {
      const identity = row.identity as JsonRecord | null | undefined;
      if (categoryTerm && String(identity?.category ?? '').toLowerCase() !== categoryTerm) {
        return false;
      }
      if (!searchTerm) return true;

      return [
        row.slug,
        identity?.name,
        identity?.symbol,
      ].some((value) => String(value ?? '').toLowerCase().includes(searchTerm));
    })
    .sort((a, b) => (b.market?.tvl ?? 0) - (a.market?.tvl ?? 0))
    .slice(offset, offset + limit);
}

export async function countLocalAssets(category?: string): Promise<number> {
  const rows = await findLocalAssets({ category, limit: Number.MAX_SAFE_INTEGER });
  return rows.length;
}
