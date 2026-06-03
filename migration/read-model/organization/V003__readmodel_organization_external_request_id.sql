-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

ALTER TABLE ${NAMESPACE}_organization."organization"
	ADD COLUMN IF NOT EXISTS "external_request_id" uuid;

-- UNIQUE on a nullable column: only valued rows participate (NULLs are distinct
-- in Postgres), so an externalRequestId maps to at most one organization while
-- callers that don't supply one (e.g. the BFF) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS "organization_external_request_id_unique"
	ON ${NAMESPACE}_organization."organization" ("external_request_id");
