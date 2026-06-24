export type MonitoringQueueType = 'review-task' | 'source-health' | 'health-check' | 'sync-log';

export type MonitoringQueueBreakdownItem = {
  type: MonitoringQueueType;
  label: string;
  count: number;
};

export type MonitoringQueueBreakdown = {
  totalIssues: number;
  byType: MonitoringQueueBreakdownItem[];
};

type StatusRow = {
  status?: string | null;
};

type MonitoringQueueInput = {
  reviewTasks: StatusRow[];
  sourceHealth: StatusRow[];
  healthChecks: StatusRow[];
  syncLogs: StatusRow[];
};

export const MONITORING_QUEUE_STATUS_BY_TYPE = {
  'review-task': new Set(['open', 'reopened', 'pending_validation']),
  'source-health': new Set(['restricted', 'broken', 'error', 'deprecated', 'missing', 'low-confidence']),
  'health-check': new Set(['stale', 'needs-sync', 'reopened', 'pending_validation']),
  'sync-log': new Set(['failed', 'error']),
} satisfies Record<MonitoringQueueType, Set<string>>;

const MONITORING_QUEUE_LABELS = {
  'review-task': 'Review tasks',
  'source-health': 'Source checks',
  'health-check': 'Stale layers',
  'sync-log': 'Failed sync',
} satisfies Record<MonitoringQueueType, string>;

function normalizedStatus(row: StatusRow): string {
  return String(row.status ?? '').trim().toLowerCase();
}

function countMatching(rows: StatusRow[], type: MonitoringQueueType): number {
  const eligibleStatuses = MONITORING_QUEUE_STATUS_BY_TYPE[type];
  return rows.reduce((count, row) => count + (eligibleStatuses.has(normalizedStatus(row)) ? 1 : 0), 0);
}

export function buildMonitoringQueueBreakdown(input: MonitoringQueueInput): MonitoringQueueBreakdown {
  const byType: MonitoringQueueBreakdownItem[] = [
    {
      type: 'review-task',
      label: MONITORING_QUEUE_LABELS['review-task'],
      count: countMatching(input.reviewTasks, 'review-task'),
    },
    {
      type: 'source-health',
      label: MONITORING_QUEUE_LABELS['source-health'],
      count: countMatching(input.sourceHealth, 'source-health'),
    },
    {
      type: 'health-check',
      label: MONITORING_QUEUE_LABELS['health-check'],
      count: countMatching(input.healthChecks, 'health-check'),
    },
    {
      type: 'sync-log',
      label: MONITORING_QUEUE_LABELS['sync-log'],
      count: countMatching(input.syncLogs, 'sync-log'),
    },
  ];

  return {
    totalIssues: byType.reduce((total, item) => total + item.count, 0),
    byType,
  };
}
