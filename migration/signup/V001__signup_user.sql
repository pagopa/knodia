-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE SCHEMA IF NOT EXISTS ${NAMESPACE}_signup;

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_signup."signup_user" (
    "signup_user_id" UUID PRIMARY KEY,

    "spid_code" TEXT UNIQUE,
    "fiscal_number" TEXT UNIQUE,
    "person_identifier" TEXT UNIQUE,

    "name" TEXT NOT NULL,
    "family_name" TEXT NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "email" TEXT NOT NULL UNIQUE,

    -- UNIQUE per column: INSERT atomically rejects concurrent onboardings
    -- that generated the same name.
    "orion_organization_name" TEXT NOT NULL UNIQUE,
    "orion_organization_id" UUID,
    "orion_user_name" TEXT NOT NULL UNIQUE,
    "lynx_organization_name" TEXT NOT NULL UNIQUE,
    "lynx_organization_id" UUID,
    "lynx_user_name" TEXT NOT NULL UNIQUE,

    "status" TEXT NOT NULL,

    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT "signup_user_at_least_one_identifier"
        CHECK ("spid_code" IS NOT NULL
            OR "fiscal_number" IS NOT NULL
            OR "person_identifier" IS NOT NULL)
);
