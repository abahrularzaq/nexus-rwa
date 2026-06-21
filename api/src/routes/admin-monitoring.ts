import fs from 'node:fs';
import path from 'node:path';
import { Hono } from 'hono';
import { db } from '../lib/database.js';
import { buildAssetMonitoringScores } from '../lib/monitoring-score.js';
import { adminAuthMiddleware } from '../middleware/admin-auth.js';
import { ERROR_CODES } from '../shared/index.js';
import { getSourceReliabilitySummary, getSourceTrail, SOURCE_VERIFICATION_STATUSES } from '../services/source-reliability.service.js';

export const adminMonitoringRouter = new Hono();

adminMonitoringRouter.use('*', adminAuthMiddleware());

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, '..', 'data', 'assets');
const MANUAL_REQUIRED_CHECKED_BY = new Set(['manual_required', 'manual-review-required']);
const SOURCE_STATUS_OPTIONS = new Set([...SOURCE_VERIFICATION_STATUSES, 'healthy', 'redirected', 'restricted', 'timeout', 'error', 'broken', 'deprecated']);
const RESOLUTION_TYPES = new Set(['fixed_source', 'verified_manual', 'false_positive', 'accepted_risk', 'deferred', 'replaced_provider']);
const VALIDATION_WINDOW_MS = 24 * 60 * 60 * 1000;

type QueryOptions = {
  limit: number;
  assetSlug?: string;
  layer?: string;
  field?: string;
  status?: string;
  assignedOwner?: string;
};

type ResolutionMetadata = {
  resolutionType: string;
  resolutionNote: string;
  evidenceUrl?: string | null;
};

type ReopenMetadata = {
  reason: string;
};

type AssignmentMetadata = {
  assignedOwner: string | null;
  expectedAssignedOwner?: string | null;
};

async function parseAssignmentMetadata(c: any): Promise<AssignmentMetadata | { error: string }> {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const rawOwner = Object.prototype.hasOwnProperty.call(body, 'assignedOwner') ? body.assignedOwner : body.owner;
  const assignedOwner = typeof rawOwner === 'string' ? rawOwner.trim() : rawOwner === null ? null : undefined;
  const rawExpected = Object.prototype.hasOwnProperty.call(body, 'expectedAssignedOwner') ? body.expectedAssignedOwner : body.expectedOwner;
  const expectedAssignedOwner = typeof rawExpected === 'string' ? rawExpected.trim() || null : rawExpected === null ? null : undefined;

  if (assignedOwner === undefined) return { error: 'assignedOwner is required. Use a non-empty owner name or null to unassign.' };
  if (typeof assignedOwner === 'string' && !assignedOwner) return { error: 'assignedOwner must be a non-empty owner name or null to unassign.' };
  if (typeof assignedOwner === 'string' && assignedOwner.length > 120) return { error: 'assignedOwner must be 120 characters or fewer.' };

  return { assignedOwner, ...(expectedAssignedOwner !== undefined ? { expectedAssignedOwner } : {}) };
}

function assignmentWhere(query: QueryOptions) {
  if (!query.assignedOwner) return {};
  if (query.assignedOwner === '__unassigned') return { assignedOwner: null };
  return { assignedOwner: query.assignedOwner };
}

function assignmentMatches(actual?: string | null, expected?: string | null): boolean {
  if (expected === undefined) return true;
  return (actual ?? null) === (expected || null);
}

type ValidationEvidence = {
  method: 'source-health' | 'data-health-check';
  result: string;
  evidenceId: string;
  evidenceRef: string;
  validatedAt: Date;
};

type SourceRepairBody = {
  newUrl: string;
  reason: string;
  reliability: number;
  evidenceNote?: string | null;
};

type MonitoringRepairLogInput = {
  actor?: string;
  action: string;
  resource: string;
  resourceId: string;
  assetSlug?: string | null;
  layer?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  evidenceUrl?: string | null;
};

type SourceHealthRow = {
  assetSlug: string;
  layer: string;
  field?: string | null;
  url: string;
  status: string;
  httpStatus?: number | null;
  errorMessage?: string | null;
  lastCheckedAt: Date;
};

function parseLimit(value: string | undefined, fallback = 50): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), 250);
}

function parseQuery(c: any): QueryOptions {
  return {
    limit: parseLimit(c.req.query('limit')),
    assetSlug: c.req.query('assetSlug') || undefined,
    layer: c.req.query('layer') || undefined,
    field: c.req.query('field') || undefined,
    status: c.req.query('status') || undefined,
    assignedOwner: c.req.query('assignedOwner') || undefined,
  };
}

function countBy<T extends Record<string, unknown>>(items: T[], key: keyof T): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key] ?? 'unknown');
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function normalizeCheckedBy(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function monitoringPriorityForAsset(assetSlug: string): string | null {
  const filePath = path.join(ASSETS_DIR, assetSlug, 'monitoring.json');
  if (!fs.existsSync(filePath)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
    if (!isRecord(parsed) || typeof parsed.monitoringPriority !== 'string') return null;
    return parsed.monitoringPriority;
  } catch {
    return null;
  }
}

function manualRequiredSourceKeys(assetSlug: string): Set<string> {
  const filePath = path.join(ASSETS_DIR, assetSlug, 'sources.json');
  if (!fs.existsSync(filePath)) return new Set();

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
    if (!Array.isArray(parsed)) return new Set();

    return parsed.filter(isRecord).reduce<Set<string>>((acc, source) => {
      const checkedBy = normalizeCheckedBy(source.checkedBy);
      const sourceUrl = typeof source.sourceUrl === 'string' ? source.sourceUrl : '';
      const layer = typeof source.layer === 'string' ? source.layer : 'unknown';
      const field = typeof source.field === 'string' ? source.field : '';

      if (sourceUrl.startsWith('http') && checkedBy && MANUAL_REQUIRED_CHECKED_BY.has(checkedBy)) {
        acc.add(`${assetSlug}::${layer}::${field}::${sourceUrl}`);
      }

      return acc;
    }, new Set());
  } catch {
    return new Set();
  }
}

