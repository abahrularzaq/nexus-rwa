# Asset Layer Source of Truth

This folder contains the canonical curated asset layer files imported into Prisma by `npm run import:asset-files`.

## Purpose

`api/src/data/asset/{asset-slug}` contains the source-of-truth Markdown, YAML, and JSON layer files for asset content that is imported into the database after Prisma migrations run.

Typical legacy files include:

- `identity.md`
- `reserve.md`
- `legal.md`
- `risk.md`
- `metadata.json`
- `scoring.json`
- `sources.yaml`
- `master.md`

## Status

This folder **is the source of truth for imported asset content** used by the asset file import pipeline. Do not replace it with Prisma seed catalog data, and do not edit seed helpers as the primary way to change production asset content.

## Import workflow

Run Prisma migrations before importing these files into the database:

```bash
npm run db:migrate:deploy
npm run import:asset-files -- --slug=<asset-slug> --force
```

For local development, `npm run seed` may be run between migration and import to create missing bootstrap asset rows. The seed catalog is a fallback only and skips existing assets so it does not overwrite content imported from this folder.

## Production rule

Treat files in this folder as canonical. Update `api/src/data/asset/{asset-slug}/` first, then import the files into Prisma. Do not use `api/prisma/seed-helpers.ts` catalog/minimal seeds as the production asset dataset, and do not use `prisma db push` as the production migration workflow.
