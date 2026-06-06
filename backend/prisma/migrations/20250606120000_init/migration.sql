-- CreateEnum
CREATE TYPE "TrafficSource" AS ENUM ('mediago', 'facebook', 'google');

-- CreateEnum
CREATE TYPE "ConversionStatus" AS ENUM ('pending', 'sent', 'failed', 'skipped');

-- CreateEnum
CREATE TYPE "PostbackNetwork" AS ENUM ('mediago', 'facebook', 'google');

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "traffic_source" "TrafficSource" NOT NULL,
    "destination_url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postback_configs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "mediago_conversion_type" INTEGER NOT NULL DEFAULT 10,
    "mediago_enabled" BOOLEAN NOT NULL DEFAULT true,
    "facebook_pixel_id" TEXT,
    "facebook_access_token" TEXT,
    "facebook_enabled" BOOLEAN NOT NULL DEFAULT false,
    "google_conversion_id" TEXT,
    "google_conversion_label" TEXT,
    "google_postback_url" TEXT,
    "google_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postback_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clicks" (
    "id" TEXT NOT NULL,
    "click_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "tracking_id" TEXT,
    "gclid" TEXT,
    "fbclid" TEXT,
    "ad_id" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_term" TEXT,
    "utm_content" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "referrer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversions" (
    "id" TEXT NOT NULL,
    "click_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL DEFAULT 'lead',
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ConversionStatus" NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postback_logs" (
    "id" TEXT NOT NULL,
    "conversion_id" TEXT NOT NULL,
    "network" "PostbackNetwork" NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "request_body" TEXT,
    "http_status" INTEGER,
    "response" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postback_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "postback_configs_campaign_id_key" ON "postback_configs"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "clicks_click_id_key" ON "clicks"("click_id");

-- CreateIndex
CREATE INDEX "clicks_campaign_id_created_at_idx" ON "clicks"("campaign_id", "created_at");

-- CreateIndex
CREATE INDEX "clicks_tracking_id_idx" ON "clicks"("tracking_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversions_click_id_event_type_key" ON "conversions"("click_id", "event_type");

-- CreateIndex
CREATE INDEX "conversions_campaign_id_created_at_idx" ON "conversions"("campaign_id", "created_at");

-- CreateIndex
CREATE INDEX "postback_logs_conversion_id_idx" ON "postback_logs"("conversion_id");

-- AddForeignKey
ALTER TABLE "postback_configs" ADD CONSTRAINT "postback_configs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_click_id_fkey" FOREIGN KEY ("click_id") REFERENCES "clicks"("click_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postback_logs" ADD CONSTRAINT "postback_logs_conversion_id_fkey" FOREIGN KEY ("conversion_id") REFERENCES "conversions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