function filterAutoCheckedSourceRows<T extends { assetSlug: string; layer: string; field?: string | null; url: string }>(rows: T[]): T[] {
  const cache = new Map<string, Set<string>>();

  return rows.filter((row) => {
    if (!cache.has(row.assetSlug)) {
      cache.set(row.assetSlug, manualRequiredSourceKeys(row.assetSlug));
    }

    const key = `${row.assetSlug}::${row.layer}::${row.field ?? ''}::${row.url}`;
    return !cache.get(row.assetSlug)!.has(key);
  });
}

function uniqueLatestSourceRows<T extends SourceHealthRow>(rows: T[]): T[] {
  const unique = new Map<string, T>();

  for (const row of rows) {
    const key = `${row.assetSlug}::${row.layer}::${row.field ?? ''}::${row.url}`;
    if (!unique.has(key)) {
      unique.set(key, row);
    }
  }

  return [...unique.values()];
}


async function parseResolutionMetadata(c: any): Promise<ResolutionMetadata | { error: string }> {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const resolutionType = typeof body.resolutionType === 'string' ? body.resolutionType.trim() : '';
  const resolutionNote = typeof body.resolutionNote === 'string' ? body.resolutionNote.trim() : '';
  const evidenceUrl = typeof body.evidenceUrl === 'string' ? body.evidenceUrl.trim() : '';

  if (!RESOLUTION_TYPES.has(resolutionType)) {
    return { error: `Invalid resolutionType. Use one of: ${[...RESOLUTION_TYPES].join(', ')}` };
  }

  if (!resolutionNote) {
    return { error: 'resolutionNote is required for monitoring repair or resolution work.' };
  }

  if (evidenceUrl && !/^https?:\/\//i.test(evidenceUrl)) {
    return { error: 'evidenceUrl must start with http:// or https:// when provided.' };
  }

  return { resolutionType, resolutionNote, evidenceUrl: evidenceUrl || null };
}

async function parseReopenMetadata(c: any): Promise<ReopenMetadata | { error: string }> {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const reason = typeof body.reason === 'string'
    ? body.reason.trim()
    : typeof body.reopenReason === 'string'
      ? body.reopenReason.trim()
      : '';

  if (!reason) return { error: 'reopen reason is required.' };

  return { reason };
}

function parseReliability(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

async function parseSourceRepairBody(c: any): Promise<SourceRepairBody | { error: string }> {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const newUrl = typeof body.newUrl === 'string' ? body.newUrl.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const reliability = parseReliability(body.reliability);
  const evidenceNote = typeof body.evidenceNote === 'string' ? body.evidenceNote.trim() : '';

  if (!/^https?:\/\//i.test(newUrl)) return { error: 'newUrl must start with http:// or https://.' };
  if (!reason) return { error: 'reason is required for source repair audit.' };
  if (reliability === null) return { error: 'reliability must be a number between 0 and 100.' };

  return { newUrl, reason, reliability, evidenceNote: evidenceNote || null };
}

function adminActor(c: any): string {
  return c.get?.('adminActor') ?? 'admin';
}

async function createMonitoringRepairLog(tx: any, input: MonitoringRepairLogInput) {
  return tx.monitoringRepairLog.create({
    data: {
      actor: input.actor || 'unknown',
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      assetSlug: input.assetSlug || 'unknown',
      layer: input.layer || 'unknown',
      oldValue: input.oldValue === undefined ? undefined : input.oldValue,
      newValue: input.newValue === undefined ? undefined : input.newValue,
      reason: input.reason || null,
      evidenceUrl: input.evidenceUrl || null,
    },
  });
}

function validationError(c: any, message: string) {
  return c.json(
    {
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message,
      },
    },
    400,
  );
}

function internalError(c: any, err: unknown, fallback: string) {
  return c.json(
    {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: err instanceof Error ? err.message : fallback,
      },
    },
    500,
  );
}

function notFound(c: any, message: string) {
  return c.json(
    {
      success: false,
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message,
      },
    },
    404,
  );
}

function validationRequired(c: any, message: string) {
  return c.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_REQUIRED',
        message,
      },
    },
    409,
  );
}

function validationCutoff(createdAt: Date): Date {
  return new Date(Math.max(createdAt.getTime(), Date.now() - VALIDATION_WINDOW_MS));
}

function validationBaseline(createdAt: Date, reopenedAt?: Date | null): Date {
  return reopenedAt && reopenedAt.getTime() > createdAt.getTime() ? reopenedAt : createdAt;
}

function extractFirstHttpUrl(value?: string | null): string | null {
  if (!value) return null;
  const match = value.match(/https?:\/\/\S+/i);
  return match ? match[0].replace(/[),.;\]]+$/, '') : null;
}

function validationPayload(evidence: ValidationEvidence, actor: string) {
  return {
    validationMethod: evidence.method,
    validationResult: evidence.result,
    validationEvidenceId: evidence.evidenceId,
    validationEvidenceRef: evidence.evidenceRef,
    validatedAt: evidence.validatedAt,
    validatedBy: actor,
  };
}

