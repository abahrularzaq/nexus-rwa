ALTER TABLE "DataHealthCheck"
ADD COLUMN "reopenedAt" TIMESTAMP(3),
ADD COLUMN "reopenedBy" TEXT,
ADD COLUMN "reopenReason" TEXT;

ALTER TABLE "ReviewTask"
ADD COLUMN "reopenedAt" TIMESTAMP(3),
ADD COLUMN "reopenedBy" TEXT,
ADD COLUMN "reopenReason" TEXT;

CREATE INDEX "DataHealthCheck_reopenedAt_idx" ON "DataHealthCheck"("reopenedAt");
CREATE INDEX "ReviewTask_reopenedAt_idx" ON "ReviewTask"("reopenedAt");
