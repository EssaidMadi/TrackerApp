-- CreateEnum
CREATE TYPE "TrackingMode" AS ENUM ('redirect', 'direct');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "tracking_mode" "TrackingMode" NOT NULL DEFAULT 'redirect';

-- Facebook / Google default to direct (no redirect in ad platforms)
UPDATE "campaigns" SET "tracking_mode" = 'direct' WHERE "traffic_source" IN ('facebook', 'google');
