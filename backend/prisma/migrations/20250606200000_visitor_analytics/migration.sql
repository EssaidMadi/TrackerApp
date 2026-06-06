-- AlterTable
ALTER TABLE "clicks" ADD COLUMN "visitor_id" TEXT;
ALTER TABLE "clicks" ADD COLUMN "is_new_visitor" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "clicks_campaign_id_visitor_id_idx" ON "clicks"("campaign_id", "visitor_id");
