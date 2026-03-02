-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE SCHEMA IF NOT EXISTS ${NAMESPACE}_consumer_keychain;

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_consumer_keychain."events" (
	"correlation_id" text NOT NULL,
	"data" "bytea" NOT NULL,
	"log_date" timestamp with time zone DEFAULT now() NOT NULL,
	"sequence_num" bigserial PRIMARY KEY NOT NULL,
	"stream_id" uuid NOT NULL,
	"type" text NOT NULL,
	"version" bigint NOT NULL,
	CONSTRAINT "events_stream_id_version_unique" UNIQUE("stream_id","version")
);

-- Grant privileges to ${NAMESPACE}_consumer_keychain_process_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_consumer_keychain TO ${NAMESPACE}_consumer_keychain_process_user;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA ${NAMESPACE}_consumer_keychain TO ${NAMESPACE}_consumer_keychain_process_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${NAMESPACE}_consumer_keychain TO ${NAMESPACE}_consumer_keychain_process_user;
