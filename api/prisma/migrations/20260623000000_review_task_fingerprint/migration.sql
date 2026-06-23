ALTER TABLE "ReviewTask"
  ADD COLUMN "fieldPath" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "issueType" TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN "fingerprint" TEXT,
  ADD COLUMN "activeFingerprint" TEXT,
  ADD COLUMN "lastDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "occurrenceCount" INTEGER NOT NULL DEFAULT 1;

WITH extracted AS (
  SELECT
    "id",
    CASE
      WHEN "reason" ~* '^Source URL issue for [^:]+:'
        THEN lower(trim(substring("reason" from '^Source URL issue for ([^:]+):')))
      ELSE NULL
    END AS "fieldPath",
    CASE
      WHEN substring("reason" from '(https?://[^[:space:]()]+)') IS NOT NULL
        THEN split_part(trim(substring("reason" from '(https?://[^[:space:]()]+)')), '#', 1)
      ELSE NULL
    END AS "rawSourceUrl",
    CASE
      WHEN "reason" ~* '^Source URL issue for [^:]+:'
        THEN 'source-url:' || lower(coalesce(substring("reason" from '\(([^ )]+)'), 'unknown'))
      ELSE 'legacy:' || md5(lower(trim("reason")))
    END AS "issueType"
  FROM "ReviewTask"
),
url_parts AS (
  SELECT
    "id",
    "fieldPath",
    "rawSourceUrl",
    regexp_match("rawSourceUrl", '^(https?)://([^/?#:]+)(:[0-9]+)?([^?#]*)(\?.*)?$', 'i') AS "sourceUrlParts",
    "issueType"
  FROM extracted
),
normalized AS (
  SELECT
    "id",
    "fieldPath",
    CASE
      WHEN "rawSourceUrl" IS NULL THEN NULL
      WHEN "sourceUrlParts" IS NULL THEN regexp_replace("rawSourceUrl", '/+$', '')
      ELSE lower("sourceUrlParts"[1])
        || '://'
        || lower("sourceUrlParts"[2])
        || coalesce("sourceUrlParts"[3], '')
        || CASE
          WHEN coalesce("sourceUrlParts"[4], '') = '' THEN '/'
          WHEN length("sourceUrlParts"[4]) > 1 THEN regexp_replace("sourceUrlParts"[4], '/+$', '')
          ELSE "sourceUrlParts"[4]
        END
        || coalesce("sourceUrlParts"[5], '')
    END AS "sourceUrl",
    "issueType"
  FROM url_parts
),
fingerprinted AS (
  SELECT
    task."id",
    normalized."fieldPath",
    normalized."sourceUrl",
    normalized."issueType",
    lower(trim(task."assetSlug"))
      || '|'
      || lower(trim(task."layer"))
      || '|'
      || coalesce(normalized."fieldPath", '')
      || '|'
      || coalesce(normalized."sourceUrl", '')
      || '|'
      || normalized."issueType" AS "fingerprint"
  FROM "ReviewTask" AS task
  JOIN normalized ON normalized."id" = task."id"
)
UPDATE "ReviewTask" AS task
SET
  "fieldPath" = fingerprinted."fieldPath",
  "sourceUrl" = fingerprinted."sourceUrl",
  "issueType" = fingerprinted."issueType",
  "fingerprint" = fingerprinted."fingerprint",
  "lastDetectedAt" = task."createdAt"
FROM fingerprinted
WHERE task."id" = fingerprinted."id";

WITH active_ranked AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "fingerprint"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS duplicate_rank
  FROM "ReviewTask"
  WHERE "status" IN ('open', 'reopened', 'pending_validation')
    AND "fingerprint" IS NOT NULL
)
UPDATE "ReviewTask" AS task
SET
  "status" = 'resolved',
  "activeFingerprint" = NULL,
  "resolvedAt" = coalesce(task."resolvedAt", CURRENT_TIMESTAMP),
  "resolutionType" = coalesce(task."resolutionType", 'deduplicated'),
  "resolutionNote" = coalesce(task."resolutionNote", 'Resolved by review task fingerprint backfill; duplicate active issue retained as history.')
FROM active_ranked
WHERE task."id" = active_ranked."id"
  AND active_ranked.duplicate_rank > 1;

UPDATE "ReviewTask"
SET "activeFingerprint" = "fingerprint"
WHERE "status" IN ('open', 'reopened', 'pending_validation')
  AND "fingerprint" IS NOT NULL;

CREATE UNIQUE INDEX "ReviewTask_activeFingerprint_key" ON "ReviewTask"("activeFingerprint");
CREATE INDEX "ReviewTask_fieldPath_idx" ON "ReviewTask"("fieldPath");
CREATE INDEX "ReviewTask_issueType_idx" ON "ReviewTask"("issueType");
CREATE INDEX "ReviewTask_fingerprint_idx" ON "ReviewTask"("fingerprint");
CREATE INDEX "ReviewTask_lastDetectedAt_idx" ON "ReviewTask"("lastDetectedAt");
