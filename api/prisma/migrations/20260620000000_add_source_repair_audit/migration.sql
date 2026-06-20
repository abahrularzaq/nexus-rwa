-- CreateTable
CREATE TABLE "SourceRepairAudit" (
    "id" TEXT NOT NULL,
    "assetSourceId" TEXT NOT NULL,
    "assetSlug" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldUrl" TEXT NOT NULL,
    "newUrl" TEXT NOT NULL,
    "oldReliability" INTEGER,
    "newReliability" INTEGER NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceNote" TEXT,
    "repairedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SourceRepairAudit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SourceRepairAudit_assetSourceId_fkey" FOREIGN KEY ("assetSourceId") REFERENCES "AssetSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SourceRepairAudit_assetSourceId_idx" ON "SourceRepairAudit"("assetSourceId");

-- CreateIndex
CREATE INDEX "SourceRepairAudit_assetSlug_idx" ON "SourceRepairAudit"("assetSlug");

-- CreateIndex
CREATE INDEX "SourceRepairAudit_createdAt_idx" ON "SourceRepairAudit"("createdAt");
