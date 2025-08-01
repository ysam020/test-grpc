-- CreateEnum
CREATE TYPE "Region" AS ENUM ('METRO', 'URBAN', 'RURAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "region" "Region";
