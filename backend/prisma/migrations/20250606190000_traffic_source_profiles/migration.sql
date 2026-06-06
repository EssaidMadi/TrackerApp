-- CreateEnum
CREATE TYPE "ConversionMethod" AS ENUM ('mediago_s2s', 'facebook_capi', 'google_offline', 'outbrain_s2s', 'generic_postback', 'none');

-- AlterEnum
ALTER TYPE "PostbackNetwork" ADD VALUE 'outbrain';

-- CreateTable
CREATE TABLE "traffic_source_profiles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tracking_mode_default" "TrackingMode" NOT NULL DEFAULT 'redirect',
    "click_url_template" TEXT,
    "direct_ad_url_template" TEXT,
    "param_mappings" JSONB NOT NULL,
    "conversion_method" "ConversionMethod" NOT NULL,
    "postback_defaults" JSONB,
    "setup_note" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traffic_source_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "traffic_source_profiles_slug_key" ON "traffic_source_profiles"("slug");

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "traffic_source_profile_id" TEXT;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_traffic_source_profile_id_fkey" FOREIGN KEY ("traffic_source_profile_id") REFERENCES "traffic_source_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
