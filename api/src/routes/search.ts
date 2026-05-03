import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';
import type { ApiErrorResponse, ApiSuccessResponse, AssetSummary } from '../shared/index.js';
import { createMeta, ERROR_CODES } from '../shared/index.js';
import { createNexusX402Middleware } from '../middleware/x402/index.js';
import * as assetRepo from '../repositories/asset.repository.js';
import { summarizeAssetsForList } from '../services/asset.service.js';

let x402Instance: ReturnType<typeof createNexusX402Middleware> | null = null;

function getX402Middleware() {
  if (!x402Instance) {
    x402Instance = createNexusX402Middleware();
  }
  return x402Instance;
}

const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'q wajib minimal 2 karakter'),
  limit: z.coerce.number().min(1).max(20).default(10),
});

function ok<T>(data: T): ApiSuccessResponse<T> {
  return { success: true, data, meta: createMeta(false) };
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

export const searchRouter = new Hono();

async function getSearchHandler(c: Context) {
  const parsed = searchQuerySchema.safeParse({
    q: c.req.query('q'),
    limit: c.req.query('limit'),
  });

  if (!parsed.success) {
    return c.json(
      err(ERROR_CODES.INVALID_PARAMS, 'Query tidak valid', {
        issues: parsed.error.flatten(),
      }),
      400,
    );
  }

  const { q, limit } = parsed.data;
  try {
    const { data } = await assetRepo.findMany({ page: 1, limit, search: q });
    const summaries: AssetSummary[] = await summarizeAssetsForList(data);
    return c.json(ok(summaries));
  } catch (e) {
    return c.json(
      err(
        ERROR_CODES.INTERNAL_ERROR,
        e instanceof Error ? e.message : 'Terjadi kesalahan internal',
      ),
      500,
    );
  }
}

searchRouter.get('/', (c, next) => getX402Middleware()(c, next), getSearchHandler);
