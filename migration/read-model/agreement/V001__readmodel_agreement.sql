-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE SCHEMA IF NOT EXISTS ${NAMESPACE}_agreement;

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_agreement."agreement" (
	"consumer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"eservice_id" uuid NOT NULL,
	"eservice_version_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata_version" bigint NOT NULL,
	"producer_id" uuid NOT NULL,
	"state" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "agreement_id_metadata_v_unique" UNIQUE("id","metadata_version")
);

-- Grant privileges to _agreement_rmw_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_agreement_rmw_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_agreement_rmw_user;

-- Grant privileges to ${NAMESPACE}_agreement_process_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_agreement_process_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_agreement_process_user;
