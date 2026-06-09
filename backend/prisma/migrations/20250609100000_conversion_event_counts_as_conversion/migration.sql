ALTER TABLE "conversion_event_types" ADD COLUMN "counts_as_conversion" BOOLEAN NOT NULL DEFAULT false;

UPDATE "conversion_event_types"
SET "counts_as_conversion" = true
WHERE "slug" IN (
  'lead',
  'call_connected',
  'sale',
  'sales',
  'purchase',
  'postalcode',
  'account_opening',
  'account_validated',
  'age_60',
  'hearing_loss'
);
