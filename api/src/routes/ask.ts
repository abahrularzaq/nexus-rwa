import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { z } from 'zod';
import { createNexusX402Middleware } from '../middleware/x402/index.js';
import { checkAskRateLimit } from '../lib/ask-rate-limit.js';
import { streamAskNexus } from '../lib/aiInsights.js';
import { ERROR_CODES } from '../shared/index.js';
import { AppError } from '../services/asset.service.js';
import { logger } from '../lib/logger.js';

const ASK_QUESTION_MAX_LENGTH = 500;

const askBodySchema = z.object({
  question: z
    .string({ required_error: 'question is required', invalid_type_error: 'question must be a string' })
    .trim()
    .min(3, 'question must be at least 3 characters')
    .max(ASK_QUESTION_MAX_LENGTH, `question must be ${ASK_QUESTION_MAX_LENGTH} characters or fewer`),
  context: z
    .array(z.string().trim().min(1).max(128), { invalid_type_error: 'context must be an array of asset slugs' })
    .max(8, 'context can include at most 8 assets')
    .optional(),
}).strict();

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
  } catch (err) {
    const details = err instanceof z.ZodError ? err.issues.map((issue) => issue.message) : undefined;
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.INVALID_PARAMS,
          message: `Body must include { question: string (3-${ASK_QUESTION_MAX_LENGTH} chars), context?: string[] }`,
          ...(details ? { details } : {}),
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
        onDone: async (metadata) => {
          await writeEvent('done', JSON.stringify({ ok: true, metadata }));
        },
        onError: async (err) => {
          logger.warn({ err: err.message }, 'Ask Nexus provider stream error; fallback will be attempted');
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
