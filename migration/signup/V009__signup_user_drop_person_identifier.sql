-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

-- One Identity never sends PersonIdentifier: the Italian eIDAS node maps it onto
-- spidCode, so eIDAS users are identified by spid_code like SPID users.

-- Move any leftover identifier to where the next login looks it up.
UPDATE ${NAMESPACE}_signup."signup_user"
    SET "spid_code" = "person_identifier", "person_identifier" = NULL
    WHERE "person_identifier" IS NOT NULL;

ALTER TABLE ${NAMESPACE}_signup."signup_user"
    DROP CONSTRAINT "signup_user_single_identifier";

ALTER TABLE ${NAMESPACE}_signup."signup_user"
    DROP COLUMN "person_identifier";

ALTER TABLE ${NAMESPACE}_signup."signup_user"
    ADD CONSTRAINT "signup_user_single_identifier"
        CHECK (("spid_code" IS NOT NULL)::int + ("fiscal_number" IS NOT NULL)::int = 1);
