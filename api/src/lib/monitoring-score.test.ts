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
