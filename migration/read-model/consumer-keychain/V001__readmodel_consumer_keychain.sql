-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE SCHEMA IF NOT EXISTS ${NAMESPACE}_consumer_keychain;

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_consumer_keychain."consumer_keychain" (
	"created_at" timestamp with time zone NOT NULL,
	"description" jsonb,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" jsonb NOT NULL,
	"owner_id" uuid NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "consumer_keychain_id_metadata_v_unique" UNIQUE("id","metadata_version")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_consumer_keychain."consumer_keychain_user" (
	"consumer_keychain_id" uuid NOT NULL,
	"metadata_version" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "consumer_keychain_user_pk" PRIMARY KEY("user_id","metadata_version","consumer_keychain_id")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_consumer_keychain."consumer_keychain_purpose" (
	"consumer_keychain_id" uuid NOT NULL,
	"metadata_version" bigint NOT NULL,
	"purpose_id" uuid NOT NULL,
	CONSTRAINT "consumer_keychain_purpose_pk" PRIMARY KEY("purpose_id","metadata_version","consumer_keychain_id")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_consumer_keychain."consumer_keychain_key" (
	"algorithm" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"encoded_pem" text NOT NULL,
	"format" text NOT NULL,
	"consumer_keychain_id" uuid NOT NULL,
	"kid" text NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" jsonb NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "consumer_keychain_key_pkey" PRIMARY KEY("consumer_keychain_id","kid")
);

-- Foreign key constraints with DEFERRABLE INITIALLY DEFERRED
-- Each ADD CONSTRAINT is preceded by DROP CONSTRAINT IF EXISTS for idempotency

ALTER TABLE ${NAMESPACE}_consumer_keychain."consumer_keychain_user" DROP CONSTRAINT IF EXISTS "consumer_keychain_user_consumer_keychain_id_fkey";
ALTER TABLE ${NAMESPACE}_consumer_keychain."consumer_keychain_user" ADD CONSTRAINT "consumer_keychain_user_consumer_keychain_id_fkey" FOREIGN KEY ("consumer_keychain_id") REFERENCES ${NAMESPACE}_consumer_keychain."consumer_keychain"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_consumer_keychain."consumer_keychain_user" DROP CONSTRAINT IF EXISTS "consumer_keychain_user_consumer_keychain_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_consumer_keychain."consumer_keychain_user" ADD CONSTRAINT "consumer_keychain_user_consumer_keychain_id_metadata_v_fkey" FOREIGN KEY ("consumer_keychain_id","metadata_version") REFERENCES ${NAMESPACE}_consumer_keychain."consumer_keychain"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_consumer_keychain."consumer_keychain_purpose" DROP CONSTRAINT IF EXISTS "consumer_keychain_purpose_consumer_keychain_id_fkey";
ALTER TABLE ${NAMESPACE}_consumer_keychain."consumer_keychain_purpose" ADD CONSTRAINT "consumer_keychain_purpose_consumer_keychain_id_fkey" FOREIGN KEY ("consumer_keychain_id") REFERENCES ${NAMESPACE}_consumer_keychain."consumer_keychain"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_consumer_keychain."consumer_keychain_purpose" DROP CONSTRAINT IF EXISTS "consumer_keychain_purpose_consumer_keychain_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_consumer_keychain."consumer_keychain_purpose" ADD CONSTRAINT "consumer_keychain_purpose_consumer_keychain_id_metadata_v_fkey" FOREIGN KEY ("consumer_keychain_id","metadata_version") REFERENCES ${NAMESPACE}_consumer_keychain."consumer_keychain"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_consumer_keychain."consumer_keychain_key" DROP CONSTRAINT IF EXISTS "consumer_keychain_key_consumer_keychain_id_fkey";
ALTER TABLE ${NAMESPACE}_consumer_keychain."consumer_keychain_key" ADD CONSTRAINT "consumer_keychain_key_consumer_keychain_id_fkey" FOREIGN KEY ("consumer_keychain_id") REFERENCES ${NAMESPACE}_consumer_keychain."consumer_keychain"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_consumer_keychain."consumer_keychain_key" DROP CONSTRAINT IF EXISTS "consumer_keychain_key_consumer_keychain_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_consumer_keychain."consumer_keychain_key" ADD CONSTRAINT "consumer_keychain_key_consumer_keychain_id_metadata_v_fkey" FOREIGN KEY ("consumer_keychain_id","metadata_version") REFERENCES ${NAMESPACE}_consumer_keychain."consumer_keychain"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

-- Grant privileges to _consumer_keychain_rmw_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_consumer_keychain TO ${NAMESPACE}_consumer_keychain_rmw_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${NAMESPACE}_consumer_keychain TO ${NAMESPACE}_consumer_keychain_rmw_user;

-- Grant privileges to ${NAMESPACE}_consumer_keychain_process_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_consumer_keychain TO ${NAMESPACE}_consumer_keychain_process_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_consumer_keychain TO ${NAMESPACE}_consumer_keychain_process_user;
