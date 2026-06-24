ALTER TABLE "DataHealthCheck"
ADD COLUMN "assignedOwner" TEXT,
ADD COLUMN "assignedAt" TIMESTAMP(3),
ADD COLUMN "assignedBy" TEXT;

ALTER TABLE "ReviewTask"
ADD COLUMN "assignedOwner" TEXT,
ADD COLUMN "assignedAt" TIMESTAMP(3),
ADD COLUMN "assignedBy" TEXT;

CREATE INDEX "DataHealthCheck_assignedOwner_idx" ON "DataHealthCheck"("assignedOwner");
CREATE INDEX "ReviewTask_assignedOwner_idx" ON "ReviewTask"("assignedOwner");
