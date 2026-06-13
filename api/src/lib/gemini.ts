import { logger } from './logger.js';

export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

type GeminiTextPart = {
  text?: string;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiTextPart[];
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

function apiKey(): string {
  const key = (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY)?.trim();
  if (!key) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return key;
}

function geminiUrl(model: string): string {
  return `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey())}`;
}

function stripGeminiJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenceMatch ? fenceMatch[1]!.trim() : trimmed;
}

export async function geminiComplete(params: {
  system: string;
  user: string;
  maxTokens?: number;
  model?: string;
}): Promise<string> {
  const model = params.model?.trim() || GEMINI_MODEL;
  const res = await fetch(geminiUrl(model), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: params.system }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: params.user }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: params.maxTokens ?? 1024,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error({ status: res.status, body, model }, 'Gemini API error');
    throw new Error(`Gemini API failed (${res.status})`);
  }

  const json = (await res.json()) as GeminiResponse;
  const text = json.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  return stripGeminiJsonFence(text);
}
