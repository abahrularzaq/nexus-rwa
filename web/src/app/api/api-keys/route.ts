import { createHash, randomBytes, randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

type ApiTier = "free" | "pro" | "enterprise";

type StoredApiKey = {
  id: string;
  name: string;
  prefix: string;
  keyHash: string;
  tier: ApiTier;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
};

type ApiKeyResponse = Omit<StoredApiKey, "keyHash"> & { active: boolean };

declare global {
  var nexusApiKeys: StoredApiKey[] | undefined;
}

const DEFAULT_TIER: ApiTier = "pro";
const KEY_TTL_DAYS = 30;

function getStore() {
  globalThis.nexusApiKeys ??= [];
  return globalThis.nexusApiKeys;
}

function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

function createRawApiKey() {
  return `nxrwa_${randomBytes(24).toString("base64url")}`;
}

function toResponse(key: StoredApiKey): ApiKeyResponse {
  const expiresAt = new Date(key.expiresAt).getTime();
  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    tier: key.tier,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    revokedAt: key.revokedAt,
    active: !key.revokedAt && expiresAt > Date.now(),
  };
}

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export async function GET() {
  const keys = getStore()
    .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(toResponse);

  return json({ success: true, data: keys });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { name?: string; tier?: ApiTier };
  const rawKey = createRawApiKey();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + KEY_TTL_DAYS * 24 * 60 * 60 * 1000);
  const tier = body.tier && ["free", "pro", "enterprise"].includes(body.tier) ? body.tier : DEFAULT_TIER;

  const record: StoredApiKey = {
    id: randomUUID(),
    name: body.name?.trim() || "Dashboard API key",
    prefix: rawKey.slice(0, 12),
    keyHash: hashApiKey(rawKey),
    tier,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    revokedAt: null,
  };

  getStore().push(record);

  return json(
    {
      success: true,
      data: {
        ...toResponse(record),
        apiKey: rawKey,
        warning: "Store this key now. Nexus RWA only shows the full API key once.",
      },
    },
    { status: 201 },
  );
}
