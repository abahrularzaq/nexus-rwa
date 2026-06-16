import type { NextRequest } from "next/server";

import { getApiKeyStore, toApiKeyResponse } from "@/lib/api-keys-store";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const key = getApiKeyStore().find((item) => item.id === id);

  if (!key) {
    return Response.json({ success: false, error: "API key not found" }, { status: 404 });
  }

  key.revokedAt ??= new Date().toISOString();

  return Response.json({ success: true, data: toApiKeyResponse(key) });
}
