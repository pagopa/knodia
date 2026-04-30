-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_keychain."knodia_api_keychain" (
	"created_at" timestamp with time zone NOT NULL,
	"description" jsonb,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" jsonb NOT NULL,
	"owner_id" uuid NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "knodia_api_keychain_id_metadata_v_unique" UNIQUE("id","metadata_version")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_keychain."knodia_api_keychain_user" (
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"knodia_api_keychain_id" uuid NOT NULL,
	"metadata_version" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "knodia_api_keychain_user_pk" PRIMARY KEY("user_id","metadata_version","knodia_api_keychain_id")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_keychain."knodia_api_keychain_key" (
	"algorithm" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"encoded_pem" text NOT NULL,
	"format" text NOT NULL,
	"knodia_api_keychain_id" uuid NOT NULL,
	"kid" text NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" jsonb NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "knodia_api_keychain_key_pkey" PRIMARY KEY("knodia_api_keychain_id","kid")
);

ALTER TABLE ${NAMESPACE}_keychain."knodia_api_keychain_user" DROP CONSTRAINT IF EXISTS "knodia_api_keychain_user_knodia_api_keychain_id_fkey";
ALTER TABLE ${NAMESPACE}_keychain."knodia_api_keychain_user" ADD CONSTRAINT "knodia_api_keychain_user_knodia_api_keychain_id_fkey" FOREIGN KEY ("knodia_api_keychain_id") REFERENCES ${NAMESPACE}_keychain."knodia_api_keychain"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_keychain."knodia_api_keychain_user" DROP CONSTRAINT IF EXISTS "knodia_api_keychain_user_knodia_api_keychain_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_keychain."knodia_api_keychain_user" ADD CONSTRAINT "knodia_api_keychain_user_knodia_api_keychain_id_metadata_v_fkey" FOREIGN KEY ("knodia_api_keychain_id","metadata_version") REFERENCES ${NAMESPACE}_keychain."knodia_api_keychain"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_keychain."knodia_api_keychain_key" DROP CONSTRAINT IF EXISTS "knodia_api_keychain_key_knodia_api_keychain_id_fkey";
ALTER TABLE ${NAMESPACE}_keychain."knodia_api_keychain_key" ADD CONSTRAINT "knodia_api_keychain_key_knodia_api_keychain_id_fkey" FOREIGN KEY ("knodia_api_keychain_id") REFERENCES ${NAMESPACE}_keychain."knodia_api_keychain"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_keychain."knodia_api_keychain_key" DROP CONSTRAINT IF EXISTS "knodia_api_keychain_key_knodia_api_keychain_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_keychain."knodia_api_keychain_key" ADD CONSTRAINT "knodia_api_keychain_key_knodia_api_keychain_id_metadata_v_fkey" FOREIGN KEY ("knodia_api_keychain_id","metadata_version") REFERENCES ${NAMESPACE}_keychain."knodia_api_keychain"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;
