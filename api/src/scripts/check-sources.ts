import fs from 'node:fs';
import path from 'node:path';
import { db } from '../lib/database.js';

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, '..', 'data', 'assets');
const REQUEST_TIMEOUT_MS = 15_000;

type SourceItem = {
  layer: string;
  field?: string | null;
  sourceUrl: string;
  sourceType?: string | null;
  reliability?: number | null;
};

type SourceCheckResult = SourceItem & {
  assetSlug: string;
  status: 'healthy' | 'redirected' | 'broken' | 'timeout' | 'error';
  httpStatus?: number | null;
  errorMessage?: string | null;
};

function listAssetSlugs(): string[] {
  return fs
    .readdirSync(ASSETS_DIR)
    .filter((name) => !name.startsWith('_') && name !== 'README.md')
    .filter((name) => fs.statSync(path.join(ASSETS_DIR, name)).isDirectory())
    .sort();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readSources(assetSlug: string): SourceItem[] {
  const filePath = path.join(ASSETS_DIR, assetSlug, 'sources.json');
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(isRecord)
    .map((item) => ({
      layer: typeof item.layer === 'string' ? item.layer : 'unknown',
      field: typeof item.field === 'string' ? item.field : null,
      sourceUrl: typeof item.sourceUrl === 'string' ? item.sourceUrl : '',
      sourceType: typeof item.sourceType === 'string' ? item.sourceType : null,
      reliability: typeof item.reliability === 'number' ? item.reliability : null,
    }))
    .filter((item) => item.sourceUrl.startsWith('http'));
}

async function fetchWithTimeout(url: string, method: 'HEAD' | 'GET'): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'NexusRWA-SourceHealthChecker/1.0',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkUrl(assetSlug: string, source: SourceItem): Promise<SourceCheckResult> {
  try {
    let response = await fetchWithTimeout(source.sourceUrl, 'HEAD');

    if (response.status === 405 || response.status === 403) {
      response = await fetchWithTimeout(source.sourceUrl, 'GET');
    }

    const status = response.ok
      ? response.redirected
        ? 'redirected'
        : 'healthy'
      : 'broken';

    return {
      ...source,
      assetSlug,
      status,
      httpStatus: response.status,
      errorMessage: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.toLowerCase().includes('abort') ? 'timeout' : 'error';

    return {
      ...source,
      assetSlug,
      status,
      httpStatus: null,
      errorMessage: message,
    };
  }
}

async function saveSourceResult(result: SourceCheckResult): Promise<void> {
  await db.sourceHealth.create({
    data: {
      assetSlug: result.assetSlug,
      layer: result.layer,
      field: result.field ?? null,
      url: result.sourceUrl,
      sourceType: result.sourceType ?? null,
      reliability: result.reliability ?? null,
      status: result.status,
      httpStatus: result.httpStatus ?? null,
      errorMessage: result.errorMessage ?? null,
      lastCheckedAt: new Date(),
    },
  });

  if (result.status !== 'healthy' && result.status !== 'redirected') {
    await db.reviewTask.create({
      data: {
        assetSlug: result.assetSlug,
        layer: result.layer,
        priority: 'high',
        reason: `Source URL issue for ${result.layer}.${result.field ?? 'unknown'}: ${result.sourceUrl} (${result.status}${result.httpStatus ? ` ${result.httpStatus}` : ''})`,
        status: 'open',
      },
    });
  }
}

async function main(): Promise<void> {
  const assetSlugs = listAssetSlugs();
  const results: SourceCheckResult[] = [];

  for (const assetSlug of assetSlugs) {
    const sources = readSources(assetSlug);

    for (const source of sources) {
      const result = await checkUrl(assetSlug, source);
      results.push(result);
      await saveSourceResult(result);
    }
  }

  const summary = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.status] = (acc[result.status] ?? 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({ checkedSources: results.length, summary }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
