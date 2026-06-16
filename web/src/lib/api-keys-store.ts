import { createHash } from "node:crypto";

export type ApiTier = "free" | "pro" | "enterprise";

export type StoredApiKey = {
  id: string;
  name: string;
  prefix: string;
  keyHash: string;
  tier: ApiTier;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  rateLimitLimit: number;
  rateLimitRemaining: number;
};

export type ApiKeyResponse = Omit<StoredApiKey, "keyHash"> & { active: boolean };

declare global {
  var nexusApiKeys: StoredApiKey[] | undefined;
}

export const TIER_RATE_LIMITS: Record<ApiTier, number> = {
  free: 1_000,
  pro: 25_000,
  enterprise: 250_000,
};

export function getApiKeyStore() {
  globalThis.nexusApiKeys ??= [];
  return globalThis.nexusApiKeys;
}

export function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function isApiKeyActive(key: StoredApiKey) {
  return !key.revokedAt && new Date(key.expiresAt).getTime() > Date.now();
}

export function toApiKeyResponse(key: StoredApiKey): ApiKeyResponse {
  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    tier: key.tier,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    revokedAt: key.revokedAt,
    lastUsedAt: key.lastUsedAt,
    usageCount: key.usageCount,
    rateLimitLimit: key.rateLimitLimit,
    rateLimitRemaining: Math.max(0, key.rateLimitRemaining),
    active: isApiKeyActive(key),
  };
}