async function findSourceValidationEvidence(input: {
  assetSlug: string;
  layer: string;
  createdAt: Date;
  reason?: string | null;
  evidenceUrl?: string | null;
}): Promise<ValidationEvidence | null> {
  const sourceUrl = input.evidenceUrl || extractFirstHttpUrl(input.reason);
  const row = await db.sourceHealth.findFirst({
    where: {
      assetSlug: input.assetSlug,
      layer: input.layer,
      ...(sourceUrl ? { url: sourceUrl } : {}),
      status: { in: ['healthy', 'redirected'] },
      lastCheckedAt: { gte: validationCutoff(input.createdAt) },
    },
    orderBy: { lastCheckedAt: 'desc' },
  });

  if (!row) return null;
  return {
    method: 'source-health',
    result: row.status,
    evidenceId: row.id,
    evidenceRef: sourceUrl ? row.url : `${row.assetSlug}/${row.layer}${row.field ? `/${row.field}` : ''}`,
    validatedAt: row.lastCheckedAt,
  };
}

async function findLayerValidationEvidence(input: {
  assetSlug: string;
  layer: string;
  createdAt: Date;
  excludeId?: string;
}): Promise<ValidationEvidence | null> {
  const row = await db.dataHealthCheck.findFirst({
    where: {
      assetSlug: input.assetSlug,
      layer: input.layer,
      status: { in: ['current', 'resolved'] },
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
      lastCheckedAt: { gte: validationCutoff(input.createdAt) },
    },
    orderBy: { lastCheckedAt: 'desc' },
  });

  if (!row) return null;
  return {
    method: 'data-health-check',
    result: row.status,
    evidenceId: row.id,
    evidenceRef: `${row.assetSlug}/${row.layer}`,
    validatedAt: row.lastCheckedAt,
  };
}

async function findReviewTaskValidationEvidence(task: { assetSlug: string; layer: string; reason: string; createdAt: Date; reopenedAt?: Date | null }, metadata: ResolutionMetadata): Promise<ValidationEvidence | null> {
  const createdAt = validationBaseline(task.createdAt, task.reopenedAt);
  const sourceEvidence = await findSourceValidationEvidence({
    assetSlug: task.assetSlug,
    layer: task.layer,
    reason: task.reason,
    evidenceUrl: metadata.evidenceUrl,
    createdAt,
  });
  if (sourceEvidence) return sourceEvidence;

  return findLayerValidationEvidence({
    assetSlug: task.assetSlug,
    layer: task.layer,
    createdAt,
  });
}

async function reopenReviewTask(id: string, metadata: ReopenMetadata, actor: string) {
  return db.$transaction(async (tx) => {
    const existing = await tx.reviewTask.findUnique({ where: { id } });
    if (!existing) return { kind: 'not-found' as const };
    if (existing.status !== 'resolved') {
      return { kind: 'invalid-transition' as const, status: existing.status };
    }

    const reopenedAt = new Date();
    const updateResult = await tx.reviewTask.updateMany({
      where: { id, status: 'resolved' },
      data: {
        status: 'reopened',
        reopenedAt,
        reopenedBy: actor,
        reopenReason: metadata.reason,
        validationMethod: null,
        validationResult: null,
        validationEvidenceId: null,
        validationEvidenceRef: null,
        validatedAt: null,
        validatedBy: null,
      },
    });

    if (updateResult.count !== 1) {
      return { kind: 'invalid-transition' as const, status: 'status_changed' };
    }

    const updated = await tx.reviewTask.findUniqueOrThrow({ where: { id } });

    await createMonitoringRepairLog(tx, {
      actor,
      action: 'reopen_review_task',
      resource: 'review-task',
      resourceId: id,
      assetSlug: existing.assetSlug,
      layer: existing.layer,
      oldValue: {
        status: existing.status,
        resolvedAt: existing.resolvedAt,
        resolutionType: existing.resolutionType,
        resolutionNote: existing.resolutionNote,
        evidenceUrl: existing.evidenceUrl,
        validationMethod: existing.validationMethod,
        validationResult: existing.validationResult,
        validationEvidenceId: existing.validationEvidenceId,
        validationEvidenceRef: existing.validationEvidenceRef,
        validatedAt: existing.validatedAt,
      },
      newValue: {
        status: updated.status,
        reopenedAt: updated.reopenedAt,
        reopenedBy: updated.reopenedBy,
        reopenReason: updated.reopenReason,
        validationResult: updated.validationResult,
      },
      reason: metadata.reason,
      evidenceUrl: existing.validationEvidenceRef || existing.evidenceUrl,
    });

    return { kind: 'ok' as const, data: updated };
  });
}

