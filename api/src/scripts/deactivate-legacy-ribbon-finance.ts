import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const canonicalSlug = 'ribbon-finance-rbn';
  const legacySlugs = [
    'ribbon-finance',
    'ribbon-rbn',
    'ribbon',
    'rbn',
  ];

  const canonical = await prisma.asset.findUnique({
    where: { slug: canonicalSlug },
    select: { id: true, slug: true, isActive: true },
  });

  if (!canonical) {
    throw new Error(
      `Canonical asset "${canonicalSlug}" was not found. Import ribbon-finance-rbn before deactivating legacy Ribbon assets.`,
    );
  }

  const legacyAssets = await prisma.asset.findMany({
    where: {
      slug: {
        in: legacySlugs,
      },
    },
    select: {
      id: true,
      slug: true,
      isActive: true,
    },
    orderBy: {
      slug: 'asc',
    },
  });

  const result = await prisma.asset.updateMany({
    where: {
      slug: {
        in: legacySlugs,
      },
    },
    data: { isActive: false },
  });

  console.log(
    JSON.stringify(
      {
        action: 'deactivate-legacy-ribbon-finance',
        canonicalSlug,
        canonicalIsActive: canonical.isActive,
        legacySlugsChecked: legacySlugs,
        legacyAssetsFound: legacyAssets,
        deactivatedCount: result.count,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error('[deactivate-legacy-ribbon-finance] FAILED:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
