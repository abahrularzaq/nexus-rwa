-- CreateTable
CREATE TABLE "UsageDailyAggregate" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "responseCode" INTEGER NOT NULL,
    "tier" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL,
    "averageDurationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UsageDailyAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsageDailyAggregate_date_endpoint_method_responseCode_tier_key" ON "UsageDailyAggregate"("date", "endpoint", "method", "responseCode", "tier");

-- CreateIndex
CREATE INDEX "UsageDailyAggregate_date_idx" ON "UsageDailyAggregate"("date");

-- CreateIndex
CREATE INDEX "UsageDailyAggregate_endpoint_idx" ON "UsageDailyAggregate"("endpoint");

-- CreateIndex
CREATE INDEX "UsageDailyAggregate_tier_idx" ON "UsageDailyAggregate"("tier");