async function reopenHealthCheck(id: string, metadata: ReopenMetadata, actor: string) {
  return db.$transaction(async (tx) => {
    const existing = await tx.dataHealthCheck.findUnique({ where: { id } });
    if (!existing) return { kind: 'not-found' as const };
    if (existing.status !== 'resolved') {
      return { kind: 'invalid-transition' as const, status: existing.status };
    }

    const reopenedAt = new Date();
    const updateResult = await tx.dataHealthCheck.updateMany({
      where: { id, status: 'resolved' },
      data: {
        status: 'reopened',
        reopenedAt,
        reopenedBy: actor,
        reopenReason: metadata.reason,
        validationMethod: null,
        validationResult: null,
        validationEvidenceId: null,
        validationEvidenceRef: null,
        validatedAt: null,
        validatedBy: null,
      },
    });

    if (updateResult.count !== 1) {
      return { kind: 'invalid-transition' as const, status: 'status_changed' };
    }

    const updated = await tx.dataHealthCheck.findUniqueOrThrow({ where: { id } });

    await createMonitoringRepairLog(tx, {
      actor,
      action: 'reopen_health_check',
      resource: 'health-check',
      resourceId: id,
      assetSlug: existing.assetSlug,
      layer: existing.layer,
      oldValue: {
        status: existing.status,
        severity: existing.severity,
        reason: existing.reason,
        resolutionType: existing.resolutionType,
        resolutionNote: existing.resolutionNote,
        evidenceUrl: existing.evidenceUrl,
        validationMethod: existing.validationMethod,
        validationResult: existing.validationResult,
        validationEvidenceId: existing.validationEvidenceId,
        validationEvidenceRef: existing.validationEvidenceRef,
        validatedAt: existing.validatedAt,
      },
      newValue: {
        status: updated.status,
        severity: updated.severity,
        reason: updated.reason,
        reopenedAt: updated.reopenedAt,
        reopenedBy: updated.reopenedBy,
        reopenReason: updated.reopenReason,
        validationResult: updated.validationResult,
      },
      reason: metadata.reason,
      evidenceUrl: existing.validationEvidenceRef || existing.evidenceUrl,
    });

    return { kind: 'ok' as const, data: updated };
  });
}

async function markReviewTaskPendingValidation(id: string, metadata: ResolutionMetadata, actor: string) {
  const existing = await db.reviewTask.findUnique({ where: { id } });
  if (!existing) return null;

  return db.$transaction(async (tx) => {
    const updated = await tx.reviewTask.update({
      where: { id },
      data: {
        status: 'pending_validation',
        resolvedAt: null,
        resolutionType: metadata.resolutionType,
        resolutionNote: metadata.resolutionNote,
        evidenceUrl: metadata.evidenceUrl,
        validationMethod: null,
        validationResult: null,
        validationEvidenceId: null,
        validationEvidenceRef: null,
        validatedAt: null,
        validatedBy: null,
      },
    });
    await createMonitoringRepairLog(tx, {
      actor,
      action: 'submit_review_task_repair',
      resource: 'review-task',
      resourceId: id,
      assetSlug: existing.assetSlug,
      layer: existing.layer,
      oldValue: { status: existing.status, resolutionType: existing.resolutionType, resolutionNote: existing.resolutionNote, evidenceUrl: existing.evidenceUrl },
      newValue: { status: updated.status, resolutionType: updated.resolutionType, resolutionNote: updated.resolutionNote, evidenceUrl: updated.evidenceUrl, validationResult: updated.validationResult },
      reason: metadata.resolutionNote,
      evidenceUrl: metadata.evidenceUrl,
    });
    return updated;
  });
}

async function markHealthCheckPendingValidation(id: string, metadata: ResolutionMetadata, actor: string) {
  const existing = await db.dataHealthCheck.findUnique({ where: { id } });
  if (!existing) return null;

  return db.$transaction(async (tx) => {
    const updated = await tx.dataHealthCheck.update({
      where: { id },
      data: {
        status: 'pending_validation',
        reason: metadata.resolutionNote,
        resolutionType: metadata.resolutionType,
        resolutionNote: metadata.resolutionNote,
        evidenceUrl: metadata.evidenceUrl,
        validationMethod: null,
        validationResult: null,
        validationEvidenceId: null,
        validationEvidenceRef: null,
        validatedAt: null,
        validatedBy: null,
      },
    });
    await createMonitoringRepairLog(tx, {
      actor,
      action: 'submit_health_check_repair',
      resource: 'health-check',
      resourceId: id,
      assetSlug: existing.assetSlug,
      layer: existing.layer,
      oldValue: { status: existing.status, severity: existing.severity, reason: existing.reason, resolutionType: existing.resolutionType, resolutionNote: existing.resolutionNote, evidenceUrl: existing.evidenceUrl },
      newValue: { status: updated.status, severity: updated.severity, reason: updated.reason, resolutionType: updated.resolutionType, resolutionNote: updated.resolutionNote, evidenceUrl: updated.evidenceUrl, validationResult: updated.validationResult },
      reason: metadata.resolutionNote,
      evidenceUrl: metadata.evidenceUrl,
    });
    return updated;
  });
}

