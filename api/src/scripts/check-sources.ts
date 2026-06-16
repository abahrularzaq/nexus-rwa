import fs from 'node:fs';
import path from 'node:path';
import { db } from '../lib/database.js';

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, '..', 'data', 'assets');
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_CONCURRENCY = 8;

const AUTO_SKIP_CHECKED_BY = new Set(['manual_required', 'manual-review-required']);

type Options = {
  slug: string | null;
  concurrency: number;
  timeoutMs: number;
};

type SourceStatus = 'healthy' | 'redirected' | 'restricted' | 'broken' | 'timeout' | 'error';
type AssetMonitoringStatus = 'fresh' | 'watch' | 'stale' | 'incomplete';

type SourceItem = {
  layer: string;
  field?: string | null;
  sourceUrl: string;
  sourceType?: string | null;
  reliability?: number | null;
  checkedBy?: string | null;
};

type SourceJob = SourceItem & {
  assetSlug: string;
};

type SourceCheckResult = SourceJob & {
  status: SourceStatus;
  httpStatus?: number | null;
  errorMessage?: string | null;
};

type AssetSourceSummary = {
  assetSlug: string;
  status: AssetMonitoringStatus;
  score: number;
  checkedSources: number;
  missingSource: number;
  lowConfidenceSource: number;
  sourceIssues: number;
};

function parseArgs(argv: string[]): Options {
  let slug: string | null = null;
  let concurrency = DEFAULT_CONCURRENCY;
  let timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS;

  for (const arg of argv) {
    if (arg.startsWith('--slug=')) {
      slug = arg.slice('--slug='.length);
    } else if (arg.startsWith('--concurrency=')) {
      concurrency = Number(arg.slice('--concurrency='.length));
    } else if (arg.startsWith('--timeout-ms=')) {
      timeoutMs = Number(arg.slice('--timeout-ms='.length));
    }
  }

  if (!Number.isFinite(concurrency) || concurrency < 1) concurrency = DEFAULT_CONCURRENCY;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1000) timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS;

  return { slug, concurrency: Math.floor(concurrency), timeoutMs: Math.floor(timeoutMs) };
}

