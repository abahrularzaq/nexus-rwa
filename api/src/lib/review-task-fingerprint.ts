import { Prisma } from '@prisma/client';
import { db } from './database.js';

const ACTIVE_REVIEW_TASK_STATUSES = new Set(['open', 'reopened', 'pending_validation']);

export type ReviewTaskFingerprintInput = {
  assetSlug: string;
  layer: string;
  fieldPath?: string | null;
  sourceUrl?: string | null;
  issueType: string;
};

export type ReviewTaskUpsertInput = ReviewTaskFingerprintInput & {
  priority: string;
  reason: string;
  detectedAt?: Date;
};

function normalizeToken(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizeSourceUrl(value: string | null | undefined): string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    parsed.hash = '';
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();

    if (parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }

    return parsed.toString();
  } catch {
    return trimmed.replace(/#.*$/, '').replace(/\/+$/, '').toLowerCase();
  }
}

export function buildReviewTaskFingerprint(input: ReviewTaskFingerprintInput): string {
  return [
    normalizeToken(input.assetSlug),
    normalizeToken(input.layer),
    normalizeToken(input.fieldPath),
    normalizeSourceUrl(input.sourceUrl),
    normalizeToken(input.issueType),
  ].join('|');
}

export function activeFingerprintFor(status: string, fingerprint: string | null | undefined): string | null {
  return fingerprint && ACTIVE_REVIEW_TASK_STATUSES.has(status) ? fingerprint : null;
}

function isUniqueConstraintError(err: unknown): boolean {
  return (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
    || (err instanceof Error && err.message.toLowerCase().includes('unique constraint'));
}

export async function upsertReviewTaskDetection(input: ReviewTaskUpsertInput) {
  const detectedAt = input.detectedAt ?? new Date();
  const fingerprint = buildReviewTaskFingerprint(input);
  const sourceUrl = input.sourceUrl ? normalizeSourceUrl(input.sourceUrl) : null;
  const fieldPath = input.fieldPath?.trim() || null;

  const updateData = {
    priority: input.priority,
    reason: input.reason,
    lastDetectedAt: detectedAt,
    occurrenceCount: { increment: 1 },
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(fieldPath ? { fieldPath } : {}),
  };

  try {
    return await db.$transaction(async (tx) => {
      const active = await tx.reviewTask.findUnique({ where: { activeFingerprint: fingerprint } });
      if (active) {
        return tx.reviewTask.update({
          where: { id: active.id },
          data: updateData,
        });
      }

      const resolved = await tx.reviewTask.findFirst({
        where: { fingerprint, status: 'resolved', activeFingerprint: null },
        orderBy: { resolvedAt: 'desc' },
      });

      if (resolved) {
        const reopenedAt = detectedAt;
        const updateResult = await tx.reviewTask.updateMany({
          where: { id: resolved.id, status: 'resolved', activeFingerprint: null },
          data: {
            ...updateData,
            status: 'reopened',
            activeFingerprint: fingerprint,
            resolvedAt: null,
            reopenedAt,
            reopenedBy: 'monitoring',
            reopenReason: 'Issue detected again by monitoring',
            resolutionType: null,
            resolutionNote: null,
            evidenceUrl: null,
            validationMethod: null,
            validationResult: null,
            validationEvidenceId: null,
            validationEvidenceRef: null,
            validatedAt: null,
            validatedBy: null,
          },
        });

        if (updateResult.count === 1) {
          return tx.reviewTask.findUniqueOrThrow({ where: { id: resolved.id } });
        }

        const racedActive = await tx.reviewTask.findUnique({ where: { activeFingerprint: fingerprint } });
        if (racedActive) {
          return tx.reviewTask.update({ where: { id: racedActive.id }, data: updateData });
        }
      }

      return tx.reviewTask.create({
        data: {
          assetSlug: input.assetSlug,
          layer: input.layer,
          fieldPath,
          sourceUrl,
          issueType: input.issueType,
          fingerprint,
          activeFingerprint: fingerprint,
          priority: input.priority,
          reason: input.reason,
          status: 'open',
          lastDetectedAt: detectedAt,
          occurrenceCount: 1,
        },
      });
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return db.reviewTask.update({
        where: { activeFingerprint: fingerprint },
        data: updateData,
      });
    }

    throw err;
  }
}
