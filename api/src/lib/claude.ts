import { logger } from './logger.js';

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  return key;
}

function anthropicHeaders(stream: boolean): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey(),
    'anthropic-version': '2023-06-01',
    ...(stream ? { Accept: 'text/event-stream' } : {}),
  };
}

type AnthropicTextBlock = { type: 'text'; text: string };

type AnthropicMessageResponse = {
  content?: AnthropicTextBlock[];
  error?: { type?: string; message?: string };
};

/** Non-streaming completion; returns assistant text. */
export async function claudeComplete(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const res = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: 'POST',
    headers: anthropicHeaders(false),
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: params.maxTokens ?? 1024,
      system: params.system,
      messages: [{ role: 'user', content: params.user }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error({ status: res.status, body }, 'Claude API error');
    throw new Error(`Claude API failed (${res.status})`);
  }

  const json = (await res.json()) as AnthropicMessageResponse;
  const text = json.content?.find((b) => b.type === 'text')?.text ?? '';
  if (!text) {
    throw new Error('Claude returned empty response');
  }
  return text;
}

type StreamHandlers = {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
};

/** Streams assistant text deltas via Anthropic SSE. */
export async function claudeStream(params: {
  system: string;
  user: string;
  maxTokens?: number;
  handlers: StreamHandlers;
}): Promise<void> {
  const res = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: 'POST',
    headers: anthropicHeaders(true),
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: params.maxTokens ?? 2048,
      stream: true,
      system: params.system,
      messages: [{ role: 'user', content: params.user }],
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '');
    logger.error({ status: res.status, body }, 'Claude stream error');
    params.handlers.onError(new Error(`Claude API failed (${res.status})`));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]' || payload === '') continue;

        let event: { type?: string; delta?: { type?: string; text?: string } };
        try {
          event = JSON.parse(payload) as typeof event;
        } catch {
          continue;
        }

        if (
          event.type === 'content_block_delta' &&
          event.delta?.type === 'text_delta' &&
          typeof event.delta.text === 'string'
        ) {
          params.handlers.onDelta(event.delta.text);
        }
      }
    }
    params.handlers.onDone();
  } catch (err) {
    params.handlers.onError(err instanceof Error ? err : new Error('Stream failed'));
  } finally {
    reader.releaseLock();
  }
}

/** Extract JSON object from model text (handles optional markdown fences). */
export function parseJsonFromModelText<T>(text: string): T {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1]!.trim() : trimmed;
  return JSON.parse(candidate) as T;
}
