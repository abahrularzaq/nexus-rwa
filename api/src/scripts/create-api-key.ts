import { randomBytes, createHash } from 'node:crypto';
import { db } from '../lib/database.js';

const VALID_TIERS = ['FREE', 'STANDARD', 'PREMIUM'] as const;
type CliKeyTier = (typeof VALID_TIERS)[number];

function argValue(name: string): string | null {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : null;
}

function parseTier(): CliKeyTier {
  const raw = (argValue('tier') ?? 'STANDARD').toUpperCase();
  if (VALID_TIERS.includes(raw as CliKeyTier)) return raw as CliKeyTier;
  throw new Error(`Invalid --tier=${raw}. Use one of: ${VALID_TIERS.join(', ')}`);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function createRawKey(prefix: string): string {
  return `${prefix}_${randomBytes(32).toString('hex')}`;
}

async function main() {
  const name = argValue('name') ?? 'Manual API Key';
  const tier = parseTier();
  const prefix = argValue('prefix') ?? 'nxrwa';
  const expiresAtRaw = argValue('expiresAt');
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

  if (expiresAtRaw && Number.isNaN(expiresAt?.getTime())) {
    throw new Error('Invalid --expiresAt. Use an ISO date, for example 2026-12-31T23:59:59Z');
  }

  const rawKey = createRawKey(prefix);
  const keyHash = sha256(rawKey);

  const row = await db.apiKey.create({
    data: {
      keyHash,
      prefix,
      name,
      tier,
      expiresAt,
    },
    select: {
      id: true,
      prefix: true,
      name: true,
      tier: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  console.log(JSON.stringify(
    {
      message: 'API key created. Store rawKey securely; it will not be shown again.',
      rawKey,
      record: row,
      usage: {
        header: 'X-API-Key',
        example: `curl http://localhost:3001/v1/assets/ondo-ousg/sources -H "X-API-Key: ${rawKey}"`,
      },
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
