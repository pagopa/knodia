-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_signup."email_change_request" (
    "email_change_request_id" UUID PRIMARY KEY,
    "signup_user_id" UUID NOT NULL UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE ${NAMESPACE}_signup."email_change_request" ADD CONSTRAINT "email_change_request_signup_user_id_fkey"
  FOREIGN KEY ("signup_user_id") REFERENCES ${NAMESPACE}_signup."signup_user"("signup_user_id") ON DELETE cascade;

-- signup-manager creates and reads email change requests
GRANT SELECT, INSERT ON ${NAMESPACE}_signup."email_change_request" TO ${NAMESPACE}_signup_manager_user;

-- signup-updater reads email change requests, updates signup users, then deletes completed requests
GRANT SELECT, DELETE ON ${NAMESPACE}_signup."email_change_request" TO ${NAMESPACE}_signup_updater_user;
GRANT UPDATE ON ${NAMESPACE}_signup."signup_user" TO ${NAMESPACE}_signup_updater_user;
