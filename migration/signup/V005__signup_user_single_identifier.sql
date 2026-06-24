-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

-- Exactly one identifier, not just at least one: SPID returns both spidCode and
-- fiscalNumber, so keeping both lets a later CIE login (fiscalNumber only)
-- collide with the same person's SPID user.

-- Rollout: deploy signup-manager before (or with) this migration, else the new
-- CHECK rejects onboarding inserts from pre-change tokens still carrying both
-- spid_code and fiscal_number.

-- Backfill before tightening: signup is not event-sourced, so there is no
-- projection to rebuild from — the data is fixed here. Keep the precedence
-- winner (person_identifier > spid_code > fiscal_number), null the rest.
-- Idempotent.
UPDATE ${NAMESPACE}_signup."signup_user"
    SET "fiscal_number" = NULL
    WHERE "fiscal_number" IS NOT NULL
        AND ("spid_code" IS NOT NULL OR "person_identifier" IS NOT NULL);

UPDATE ${NAMESPACE}_signup."signup_user"
    SET "spid_code" = NULL
    WHERE "spid_code" IS NOT NULL AND "person_identifier" IS NOT NULL;

ALTER TABLE ${NAMESPACE}_signup."signup_user"
    DROP CONSTRAINT "signup_user_at_least_one_identifier";

ALTER TABLE ${NAMESPACE}_signup."signup_user"
    ADD CONSTRAINT "signup_user_single_identifier"
        CHECK (
            ("spid_code" IS NOT NULL)::int
            + ("fiscal_number" IS NOT NULL)::int
            + ("person_identifier" IS NOT NULL)::int
            = 1
        );
