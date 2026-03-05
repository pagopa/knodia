-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE SCHEMA IF NOT EXISTS ${NAMESPACE}_agreement;

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_agreement."agreement" (
	"agreement_id" uuid PRIMARY KEY NOT NULL,
	"eservice_id" uuid NOT NULL,
	"eservice_version_id" uuid NOT NULL,
	"consumer_id" uuid NOT NULL,
	"producer_id" uuid NOT NULL,
	"knode_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Grant privileges to ${NAMESPACE}_remote_resource_manager_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_remote_resource_manager_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_remote_resource_manager_user;
