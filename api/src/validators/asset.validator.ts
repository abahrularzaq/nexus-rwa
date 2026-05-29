import { z } from 'zod';
import { PAGINATION } from '../shared/index.js';

export const getAssetListSchema = z.object({
  limit: z.coerce.number().min(1).max(PAGINATION.MAX_LIMIT).default(50),
  offset: z.coerce.number().min(0).default(0),
  category: z.string().max(80).optional(),
});

/** @deprecated Use getAssetListSchema */
export const getAssetsSchema = z.object({
  page: z.coerce.number().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  category: z.string().max(80).optional(),
  chain: z.enum(['ethereum', 'base', 'polygon', 'arbitrum']).optional(),
  search: z.string().max(100).optional(),
});

export const getAssetSlugSchema = z.object({
  slug: z.string().min(1).max(120),
});

/** @deprecated Use getAssetSlugSchema */
export const getAssetByIdSchema = z.object({
  id: z.string().min(1).max(100),
});

export const getYieldSchema = z.object({
  id: z.string().min(1).max(100),
  period: z.enum(['7d', '30d', '90d', '365d']).default('30d'),
});

export const getHistorySchema = z.object({
  slug: z.string().min(1).max(120),
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
});