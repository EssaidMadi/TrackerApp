-- CreateEnum
CREATE TYPE "PlacementDimension" AS ENUM ('site', 'publisher');

-- CreateEnum
CREATE TYPE "BlockedPlacementSource" AS ENUM ('manual', 'rule');

-- CreateEnum
CREATE TYPE "BlockedPlacementStatus" AS ENUM ('active', 'removed');

-- CreateEnum
CREATE TYPE "RuleScope" AS ENUM ('campaign', 'site', 'publisher', 'creative');

-- CreateEnum
CREATE TYPE "RuleMetric" AS ENUM ('roi', 'cpa', 'botPct', 'spendNoEvents', 'budgetPace');

-- CreateEnum
CREATE TYPE "RuleOperator" AS ENUM ('lt', 'lte', 'gt', 'gte');

-- CreateEnum
CREATE TYPE "RuleAction" AS ENUM ('alert', 'suggest_block', 'suggest_pause');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('info', 'warning', 'danger', 'success');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('open', 'ack', 'resolved');

-- CreateEnum
CREATE TYPE "ControlActionStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateTable
CREATE TABLE "blocked_placements" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "workspace_name" TEXT,
    "dimension" "PlacementDimension" NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT,
    "source" "BlockedPlacementSource" NOT NULL DEFAULT 'manual',
    "status" "BlockedPlacementStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_targets" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "daily_budget" DOUBLE PRECISION,
    "cpa_target" DOUBLE PRECISION,
    "roas_target" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "RuleScope" NOT NULL,
    "metric" "RuleMetric" NOT NULL,
    "operator" "RuleOperator" NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "window_hours" INTEGER NOT NULL DEFAULT 24,
    "action" "RuleAction" NOT NULL DEFAULT 'alert',
    "severity" "AlertSeverity" NOT NULL DEFAULT 'warning',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "campaign_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "optimization_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_events" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT,
    "severity" "AlertSeverity" NOT NULL,
    "scope" "RuleScope" NOT NULL,
    "entity_key" TEXT NOT NULL,
    "entity_label" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "suggested_action" TEXT NOT NULL,
    "metric_value" DOUBLE PRECISION,
    "status" "AlertStatus" NOT NULL DEFAULT 'open',
    "campaign_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_action_logs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "platform" "AdPlatform" NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "status" "ControlActionStatus" NOT NULL DEFAULT 'pending',
    "response_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "control_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blocked_placements_campaign_id_dimension_status_idx" ON "blocked_placements"("campaign_id", "dimension", "status");

-- CreateIndex
CREATE INDEX "blocked_placements_dimension_value_status_idx" ON "blocked_placements"("dimension", "value", "status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_targets_campaign_id_key" ON "campaign_targets"("campaign_id");

-- CreateIndex
CREATE INDEX "alert_events_status_created_at_idx" ON "alert_events"("status", "created_at");

-- CreateIndex
CREATE INDEX "alert_events_entity_key_scope_status_idx" ON "alert_events"("entity_key", "scope", "status");

-- CreateIndex
CREATE INDEX "control_action_logs_campaign_id_created_at_idx" ON "control_action_logs"("campaign_id", "created_at");

-- AddForeignKey
ALTER TABLE "blocked_placements" ADD CONSTRAINT "blocked_placements_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_targets" ADD CONSTRAINT "campaign_targets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_rules" ADD CONSTRAINT "optimization_rules_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "optimization_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_action_logs" ADD CONSTRAINT "control_action_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
