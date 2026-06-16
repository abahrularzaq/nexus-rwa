-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NONE', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "KeyTier" AS ENUM ('FREE', 'STANDARD', 'PREMIUM');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dataVersion" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetIdentity" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "fullName" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "docsUrl" TEXT,
    "twitterUrl" TEXT,
    "tags" TEXT[],
    "launchDate" TIMESTAMP(3),
    "isin" TEXT,
    CONSTRAINT "AssetIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMarket" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "tvl" DOUBLE PRECISION,
    "tvl7dChange" DOUBLE PRECISION,
    "tvl30dChange" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "priceChange24h" DOUBLE PRECISION,
    "marketCap" DOUBLE PRECISION,
    "volume24h" DOUBLE PRECISION,
    "circulatingSupply" DOUBLE PRECISION,
    "totalSupply" DOUBLE PRECISION,
    "holderCount" INTEGER,
    "holderChange7d" INTEGER,
    "aumUsd" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3),
    "sources" TEXT[],
    "confidence" TEXT,
    CONSTRAINT "AssetMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetRisk" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "overallScore" INTEGER,
    "overallLevel" TEXT,
    "smartContractRisk" INTEGER,
    "counterpartyRisk" INTEGER,
    "liquidityRisk" INTEGER,
    "regulatoryRisk" INTEGER,
    "marketRisk" INTEGER,
    "concentrationRisk" INTEGER,
    "riskFactors" TEXT[],
    "mitigants" TEXT[],
    "lastAssessed" TIMESTAMP(3),
    "assessmentMethod" TEXT,
    CONSTRAINT "AssetRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetReserve" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "backingType" TEXT,
    "backingDescription" TEXT,
    "collateralizationRatio" DOUBLE PRECISION,
    "custodian" TEXT,
    "custodianUrl" TEXT,
    "hasProofOfReserves" BOOLEAN NOT NULL DEFAULT false,
    "porOracleAddress" TEXT,
    "porOracleChain" TEXT,
    "lastAuditDate" TIMESTAMP(3),
    "lastAuditUrl" TEXT,
    "auditor" TEXT,
    "reserveBreakdown" JSONB,
    "redemptionAsset" TEXT,
    CONSTRAINT "AssetReserve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetYield" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "currentYield" DOUBLE PRECISION,
    "yieldType" TEXT,
    "yieldFrequency" TEXT,
    "yieldBenchmark" TEXT,
    "yieldVsBenchmark" DOUBLE PRECISION,
    "yieldAvg7d" DOUBLE PRECISION,
    "yieldAvg30d" DOUBLE PRECISION,
    "yieldAvg90d" DOUBLE PRECISION,
    "yieldMin52w" DOUBLE PRECISION,
    "yieldMax52w" DOUBLE PRECISION,
    "yieldStdDev30d" DOUBLE PRECISION,
    "nextYieldDate" TIMESTAMP(3),
    "yieldCurrency" TEXT NOT NULL DEFAULT 'USD',
    CONSTRAINT "AssetYield_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetInstitutional" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "issuerName" TEXT,
    "issuerType" TEXT,
    "issuerCountry" TEXT,
    "fundManager" TEXT,
    "legalStructure" TEXT,
    "minimumInvestment" DOUBLE PRECISION,
    "managementFee" DOUBLE PRECISION,
    "performanceFee" DOUBLE PRECISION,
    "fundAdmin" TEXT,
    "transferAgent" TEXT,
    "targetInvestors" TEXT,
    "prospectuUrl" TEXT,
    "metadata" JSONB,
    CONSTRAINT "AssetInstitutional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetBlockchain" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "chainId" INTEGER,
    "contractAddress" TEXT NOT NULL,
    "tokenStandard" TEXT,
    "isTransferable" BOOLEAN NOT NULL DEFAULT true,
    "hasWhitelist" BOOLEAN NOT NULL DEFAULT false,
    "hasTransferRestrictions" BOOLEAN NOT NULL DEFAULT false,
    "explorerUrl" TEXT,
    "deployedAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AssetBlockchain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetHistory" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tvl" DOUBLE PRECISION,
    "yield" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "holderCount" INTEGER,
    "riskScore" INTEGER,
    "volume24h" DOUBLE PRECISION,
    "source" TEXT,
    CONSTRAINT "AssetHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAiNarrative" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "summary" TEXT,
    "opportunities" TEXT[],
    "risks" TEXT[],
    "outlook" TEXT,
    "outlookReason" TEXT,
    "confidence" TEXT,
    "keyMetrics" JSONB,
    "compareTo" TEXT[],
    "generatedAt" TIMESTAMP(3),
    "modelVersion" TEXT,
    "promptVersion" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "AssetAiNarrative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetEvent" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "onChainTx" TEXT,
    CONSTRAINT "AssetEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCompliance" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "regulatoryStatus" TEXT,
    "primaryRegulator" TEXT,
    "regulatoryFramework" TEXT,
    "kycRequired" BOOLEAN NOT NULL DEFAULT true,
    "accreditedOnly" BOOLEAN NOT NULL DEFAULT false,
    "blockedJurisdictions" TEXT[],
    "allowedJurisdictions" TEXT[],
    "sanctionsScreening" BOOLEAN NOT NULL DEFAULT false,
    "amlPolicy" TEXT,
    "lastComplianceCheck" TIMESTAMP(3),
    "legalOpinionUrl" TEXT,
    CONSTRAINT "AssetCompliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetLiquidity" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "redemptionType" TEXT,
    "redemptionPeriodDays" INTEGER,
    "lockupPeriodDays" INTEGER,
    "earlyRedemptionFee" DOUBLE PRECISION,
    "minRedemptionAmount" DOUBLE PRECISION,
    "dexPairs" JSONB,
    "onchainLiquidity" DOUBLE PRECISION,
    "bidAskSpread" DOUBLE PRECISION,
    "liquidityScore" INTEGER,
    "liquidityNotes" TEXT,
    CONSTRAINT "AssetLiquidity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetSource" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "reliability" INTEGER NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedBy" TEXT,
    "notes" TEXT,
    CONSTRAINT "AssetSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetGrade" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "completenessScore" INTEGER NOT NULL,
    "sourceScore" INTEGER NOT NULL,
    "legalScore" INTEGER NOT NULL,
    "reserveScore" INTEGER NOT NULL,
    "liquidityScore" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "blockers" TEXT[],
    "warnings" TEXT[],
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AssetGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataHealthCheck" (
    "id" TEXT NOT NULL,
    "assetSlug" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "reason" TEXT,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextCheckAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DataHealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceHealth" (
    "id" TEXT NOT NULL,
    "assetSlug" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "field" TEXT,
    "url" TEXT NOT NULL,
    "sourceType" TEXT,
    "reliability" INTEGER,
    "status" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "errorMessage" TEXT,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SourceHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "assetSlug" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "provider" TEXT,
    "status" TEXT NOT NULL,
    "fieldsUpdated" JSONB,
    "fieldsFailed" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewTask" (
    "id" TEXT NOT NULL,
    "assetSlug" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "ReviewTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRequest" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "paymentTxHash" TEXT,
    "paymentAmount" DOUBLE PRECISION,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NONE',
    "responseCode" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failureReason" TEXT,
    "paymentFrom" TEXT,
    CONSTRAINT "ApiRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "KeyTier" NOT NULL DEFAULT 'STANDARD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageLog" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "responseCode" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "apiKeyId" TEXT,
    "tier" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_slug_key" ON "Asset"("slug");
