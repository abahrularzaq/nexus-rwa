import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEGACY_ASSET_SLUGS = [
  'backed-finance',
  'openeden',
  'openeden-ousg',
  'openedon-ousg',
] as const;

async function main() {
  console.log('[deactivate-legacy-assets] Target slugs:', LEGACY_ASSET_SLUGS.join(', '));

  const before = await prisma.asset.findMany({
    where: { slug: { in: [...LEGACY_ASSET_SLUGS] } },
    select: {
      slug: true,
      isActive: true,
      identity: {
        select: {
          name: true,
          symbol: true,
        },
      },
    },
    orderBy: { slug: 'asc' },
  });

  if (before.length === 0) {
    console.log('[deactivate-legacy-assets] No matching legacy assets found. Nothing to deactivate.');
    return;
  }

  console.log('[deactivate-legacy-assets] Before:');
  for (const asset of before) {
    console.log(
      `  - ${asset.slug} | active=${asset.isActive} | ${asset.identity?.name ?? 'unknown'} (${asset.identity?.symbol ?? 'unknown'})`,
    );
  }

  const result = await prisma.asset.updateMany({
    where: { slug: { in: [...LEGACY_ASSET_SLUGS] } },
    data: { isActive: false },
  });

  const after = await prisma.asset.findMany({
    where: { slug: { in: [...LEGACY_ASSET_SLUGS] } },
    select: {
      slug: true,
      isActive: true,
    },
    orderBy: { slug: 'asc' },
  });

  console.log(`[deactivate-legacy-assets] Updated ${result.count} legacy asset(s).`);
  console.log('[deactivate-legacy-assets] After:');
  for (const asset of after) {
    console.log(`  - ${asset.slug} | active=${asset.isActive}`);
  }
}

main()
  .catch((error) => {
    console.error('[deactivate-legacy-assets] FAILED:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
