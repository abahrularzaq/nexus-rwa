import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { z } from 'zod';
import { createNexusX402Middleware } from '../middleware/x402/index.js';
import { checkAskRateLimit } from '../lib/ask-rate-limit.js';
import { streamAskNexus } from '../lib/aiInsights.js';
import { ERROR_CODES } from '../shared/index.js';
import { AppError } from '../services/asset.service.js';
import { logger } from '../lib/logger.js';

const askBodySchema = z.object({
  question: z.string().min(3).max(2000),
  context: z.array(z.string().min(1).max(128)).max(8).optional(),
});

const x402 = createNexusX402Middleware();

export const askRouter = new Hono();

askRouter.post('/', (c, next) => x402(c, next), async (c) => {
  const wallet = c.req.header('X-Wallet-Address');
  const rate = await checkAskRateLimit(wallet);

  if (!rate.allowed) {
    const status = rate.code === ERROR_CODES.UNAUTHORIZED ? 400 : 429;
    const message =
      rate.code === ERROR_CODES.UNAUTHORIZED
        ? 'X-Wallet-Address header required for Ask Nexus.'
        : 'Ask Nexus limit reached (10 requests per wallet per day).';
    return c.json(
      {
        success: false,
        error: { code: rate.code, message },
      },
      status,
    );
  }

  let body: z.infer<typeof askBodySchema>;
  try {
    const json: unknown = await c.req.json();
    body = askBodySchema.parse(json);
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.INVALID_PARAMS,
          message: 'Body must include { question: string, context?: string[] }',
        },
      },
      400,
    );
  }

  c.header('X-RateLimit-Remaining', String(rate.remaining));
  c.header('Content-Type', 'text/event-stream; charset=utf-8');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (sseStream) => {
    const encoder = new TextEncoder();

    const writeEvent = async (event: string, data: string) => {
      await sseStream.write(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
    };

    try {
      await streamAskNexus({
        question: body.question,
        context: body.context,
        onDelta: async (text) => {
          await writeEvent('delta', JSON.stringify({ text }));
        },
        onDone: async () => {
          await writeEvent('done', JSON.stringify({ ok: true }));
        },
        onError: async (err) => {
          logger.warn({ err: err.message }, 'Ask Nexus stream error');
          await writeEvent('error', JSON.stringify({ message: err.message }));
        },
      });
      await sseStream.close();
    } catch (e) {
      const message =
        e instanceof AppError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Ask Nexus failed';
      const code =
        e instanceof AppError ? e.code : ERROR_CODES.INTERNAL_ERROR;
      await writeEvent('error', JSON.stringify({ code, message }));
      await sseStream.close();
    }
  });
});
