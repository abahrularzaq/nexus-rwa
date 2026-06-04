import type { Context } from 'hono';
import { Hono } from 'hono';
import type { ApiErrorResponse, ApiSuccessResponse } from '../shared/index.js';
import { createMeta, ERROR_CODES, paginate } from '../shared/index.js';
import { createNexusX402Middleware } from '../middleware/x402/index.js';
import { resolveRequestTier } from '../lib/request-tier.js';
import { getAssetInsightById } from '../lib/aiInsights.js';
import { getAssetsSchema, getAssetSlugSchema, getHistorySchema } from '../validators/asset.validator.js';
import {
  AppError,
  getAssetDetail,
  getAssetList,
  getAssetRepository,
  NotFoundError,
} from '../services/asset.service.js';
import type { HistoryPeriod } from '../types/asset.types.js';

let x402Instance: ReturnType<typeof createNexusX402Middleware> | null = null;

function getX402Middleware() {
  if (!x402Instance) {
    x402Instance = createNexusX402Middleware();
  }
  return x402Instance;
}

function ok<T>(data: T, cached = false): ApiSuccessResponse<T> {
  return { success: true, data, meta: createMeta(cached) };
}

function err(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ApiErrorResponse {
  return {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
    meta: createMeta(false),
  };
}

function appErrorStatus(code: string): 400 | 404 {
  if (code === ERROR_CODES.ASSET_NOT_FOUND || code === ERROR_CODES.DATA_NOT_AVAILABLE) {
    return 404;
  }
  return 400;
}

function setDataVersionHeader(c: Context, dataVersion: number | undefined): void {
  if (typeof dataVersion === 'number' && Number.isFinite(dataVersion)) {
    c.header('X-Data-Version', String(dataVersion));
  }
}

function dataVersionFromDetail(data: { dataVersion?: number }): number | undefined {
  return data.dataVersion;
}

export const assetsRouter = new Hono();

/** GET / — paginated 12-layer list items (tier-scoped layers). */
async function getAssetListHandler(c: Context) {
  const q = c.req.query();
  const parsed = getAssetsSchema.safeParse({
    page: q.page,
    limit: q.limit,
    category: q.category,
    chain: q.chain,
    search: q.search,
  });

  if (!parsed.success) {
    return c.json(
      err(ERROR_CODES.INVALID_PARAMS, 'Query tidak valid', {
        issues: parsed.error.flatten(),
      }),
      400,
    );
  }

  try {
    const tier = await resolveRequestTier(c);
    const offset = (parsed.data.page - 1) * parsed.data.limit;
    const { data, cached } = await getAssetList({
      category: parsed.data.category,
      search: parsed.data.search,
      limit: parsed.data.limit,
      offset,
      tier,
    });
    const total = await getAssetRepository().countActive(parsed.data.category);
    const maxVersion = data.reduce(
      (max, row) => Math.max(max, 'dataVersion' in row ? row.dataVersion : 0),
      0,
    );
    if (maxVersion > 0) {
      c.header('X-Data-Version', String(maxVersion));
    }
    c.header('X-Cache', cached ? 'HIT' : 'MISS');
    c.header('X-Payment-Tier', tier);
    return c.json(
      ok(
        paginate(data, total, {
          page: parsed.data.page,
          limit: parsed.data.limit,
        }),
        cached,
      ),
    );
  } catch (e: unknown) {
    if (e instanceof AppError) {
      return c.json(err(e.code, e.message), appErrorStatus(e.code));
    }
    return c.json(
      err(
        ERROR_CODES.INTERNAL_ERROR,
        e instanceof Error ? e.message : 'Terjadi kesalahan internal',
      ),
      500,
    );
  }
}

/** GET /:slug — FREE tier detail */
async function getAssetDetailFreeHandler(c: Context) {
  const parsed = getAssetSlugSchema.safeParse({ slug: c.req.param('slug') });
  if (!parsed.success) {
    return c.json(
      err(ERROR_CODES.INVALID_PARAMS, 'Parameter slug tidak valid', {
        issues: parsed.error.flatten(),
      }),
      400,
    );
  }

  try {
    const { data, cached } = await getAssetDetail(parsed.data.slug, 'free');
    setDataVersionHeader(c, dataVersionFromDetail(data));
    c.header('X-Cache', cached ? 'HIT' : 'MISS');
    return c.json(ok(data, cached));
  } catch (e: unknown) {
    if (e instanceof NotFoundError || e instanceof AppError) {
      return c.json(err(e.code, e.message), 404);
    }
    return c.json(
      err(
        ERROR_CODES.INTERNAL_ERROR,
        e instanceof Error ? e.message : 'Terjadi kesalahan internal',
      ),
      500,
    );
  }
}

/** GET /:slug/full — PRO tier detail (x402 gated) */
async function getAssetDetailProHandler(c: Context) {
  const parsed = getAssetSlugSchema.safeParse({ slug: c.req.param('slug') });
  if (!parsed.success) {
    return c.json(
      err(ERROR_CODES.INVALID_PARAMS, 'Parameter slug tidak valid', {
        issues: parsed.error.flatten(),
      }),
      400,
    );
  }

  try {
    const tier = await resolveRequestTier(c);
    const effectiveTier = tier === 'enterprise' ? 'enterprise' : 'pro';
    const { data, cached } = await getAssetDetail(parsed.data.slug, effectiveTier);
    setDataVersionHeader(c, dataVersionFromDetail(data));
    c.header('X-Cache', cached ? 'HIT' : 'MISS');
    c.header('X-Payment-Tier', effectiveTier);
    return c.json(ok(data, cached));
  } catch (e: unknown) {
    if (e instanceof NotFoundError || e instanceof AppError) {
      return c.json(err(e.code, e.message), 404);
    }
    return c.json(
      err(
        ERROR_CODES.INTERNAL_ERROR,
        e instanceof Error ? e.message : 'Terjadi kesalahan internal',
      ),
      500,
    );
  }
}

/** GET /:slug/history — PRO gated */
async function getAssetHistoryHandler(c: Context) {
  const parsed = getHistorySchema.safeParse({
    slug: c.req.param('slug'),
    period: c.req.query('period'),
  });
  if (!parsed.success) {
    return c.json(
      err(ERROR_CODES.INVALID_PARAMS, 'Parameter tidak valid', {
        issues: parsed.error.flatten(),
      }),
      400,
    );
  }

  try {
    const asset = await getAssetRepository().findBySlug(parsed.data.slug);
    if (!asset) {
      return c.json(err(ERROR_CODES.ASSET_NOT_FOUND, 'Asset tidak ditemukan'), 404);
    }

    const period = parsed.data.period as HistoryPeriod;
    const history = await getAssetRepository().getHistory(asset.id, period);
    setDataVersionHeader(c, asset.dataVersion);
    return c.json(ok(history, false));
  } catch (e: unknown) {
    if (e instanceof AppError) {
      return c.json(err(e.code, e.message), appErrorStatus(e.code));
    }
    return c.json(
      err(
        ERROR_CODES.INTERNAL_ERROR,
        e instanceof Error ? e.message : 'Terjadi kesalahan internal',
      ),
      500,
    );
  }
}

/** GET /:slug/risk — PRO gated risk breakdown */
async function getAssetRiskHandler(c: Context) {
  const parsed = getAssetSlugSchema.safeParse({ slug: c.req.param('slug') });
  if (!parsed.success) {
    return c.json(
      err(ERROR_CODES.INVALID_PARAMS, 'Parameter slug tidak valid', {
        issues: parsed.error.flatten(),
      }),
      400,
    );
  }

  try {
    const asset = await getAssetRepository().findBySlug(parsed.data.slug, ['risk', 'grade']);
    if (!asset) {
      return c.json(err(ERROR_CODES.ASSET_NOT_FOUND, 'Asset tidak ditemukan'), 404);
    }

    setDataVersionHeader(c, asset.dataVersion);
    return c.json(ok({ risk: asset.risk ?? null, grade: asset.grade ?? null }, false));
  } catch (e: unknown) {
    return c.json(
      err(
        ERROR_CODES.INTERNAL_ERROR,
        e instanceof Error ? e.message : 'Terjadi kesalahan internal',
      ),
      500,
    );
  }
}

/** GET /:slug/sources — PRO gated field-level source trail */
async function getAssetSourcesHandler(c: Context) {
  const parsed = getAssetSlugSchema.safeParse({ slug: c.req.param('slug') });
  if (!parsed.success) {
    return c.json(
      err(ERROR_CODES.INVALID_PARAMS, 'Parameter slug tidak valid', {
        issues: parsed.error.flatten(),
      }),
      400,
    );
  }

  try {
    const asset = await getAssetRepository().findBySlug(parsed.data.slug, ['sources']);
    if (!asset) {
      return c.json(err(ERROR_CODES.ASSET_NOT_FOUND, 'Asset tidak ditemukan'), 404);
    }

    setDataVersionHeader(c, asset.dataVersion);
    return c.json(ok(asset.sources ?? [], false));
  } catch (e: unknown) {
    return c.json(
      err(
        ERROR_CODES.INTERNAL_ERROR,
        e instanceof Error ? e.message : 'Terjadi kesalahan internal',
      ),
      500,
    );
  }
}

/** GET /:slug/insight — PRO gated AI-generated asset insight */
async function getAssetInsightHandler(c: Context) {
  const parsed = getAssetSlugSchema.safeParse({ slug: c.req.param('slug') });
  if (!parsed.success) {
    return c.json(
      err(ERROR_CODES.INVALID_PARAMS, 'Parameter slug tidak valid', {
        issues: parsed.error.flatten(),
      }),
      400,
    );
  }

  try {
    const { insight, cached } = await getAssetInsightById(parsed.data.slug);
    c.header('X-Cache', cached ? 'HIT' : 'MISS');
    return c.json(ok(insight, cached));
  } catch (e: unknown) {
    if (e instanceof NotFoundError || e instanceof AppError) {
      return c.json(err(e.code, e.message), appErrorStatus(e.code));
    }
    return c.json(
      err(
        ERROR_CODES.INTERNAL_ERROR,
        e instanceof Error ? e.message : 'Terjadi kesalahan internal',
      ),
      500,
    );
  }
}

/** GET /:slug/events — FREE */
async function getAssetEventsHandler(c: Context) {
  const parsed = getAssetSlugSchema.safeParse({ slug: c.req.param('slug') });
  if (!parsed.success) {
    return c.json(
      err(ERROR_CODES.INVALID_PARAMS, 'Parameter slug tidak valid', {
        issues: parsed.error.flatten(),
      }),
      400,
    );
  }

  try {
    const asset = await getAssetRepository().findBySlug(parsed.data.slug, ['events']);
    if (!asset) {
      return c.json(err(ERROR_CODES.ASSET_NOT_FOUND, 'Asset tidak ditemukan'), 404);
    }

    setDataVersionHeader(c, asset.dataVersion);
    return c.json(ok(asset.events ?? [], false));
  } catch (e: unknown) {
    return c.json(
      err(
        ERROR_CODES.INTERNAL_ERROR,
        e instanceof Error ? e.message : 'Terjadi kesalahan internal',
      ),
      500,
    );
  }
}

assetsRouter.get('/', (c, next) => getX402Middleware()(c, next), getAssetListHandler);
assetsRouter.get('/:slug/full', (c, next) => getX402Middleware()(c, next), getAssetDetailProHandler);
assetsRouter.get('/:slug/history', (c, next) => getX402Middleware()(c, next), getAssetHistoryHandler);
assetsRouter.get('/:slug/risk', (c, next) => getX402Middleware()(c, next), getAssetRiskHandler);
assetsRouter.get('/:slug/sources', (c, next) => getX402Middleware()(c, next), getAssetSourcesHandler);
assetsRouter.get('/:slug/insight', (c, next) => getX402Middleware()(c, next), getAssetInsightHandler);
assetsRouter.get('/:slug/events', getAssetEventsHandler);
assetsRouter.get('/:slug', (c, next) => getX402Middleware()(c, next), getAssetDetailFreeHandler);
