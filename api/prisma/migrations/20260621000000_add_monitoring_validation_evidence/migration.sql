ALTER TABLE "DataHealthCheck"
ADD COLUMN "validationMethod" TEXT,
ADD COLUMN "validationResult" TEXT,
ADD COLUMN "validationEvidenceId" TEXT,
ADD COLUMN "validationEvidenceRef" TEXT,
ADD COLUMN "validatedAt" TIMESTAMP(3),
ADD COLUMN "validatedBy" TEXT;

ALTER TABLE "ReviewTask"
ADD COLUMN "validationMethod" TEXT,
ADD COLUMN "validationResult" TEXT,
ADD COLUMN "validationEvidenceId" TEXT,
ADD COLUMN "validationEvidenceRef" TEXT,
ADD COLUMN "validatedAt" TIMESTAMP(3),
ADD COLUMN "validatedBy" TEXT;
