import { createHash } from 'node:crypto';
import { db } from '../lib/database.js';
import { keyTierToAccessTier } from '../lib/api-key-entitlement.js';

function argValue(name: string): string | null {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : null;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function main() {
  const rawKey = argValue('key');
  if (!rawKey) {
    throw new Error('Missing --key=<raw-api-key>');
  }

  const keyHash = sha256(rawKey);
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
      lastUsedAt: true,
      createdAt: true,
    },
  });

  if (!row) {
    console.log(JSON.stringify({ found: false, keyHash }, null, 2));
    return;
  }

  const isExpired = row.expiresAt ? row.expiresAt <= now : false;

  console.log(JSON.stringify(
    {
      found: true,
      keyHash,
      record: row,
      accessTier: keyTierToAccessTier(row.tier),
      usable: row.isActive && !isExpired,
      isExpired,
    },
    null,
    2,
  ));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
