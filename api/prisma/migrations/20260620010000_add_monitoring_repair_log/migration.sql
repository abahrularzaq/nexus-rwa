-- CreateTable
CREATE TABLE "MonitoringRepairLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "assetSlug" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MonitoringRepairLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonitoringRepairLog_assetSlug_idx" ON "MonitoringRepairLog"("assetSlug");

-- CreateIndex
CREATE INDEX "MonitoringRepairLog_layer_idx" ON "MonitoringRepairLog"("layer");

-- CreateIndex
CREATE INDEX "MonitoringRepairLog_action_idx" ON "MonitoringRepairLog"("action");

-- CreateIndex
CREATE INDEX "MonitoringRepairLog_resource_idx" ON "MonitoringRepairLog"("resource");

-- CreateIndex
CREATE INDEX "MonitoringRepairLog_createdAt_idx" ON "MonitoringRepairLog"("createdAt");
