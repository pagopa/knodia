-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

ALTER TABLE ${NAMESPACE}_purpose."purpose"
  ADD COLUMN "form_schema_version" text NOT NULL DEFAULT '1.0';
