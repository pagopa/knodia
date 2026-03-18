-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE SCHEMA IF NOT EXISTS ${NAMESPACE}_purpose;

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_purpose."purpose" (
	"consumer_id" uuid NOT NULL,
	"consumer_knode_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"daily_calls" integer NOT NULL,
	"description" jsonb NOT NULL,
	"eservice_id" uuid NOT NULL,
	"form_answers" jsonb NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" jsonb NOT NULL,
	"state" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "purpose_id_metadata_v_unique" UNIQUE("id","metadata_version")
);

-- Grant privileges to ${NAMESPACE}_purpose_rmw_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_purpose TO ${NAMESPACE}_purpose_rmw_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${NAMESPACE}_purpose TO ${NAMESPACE}_purpose_rmw_user;

-- Grant privileges to ${NAMESPACE}_purpose_process_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_purpose TO ${NAMESPACE}_purpose_process_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_purpose TO ${NAMESPACE}_purpose_process_user;
