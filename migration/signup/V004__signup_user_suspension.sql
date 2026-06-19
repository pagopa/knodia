-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

ALTER TABLE ${NAMESPACE}_signup."signup_user"
  ADD COLUMN IF NOT EXISTS "suspended_at" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "suspension_reason" TEXT;

ALTER TABLE ${NAMESPACE}_signup."signup_user"
  ADD CONSTRAINT "signup_user_suspension_consistency"
  CHECK (
    (
      "status" = 'Suspended'
      AND "suspended_at" IS NOT NULL
      AND "suspension_reason" IS NOT NULL
    )
    OR
    (
      "status" <> 'Suspended'
      AND "suspended_at" IS NULL
      AND "suspension_reason" IS NULL
    )
  );

-- signup-manager needs update permission to mark users as suspended.
GRANT UPDATE ON ${NAMESPACE}_signup."signup_user" TO ${NAMESPACE}_signup_manager_user;
