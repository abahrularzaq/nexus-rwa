import fs from 'node:fs';
import path from 'node:path';
import { db } from '../lib/database.js';
import { upsertReviewTaskDetection } from '../lib/review-task-fingerprint.js';

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

type LayerStatus = 'current' | 'stale' | 'needs-review' | 'needs-sync' | 'missing-meta' | 'invalid-json';
type AssetMonitoringStatus = 'fresh' | 'watch' | 'stale' | 'incomplete';

type HealthResult = {
  assetSlug: string;
  layer: string;
  status: LayerStatus;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  nextCheckAt?: Date | null;
};

type AssetFreshnessSummary = {
  assetSlug: string;
  status: AssetMonitoringStatus;
  score: number;
  staleData: number;
  incompleteLayer: number;
  checkedLayers: number;
  missingLayers: string[];
};

function listAssetSlugs(): string[] {
  return fs
    .readdirSync(ASSETS_DIR)
    .filter((name) => !name.startsWith('_') && name !== 'README.md')
    .filter((name) => fs.statSync(path.join(ASSETS_DIR, name)).isDirectory())
    .sort();
}

function layerName(file: string): string {
  return file.replace('.json', '');
}

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addHours(date: Date, hours: number): Date {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

function diffDays(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function diffHours(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function evaluateLayer(assetSlug: string, layer: string, filePath: string): HealthResult {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw) as unknown;

    if (!isRecord(json)) {
      return {
        assetSlug,
        layer,
        status: 'invalid-json',
        severity: 'high',
        reason: `${layer}.json is not an object JSON layer`,
      };
    }

    const meta = isRecord(json._meta) ? json._meta : null;

    if (!meta) {
      return {
        assetSlug,
        layer,
        status: 'missing-meta',
        severity: 'medium',
        reason: `${layer}.json is missing _meta`,
      };
    }

    const dataOwner = typeof meta.dataOwner === 'string' ? meta.dataOwner : null;
    const now = new Date();

    if (dataOwner === 'auto-sync') {
      const lastAutoSync = parseDate(meta.lastAutoSync);
      const syncFrequencyHours = typeof meta.syncFrequencyHours === 'number' ? meta.syncFrequencyHours : 24;
      const syncStatus = typeof meta.syncStatus === 'string' ? meta.syncStatus : 'unknown';

      if (!lastAutoSync) {
        return {
          assetSlug,
          layer,
          status: 'needs-sync',
          severity: 'medium',
          reason: `${layer}.json has no _meta.lastAutoSync yet; syncStatus=${syncStatus}`,
          nextCheckAt: now,
        };
      }

      const ageHours = diffHours(lastAutoSync, now);
      const nextCheckAt = addHours(lastAutoSync, syncFrequencyHours);

      if (ageHours > syncFrequencyHours) {
        return {
          assetSlug,
          layer,
          status: 'stale',
          severity: 'high',
          reason: `${layer}.json auto-sync is stale: last synced ${ageHours} hours ago`,
          nextCheckAt,
        };
      }

      return {
        assetSlug,
        layer,
        status: 'current',
        severity: 'low',
        reason: `${layer}.json auto-sync is current`,
        nextCheckAt,
      };
    }

    const lastManualReview = parseDate(meta.lastManualReview);
    const reviewFrequencyDays = typeof meta.reviewFrequencyDays === 'number' ? meta.reviewFrequencyDays : 30;

    if (!lastManualReview) {
      return {
        assetSlug,
        layer,
        status: 'needs-review',
        severity: 'medium',
        reason: `${layer}.json has no _meta.lastManualReview`,
        nextCheckAt: now,
      };
    }

    const ageDays = diffDays(lastManualReview, now);
    const nextCheckAt = addDays(lastManualReview, reviewFrequencyDays);

    if (ageDays > reviewFrequencyDays) {
      return {
        assetSlug,
        layer,
        status: 'stale',
        severity: 'medium',
        reason: `${layer}.json manual review is stale: last reviewed ${ageDays} days ago`,
        nextCheckAt,
      };
    }

    return {
      assetSlug,
      layer,
      status: 'current',
      severity: 'low',
      reason: `${layer}.json manual review is current`,
      nextCheckAt,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      assetSlug,
      layer,
      status: 'invalid-json',
      severity: 'critical',
      reason: `${layer}.json could not be parsed: ${message}`,
    };
  }
}

function summarizeAsset(assetSlug: string, results: HealthResult[], missingLayers: string[]): AssetFreshnessSummary {
  const staleData = results.filter((result) => result.status === 'stale').length;
  const reviewNeeded = results.filter((result) => ['needs-review', 'needs-sync', 'missing-meta', 'invalid-json'].includes(result.status)).length;
  const incompleteLayer = missingLayers.length + results.filter((result) => result.status === 'invalid-json').length;
  const penalty = staleData * 25 + reviewNeeded * 15 + incompleteLayer * 30;
  const score = Math.max(0, 100 - penalty);
  const status: AssetMonitoringStatus = incompleteLayer > 0 ? 'incomplete' : staleData > 0 ? 'stale' : reviewNeeded > 0 || score < 90 ? 'watch' : 'fresh';

  return {
    assetSlug,
    status,
    score,
    staleData,
    incompleteLayer,
    checkedLayers: results.length,
    missingLayers,
  };
}

async function saveHealthResult(result: HealthResult): Promise<void> {
  await db.dataHealthCheck.create({
    data: {
      assetSlug: result.assetSlug,
      layer: result.layer,
      status: result.status,
      severity: result.severity,
      reason: result.reason,
      nextCheckAt: result.nextCheckAt ?? null,
      lastCheckedAt: new Date(),
    },
  });

  if (result.status !== 'current') {
    await upsertReviewTaskDetection({
      assetSlug: result.assetSlug,
      layer: result.layer,
      issueType: `freshness:${result.status}`,
      priority: result.severity,
      reason: result.reason,
    });
  }
}

async function main(): Promise<void> {
  const assetSlugs = listAssetSlugs();
  const results: HealthResult[] = [];
  const assetSummaries: AssetFreshnessSummary[] = [];

  for (const assetSlug of assetSlugs) {
    const assetDir = path.join(ASSETS_DIR, assetSlug);
    const assetResults: HealthResult[] = [];
    const missingLayers: string[] = [];

    for (const file of OBJECT_LAYER_FILES) {
      const filePath = path.join(assetDir, file);
      if (!fs.existsSync(filePath)) {
        missingLayers.push(layerName(file));
        continue;
      }

      const result = evaluateLayer(assetSlug, layerName(file), filePath);
      results.push(result);
      assetResults.push(result);
      await saveHealthResult(result);
    }

    assetSummaries.push(summarizeAsset(assetSlug, assetResults, missingLayers));
  }

  const summary = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.status] = (acc[result.status] ?? 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({ checkedLayers: results.length, summary, assetSummaries }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
