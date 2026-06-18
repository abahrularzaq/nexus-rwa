import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const ASSET_DATA_ROOT = join(import.meta.dirname, '../../../data/assets');

export const ASSET_LAYER_FILES = [
  'identity.json',
  'blockchain.json',
  'reserve.json',
  'institutional.json',
  'compliance.json',
  'liquidity.json',
  'market.json',
  'yield.json',
  'sources.json',
  'risk.json',
] as const;

export const ASSET_OPTIONAL_FILES = ['grade-baseline.json'] as const;

export type AssetLayerFile = (typeof ASSET_LAYER_FILES)[number];
export type AssetOptionalFile = (typeof ASSET_OPTIONAL_FILES)[number];
export type AssetJsonFile = AssetLayerFile | AssetOptionalFile;

export type JsonRecord = Record<string, unknown>;

export function assetDirForSlug(slug: string): string {
  return join(ASSET_DATA_ROOT, slug);
}

export function assetFilePath(slug: string, file: AssetJsonFile): string {
  return join(assetDirForSlug(slug), file);
}

export function readAssetFile(slug: string, file: AssetJsonFile): string {
  const path = assetFilePath(slug, file);
  if (!existsSync(path)) {
    throw new Error(`Missing file: ${path}`);
  }
  return readFileSync(path, 'utf8');
}

export function readAssetJson<T>(slug: string, file: AssetJsonFile): T {
  try {
    return JSON.parse(readAssetFile(slug, file)) as T;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON in ${file}: ${message}`);
  }
}

export type AssetJsonBundle = {
  identity: JsonRecord;
  blockchain: JsonRecord[];
  reserve: JsonRecord;
  institutional: JsonRecord;
  compliance: JsonRecord;
  liquidity: JsonRecord;
  market: JsonRecord;
  yield: JsonRecord;
  sources: JsonRecord | JsonRecord[];
  risk: JsonRecord;
  gradeBaseline?: JsonRecord;
};

function readObject(slug: string, file: AssetLayerFile): JsonRecord {
  const value = readAssetJson<unknown>(slug, file);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${file} must contain a JSON object`);
  }
  return value as JsonRecord;
}

function readObjectArray(slug: string, file: AssetLayerFile): JsonRecord[] {
  const value = readAssetJson<unknown>(slug, file);
  if (!Array.isArray(value)) {
    throw new Error(`${file} must contain a JSON array`);
  }
  return value.filter((row): row is JsonRecord => Boolean(row) && typeof row === 'object' && !Array.isArray(row));
}

export function loadAssetFileBundle(slug: string): AssetJsonBundle {
  const gradePath = assetFilePath(slug, 'grade-baseline.json');

  return {
    identity: readObject(slug, 'identity.json'),
    blockchain: readObjectArray(slug, 'blockchain.json'),
    reserve: readObject(slug, 'reserve.json'),
    institutional: readObject(slug, 'institutional.json'),
    compliance: readObject(slug, 'compliance.json'),
    liquidity: readObject(slug, 'liquidity.json'),
    market: readObject(slug, 'market.json'),
    yield: readObject(slug, 'yield.json'),
    sources: readAssetJson<JsonRecord | JsonRecord[]>(slug, 'sources.json'),
    risk: readObject(slug, 'risk.json'),
    ...(existsSync(gradePath) ? { gradeBaseline: readAssetJson<JsonRecord>(slug, 'grade-baseline.json') } : {}),
  };
}
