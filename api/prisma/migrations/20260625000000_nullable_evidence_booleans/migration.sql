ALTER TABLE "AssetBlockchain" ALTER COLUMN "hasWhitelist" DROP NOT NULL;
ALTER TABLE "AssetReserve" ALTER COLUMN "hasProofOfReserves" DROP NOT NULL;
ALTER TABLE "AssetCompliance" ALTER COLUMN "kycRequired" DROP NOT NULL;
ALTER TABLE "AssetCompliance" ALTER COLUMN "sanctionsScreening" DROP NOT NULL;
