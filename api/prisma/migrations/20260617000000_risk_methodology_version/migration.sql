-- Add methodology version audit fields to scored risk outputs.
ALTER TABLE "AssetRisk" ADD COLUMN "methodologyVersion" TEXT;
ALTER TABLE "AssetHistory" ADD COLUMN "methodologyVersion" TEXT;