adminMonitoringRouter.get('/overview', async (c) => {
  try {
    const [healthChecks, sourceHealthRows, openReviewTasks, failedSyncLogs, assetSources] = await Promise.all([
      db.dataHealthCheck.findMany({
        orderBy: { lastCheckedAt: 'desc' },
        take: 5000,
        select: { status: true, severity: true, assetSlug: true, layer: true },
      }),
      db.sourceHealth.findMany({
        orderBy: { lastCheckedAt: 'desc' },
        take: 5000,
        select: { status: true, assetSlug: true, layer: true, field: true, url: true, httpStatus: true, errorMessage: true, lastCheckedAt: true },
      }),
      db.reviewTask.findMany({
        where: { status: { in: ['open', 'reopened'] } },
        orderBy: { createdAt: 'desc' },
        take: 5000,
        select: { priority: true, assetSlug: true, layer: true, reason: true, status: true, createdAt: true, reopenedAt: true },
      }),
      db.syncLog.findMany({
        where: { status: { not: 'success' } },
        orderBy: { startedAt: 'desc' },
        take: 5000,
        select: { status: true, assetSlug: true, layer: true, provider: true, errorMessage: true, startedAt: true },
      }),
      db.assetSource.findMany({
        orderBy: { checkedAt: 'desc' },
        take: 10000,
        include: { asset: { select: { slug: true } } },
      }),
    ]);

    const sourceHealth = uniqueLatestSourceRows(filterAutoCheckedSourceRows(sourceHealthRows));
    const sourceRowsByAsset = assetSources.reduce<Map<string, Array<{ sourceUrl?: string | null; reliability?: number | null; layer?: string | null }>>>((acc, source) => {
      const rows = acc.get(source.asset.slug) ?? [];
      rows.push({ sourceUrl: source.sourceUrl, reliability: source.reliability, layer: source.layer });
      acc.set(source.asset.slug, rows);
      return acc;
    }, new Map());
    const assetPriorityByAsset = new Map([...sourceRowsByAsset.keys(), ...new Set([...healthChecks.map((row) => row.assetSlug), ...sourceHealth.map((row) => row.assetSlug)])].map((assetSlug) => [assetSlug, monitoringPriorityForAsset(assetSlug)]));
    const assetSummaries = buildAssetMonitoringScores(healthChecks, sourceHealth, { sourceRowsByAsset, assetPriorityByAsset });
    const recentHealthIssues = await db.dataHealthCheck.findMany({
      where: { status: { notIn: ['current', 'resolved'] } },
      orderBy: { lastCheckedAt: 'desc' },
      take: 10,
      select: { assetSlug: true, layer: true, status: true, severity: true, reason: true, lastCheckedAt: true },
    });
    const recentSourceIssues = sourceHealth.filter((row) => !['healthy', 'redirected'].includes(row.status)).slice(0, 10);

    return c.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        overview: {
          totalHealthChecks: healthChecks.length,
          totalSourceChecks: sourceHealth.length,
          openReviewTasks: openReviewTasks.length,
          reopenedReviewTasks: openReviewTasks.filter((row) => row.status === 'reopened').length,
          failedOrNonSuccessSyncLogs: failedSyncLogs.length,
        },
        healthStatusSummary: countBy(healthChecks, 'status'),
        healthSeveritySummary: countBy(healthChecks, 'severity'),
        sourceStatusSummary: countBy(sourceHealth, 'status'),
        reviewStatusSummary: countBy(openReviewTasks, 'status'),
        reviewPrioritySummary: countBy(openReviewTasks, 'priority'),
        assetStatusSummary: countBy(assetSummaries, 'status'),
        assetSummaries,
        recentHealthIssues,
        recentSourceIssues,
        recentReviewTasks: openReviewTasks.slice(0, 10),
        failedSyncLogs: failedSyncLogs.slice(0, 10),
      },
    });
  } catch (err) {
    return internalError(c, err, 'Monitoring overview failed');
  }
});

adminMonitoringRouter.get('/repair-logs', async (c) => {
  try {
    const query = parseQuery(c);
    const rows = await db.monitoringRepairLog.findMany({
      where: {
        ...(query.assetSlug ? { assetSlug: query.assetSlug } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
    });
    return c.json({ success: true, data: rows });
  } catch (err) {
    return internalError(c, err, 'Monitoring repair log query failed');
  }
});

adminMonitoringRouter.get('/sources', async (c) => {
  try {
    const query = parseQuery(c);
    const rows = await getSourceTrail({ assetSlug: query.assetSlug, layer: query.layer, field: query.field, status: query.status, limit: query.limit });
    return c.json({ success: true, data: rows });
  } catch (err) {
    return internalError(c, err, 'Source evidence library query failed');
  }
});


async function repairAssetSource(sourceId: string, repair: SourceRepairBody, repairedBy?: string) {
  const existing = await db.assetSource.findUnique({
    where: { id: sourceId },
    include: { asset: { select: { slug: true } } },
  });
  if (!existing) return null;

  return db.$transaction(async (tx) => {
    const oldUrl = existing.sourceUrl;
    const newStatus = 'verified';
    const checkedAt = new Date();

    const source = await tx.assetSource.update({
      where: { id: sourceId },
      data: {
        sourceUrl: repair.newUrl,
        reliability: repair.reliability,
        status: newStatus,
        checkedAt,
        checkedBy: repairedBy,
        notes: [
          existing.notes,
          repair.evidenceNote ? `Repair note: ${repair.evidenceNote}` : null,
          `Previous URL: ${oldUrl}`,
          `Repair reason: ${repair.reason}`,
        ].filter(Boolean).join('\n'),
      },
      include: { asset: { select: { slug: true, dataVersion: true } } },
    });

    await tx.sourceHealth.updateMany({
      where: {
        assetSlug: existing.asset.slug,
        layer: existing.layer,
        field: existing.field,
        url: oldUrl,
      },
      data: {
        url: repair.newUrl,
        reliability: repair.reliability,
        status: 'healthy',
        httpStatus: null,
        errorMessage: null,
        lastCheckedAt: checkedAt,
      },
    });

    const audit = await tx.sourceRepairAudit.create({
      data: {
        assetSourceId: existing.id,
        assetSlug: existing.asset.slug,
        layer: existing.layer,
        field: existing.field,
        oldUrl,
        newUrl: repair.newUrl,
        oldReliability: existing.reliability,
        newReliability: repair.reliability,
        oldStatus: existing.status,
        newStatus,
        reason: repair.reason,
        evidenceNote: repair.evidenceNote,
        repairedBy,
      },
    });

    const repairLog = await createMonitoringRepairLog(tx, {
      actor: repairedBy,
      action: 'replace_source_url',
      resource: 'asset-source',
      resourceId: existing.id,
      assetSlug: existing.asset.slug,
      layer: existing.layer,
      oldValue: { sourceUrl: oldUrl, reliability: existing.reliability, status: existing.status },
      newValue: { sourceUrl: repair.newUrl, reliability: repair.reliability, status: newStatus },
      reason: repair.reason,
      evidenceUrl: repair.evidenceNote,
    });

    return { source, audit, repairLog };
  });
}

adminMonitoringRouter.patch('/sources/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const repair = await parseSourceRepairBody(c);
    if ('error' in repair) return validationError(c, repair.error);

    const result = await repairAssetSource(id, repair, adminActor(c));
    if (!result) return notFound(c, `Source evidence row not found: ${id}`);

    return c.json({ success: true, data: result });
  } catch (err) {
    return internalError(c, err, 'Source repair failed');
  }
});

