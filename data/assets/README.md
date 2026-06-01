# Normalized Production Asset Dataset

This folder is the normalized production dataset for Nexus RWA assets.

## Purpose

`data/assets` contains clean, structured, JSON-based asset data that can be imported into the database and evaluated by the institutional-grade asset grading engine.

Each asset should live in its own slug folder:

```text
data/assets/{asset-slug}/
```

Example:

```text
data/assets/superstate-ustb/
```

## Required asset files

Each normalized asset folder should contain:

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

## Relationship to legacy data

Legacy research files remain in:

```text
api/src/data/asset
```

Those files are raw source material only. They may include Markdown, YAML, older JSON metadata, or analyst notes.

Do not import legacy files directly into the institutional grading pipeline. Convert and normalize them into this folder first.

## Import command

From the `api` folder:

```bash
npm run import:asset -- {asset-slug}
```

Example:

```bash
npm run import:asset -- superstate-ustb
```
