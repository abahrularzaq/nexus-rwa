import { db } from '../lib/database.js';

async function main(): Promise<void> {
  const canonicalSlug = 'credix-credit-pool';
  const legacySlug = 'credix';

  const canonical = await db.asset.findUnique({
    where: { slug: canonicalSlug },
    select: { id: true, slug: true, isActive: true },
  });

  if (!canonical) {
    throw new Error(`Canonical asset not found: ${canonicalSlug}. Import credix-credit-pool before deactivating legacy Credix.`);
  }

  const legacy = await db.asset.findUnique({
    where: { slug: legacySlug },
    select: { id: true, slug: true, isActive: true },
  });

  if (!legacy) {
    console.log(JSON.stringify({ status: 'no-op', message: `Legacy asset not found: ${legacySlug}` }, null, 2));
    return;
  }

  await db.asset.update({
    where: { slug: legacySlug },
    data: { isActive: false },
  });

  console.log(
    JSON.stringify(
      {
        status: 'deactivated',
        canonical: { slug: canonical.slug, isActive: canonical.isActive },
        legacy: { slug: legacy.slug, wasActive: legacy.isActive, isActive: false },
        note: 'credix-credit-pool remains canonical. legacy credix is hidden from active web/API listings.',
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
