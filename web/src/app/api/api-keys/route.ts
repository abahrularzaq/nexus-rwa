import { randomBytes, randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import { getApiKeyStore, hashApiKey, type ApiTier, type StoredApiKey, TIER_RATE_LIMITS, toApiKeyResponse } from "@/lib/api-keys-store";

const DEFAULT_TIER: ApiTier = "pro";
const KEY_TTL_DAYS = 30;

function createRawApiKey() {
  return `nxrwa_${randomBytes(24).toString("base64url")}`;
}

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export async function GET() {
  const keys = getApiKeyStore()
    .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(toApiKeyResponse);

  return json({ success: true, data: keys });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { name?: string; tier?: ApiTier };
  const rawKey = createRawApiKey();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + KEY_TTL_DAYS * 24 * 60 * 60 * 1000);
  const tier = body.tier && ["free", "pro", "enterprise"].includes(body.tier) ? body.tier : DEFAULT_TIER;
  const rateLimitLimit = TIER_RATE_LIMITS[tier];

  const record: StoredApiKey = {
    id: randomUUID(),
    name: body.name?.trim() || "Dashboard API key",
    prefix: rawKey.slice(0, 12),
    keyHash: hashApiKey(rawKey),
    tier,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    revokedAt: null,
    lastUsedAt: null,
    usageCount: 0,
    rateLimitLimit,
    rateLimitRemaining: rateLimitLimit,
  };

  getApiKeyStore().push(record);

  return json(
    {
      success: true,
      data: {
        ...toApiKeyResponse(record),
        apiKey: rawKey,
        warning: "Store this key now. Nexus RWA only shows the full API key once.",
      },
    },
    { status: 201 },
  );
}
