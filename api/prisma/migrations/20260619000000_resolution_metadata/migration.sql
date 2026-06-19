-- Add resolution metadata captured when admins close monitoring work items.
ALTER TABLE "ReviewTask"
  ADD COLUMN "resolutionType" TEXT,
  ADD COLUMN "resolutionNote" TEXT,
  ADD COLUMN "evidenceUrl" TEXT;

ALTER TABLE "DataHealthCheck"
  ADD COLUMN "resolutionType" TEXT,
  ADD COLUMN "resolutionNote" TEXT,
  ADD COLUMN "evidenceUrl" TEXT;
