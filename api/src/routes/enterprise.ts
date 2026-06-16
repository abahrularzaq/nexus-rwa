import { Hono } from 'hono';
import { createNexusX402Middleware } from '../middleware/x402/index.js';
import { getAssetList } from '../services/asset.service.js';
import { createMeta } from '../shared/index.js';

const x402 = createNexusX402Middleware();

type ExportFormat = 'json' | 'csv' | 'ndjson';
type CsvValue = string | number | boolean | null | undefined;

type ExportAsset = {
  slug?: string | null;
  name?: string | null;
  symbol?: string | null;
  category?: string | null;
  chain?: string | null;
  issuer?: string | null;
  grade?: unknown;
  market?: unknown;
  risk?: unknown;
  yield?: unknown;
};

const CSV_COLUMNS: ReadonlyArray<{ key: keyof ExportAsset; label: string }> = [
  { key: 'slug', label: 'slug' },
  { key: 'name', label: 'name' },
  { key: 'symbol', label: 'symbol' },
  { key: 'category', label: 'category' },
  { key: 'chain', label: 'chain' },
  { key: 'issuer', label: 'issuer' },
  { key: 'grade', label: 'grade' },
  { key: 'market', label: 'market' },
  { key: 'risk', label: 'risk' },
  { key: 'yield', label: 'yield' },
];

function getExportFormat(value: string | undefined): ExportFormat {
  if (value === 'csv' || value === 'ndjson') {
    return value;
  }

  return 'json';
}

function serializeCsvValue(value: unknown): string {
  const csvValue: CsvValue =
    value === null || value === undefined
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
  const normalizedValue = String(csvValue ?? '');

  if (/[",\n\r]/.test(normalizedValue)) {
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  return normalizedValue;
}

function serializeAssetsToCsv(assets: ExportAsset[]): string {
  const header = CSV_COLUMNS.map((column) => column.label).join(',');
  const rows = assets.map((asset) =>
    CSV_COLUMNS.map((column) => serializeCsvValue(asset[column.key])).join(','),
  );

  return [header, ...rows].join('\n');
}

function serializeAssetsToNdjson(assets: ExportAsset[]): string {
  return assets.map((asset) => JSON.stringify(asset)).join('\n');
}

export const analyticsRouter = new Hono();
export const exportRouter = new Hono();

analyticsRouter.get('/bulk', (c, next) => x402(c, next), async (c) => {
  const result = await getAssetList({ tier: 'enterprise', limit: 100 });
  return c.json({
    success: true,
    data: {
      kind: 'bulk',
      count: result.data.length,
      items: result.data,
      note: 'Enterprise bulk snapshot — all assets in one response.',
    },
    meta: createMeta(false),
  });
});

exportRouter.get('/', (c, next) => x402(c, next), async (c) => {
  const result = await getAssetList({ tier: 'enterprise', limit: 100 });
  const format = getExportFormat(c.req.query('format'));
  const exportedAt = new Date().toISOString();

  if (format === 'csv') {
    return new Response(serializeAssetsToCsv(result.data), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
      },
    });
  }

  if (format === 'ndjson') {
    return new Response(serializeAssetsToNdjson(result.data), {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
      },
    });
  }

  return c.json(
    {
      success: true,
      data: {
        kind: 'export',
        exportedAt,
        assets: result.data,
      },
      meta: createMeta(false),
    },
    200,
    {
      'Content-Type': 'application/json; charset=utf-8',
    },
  );
});
