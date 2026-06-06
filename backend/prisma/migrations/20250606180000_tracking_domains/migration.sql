-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('pending_dns', 'verified', 'failed');

-- CreateTable
CREATE TABLE "tracking_domains" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL DEFAULT 'track',
    "root_domain" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "status" "DomainStatus" NOT NULL DEFAULT 'pending_dns',
    "verification_token" TEXT NOT NULL,
    "verification_host" TEXT NOT NULL,
    "dns_records" JSONB NOT NULL,
    "last_checked_at" TIMESTAMP(3),
    "last_check_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_domains_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tracking_domains_hostname_key" ON "tracking_domains"("hostname");

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "domain_id" TEXT;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "tracking_domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;
