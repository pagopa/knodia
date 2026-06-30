-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

ALTER TABLE ${NAMESPACE}_signup."signup_user"
  DROP CONSTRAINT "signup_user_status_valid";

ALTER TABLE ${NAMESPACE}_signup."signup_user"
  ADD CONSTRAINT "signup_user_status_valid"
    CHECK ("status" IN ('OnboardingPending', 'Active', 'Suspended', 'DeletionPending'));
