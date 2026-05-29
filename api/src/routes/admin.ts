import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../lib/database.js';
import { adminAuthMiddleware } from '../middleware/admin-auth.js';
import { ERROR_CODES } from '../shared/index.js';
import {
  getAssetRepository,
  invalidateAssetCache,
  NotFoundError,
} from '../services/asset.service.js';
import { getSyncService } from '../services/sync.service.js';

export const adminRouter = new Hono();

adminRouter.use('*', adminAuthMiddleware());

const slugParamSchema = z.object({
  slug: z.string().min(1).max(120),
});

const addEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  eventType: z.string().min(1).max(80),
  severity: z.enum(['info', 'warning', 'critical']).default('info'),
  occurredAt: z.coerce.date(),
  sourceUrl: z.string().url().optional(),
  isVerified: z.boolean().optional(),
  onChainTx: z.string().max(120).optional(),
});

async function resolveAssetId(slug: string): Promise<string> {
  const asset = await db.asset.findFirst({
    where: { slug, isActive: true },
    select: { id: true },
  });
  if (!asset) {
    throw new NotFoundError();
  }
  return asset.id;
}

adminRouter.post('/assets/:slug/sync', async (c) => {
  const parsed = slugParamSchema.safeParse({ slug: c.req.param('slug') });
  if (!parsed.success) {
    return c.json(
      { success: false, error: { code: ERROR_CODES.INVALID_PARAMS, message: 'Invalid slug' } },
      400,
    );
  }

  try {
    const result = await getSyncService().syncSingle(parsed.data.slug);
    invalidateAssetCache(parsed.data.slug);

    return c.json({ success: true, data: result });
  } catch (e) {
    if (e instanceof NotFoundError) {
      return c.json({ success: false, error: { code: e.code, message: e.message } }, 404);
    }
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: e instanceof Error ? e.message : 'Sync failed',
        },
      },
      500,
    );
  }
});

adminRouter.post('/assets/:slug/events', async (c) => {
  const slugParsed = slugParamSchema.safeParse({ slug: c.req.param('slug') });
  if (!slugParsed.success) {
    return c.json(
      { success: false, error: { code: ERROR_CODES.INVALID_PARAMS, message: 'Invalid slug' } },
      400,
    );
  }

  const body = await c.req.json().catch(() => null);
  const eventParsed = addEventSchema.safeParse(body);
  if (!eventParsed.success) {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.INVALID_PARAMS,
          message: 'Invalid event body',
          details: eventParsed.error.flatten(),
        },
      },
      400,
    );
  }

  try {
    const assetId = await resolveAssetId(slugParsed.data.slug);
    const repo = getAssetRepository();
    const event = await repo.addEvent(assetId, {
      title: eventParsed.data.title,
      eventType: eventParsed.data.eventType,
      severity: eventParsed.data.severity,
      occurredAt: eventParsed.data.occurredAt,
      description: eventParsed.data.description ?? null,
      sourceUrl: eventParsed.data.sourceUrl ?? null,
      onChainTx: eventParsed.data.onChainTx ?? null,
      isVerified: eventParsed.data.isVerified ?? false,
    });
    invalidateAssetCache(slugParsed.data.slug);
    return c.json({ success: true, data: event });
  } catch (e) {
    if (e instanceof NotFoundError) {
      return c.json({ success: false, error: { code: e.code, message: e.message } }, 404);
    }
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: e instanceof Error ? e.message : 'Failed to add event',
        },
      },
      500,
    );
  }
});

adminRouter.patch('/assets/:slug/compliance', async (c) => {
  const slugParsed = slugParamSchema.safeParse({ slug: c.req.param('slug') });
  if (!slugParsed.success) {
    return c.json(
      { success: false, error: { code: ERROR_CODES.INVALID_PARAMS, message: 'Invalid slug' } },
      400,
    );
  }

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const assetId = await resolveAssetId(slugParsed.data.slug);
    const updated = await db.assetCompliance.upsert({
      where: { assetId },
      create: { assetId, ...body },
      update: body,
    });
    invalidateAssetCache(slugParsed.data.slug);
    return c.json({ success: true, data: updated });
  } catch (e) {
    if (e instanceof NotFoundError) {
      return c.json({ success: false, error: { code: e.code, message: e.message } }, 404);
    }
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: e instanceof Error ? e.message : 'Compliance update failed',
        },
      },
      500,
    );
  }
});

adminRouter.patch('/assets/:slug/institutional', async (c) => {
  const slugParsed = slugParamSchema.safeParse({ slug: c.req.param('slug') });
  if (!slugParsed.success) {
    return c.json(
      { success: false, error: { code: ERROR_CODES.INVALID_PARAMS, message: 'Invalid slug' } },
      400,
    );
  }

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const assetId = await resolveAssetId(slugParsed.data.slug);
    const updated = await db.assetInstitutional.upsert({
      where: { assetId },
      create: { assetId, ...body },
      update: body,
    });
    invalidateAssetCache(slugParsed.data.slug);
    return c.json({ success: true, data: updated });
  } catch (e) {
    if (e instanceof NotFoundError) {
      return c.json({ success: false, error: { code: e.code, message: e.message } }, 404);
    }
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: e instanceof Error ? e.message : 'Institutional update failed',
        },
      },
      500,
    );
  }
});

adminRouter.get('/sync/status', async (c) => {
  try {
    const statuses = await getSyncService().getAllSyncStatuses();
    return c.json({ success: true, data: statuses });
  } catch (e) {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: e instanceof Error ? e.message : 'Failed to load sync status',
        },
      },
      500,
    );
  }
});
