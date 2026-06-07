import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const legacySlug = 'maple-usdc';
  const canonicalSlug = 'maple-musdc';

  const canonical = await prisma.asset.findUnique({
    where: { slug: canonicalSlug },
    select: { id: true, slug: true, isActive: true },
  });

  if (!canonical) {
    throw new Error(
      `Canonical asset "${canonicalSlug}" was not found. Import maple-musdc before deactivating the legacy slug.`,
    );
  }

  const result = await prisma.asset.updateMany({
    where: { slug: legacySlug },
    data: { isActive: false },
  });

  console.log(
    JSON.stringify(
      {
        action: 'deactivate-legacy-maple-usdc',
        canonicalSlug,
        canonicalIsActive: canonical.isActive,
        legacySlug,
        deactivatedCount: result.count,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error('[deactivate-legacy-maple-usdc] FAILED:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
