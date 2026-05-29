import type { Context } from 'hono';
import { Hono } from 'hono';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AssetSummary,
  HolderData,
  PaginatedResponse,
  RiskData,
  YieldData,
  YieldHistoryResponse,
} from '../shared/index.js';
import { createMeta, ERROR_CODES } from '../shared/index.js';
import { createNexusX402Middleware } from '../middleware/x402/index.js';
import {
  getAssetByIdSchema,
  getAssetsSchema,
  getHistorySchema,
  getYieldSchema,
} from '../validators/asset.validator.js';
import {
  AppError,
  type AssetDetail,
  getAssetDetail,
  getAssets,
  getHolderData,
  getRiskData,
  getYieldData,
} from '../services/asset.service.js';
import { getYieldHistory } from '../services/yieldHistory.service.js';

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

export const assetsRouter = new Hono();

/** GET / — daftar asset dengan pagination & filter (validator: getAssetsSchema) */
async function getAssetsHandler(c: Context) {
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
    const body = await getAssets(parsed.data);
    return c.json(ok<PaginatedResponse<AssetSummary>>(body, false));
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

/** GET /:id/yield — data yield dengan `period` (7d|30d|90d|365d) */
async function getYieldHandler(c: Context) {
  const parsed = getYieldSchema.safeParse({
    id: c.req.param('id'),
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
    const data: YieldData = await getYieldData(parsed.data.id, parsed.data.period);
    return c.json(ok(data, false));
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

/** GET /:id/holders — distribusi holder */
async function getHoldersHandler(c: Context) {
  const parsed = getAssetByIdSchema.safeParse({ id: c.req.param('id') });
  if (!parsed.success) {
    return c.json(
      err(ERROR_CODES.INVALID_PARAMS, 'Parameter id tidak valid', {
        issues: parsed.error.flatten(),
      }),
      400,
    );
  }

  try {
    const data: HolderData = await getHolderData(parsed.data.id);
    return c.json(ok(data, false));
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

/** GET /:id/history — time-series yield + TVL (gated) */
async function getHistoryHandler(c: Context) {
  const parsed = getHistorySchema.safeParse({
    id: c.req.param('id'),
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
    const data: YieldHistoryResponse = await getYieldHistory(
      parsed.data.id,
      parsed.data.period,
    );
    return c.json(ok(data, false));
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'ASSET_NOT_FOUND') {
      return c.json(
        err(ERROR_CODES.ASSET_NOT_FOUND, 'Asset tidak ditemukan'),
        404,
      );
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

/** GET /:id/risk — detail skor risiko */
async function getRiskHandler(c: Context) {
  const parsed = getAssetByIdSchema.safeParse({ id: c.req.param('id') });
  if (!parsed.success) {
    return c.json(
      err(ERROR_CODES.INVALID_PARAMS, 'Parameter id tidak valid', {
        issues: parsed.error.flatten(),
      }),
      400,
    );
  }

  try {
    const { data, cached } = await getRiskData(parsed.data.id);
    c.header('X-Cache', cached ? 'HIT' : 'MISS');
    return c.json(ok<RiskData>(data, cached));
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

/** GET /:id — detail satu asset (validator: getAssetByIdSchema) */
async function getAssetDetailHandler(c: Context) {
  const parsed = getAssetByIdSchema.safeParse({ id: c.req.param('id') });
  if (!parsed.success) {
    return c.json(
      err(ERROR_CODES.INVALID_PARAMS, 'Parameter id tidak valid', {
        issues: parsed.error.flatten(),
      }),
      400,
    );
  }

  try {
    const data: AssetDetail = await getAssetDetail(parsed.data.id);
    return c.json(ok(data, false));
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

assetsRouter.get('/', (c, next) => getX402Middleware()(c, next), getAssetsHandler);
assetsRouter.get('/:id/yield', (c, next) => getX402Middleware()(c, next), getYieldHandler);
assetsRouter.get('/:id/history', (c, next) => getX402Middleware()(c, next), getHistoryHandler);
assetsRouter.get('/:id/holders', (c, next) => getX402Middleware()(c, next), getHoldersHandler);
assetsRouter.get('/:id/risk', (c, next) => getX402Middleware()(c, next), getRiskHandler);
assetsRouter.get('/:id', (c, next) => getX402Middleware()(c, next), getAssetDetailHandler);