CREATE INDEX "Asset_isActive_idx" ON "Asset"("isActive");
CREATE INDEX "Asset_slug_idx" ON "Asset"("slug");
CREATE UNIQUE INDEX "AssetIdentity_assetId_key" ON "AssetIdentity"("assetId");
CREATE INDEX "AssetIdentity_category_idx" ON "AssetIdentity"("category");
CREATE INDEX "AssetIdentity_symbol_idx" ON "AssetIdentity"("symbol");
CREATE UNIQUE INDEX "AssetMarket_assetId_key" ON "AssetMarket"("assetId");
CREATE UNIQUE INDEX "AssetRisk_assetId_key" ON "AssetRisk"("assetId");
CREATE UNIQUE INDEX "AssetReserve_assetId_key" ON "AssetReserve"("assetId");
CREATE UNIQUE INDEX "AssetYield_assetId_key" ON "AssetYield"("assetId");
CREATE UNIQUE INDEX "AssetInstitutional_assetId_key" ON "AssetInstitutional"("assetId");
CREATE UNIQUE INDEX "AssetBlockchain_assetId_chain_key" ON "AssetBlockchain"("assetId", "chain");
CREATE INDEX "AssetBlockchain_chain_idx" ON "AssetBlockchain"("chain");
CREATE INDEX "AssetBlockchain_contractAddress_idx" ON "AssetBlockchain"("contractAddress");
CREATE INDEX "AssetHistory_assetId_timestamp_idx" ON "AssetHistory"("assetId", "timestamp");
CREATE UNIQUE INDEX "AssetAiNarrative_assetId_key" ON "AssetAiNarrative"("assetId");
CREATE INDEX "AssetEvent_assetId_occurredAt_idx" ON "AssetEvent"("assetId", "occurredAt");
CREATE UNIQUE INDEX "AssetCompliance_assetId_key" ON "AssetCompliance"("assetId");
CREATE UNIQUE INDEX "AssetLiquidity_assetId_key" ON "AssetLiquidity"("assetId");
CREATE INDEX "AssetSource_assetId_idx" ON "AssetSource"("assetId");
CREATE INDEX "AssetSource_layer_idx" ON "AssetSource"("layer");
CREATE INDEX "AssetSource_field_idx" ON "AssetSource"("field");
CREATE INDEX "AssetSource_sourceType_idx" ON "AssetSource"("sourceType");
CREATE UNIQUE INDEX "AssetGrade_assetId_key" ON "AssetGrade"("assetId");
CREATE INDEX "AssetGrade_grade_idx" ON "AssetGrade"("grade");
CREATE INDEX "AssetGrade_score_idx" ON "AssetGrade"("score");
CREATE INDEX "DataHealthCheck_assetSlug_idx" ON "DataHealthCheck"("assetSlug");
CREATE INDEX "DataHealthCheck_layer_idx" ON "DataHealthCheck"("layer");
CREATE INDEX "DataHealthCheck_status_idx" ON "DataHealthCheck"("status");
CREATE INDEX "DataHealthCheck_severity_idx" ON "DataHealthCheck"("severity");
CREATE INDEX "DataHealthCheck_lastCheckedAt_idx" ON "DataHealthCheck"("lastCheckedAt");
CREATE INDEX "SourceHealth_assetSlug_idx" ON "SourceHealth"("assetSlug");
CREATE INDEX "SourceHealth_layer_idx" ON "SourceHealth"("layer");
CREATE INDEX "SourceHealth_status_idx" ON "SourceHealth"("status");
CREATE INDEX "SourceHealth_lastCheckedAt_idx" ON "SourceHealth"("lastCheckedAt");
CREATE INDEX "SyncLog_assetSlug_idx" ON "SyncLog"("assetSlug");
CREATE INDEX "SyncLog_layer_idx" ON "SyncLog"("layer");
CREATE INDEX "SyncLog_status_idx" ON "SyncLog"("status");
CREATE INDEX "SyncLog_startedAt_idx" ON "SyncLog"("startedAt");
CREATE INDEX "ReviewTask_assetSlug_idx" ON "ReviewTask"("assetSlug");
CREATE INDEX "ReviewTask_layer_idx" ON "ReviewTask"("layer");
CREATE INDEX "ReviewTask_status_idx" ON "ReviewTask"("status");
CREATE INDEX "ReviewTask_priority_idx" ON "ReviewTask"("priority");
CREATE INDEX "ReviewTask_createdAt_idx" ON "ReviewTask"("createdAt");
CREATE UNIQUE INDEX "ApiRequest_requestId_key" ON "ApiRequest"("requestId");
CREATE INDEX "ApiRequest_endpoint_idx" ON "ApiRequest"("endpoint");
CREATE INDEX "ApiRequest_timestamp_idx" ON "ApiRequest"("timestamp");
CREATE INDEX "ApiRequest_paymentStatus_idx" ON "ApiRequest"("paymentStatus");
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE INDEX "ApiKey_prefix_idx" ON "ApiKey"("prefix");
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");
CREATE INDEX "UsageLog_endpoint_idx" ON "UsageLog"("endpoint");
CREATE INDEX "UsageLog_method_idx" ON "UsageLog"("method");
CREATE INDEX "UsageLog_responseCode_idx" ON "UsageLog"("responseCode");
CREATE INDEX "UsageLog_apiKeyId_idx" ON "UsageLog"("apiKeyId");
CREATE INDEX "UsageLog_tier_idx" ON "UsageLog"("tier");
CREATE INDEX "UsageLog_timestamp_idx" ON "UsageLog"("timestamp");

-- AddForeignKey
ALTER TABLE "AssetIdentity" ADD CONSTRAINT "AssetIdentity_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetMarket" ADD CONSTRAINT "AssetMarket_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetRisk" ADD CONSTRAINT "AssetRisk_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetReserve" ADD CONSTRAINT "AssetReserve_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetYield" ADD CONSTRAINT "AssetYield_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetInstitutional" ADD CONSTRAINT "AssetInstitutional_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetBlockchain" ADD CONSTRAINT "AssetBlockchain_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetHistory" ADD CONSTRAINT "AssetHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetAiNarrative" ADD CONSTRAINT "AssetAiNarrative_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetEvent" ADD CONSTRAINT "AssetEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetCompliance" ADD CONSTRAINT "AssetCompliance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetLiquidity" ADD CONSTRAINT "AssetLiquidity_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetSource" ADD CONSTRAINT "AssetSource_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetGrade" ADD CONSTRAINT "AssetGrade_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
