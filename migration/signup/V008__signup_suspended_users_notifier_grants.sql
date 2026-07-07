-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

-- signup-suspended-users-notifier reads suspended users to email the list to Legal
GRANT USAGE ON SCHEMA ${NAMESPACE}_signup TO ${NAMESPACE}_signup_suspended_users_notifier_user;
GRANT SELECT ON ${NAMESPACE}_signup."signup_user" TO ${NAMESPACE}_signup_suspended_users_notifier_user;
