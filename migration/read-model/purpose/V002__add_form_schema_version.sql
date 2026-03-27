-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

ALTER TABLE ${NAMESPACE}_purpose."purpose"
  ADD COLUMN "form_schema_version" text NOT NULL DEFAULT '1.0';

-- Remove default after backfilling existing rows, new inserts always provide the value
ALTER TABLE ${NAMESPACE}_purpose."purpose"
  ALTER COLUMN "form_schema_version" DROP DEFAULT;
