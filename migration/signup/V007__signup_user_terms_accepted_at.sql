-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

ALTER TABLE ${NAMESPACE}_signup."signup_user"
  ADD COLUMN "terms_accepted_at" TIMESTAMP WITH TIME ZONE;

-- Existing rows are all v1, where created_at is the acceptance instant.
UPDATE ${NAMESPACE}_signup."signup_user"
  SET "terms_accepted_at" = "created_at"
  WHERE "terms_accepted_at" IS NULL;

-- Rolling-deploy fallback: an old writer still inserting during migrate-before-app
-- has no value to set; now() is safe (insert instant ≈ acceptance for a new row).
-- The updated writer always sets it explicitly.
ALTER TABLE ${NAMESPACE}_signup."signup_user"
  ALTER COLUMN "terms_accepted_at" SET DEFAULT now();

ALTER TABLE ${NAMESPACE}_signup."signup_user"
  ALTER COLUMN "terms_accepted_at" SET NOT NULL;