adminMonitoringRouter.patch('/source-health/:id/repair', async (c) => {
  try {
    const id = c.req.param('id');
    const repair = await parseSourceRepairBody(c);
    if ('error' in repair) return validationError(c, repair.error);

    const health = await db.sourceHealth.findUnique({ where: { id } });
    if (!health) return notFound(c, `Source health row not found: ${id}`);

    const source = await db.assetSource.findFirst({
      where: {
        asset: { slug: health.assetSlug },
        layer: health.layer,
        field: health.field ?? '',
        sourceUrl: health.url,
      },
      orderBy: { checkedAt: 'desc' },
    });
    if (!source) return notFound(c, `No asset source matches source health row: ${id}`);

    const result = await repairAssetSource(source.id, repair, adminActor(c));
    if (!result) return notFound(c, `Source evidence row not found: ${source.id}`);

    return c.json({ success: true, data: result });
  } catch (err) {
    return internalError(c, err, 'Source health repair failed');
  }
});

adminMonitoringRouter.get('/source-reliability', async (c) => {
  try {
    const query = parseQuery(c);
    const rows = await getSourceReliabilitySummary(query.assetSlug);
    return c.json({ success: true, data: rows.slice(0, query.limit) });
  } catch (err) {
    return internalError(c, err, 'Source reliability query failed');
  }
});


async function assignMonitoringIssue(resource: string, id: string, metadata: AssignmentMetadata, actor: string) {
  const auditResource = resource === 'review-tasks' ? 'review-task' : resource === 'health-checks' ? 'health-check' : null;
  if (!auditResource) return { kind: 'unsupported' as const };

  return db.$transaction(async (tx) => {
    const model = (resource === 'review-tasks' ? tx.reviewTask : tx.dataHealthCheck) as any;
    const existing = await model.findUnique({ where: { id } });
    if (!existing) return { kind: 'not-found' as const };
    if (['resolved', 'current'].includes(existing.status)) return { kind: 'inactive' as const, status: existing.status };
    if (!assignmentMatches(existing.assignedOwner, metadata.expectedAssignedOwner)) {
      return { kind: 'assignment-conflict' as const, assignedOwner: existing.assignedOwner ?? null };
    }

    const assignedAt = new Date();
    const data = {
      assignedOwner: metadata.assignedOwner,
      assignedAt,
      assignedBy: actor,
    };
    const where = {
      id,
      ...(metadata.expectedAssignedOwner !== undefined ? { assignedOwner: metadata.expectedAssignedOwner } : {}),
    };
    const updateResult = await model.updateMany({ where, data });
    if (updateResult.count !== 1) {
      return { kind: 'assignment-conflict' as const, assignedOwner: existing.assignedOwner ?? null };
    }

    const updated = await model.findUniqueOrThrow({ where: { id } });
    await createMonitoringRepairLog(tx, {
      actor,
      action: metadata.assignedOwner ? 'assign_monitoring_issue' : 'unassign_monitoring_issue',
      resource: auditResource,
      resourceId: id,
      assetSlug: existing.assetSlug,
      layer: existing.layer,
      oldValue: { assignedOwner: existing.assignedOwner ?? null, assignedAt: existing.assignedAt ?? null, assignedBy: existing.assignedBy ?? null, status: existing.status },
      newValue: { assignedOwner: updated.assignedOwner ?? null, assignedAt: updated.assignedAt ?? null, assignedBy: updated.assignedBy ?? null, status: updated.status },
      reason: metadata.assignedOwner ? `Assigned to ${metadata.assignedOwner}` : 'Unassigned monitoring issue',
    });

    return { kind: 'ok' as const, data: updated };
  });
}

adminMonitoringRouter.get('/review-tasks', async (c) => {
  try {
    const query = parseQuery(c);
    const tasks = await db.reviewTask.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.assetSlug ? { assetSlug: query.assetSlug } : {}),
        ...(query.layer ? { layer: query.layer } : {}),
        ...assignmentWhere(query),
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
    });

    return c.json({ success: true, data: tasks });
  } catch (err) {
    return internalError(c, err, 'Review task query failed');
  }
});

adminMonitoringRouter.get('/source-health', async (c) => {
  try {
    const query = parseQuery(c);
    const rows = await db.sourceHealth.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.assetSlug ? { assetSlug: query.assetSlug } : {}),
        ...(query.layer ? { layer: query.layer } : {}),
        ...(query.field ? { field: query.field } : {}),
      },
      orderBy: { lastCheckedAt: 'desc' },
      take: 5000,
    });

    const data = uniqueLatestSourceRows(filterAutoCheckedSourceRows(rows)).slice(0, query.limit);

    return c.json({ success: true, data });
  } catch (err) {
    return internalError(c, err, 'Source health query failed');
  }
});

