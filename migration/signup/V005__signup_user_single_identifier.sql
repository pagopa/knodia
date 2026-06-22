-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

-- A signup user must carry exactly one identifier, not just at least one: SPID
-- returns both spidCode and fiscalNumber, so persisting more than one would let
-- a later CIE login (fiscalNumber only) collide with a SPID user on the same
-- person. We now keep only the identifier selected by precedence.

-- Backfill existing rows to the new invariant before tightening the constraint.
-- Rows written before this change can carry more than one identifier (a SPID
-- signup stored both spid_code and fiscal_number), and signup is not
-- event-sourced, so there is no projection to rebuild from — the data is fixed
-- here. Keep only the precedence winner (person_identifier > spid_code >
-- fiscal_number) and null the rest. Idempotent: a no-op on rows that already
-- carry a single identifier.
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
