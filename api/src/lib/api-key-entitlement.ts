import { createHash } from 'node:crypto';
import type { Context } from 'hono';
import type { KeyTier } from '@prisma/client';
import { db } from './database.js';
import type { AccessTier } from '../middleware/x402/pricer.js';

export type ApiKeyEntitlement = {
  id: string;
  prefix: string;
  name: string;
  keyTier: KeyTier;
  accessTier: AccessTier;
};

const TIER_RANK: Record<AccessTier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

export function compareAccessTier(a: AccessTier, b: AccessTier): number {
  return TIER_RANK[a] - TIER_RANK[b];
}

export function maxAccessTier(...tiers: AccessTier[]): AccessTier {
  return tiers.reduce((max, tier) => (compareAccessTier(tier, max) > 0 ? tier : max), 'free');
}

export function hasAccessTier(actual: AccessTier, required: AccessTier): boolean {
  return compareAccessTier(actual, required) >= 0;
}

export function keyTierToAccessTier(tier: KeyTier): AccessTier {
  if (tier === 'PREMIUM') return 'enterprise';
  if (tier === 'STANDARD') return 'pro';
  return 'free';
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function readApiKey(c: Context): string | null {
  const explicit = c.req.header('X-API-Key')?.trim();
  if (explicit) return explicit;

  const authorization = c.req.header('Authorization')?.trim();
  if (!authorization) return null;

  const match = /^Bearer\s+(.+)$/iu.exec(authorization);
  return match?.[1]?.trim() || null;
}

/**
 * Resolve API key entitlement from X-API-Key or Authorization: Bearer.
 *
 * Only the SHA-256 hash of the supplied key is checked against the database.
 * Never store or log the raw API key.
 */
export async function resolveApiKeyEntitlement(c: Context): Promise<ApiKeyEntitlement | null> {
  const apiKey = readApiKey(c);
  if (!apiKey) return null;

  const keyHash = sha256(apiKey);
  const now = new Date();

  const row = await db.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      prefix: true,
      name: true,
      tier: true,
      isActive: true,
      expiresAt: true,
    },
  });

  if (!row || !row.isActive) return null;
  if (row.expiresAt && row.expiresAt <= now) return null;

  void db.apiKey
    .update({
      where: { id: row.id },
      data: { lastUsedAt: now },
    })
    .catch(() => {
      // best-effort telemetry only
    });

  return {
    id: row.id,
    prefix: row.prefix,
    name: row.name,
    keyTier: row.tier,
    accessTier: keyTierToAccessTier(row.tier),
  };
}
