import type { NextRequest } from "next/server";

type StoredApiKey = {
  id: string;
  name: string;
  prefix: string;
  keyHash: string;
  tier: "free" | "pro" | "enterprise";
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
};

declare global {
  var nexusApiKeys: StoredApiKey[] | undefined;
}

function getStore() {
  globalThis.nexusApiKeys ??= [];
  return globalThis.nexusApiKeys;
}

function toResponse(key: StoredApiKey) {
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

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const key = getStore().find((item) => item.id === id);

  if (!key) {
    return Response.json({ success: false, error: "API key not found" }, { status: 404 });
  }

  key.revokedAt ??= new Date().toISOString();

  return Response.json({ success: true, data: toResponse(key) });
}
