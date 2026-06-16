import type { NextRequest } from "next/server";

import { getApiKeyStore, hashApiKey, isApiKeyActive, toApiKeyResponse } from "@/lib/api-keys-store";

function bearerToken(req: NextRequest) {
  const header = req.headers.get("authorization")?.trim();
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  const key = token ? getApiKeyStore().find((item) => item.keyHash === hashApiKey(token)) : null;

  if (!key || !isApiKeyActive(key)) {
    return Response.json({ success: false, error: "Invalid, revoked, or expired API key" }, { status: 401 });
  }

  if (key.rateLimitRemaining <= 0) {
    return Response.json(
      { success: false, error: "Rate limit exceeded", data: toApiKeyResponse(key) },
      { status: 429, headers: { "x-ratelimit-limit": String(key.rateLimitLimit), "x-ratelimit-remaining": "0" } },
    );
  }

  key.usageCount += 1;
  key.rateLimitRemaining -= 1;
  key.lastUsedAt = new Date().toISOString();

  return Response.json(
    {
      success: true,
      message: "API key is valid. Usage and last-used timestamp were updated.",
      data: toApiKeyResponse(key),
    },
    {
      headers: {
        "x-ratelimit-limit": String(key.rateLimitLimit),
        "x-ratelimit-remaining": String(key.rateLimitRemaining),
      },
    },
  );
}
