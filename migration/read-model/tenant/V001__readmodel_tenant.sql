-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE SCHEMA IF NOT EXISTS ${NAMESPACE}_tenant;

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_tenant."tenant" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tenant_id_metadata_v_unique" UNIQUE("id","metadata_version")
);

-- Grant privileges to ${NAMESPACE}_tenant_process_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_tenant TO ${NAMESPACE}_tenant_process_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_tenant TO ${NAMESPACE}_tenant_process_user;
