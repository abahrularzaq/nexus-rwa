import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAssetMonitoringScores } from './monitoring-score.js';

test('penalizes stale legal data more heavily for high-priority assets', () => {
  const [score] = buildAssetMonitoringScores(
    [{ assetSlug: 'issuer-a', layer: 'legal', status: 'stale' }],
    [],
    {
      sourceRowsByAsset: new Map([['issuer-a', [{ layer: 'legal', sourceUrl: 'https://example.com/legal', reliability: 5 }]]]),
      assetPriorityByAsset: new Map([['issuer-a', 'high']]),
    },
  );

  assert.equal(score.status, 'stale');
  assert.equal(score.staleData, 1);
  assert.equal(score.score, 60);
});

test('is more tolerant of a broken low-priority source', () => {
  const [score] = buildAssetMonitoringScores(
    [],
    [{ assetSlug: 'issuer-b', layer: 'metadata', status: 'broken' }],
    {
      sourceRowsByAsset: new Map([['issuer-b', [{ layer: 'metadata', sourceUrl: 'https://example.com/meta', reliability: 4 }]]]),
      assetPriorityByAsset: new Map([['issuer-b', 'low']]),
    },
  );

  assert.equal(score.status, 'stale');
  assert.equal(score.totalIssues, 1);
  assert.equal(score.score, 94);
});

test('keeps restricted sources in watch without stale or incomplete escalation', () => {
  const [score] = buildAssetMonitoringScores(
    [{ assetSlug: 'issuer-c', layer: 'market', status: 'current' }],
    [{ assetSlug: 'issuer-c', layer: 'market', status: 'restricted' }],
    {
      sourceRowsByAsset: new Map([['issuer-c', [{ layer: 'market', sourceUrl: 'https://example.com/market', reliability: 4 }]]]),
      assetPriorityByAsset: new Map([['issuer-c', 'medium']]),
    },
  );

  assert.equal(score.status, 'watch');
  assert.equal(score.totalIssues, 1);
  assert.equal(score.score, 100);
});

test('counts reopened health checks as active watch issues instead of resolved', () => {
  const [score] = buildAssetMonitoringScores(
    [{ assetSlug: 'issuer-reopen', layer: 'reserve', status: 'reopened' }],
    [],
    {
      sourceRowsByAsset: new Map([['issuer-reopen', [{ layer: 'reserve', sourceUrl: 'https://example.com/reserve', reliability: 4 }]]]),
    },
  );

  assert.equal(score.status, 'watch');
  assert.equal(score.totalIssues, 1);
  assert.equal(score.score, 84);
});

test('flags missing required layers as incomplete with layer and priority weighting', () => {
  const [score] = buildAssetMonitoringScores(
    [{ assetSlug: 'issuer-d', layer: 'market', status: 'current' }],
    [],
    {
      expectedLayersByAsset: new Map([['issuer-d', ['market', 'reserve']]]),
      sourceRowsByAsset: new Map([['issuer-d', [{ layer: 'market', sourceUrl: 'https://example.com/market', reliability: 4 }]]]),
      assetPriorityByAsset: new Map([['issuer-d', 'high']]),
    },
  );

  assert.equal(score.status, 'incomplete');
  assert.equal(score.incompleteLayer, 1);
  assert.equal(score.score, 60);
});

test('uses high severity review issue as the primary asset reason', () => {
  const [score] = buildAssetMonitoringScores(
    [{ assetSlug: 'issuer-review', layer: 'reserve', status: 'stale', severity: 'medium', reason: 'reserve data old', lastCheckedAt: new Date('2026-06-20T00:00:00Z') }],
    [{ assetSlug: 'issuer-review', layer: 'market', status: 'broken', url: 'https://example.com/market', lastCheckedAt: new Date('2026-06-21T00:00:00Z') }],
    {
      sourceRowsByAsset: new Map([['issuer-review', [{ layer: 'reserve', sourceUrl: 'https://example.com/reserve', reliability: 4 }]]]),
      reviewTasks: [{ assetSlug: 'issuer-review', layer: 'legal', priority: 'high', reason: 'legal ownership conflict', status: 'open', createdAt: new Date('2026-06-21T10:00:00Z') }],
    },
  );

  assert.equal(score.primaryReason, 'high review issue: legal (legal ownership conflict)');
  assert.equal(score.highestSeverity, 'high');
  assert.equal(score.openIssueCount, 3);
});

test('uses failed sync before stale layer as fallback primary reason', () => {
  const [score] = buildAssetMonitoringScores(
    [{ assetSlug: 'issuer-sync', layer: 'market', status: 'stale', severity: 'medium', reason: 'market snapshot is old', lastCheckedAt: new Date('2026-06-20T00:00:00Z') }],
    [],
    {
      sourceRowsByAsset: new Map([['issuer-sync', [{ layer: 'market', sourceUrl: 'https://example.com/market', reliability: 4 }]]]),
      syncLogs: [{ assetSlug: 'issuer-sync', layer: 'market', provider: 'defillama', status: 'failed', errorMessage: 'provider timeout', startedAt: new Date('2026-06-21T00:00:00Z') }],
    },
  );

  assert.equal(score.primaryReason, 'failed sync: market (provider timeout)');
  assert.equal(score.highestSeverity, 'high');
  assert.equal(score.lastCheckedAt, '2026-06-21T00:00:00.000Z');
});

test('does not invent a primary reason for fresh assets', () => {
  const [score] = buildAssetMonitoringScores(
    [{ assetSlug: 'issuer-fresh', layer: 'market', status: 'current', severity: 'low', lastCheckedAt: new Date('2026-06-21T00:00:00Z') }],
    [{ assetSlug: 'issuer-fresh', layer: 'market', status: 'healthy', url: 'https://example.com/market', lastCheckedAt: new Date('2026-06-21T01:00:00Z') }],
    {
      sourceRowsByAsset: new Map([['issuer-fresh', [{ layer: 'market', sourceUrl: 'https://example.com/market', reliability: 4, checkedAt: new Date('2026-06-21T02:00:00Z') }]]]),
    },
  );

  assert.equal(score.status, 'fresh');
  assert.equal(score.primaryReason, null);
  assert.equal(score.openIssueCount, 0);
  assert.equal(score.highestSeverity, null);
  assert.equal(score.lastCheckedAt, '2026-06-21T02:00:00.000Z');
});
