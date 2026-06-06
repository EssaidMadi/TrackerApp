-- CreateEnum
CREATE TYPE "AdPlatform" AS ENUM ('mediago', 'facebook', 'google', 'outbrain', 'taboola', 'mgid', 'bing', 'powerspace', 'organic', 'native');

-- CreateEnum
CREATE TYPE "PlatformConnectionStatus" AS ENUM ('active', 'error', 'disabled');

-- CreateTable
CREATE TABLE "conversion_event_types" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversion_event_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_connections" (
    "id" TEXT NOT NULL,
    "platform" "AdPlatform" NOT NULL,
    "label" TEXT NOT NULL,
    "account_id" TEXT,
    "credentials" JSONB NOT NULL DEFAULT '{}',
    "status" "PlatformConnectionStatus" NOT NULL DEFAULT 'active',
    "last_sync_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_platform_mappings" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "platform" "AdPlatform" NOT NULL,
    "external_campaign_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_platform_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_spend_snapshots" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "platform" "AdPlatform" NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER NOT NULL DEFAULT -1,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "source" TEXT NOT NULL DEFAULT 'sync',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_spend_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversion_event_types_slug_key" ON "conversion_event_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "platform_connections_platform_label_key" ON "platform_connections"("platform", "label");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_platform_mappings_campaign_id_platform_key" ON "campaign_platform_mappings"("campaign_id", "platform");

-- CreateIndex
CREATE INDEX "campaign_platform_mappings_platform_external_campaign_id_idx" ON "campaign_platform_mappings"("platform", "external_campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_spend_snapshots_campaign_id_platform_date_hour_key" ON "campaign_spend_snapshots"("campaign_id", "platform", "date", "hour");

-- CreateIndex
CREATE INDEX "campaign_spend_snapshots_campaign_id_date_idx" ON "campaign_spend_snapshots"("campaign_id", "date");

-- AddForeignKey
ALTER TABLE "campaign_platform_mappings" ADD CONSTRAINT "campaign_platform_mappings_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_spend_snapshots" ADD CONSTRAINT "campaign_spend_snapshots_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
