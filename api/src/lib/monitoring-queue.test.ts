import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMonitoringQueueBreakdown } from './monitoring-queue.js';

test('builds unified monitoring queue breakdown from eligible issue types', () => {
  const breakdown = buildMonitoringQueueBreakdown({
    reviewTasks: [{ status: 'open' }, { status: 'reopened' }, { status: 'resolved' }, { status: 'pending_validation' }],
    sourceHealth: [{ status: 'healthy' }, { status: 'restricted' }, { status: 'broken' }, { status: 'low-confidence' }],
    healthChecks: [{ status: 'current' }, { status: 'stale' }, { status: 'needs-sync' }, { status: 'pending_validation' }],
    syncLogs: [{ status: 'success' }, { status: 'failed' }, { status: 'error' }],
  });

  assert.deepEqual(
    breakdown.byType.map((item) => [item.type, item.count]),
    [
      ['review-task', 3],
      ['source-health', 3],
      ['health-check', 3],
      ['sync-log', 2],
    ],
  );
  assert.equal(breakdown.totalIssues, 11);
});

test('keeps unified monitoring queue total equal to the sum of per-type counts', () => {
  const breakdown = buildMonitoringQueueBreakdown({
    reviewTasks: [{ status: 'open' }],
    sourceHealth: [{ status: 'error' }, { status: 'deprecated' }],
    healthChecks: [{ status: 'reopened' }],
    syncLogs: [{ status: 'failed' }, { status: 'success' }],
  });
  const perTypeTotal = breakdown.byType.reduce((total, item) => total + item.count, 0);

  assert.equal(perTypeTotal, breakdown.totalIssues);
});
