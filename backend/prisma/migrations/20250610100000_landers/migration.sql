-- CreateEnum
CREATE TYPE "LanderStatus" AS ENUM ('draft', 'ready');

-- CreateTable
CREATE TABLE "landers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "root_domain" TEXT,
    "public_url" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "entry_file" TEXT NOT NULL DEFAULT 'index.html',
    "inject_tracker" BOOLEAN NOT NULL DEFAULT true,
    "tracker_attrs" JSONB,
    "status" "LanderStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landers_slug_key" ON "landers"("slug");

-- CreateIndex
CREATE INDEX "landers_campaign_id_idx" ON "landers"("campaign_id");

-- AddForeignKey
ALTER TABLE "landers" ADD CONSTRAINT "landers_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
