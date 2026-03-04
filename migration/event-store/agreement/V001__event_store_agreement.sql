-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE SCHEMA IF NOT EXISTS ${NAMESPACE}_agreement;

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_agreement."events" (
	"correlation_id" text NOT NULL,
	"data" "bytea" NOT NULL,
	"log_date" timestamp with time zone DEFAULT now() NOT NULL,
	"sequence_num" bigserial PRIMARY KEY NOT NULL,
	"stream_id" uuid NOT NULL,
	"type" text NOT NULL,
	"version" bigint NOT NULL,
	CONSTRAINT "events_stream_id_version_unique" UNIQUE("stream_id","version")
);

-- Grant privileges to ${NAMESPACE}_agreement_process_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_agreement_process_user;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_agreement_process_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_agreement_process_user;
