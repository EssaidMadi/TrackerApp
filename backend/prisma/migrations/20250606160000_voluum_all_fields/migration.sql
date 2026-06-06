-- Campaign Voluum metadata
ALTER TABLE "campaigns" ADD COLUMN "workspace_name" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "workspace_id" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "traffic_source_id" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "traffic_source_name" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "lander_id" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "lander_name" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "offer_id" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "offer_name" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "affiliate_network" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "affiliate_network_id" TEXT;

-- Click Voluum fields
ALTER TABLE "clicks" ADD COLUMN "path_id" TEXT;
ALTER TABLE "clicks" ADD COLUMN "lander_id" TEXT;
ALTER TABLE "clicks" ADD COLUMN "lander_name" TEXT;
ALTER TABLE "clicks" ADD COLUMN "offer_id" TEXT;
ALTER TABLE "clicks" ADD COLUMN "offer_name" TEXT;
ALTER TABLE "clicks" ADD COLUMN "affiliate_network" TEXT;
ALTER TABLE "clicks" ADD COLUMN "affiliate_network_id" TEXT;
ALTER TABLE "clicks" ADD COLUMN "traffic_source_id" TEXT;
ALTER TABLE "clicks" ADD COLUMN "traffic_source_name" TEXT;
ALTER TABLE "clicks" ADD COLUMN "custom_variable_1" TEXT;
ALTER TABLE "clicks" ADD COLUMN "custom_variable_2" TEXT;
ALTER TABLE "clicks" ADD COLUMN "custom_variable_3" TEXT;
ALTER TABLE "clicks" ADD COLUMN "custom_variable_4" TEXT;
ALTER TABLE "clicks" ADD COLUMN "custom_variable_5" TEXT;
ALTER TABLE "clicks" ADD COLUMN "custom_variable_6" TEXT;
ALTER TABLE "clicks" ADD COLUMN "custom_variable_7" TEXT;
ALTER TABLE "clicks" ADD COLUMN "custom_variable_8" TEXT;
ALTER TABLE "clicks" ADD COLUMN "custom_variable_9" TEXT;
ALTER TABLE "clicks" ADD COLUMN "custom_variable_10" TEXT;

-- Conversion Voluum postback fields
ALTER TABLE "conversions" ADD COLUMN "currency" TEXT;
ALTER TABLE "conversions" ADD COLUMN "cost" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "conversions" ADD COLUMN "total_revenue" DOUBLE PRECISION;
ALTER TABLE "conversions" ADD COLUMN "incoming_postback_ip" TEXT;
ALTER TABLE "conversions" ADD COLUMN "incoming_postback_url" TEXT;
ALTER TABLE "conversions" ADD COLUMN "postback_param_1" TEXT;
ALTER TABLE "conversions" ADD COLUMN "postback_param_2" TEXT;
ALTER TABLE "conversions" ADD COLUMN "postback_param_3" TEXT;
ALTER TABLE "conversions" ADD COLUMN "postback_param_4" TEXT;
ALTER TABLE "conversions" ADD COLUMN "postback_param_5" TEXT;