adminMonitoringRouter.get('/health-checks', async (c) => {
  try {
    const query = parseQuery(c);
    const rows = await db.dataHealthCheck.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.assetSlug ? { assetSlug: query.assetSlug } : {}),
        ...(query.layer ? { layer: query.layer } : {}),
        ...assignmentWhere(query),
      },
      orderBy: { lastCheckedAt: 'desc' },
      take: query.limit,
    });

    return c.json({ success: true, data: rows });
  } catch (err) {
    return internalError(c, err, 'Health check query failed');
  }
});

adminMonitoringRouter.get('/sync-logs', async (c) => {
  try {
    const query = parseQuery(c);
    const rows = await db.syncLog.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.assetSlug ? { assetSlug: query.assetSlug } : {}),
        ...(query.layer ? { layer: query.layer } : {}),
      },
      orderBy: { startedAt: 'desc' },
      take: query.limit,
    });

    return c.json({ success: true, data: rows });
  } catch (err) {
    return internalError(c, err, 'Sync log query failed');
  }
});


async function handleAssignment(c: any, resource: string, id: string) {
  const metadata = await parseAssignmentMetadata(c);
  if ('error' in metadata) return validationError(c, metadata.error);

  const result = await assignMonitoringIssue(resource, id, metadata, adminActor(c));
  if (result.kind === 'unsupported') return validationError(c, `Unsupported assignment action for monitoring resource: ${resource}`);
  if (result.kind === 'not-found') return notFound(c, `${resource === 'review-tasks' ? 'Review task' : 'Health check'} not found: ${id}`);
  if (result.kind === 'inactive') {
    return c.json({ success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: `Only active monitoring issues can be assigned. Current status: ${result.status}.` } }, 409);
  }
  if (result.kind === 'assignment-conflict') {
    return c.json({ success: false, error: { code: 'ASSIGNMENT_CONFLICT', message: `Assignment changed before this update. Current owner: ${result.assignedOwner ?? 'unassigned'}.` } }, 409);
  }

  return c.json({ success: true, data: result.data });
}

adminMonitoringRouter.patch('/:resource/:id/assignment', async (c) => {
  try {
    return await handleAssignment(c, c.req.param('resource'), c.req.param('id'));
  } catch (err) {
    return internalError(c, err, 'Monitoring assignment failed');
  }
});

adminMonitoringRouter.patch('/review-tasks/:id/repair', async (c) => {
  try {
    const id = c.req.param('id');
    const metadata = await parseResolutionMetadata(c);
    if ('error' in metadata) return validationError(c, metadata.error);

    const task = await markReviewTaskPendingValidation(id, metadata, adminActor(c));
    if (!task) return notFound(c, `Review task not found: ${id}`);

    return c.json({ success: true, data: task });
  } catch (err) {
    return internalError(c, err, 'Review task repair submission failed');
  }
});

adminMonitoringRouter.patch('/health-checks/:id/repair', async (c) => {
  try {
    const id = c.req.param('id');
    const metadata = await parseResolutionMetadata(c);
    if ('error' in metadata) return validationError(c, metadata.error);

    const check = await markHealthCheckPendingValidation(id, metadata, adminActor(c));
    if (!check) return notFound(c, `Health check not found: ${id}`);

    return c.json({ success: true, data: check });
  } catch (err) {
    return internalError(c, err, 'Health check repair submission failed');
  }
});

async function handleReopen(c: any, resource: string, id: string) {
  const metadata = await parseReopenMetadata(c);
  if ('error' in metadata) return validationError(c, metadata.error);

  const result = resource === 'review-tasks'
    ? await reopenReviewTask(id, metadata, adminActor(c))
    : resource === 'health-checks'
      ? await reopenHealthCheck(id, metadata, adminActor(c))
      : null;

  if (!result) return validationError(c, `Unsupported reopen action for monitoring resource: ${resource}`);
  if (result.kind === 'not-found') {
    return notFound(c, `${resource === 'review-tasks' ? 'Review task' : 'Health check'} not found: ${id}`);
  }
  if (result.kind === 'invalid-transition') {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: `Only resolved ${resource === 'review-tasks' ? 'review tasks' : 'health checks'} can be reopened. Current status: ${result.status}.`,
        },
      },
      409,
    );
  }

  return c.json({ success: true, data: result.data });
}

adminMonitoringRouter.patch('/:resource/:id/reopen', async (c) => {
  try {
    return await handleReopen(c, c.req.param('resource'), c.req.param('id'));
  } catch (err) {
    return internalError(c, err, 'Monitoring reopen failed');
  }
});

adminMonitoringRouter.post('/:resource/:id/reopen', async (c) => {
  try {
    return await handleReopen(c, c.req.param('resource'), c.req.param('id'));
  } catch (err) {
    return internalError(c, err, 'Monitoring reopen failed');
  }
});

