-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

ALTER TABLE ${NAMESPACE}_signup."signup_user"
  ADD COLUMN "terms_accepted_at" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN "terms_accepted_version" INTEGER;

-- Existing rows are all v1, where created_at is the acceptance instant.
UPDATE ${NAMESPACE}_signup."signup_user"
  SET "terms_accepted_at" = "created_at",
      "terms_accepted_version" = 1
  WHERE "terms_accepted_at" IS NULL;

-- Rolling-deploy fallback: an old writer still inserting during migrate-before-app has no
-- value to set. now() is safe for the instant (insert ≈ acceptance for a new row) and 1 for
-- the version (the only document in existence). The updated writer always sets both explicitly.
ALTER TABLE ${NAMESPACE}_signup."signup_user"
  ALTER COLUMN "terms_accepted_at" SET DEFAULT now(),
  ALTER COLUMN "terms_accepted_version" SET DEFAULT 1;

ALTER TABLE ${NAMESPACE}_signup."signup_user"
  ADD CONSTRAINT "signup_user_terms_accepted_version_positive"
  CHECK ("terms_accepted_version" > 0);

ALTER TABLE ${NAMESPACE}_signup."signup_user"
  ALTER COLUMN "terms_accepted_at" SET NOT NULL,
  ALTER COLUMN "terms_accepted_version" SET NOT NULL;
