-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

-- signup-archiver reads signup users to archive their actions for legal purposes
GRANT USAGE ON SCHEMA ${NAMESPACE}_signup TO ${NAMESPACE}_signup_archiver_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_signup TO ${NAMESPACE}_signup_archiver_user;
