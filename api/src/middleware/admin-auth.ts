import type { MiddlewareHandler } from 'hono';

export function adminAuthMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const expected = process.env.ADMIN_API_KEY?.trim();
    if (!expected) {
      return c.json(
        {
          success: false,
          error: {
            code: 'ADMIN_DISABLED',
            message: 'ADMIN_API_KEY is not configured on the server',
          },
        },
        503,
      );
    }

    const provided =
      c.req.header('X-Admin-Key')?.trim() ?? c.req.header('x-admin-key')?.trim();

    if (!provided || provided !== expected) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or missing X-Admin-Key header',
          },
        },
        401,
      );
    }

    await next();
  };
}
