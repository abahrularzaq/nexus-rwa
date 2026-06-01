# Legacy Raw Asset Research

This folder is intentionally kept as the legacy/raw asset research area.

## Purpose

`api/src/data/asset` contains historical asset research files such as Markdown notes, YAML source trails, scoring snapshots, and older JSON metadata.

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

This folder is **not** the normalized production dataset.

Do not delete, rename, or bulk-move these files until every asset has been migrated, validated, imported, and reviewed in the new normalized structure.

## Migration target

The normalized production dataset lives at:

```text
data/assets/{asset-slug}/
```

Each migrated asset should eventually use this structure:

```text
identity.json
market.json
risk.json
reserve.json
yield.json
institutional.json
blockchain.json
compliance.json
liquidity.json
sources.json
```

## Migration rule

Treat files in this folder as raw source material only. Convert and normalize them into `data/assets/{asset-slug}/` before importing into the database or calculating institutional grades.
