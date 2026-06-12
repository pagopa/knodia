-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

ALTER TABLE ${NAMESPACE}_signup."signup_user"
    ADD CONSTRAINT "signup_user_status_valid"
        CHECK ("status" IN ('Active', 'Suspended', 'DeletionPending'));

-- Completed deletions: the signup_user row is hard-deleted and only its id
-- plus lifecycle timestamps survive here, so the deletion act stays provable
-- (idempotent replays, late-event skips) without retaining any PII.
CREATE TABLE ${NAMESPACE}_signup."deleted_signup_user" (
    "signup_user_id" UUID PRIMARY KEY,

    "signup_created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "deletion_requested_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "deleted_at" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- signup-manager marks users DeletionPending and reads the deletion registry
GRANT UPDATE ON ${NAMESPACE}_signup."signup_user" TO ${NAMESPACE}_signup_manager_user;
GRANT SELECT ON ${NAMESPACE}_signup."deleted_signup_user" TO ${NAMESPACE}_signup_manager_user;

-- signup-updater completes deletions: hard-deletes the row and records it in
-- the registry
GRANT DELETE ON ${NAMESPACE}_signup."signup_user" TO ${NAMESPACE}_signup_updater_user;
GRANT SELECT, INSERT ON ${NAMESPACE}_signup."deleted_signup_user" TO ${NAMESPACE}_signup_updater_user;
