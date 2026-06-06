-- AlterEnum
ALTER TYPE "TrafficSource" ADD VALUE 'outbrain';
ALTER TYPE "TrafficSource" ADD VALUE 'native';

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "external_id" TEXT;
CREATE UNIQUE INDEX "campaigns_external_id_key" ON "campaigns"("external_id");

-- AlterTable clicks - network params
ALTER TABLE "clicks" ADD COLUMN "external_click_id" TEXT;
ALTER TABLE "clicks" ADD COLUMN "ad_title" TEXT;
ALTER TABLE "clicks" ADD COLUMN "campaign_external_id" TEXT;
ALTER TABLE "clicks" ADD COLUMN "publisher_name" TEXT;
ALTER TABLE "clicks" ADD COLUMN "site_id" TEXT;
ALTER TABLE "clicks" ADD COLUMN "content_name" TEXT;
ALTER TABLE "clicks" ADD COLUMN "platform" TEXT;
ALTER TABLE "clicks" ADD COLUMN "asset_id" TEXT;

-- Geo
ALTER TABLE "clicks" ADD COLUMN "country" TEXT;
ALTER TABLE "clicks" ADD COLUMN "country_code" TEXT;
ALTER TABLE "clicks" ADD COLUMN "region" TEXT;
ALTER TABLE "clicks" ADD COLUMN "city" TEXT;

-- Device
ALTER TABLE "clicks" ADD COLUMN "device" TEXT;
ALTER TABLE "clicks" ADD COLUMN "os" TEXT;
ALTER TABLE "clicks" ADD COLUMN "os_version" TEXT;
ALTER TABLE "clicks" ADD COLUMN "brand" TEXT;
ALTER TABLE "clicks" ADD COLUMN "model" TEXT;
ALTER TABLE "clicks" ADD COLUMN "browser" TEXT;
ALTER TABLE "clicks" ADD COLUMN "browser_version" TEXT;

-- Network
ALTER TABLE "clicks" ADD COLUMN "isp" TEXT;
ALTER TABLE "clicks" ADD COLUMN "mobile_carrier" TEXT;
ALTER TABLE "clicks" ADD COLUMN "connection_type" TEXT;

-- Raw params
ALTER TABLE "clicks" ADD COLUMN "raw_params" JSONB;

-- Indexes
CREATE INDEX "clicks_publisher_name_idx" ON "clicks"("publisher_name");
CREATE INDEX "clicks_platform_idx" ON "clicks"("platform");
CREATE INDEX "clicks_device_idx" ON "clicks"("device");
CREATE INDEX "clicks_country_code_idx" ON "clicks"("country_code");