function listAssetSlugs(slug: string | null): string[] {
  if (slug) return [slug];

  return fs
    .readdirSync(ASSETS_DIR)
    .filter((name) => !name.startsWith('_') && name !== 'README.md')
    .filter((name) => fs.statSync(path.join(ASSETS_DIR, name)).isDirectory())
    .sort();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeCheckedBy(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function shouldAutoCheckSource(item: SourceItem): boolean {
  if (!item.sourceUrl.startsWith('http')) return false;
  if (item.checkedBy && AUTO_SKIP_CHECKED_BY.has(item.checkedBy)) return false;
  return true;
}

function readSources(assetSlug: string): SourceItem[] {
  return readAllSources(assetSlug).filter(shouldAutoCheckSource);
}

function readAllSources(assetSlug: string): SourceItem[] {
  const filePath = path.join(ASSETS_DIR, assetSlug, 'sources.json');
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) return [];

  return parsed.filter(isRecord).map((item) => ({
    layer: typeof item.layer === 'string' ? item.layer : 'unknown',
    field: typeof item.field === 'string' ? item.field : null,
    sourceUrl: typeof item.sourceUrl === 'string' ? item.sourceUrl : '',
    sourceType: typeof item.sourceType === 'string' ? item.sourceType : null,
    reliability: typeof item.reliability === 'number' ? item.reliability : null,
    checkedBy: normalizeCheckedBy(item.checkedBy),
  }));
}

function buildJobs(assetSlugs: string[]): SourceJob[] {
  const unique = new Map<string, SourceJob>();

  for (const assetSlug of assetSlugs) {
    for (const source of readSources(assetSlug)) {
      const key = `${assetSlug}::${source.sourceUrl}::${source.layer}::${source.field ?? ''}`;
      unique.set(key, { assetSlug, ...source });
    }
  }

  return [...unique.values()];
}

async function fetchWithTimeout(url: string, method: 'HEAD' | 'GET', timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 NexusRWA-SourceHealthChecker/1.0',
        accept: 'text/html,application/pdf,application/json,*/*',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function classifyResponse(response: Response): SourceStatus {
  if (response.ok) return response.redirected ? 'redirected' : 'healthy';
  if (response.status === 401 || response.status === 403 || response.status === 429) return 'restricted';
  return 'broken';
}

async function checkUrl(job: SourceJob, timeoutMs: number): Promise<SourceCheckResult> {
  try {
    let response = await fetchWithTimeout(job.sourceUrl, 'HEAD', timeoutMs);

    if (response.status === 405 || response.status === 403 || response.status === 404) {
      response = await fetchWithTimeout(job.sourceUrl, 'GET', timeoutMs);
    }

    return {
      ...job,
      status: classifyResponse(response),
      httpStatus: response.status,
      errorMessage: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status: SourceStatus = message.toLowerCase().includes('abort') ? 'timeout' : 'error';

    return {
      ...job,
      status,
      httpStatus: null,
      errorMessage: message,
    };
  }
}

function buildReviewReason(result: SourceCheckResult): string {
  return `Source URL issue for ${result.layer}.${result.field ?? 'unknown'}: ${result.sourceUrl} (${result.status}${result.httpStatus ? ` ${result.httpStatus}` : ''})`;
}

async function createReviewTaskIfMissing(result: SourceCheckResult): Promise<void> {
  const reason = buildReviewReason(result);
  const existingOpenTask = await db.reviewTask.findFirst({
    where: {
      assetSlug: result.assetSlug,
      layer: result.layer,
      reason,
      status: 'open',
    },
  });

  if (existingOpenTask) return;

  await db.reviewTask.create({
    data: {
      assetSlug: result.assetSlug,
      layer: result.layer,
      priority: result.status === 'broken' ? 'high' : 'medium',
      reason,
      status: 'open',
    },
  });
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
    await createReviewTaskIfMissing(result);
  }
}

function summarizeSources(assetSlugs: string[], results: SourceCheckResult[]): AssetSourceSummary[] {
  const resultMap = new Map<string, SourceCheckResult[]>();
  for (const result of results) {
    resultMap.set(result.assetSlug, [...(resultMap.get(result.assetSlug) ?? []), result]);
  }

  return assetSlugs.map((assetSlug) => {
    const sources = readAllSources(assetSlug);
    const checked = resultMap.get(assetSlug) ?? [];
    const missingSource = sources.filter((source) => !source.sourceUrl).length + (sources.length === 0 ? 1 : 0);
    const lowConfidenceSource = sources.filter((source) => typeof source.reliability === 'number' && source.reliability < 3).length;
    const sourceIssues = checked.filter((source) => !['healthy', 'redirected'].includes(source.status)).length;
    const penalty = missingSource * 25 + lowConfidenceSource * 10 + sourceIssues * 15;
    const score = Math.max(0, 100 - penalty);
    const status: AssetMonitoringStatus = missingSource > 0 ? 'incomplete' : sourceIssues > 0 ? 'stale' : lowConfidenceSource > 0 || score < 90 ? 'watch' : 'fresh';

    return { assetSlug, status, score, checkedSources: checked.length, missingSource, lowConfidenceSource, sourceIssues };
  });
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<void>): Promise<void> {
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await worker(items[currentIndex]!, currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker());
  await Promise.all(workers);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const assetSlugs = listAssetSlugs(options.slug);
  const jobs = buildJobs(assetSlugs);
  const results: SourceCheckResult[] = [];

  console.log(
    `Checking ${jobs.length} source references across ${assetSlugs.length} asset(s) with concurrency=${options.concurrency}, timeoutMs=${options.timeoutMs}`,
  );

  await runPool(jobs, options.concurrency, async (job, index) => {
    const result = await checkUrl(job, options.timeoutMs);
    results.push(result);
    await saveSourceResult(result);

    const checked = index + 1;
    if (checked % 25 === 0 || checked === jobs.length) {
      console.log(`Progress: ${checked}/${jobs.length}`);
    }
  });

  const summary = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.status] = (acc[result.status] ?? 0) + 1;
    return acc;
  }, {});

  const grouped = new Map<string, SourceCheckResult[]>();
  for (const result of results.filter((item) => item.status !== 'healthy' && item.status !== 'redirected')) {
    const key = `${result.assetSlug}::${result.sourceUrl}::${result.status}::${result.httpStatus ?? ''}`;
    grouped.set(key, [...(grouped.get(key) ?? []), result]);
  }

  const problematic = [...grouped.values()].slice(0, 50).map((items) => {
    const first = items[0]!;
    return {
      assetSlug: first.assetSlug,
      status: first.status,
      httpStatus: first.httpStatus,
      url: first.sourceUrl,
      affectedFields: items.length,
      sampleFields: items.slice(0, 8).map((item) => `${item.layer}.${item.field ?? 'unknown'}`),
      errorMessage: first.errorMessage,
    };
  });

  const assetSummaries = summarizeSources(assetSlugs, results);

  console.log(JSON.stringify({ checkedSources: results.length, summary, assetSummaries, problematic }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
