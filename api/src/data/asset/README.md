# Legacy Asset Folder

This folder is legacy and must not be used as the canonical curated Nexus RWA asset dataset.

Canonical curated asset data now lives at the repository root under:

```text
data/assets/{asset-slug}/
```

The asset import pipeline reads JSON layer files from `data/assets/{asset-slug}` and hydrates Prisma after migrations and bootstrap seed have run. Do not move root `data/assets` into this folder, and do not add new curated production asset data here unless explicitly working on a legacy migration.
