-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE SCHEMA IF NOT EXISTS ${NAMESPACE}_keychain;

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_keychain."keychain" (
	"created_at" timestamp with time zone NOT NULL,
	"description" jsonb,
	"id" uuid PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" jsonb NOT NULL,
	"owner_id" uuid NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "keychain_id_metadata_v_unique" UNIQUE("id","metadata_version")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_keychain."keychain_user" (
	"keychain_id" uuid NOT NULL,
	"metadata_version" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "keychain_user_pk" PRIMARY KEY("user_id","metadata_version","keychain_id")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_keychain."keychain_purpose" (
	"keychain_id" uuid NOT NULL,
	"metadata_version" bigint NOT NULL,
	"purpose_id" uuid NOT NULL,
	CONSTRAINT "keychain_purpose_pk" PRIMARY KEY("purpose_id","metadata_version","keychain_id")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_keychain."keychain_key" (
	"algorithm" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"encoded_pem" text NOT NULL,
	"format" text NOT NULL,
	"keychain_id" uuid NOT NULL,
	"kid" text NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" jsonb NOT NULL,
	"use" text NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "keychain_key_pkey" PRIMARY KEY("keychain_id","kid")
);

-- Foreign key constraints
-- Each ADD CONSTRAINT is preceded by DROP CONSTRAINT IF EXISTS for idempotency

ALTER TABLE ${NAMESPACE}_keychain."keychain_user" DROP CONSTRAINT IF EXISTS "keychain_user_keychain_id_fkey";
ALTER TABLE ${NAMESPACE}_keychain."keychain_user" ADD CONSTRAINT "keychain_user_keychain_id_fkey" FOREIGN KEY ("keychain_id") REFERENCES ${NAMESPACE}_keychain."keychain"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE ${NAMESPACE}_keychain."keychain_user" DROP CONSTRAINT IF EXISTS "keychain_user_keychain_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_keychain."keychain_user" ADD CONSTRAINT "keychain_user_keychain_id_metadata_v_fkey" FOREIGN KEY ("keychain_id","metadata_version") REFERENCES ${NAMESPACE}_keychain."keychain"("id","metadata_version") ON DELETE no action ON UPDATE no action;

ALTER TABLE ${NAMESPACE}_keychain."keychain_purpose" DROP CONSTRAINT IF EXISTS "keychain_purpose_keychain_id_fkey";
ALTER TABLE ${NAMESPACE}_keychain."keychain_purpose" ADD CONSTRAINT "keychain_purpose_keychain_id_fkey" FOREIGN KEY ("keychain_id") REFERENCES ${NAMESPACE}_keychain."keychain"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE ${NAMESPACE}_keychain."keychain_purpose" DROP CONSTRAINT IF EXISTS "keychain_purpose_keychain_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_keychain."keychain_purpose" ADD CONSTRAINT "keychain_purpose_keychain_id_metadata_v_fkey" FOREIGN KEY ("keychain_id","metadata_version") REFERENCES ${NAMESPACE}_keychain."keychain"("id","metadata_version") ON DELETE no action ON UPDATE no action;

ALTER TABLE ${NAMESPACE}_keychain."keychain_key" DROP CONSTRAINT IF EXISTS "keychain_key_keychain_id_fkey";
ALTER TABLE ${NAMESPACE}_keychain."keychain_key" ADD CONSTRAINT "keychain_key_keychain_id_fkey" FOREIGN KEY ("keychain_id") REFERENCES ${NAMESPACE}_keychain."keychain"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE ${NAMESPACE}_keychain."keychain_key" DROP CONSTRAINT IF EXISTS "keychain_key_keychain_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_keychain."keychain_key" ADD CONSTRAINT "keychain_key_keychain_id_metadata_v_fkey" FOREIGN KEY ("keychain_id","metadata_version") REFERENCES ${NAMESPACE}_keychain."keychain"("id","metadata_version") ON DELETE no action ON UPDATE no action;

-- Grant privileges to _keychain_rmw_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_keychain TO ${NAMESPACE}_keychain_rmw_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${NAMESPACE}_keychain TO ${NAMESPACE}_keychain_rmw_user;

-- Grant privileges to ${NAMESPACE}_keychain_process_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_keychain TO ${NAMESPACE}_keychain_process_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_keychain TO ${NAMESPACE}_keychain_process_user;
