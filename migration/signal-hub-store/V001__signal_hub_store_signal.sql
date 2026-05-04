-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE SCHEMA IF NOT EXISTS ${NAMESPACE}_signal_hub;

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_signal_hub."signal" (
    "correlation_id" UUID NOT NULL,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "eservice_id" UUID NOT NULL,
    "id" BIGSERIAL PRIMARY KEY NOT NULL,
    "object_id" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "signal_id" BIGINT NOT NULL,
    "signal_type" TEXT NOT NULL,
	UNIQUE ("eservice_id", "signal_id")
);

-- Grant privileges to ${NAMESPACE}_signal_hub_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_signal_hub TO ${NAMESPACE}_signal_hub_user;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA ${NAMESPACE}_signal_hub TO ${NAMESPACE}_signal_hub_user;

