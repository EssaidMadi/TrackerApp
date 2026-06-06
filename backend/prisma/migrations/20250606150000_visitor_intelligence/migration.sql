-- AlterTable
ALTER TABLE "clicks" ADD COLUMN "is_proxy" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clicks" ADD COLUMN "is_hosting" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clicks" ADD COLUMN "is_bot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clicks" ADD COLUMN "bot_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "clicks" ADD COLUMN "bot_reasons" JSONB;
ALTER TABLE "clicks" ADD COLUMN "accept_language" TEXT;
ALTER TABLE "clicks" ADD COLUMN "request_headers" JSONB;

-- CreateIndex
CREATE INDEX "clicks_is_bot_idx" ON "clicks"("is_bot");
