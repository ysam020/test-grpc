-- CreateEnum
CREATE TYPE "MatchTypeEnum" AS ENUM ('DIRECT', 'MANUAL');

-- AlterTable
ALTER TABLE "RetailerCurrentPricing" ADD COLUMN     "match_type" "MatchTypeEnum" NOT NULL DEFAULT 'MANUAL';
