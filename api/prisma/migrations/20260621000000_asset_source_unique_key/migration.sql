-- Add the canonical uniqueness key for source evidence without losing repair audit history.
--
-- Survivor policy for duplicate groups sharing (assetId, layer, field, sourceUrl):
-- 1. Prefer rows that already carry manual/review metadata over untouched importer rows.
-- 2. Prefer non-default statuses, named reviewers, notes, newer checkedAt values, and higher reliability.
-- 3. Use the oldest id as the deterministic final tie-breaker.
--
-- Before duplicate rows are deleted, every dependent SourceRepairAudit row is reassigned to the
-- selected survivor. SourceRepairAudit is currently the only foreign-key dependency on AssetSource
-- besides AssetSource.assetId itself; this migration intentionally preserves those audit records
-- before deleting duplicate AssetSource rows and creating the unique index.

ALTER TABLE "AssetSource"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'needs_review';

CREATE INDEX IF NOT EXISTS "AssetSource_status_idx"
ON "AssetSource"("status");

WITH ranked_sources AS (
  SELECT
    s.id,
    s."assetId",
    s.layer,
    s.field,
    s."sourceUrl",
    row_number() OVER (
      PARTITION BY s."assetId", s.layer, s.field, s."sourceUrl"
      ORDER BY
        CASE WHEN s.status IS NOT NULL AND s.status <> 'needs_review' THEN 1 ELSE 0 END DESC,
        CASE WHEN s."checkedBy" IS NOT NULL AND s."checkedBy" NOT IN ('manual', 'importer') THEN 1 ELSE 0 END DESC,
        CASE WHEN s.notes IS NOT NULL AND btrim(s.notes) <> '' THEN 1 ELSE 0 END DESC,
        s."checkedAt" DESC,
        s.reliability DESC,
        s.id ASC
    ) AS rank_in_group,
    count(*) OVER (PARTITION BY s."assetId", s.layer, s.field, s."sourceUrl") AS group_size
  FROM "AssetSource" s
), duplicate_map AS (
  SELECT
    duplicate.id AS duplicate_id,
    survivor.id AS survivor_id
  FROM ranked_sources duplicate
  JOIN ranked_sources survivor
    ON survivor."assetId" = duplicate."assetId"
   AND survivor.layer = duplicate.layer
   AND survivor.field = duplicate.field
   AND survivor."sourceUrl" = duplicate."sourceUrl"
   AND survivor.rank_in_group = 1
  WHERE duplicate.group_size > 1
    AND duplicate.rank_in_group > 1
)
UPDATE "SourceRepairAudit" audit
SET "assetSourceId" = duplicate_map.survivor_id
FROM duplicate_map
WHERE audit."assetSourceId" = duplicate_map.duplicate_id;

WITH ranked_sources AS (
  SELECT
    s.*,
    row_number() OVER (
      PARTITION BY s."assetId", s.layer, s.field, s."sourceUrl"
      ORDER BY
        CASE WHEN s.status IS NOT NULL AND s.status <> 'needs_review' THEN 1 ELSE 0 END DESC,
        CASE WHEN s."checkedBy" IS NOT NULL AND s."checkedBy" NOT IN ('manual', 'importer') THEN 1 ELSE 0 END DESC,
        CASE WHEN s.notes IS NOT NULL AND btrim(s.notes) <> '' THEN 1 ELSE 0 END DESC,
        s."checkedAt" DESC,
        s.reliability DESC,
        s.id ASC
    ) AS rank_in_group,
    count(*) OVER (PARTITION BY s."assetId", s.layer, s.field, s."sourceUrl") AS group_size
  FROM "AssetSource" s
), merged_metadata AS (
  SELECT
    "assetId",
    layer,
    field,
    "sourceUrl",
    (array_agg(status ORDER BY CASE WHEN status IS NOT NULL AND status <> 'needs_review' THEN 1 ELSE 0 END DESC, "checkedAt" DESC))[1] AS merged_status,
    (array_agg("checkedBy" ORDER BY CASE WHEN "checkedBy" IS NOT NULL AND "checkedBy" NOT IN ('manual', 'importer') THEN 1 ELSE 0 END DESC, "checkedAt" DESC) FILTER (WHERE "checkedBy" IS NOT NULL))[1] AS merged_checked_by,
    string_agg(DISTINCT NULLIF(btrim(notes), ''), E'\n\n') FILTER (WHERE notes IS NOT NULL AND btrim(notes) <> '') AS merged_notes,
    max("checkedAt") AS merged_checked_at
  FROM ranked_sources
  WHERE group_size > 1
  GROUP BY "assetId", layer, field, "sourceUrl"
), survivors AS (
  SELECT id, "assetId", layer, field, "sourceUrl"
  FROM ranked_sources
  WHERE group_size > 1 AND rank_in_group = 1
)
UPDATE "AssetSource" survivor
SET
  status = COALESCE(merged_metadata.merged_status, survivor.status),
  "checkedBy" = COALESCE(survivor."checkedBy", merged_metadata.merged_checked_by),
  notes = CASE
    WHEN survivor.notes IS NULL OR btrim(survivor.notes) = '' THEN merged_metadata.merged_notes
    WHEN merged_metadata.merged_notes IS NULL OR merged_metadata.merged_notes = survivor.notes THEN survivor.notes
    ELSE survivor.notes || E'\n\nMerged duplicate notes:\n' || merged_metadata.merged_notes
  END,
  "checkedAt" = GREATEST(survivor."checkedAt", merged_metadata.merged_checked_at)
FROM survivors
JOIN merged_metadata
  ON merged_metadata."assetId" = survivors."assetId"
 AND merged_metadata.layer = survivors.layer
 AND merged_metadata.field = survivors.field
 AND merged_metadata."sourceUrl" = survivors."sourceUrl"
WHERE survivor.id = survivors.id;

WITH ranked_sources AS (
  SELECT
    s.id,
    row_number() OVER (
      PARTITION BY s."assetId", s.layer, s.field, s."sourceUrl"
      ORDER BY
        CASE WHEN s.status IS NOT NULL AND s.status <> 'needs_review' THEN 1 ELSE 0 END DESC,
        CASE WHEN s."checkedBy" IS NOT NULL AND s."checkedBy" NOT IN ('manual', 'importer') THEN 1 ELSE 0 END DESC,
        CASE WHEN s.notes IS NOT NULL AND btrim(s.notes) <> '' THEN 1 ELSE 0 END DESC,
        s."checkedAt" DESC,
        s.reliability DESC,
        s.id ASC
    ) AS rank_in_group,
    count(*) OVER (PARTITION BY s."assetId", s.layer, s.field, s."sourceUrl") AS group_size
  FROM "AssetSource" s
)
DELETE FROM "AssetSource" source
USING ranked_sources
WHERE source.id = ranked_sources.id
  AND ranked_sources.group_size > 1
  AND ranked_sources.rank_in_group > 1;

CREATE UNIQUE INDEX "AssetSource_assetId_layer_field_sourceUrl_key" ON "AssetSource"("assetId", "layer", "field", "sourceUrl");