adminMonitoringRouter.patch('/review-tasks/:id/close', async (c) => {
  try {
    const id = c.req.param('id');
    const metadata = await parseResolutionMetadata(c);
    if ('error' in metadata) return validationError(c, metadata.error);

    const existing = await db.reviewTask.findUnique({ where: { id } });
    if (!existing) return notFound(c, `Review task not found: ${id}`);
    const actor = adminActor(c);
    const evidence = await findReviewTaskValidationEvidence(existing, metadata);
    if (!evidence) {
      return validationRequired(c, 'Matching successful validation evidence is required before this review task can be resolved. Submit repair to keep it pending validation, then run source or freshness checks.');
    }

    const task = await db.$transaction(async (tx) => {
      const updated = await tx.reviewTask.update({
        where: { id },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
          resolutionType: metadata.resolutionType,
          resolutionNote: metadata.resolutionNote,
          evidenceUrl: metadata.evidenceUrl,
          ...validationPayload(evidence, actor),
        },
      });
      await createMonitoringRepairLog(tx, {
        actor, action: 'resolve_review_task', resource: 'review-task', resourceId: id,
        assetSlug: existing.assetSlug, layer: existing.layer,
        oldValue: { status: existing.status, resolutionType: existing.resolutionType, resolutionNote: existing.resolutionNote, evidenceUrl: existing.evidenceUrl, validationResult: existing.validationResult },
        newValue: { status: updated.status, resolutionType: updated.resolutionType, resolutionNote: updated.resolutionNote, evidenceUrl: updated.evidenceUrl, validationMethod: updated.validationMethod, validationResult: updated.validationResult, validationEvidenceId: updated.validationEvidenceId, validationEvidenceRef: updated.validationEvidenceRef, validatedAt: updated.validatedAt },
        reason: metadata.resolutionNote, evidenceUrl: metadata.evidenceUrl,
      });
      return updated;
    });

    return c.json({ success: true, data: task });
  } catch (err) {
    return internalError(c, err, 'Review task resolution failed');
  }
});

adminMonitoringRouter.patch('/health-checks/:id/close', async (c) => {
  try {
    const id = c.req.param('id');
    const metadata = await parseResolutionMetadata(c);
    if ('error' in metadata) return validationError(c, metadata.error);

    const existing = await db.dataHealthCheck.findUnique({ where: { id } });
    if (!existing) return notFound(c, `Health check not found: ${id}`);
    const actor = adminActor(c);
    const evidence = await findLayerValidationEvidence({
      assetSlug: existing.assetSlug,
      layer: existing.layer,
      createdAt: validationBaseline(existing.createdAt, existing.reopenedAt),
      excludeId: existing.id,
    });
    if (!evidence) {
      return validationRequired(c, 'Matching successful layer validation evidence is required before this health check can be resolved. Submit repair to keep it pending validation, then run freshness/import validation.');
    }

    const check = await db.$transaction(async (tx) => {
      const updated = await tx.dataHealthCheck.update({
        where: { id },
        data: {
          status: 'resolved', severity: 'low', reason: metadata.resolutionNote,
          resolutionType: metadata.resolutionType, resolutionNote: metadata.resolutionNote, evidenceUrl: metadata.evidenceUrl,
          ...validationPayload(evidence, actor),
        },
      });
      await createMonitoringRepairLog(tx, {
        actor, action: 'resolve_health_check', resource: 'health-check', resourceId: id,
        assetSlug: existing.assetSlug, layer: existing.layer,
        oldValue: { status: existing.status, severity: existing.severity, reason: existing.reason, resolutionType: existing.resolutionType, resolutionNote: existing.resolutionNote, evidenceUrl: existing.evidenceUrl, validationResult: existing.validationResult },
        newValue: { status: updated.status, severity: updated.severity, reason: updated.reason, resolutionType: updated.resolutionType, resolutionNote: updated.resolutionNote, evidenceUrl: updated.evidenceUrl, validationMethod: updated.validationMethod, validationResult: updated.validationResult, validationEvidenceId: updated.validationEvidenceId, validationEvidenceRef: updated.validationEvidenceRef, validatedAt: updated.validatedAt },
        reason: metadata.resolutionNote, evidenceUrl: metadata.evidenceUrl,
      });
      return updated;
    });

    return c.json({ success: true, data: check });
  } catch (err) {
    return internalError(c, err, 'Health check resolution failed');
  }
});

adminMonitoringRouter.patch('/source-health/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const body = (await c.req.json().catch(() => ({}))) as { status?: unknown };
    const status = typeof body.status === 'string' ? body.status.trim() : '';

    if (!SOURCE_STATUS_OPTIONS.has(status)) {
      return c.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `Invalid source status. Use one of: ${[...SOURCE_STATUS_OPTIONS].join(', ')}`,
          },
        },
        400,
      );
    }

    const existing = await db.sourceHealth.findUnique({ where: { id } });
    if (!existing) return notFound(c, `Source health row not found: ${id}`);

    const row = await db.$transaction(async (tx) => {
      const updated = await tx.sourceHealth.update({
        where: { id },
        data: {
          status,
          lastCheckedAt: new Date(),
          ...(status === 'healthy' || status === 'redirected' || status === 'deprecated' ? { errorMessage: null } : {}),
        },
      });
      await createMonitoringRepairLog(tx, {
        actor: adminActor(c), action: 'update_source_status', resource: 'source-health', resourceId: id,
        assetSlug: existing.assetSlug, layer: existing.layer,
        oldValue: { status: existing.status, errorMessage: existing.errorMessage, httpStatus: existing.httpStatus, url: existing.url },
        newValue: { status: updated.status, errorMessage: updated.errorMessage, httpStatus: updated.httpStatus, url: updated.url },
        reason: `Source status updated to ${status}`,
      });
      return updated;
    });

    return c.json({ success: true, data: row });
  } catch (err) {
    return internalError(c, err, 'Source status update failed');
  }
});
