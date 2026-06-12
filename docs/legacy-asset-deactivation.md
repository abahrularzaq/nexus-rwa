# Legacy Asset Deactivation — Backed Finance & OpenEden

## Status

This document records the deactivation path for old/legacy Backed Finance and OpenEden entries after adding canonical normalized asset data.

## Legacy Slugs

The deactivation script targets these possible legacy slugs:

```text
backed-finance
openeden
openeden-ousg
openedon-ousg
```

Rationale:

- `backed-finance` was a legacy/minimal catalog-style entry for Backed Finance.
- `openeden` was a legacy/minimal catalog-style entry for OpenEden.
- `openeden-ousg` exists in the old markdown asset folder.
- `openedon-ousg` exists as a typo-style legacy catalog slug and should also be deactivated if present in the database.

## Canonical Replacement Direction

- Backed bC3M should use the new normalized asset folder:

```text
data/assets/backed-bc3m/
```

- Legacy markdown folders under `asset/` are kept as historical research artifacts only. They should not be treated as active production assets.

## Command

Run from the API package:

```bash
cd api
npx tsx src/scripts/deactivate-legacy-assets.ts
```

The script is idempotent. Running it multiple times is safe because it only sets `isActive = false` for the targeted legacy slugs.

## Follow-up Verification

After running the script, verify active assets from the database or API and confirm these slugs are not returned in active/public asset lists:

```text
backed-finance
openeden
openeden-ousg
openedon-ousg
```

If `npm run seed` is run later, check whether legacy minimal seed entries are still being upserted and whether they need to be removed from `MINIMAL_ASSET_SEEDS` or explicitly excluded from `TARGET_ASSET_SLUGS`.
