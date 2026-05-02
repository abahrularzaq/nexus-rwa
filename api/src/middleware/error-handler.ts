import type { Hono } from 'hono';
import type { ApiErrorResponse } from '@nexus-rwa/shared';
import { createMeta, ERROR_CODES } from '@nexus-rwa/shared';
import { logger } from '../lib/logger.js';
import { AppError } from '../services/asset.service.js';

let processHandlersBound = false;

function apiErrorBody(code: string, message: string): ApiErrorResponse {
  return {
    success: false,
    error: { code, message },
    meta: createMeta(false),
  };
}

function statusForAppError(code: string): 400 | 401 | 404 {
  switch (code) {
    case ERROR_CODES.ASSET_NOT_FOUND:
    case ERROR_CODES.DATA_NOT_AVAILABLE:
      return 404;
    case ERROR_CODES.INVALID_PARAMS:
      return 400;
    case ERROR_CODES.UNAUTHORIZED:
      return 401;
    default:
      return 400;
  }
}

export function setupErrorHandlers(app: Hono): void {
  app.onError((err, c) => {
    if (err instanceof AppError) {
      const status = statusForAppError(err.code);
      return c.json(apiErrorBody(err.code, err.message), status);
    }

    logger.error({ err }, 'Unhandled error in request handler');
    return c.json(
      apiErrorBody(
        ERROR_CODES.INTERNAL_ERROR,
        'Terjadi kesalahan internal',
      ),
      500,
    );
  });

  if (processHandlersBound) {
    return;
  }
  processHandlersBound = true;

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'unhandledRejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'uncaughtException');
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}
