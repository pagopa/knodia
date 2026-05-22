-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_keychain."producer_keychain" (
	"created_at" timestamp with time zone NOT NULL,
	"description" jsonb,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" jsonb NOT NULL,
	"owner_id" uuid NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "producer_keychain_id_metadata_v_unique" UNIQUE("id","metadata_version")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_keychain."producer_keychain_user" (
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"producer_keychain_id" uuid NOT NULL,
	"metadata_version" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "producer_keychain_user_pk" PRIMARY KEY("user_id","metadata_version","producer_keychain_id")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_keychain."producer_keychain_key" (
	"algorithm" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"encoded_pem" text NOT NULL,
	"format" text NOT NULL,
	"producer_keychain_id" uuid NOT NULL,
	"kid" text NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" jsonb NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "producer_keychain_key_pkey" PRIMARY KEY("producer_keychain_id","kid")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_keychain."producer_keychain_eservice" (
	"eservice_id" uuid NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata_version" bigint NOT NULL,
	"producer_keychain_id" uuid NOT NULL,
	CONSTRAINT "producer_keychain_eservice_pk" PRIMARY KEY("eservice_id","metadata_version","producer_keychain_id")
);


-- Foreign key constraints with DEFERRABLE INITIALLY DEFERRED
-- Each ADD CONSTRAINT is preceded by DROP CONSTRAINT IF EXISTS for idempotency

ALTER TABLE ${NAMESPACE}_keychain."producer_keychain_user" DROP CONSTRAINT IF EXISTS "producer_keychain_user_producer_keychain_id_fkey";
ALTER TABLE ${NAMESPACE}_keychain."producer_keychain_user" ADD CONSTRAINT "producer_keychain_user_producer_keychain_id_fkey" FOREIGN KEY ("producer_keychain_id") REFERENCES ${NAMESPACE}_keychain."producer_keychain"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_keychain."producer_keychain_user" DROP CONSTRAINT IF EXISTS "producer_keychain_user_producer_keychain_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_keychain."producer_keychain_user" ADD CONSTRAINT "producer_keychain_user_producer_keychain_id_metadata_v_fkey" FOREIGN KEY ("producer_keychain_id","metadata_version") REFERENCES ${NAMESPACE}_keychain."producer_keychain"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_keychain."producer_keychain_eservice" DROP CONSTRAINT IF EXISTS "producer_keychain_eservice_producer_keychain_id_fkey";
ALTER TABLE ${NAMESPACE}_keychain."producer_keychain_eservice" ADD CONSTRAINT "producer_keychain_eservice_producer_keychain_id_fkey" FOREIGN KEY ("producer_keychain_id") REFERENCES ${NAMESPACE}_keychain."producer_keychain"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_keychain."producer_keychain_eservice" DROP CONSTRAINT IF EXISTS "producer_keychain_eservice_producer_keychain_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_keychain."producer_keychain_eservice" ADD CONSTRAINT "producer_keychain_eservice_producer_keychain_id_metadata_v_fkey" FOREIGN KEY ("producer_keychain_id","metadata_version") REFERENCES ${NAMESPACE}_keychain."producer_keychain"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_keychain."producer_keychain_key" DROP CONSTRAINT IF EXISTS "producer_keychain_key_producer_keychain_id_fkey";
ALTER TABLE ${NAMESPACE}_keychain."producer_keychain_key" ADD CONSTRAINT "producer_keychain_key_producer_keychain_id_fkey" FOREIGN KEY ("producer_keychain_id") REFERENCES ${NAMESPACE}_keychain."producer_keychain"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_keychain."producer_keychain_key" DROP CONSTRAINT IF EXISTS "producer_keychain_key_producer_keychain_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_keychain."producer_keychain_key" ADD CONSTRAINT "producer_keychain_key_producer_keychain_id_metadata_v_fkey" FOREIGN KEY ("producer_keychain_id","metadata_version") REFERENCES ${NAMESPACE}_keychain."producer_keychain"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

-- Grant privileges to ${NAMESPACE}_keychain_rmw_user (writer)
GRANT SELECT, INSERT, UPDATE, DELETE ON ${NAMESPACE}_keychain."producer_keychain" TO ${NAMESPACE}_keychain_rmw_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ${NAMESPACE}_keychain."producer_keychain_user" TO ${NAMESPACE}_keychain_rmw_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ${NAMESPACE}_keychain."producer_keychain_key" TO ${NAMESPACE}_keychain_rmw_user;

-- Grant privileges to ${NAMESPACE}_keychain_process_user (reader)
GRANT SELECT ON ${NAMESPACE}_keychain."producer_keychain" TO ${NAMESPACE}_keychain_process_user;
GRANT SELECT ON ${NAMESPACE}_keychain."producer_keychain_user" TO ${NAMESPACE}_keychain_process_user;
GRANT SELECT ON ${NAMESPACE}_keychain."producer_keychain_key" TO ${NAMESPACE}_keychain_process_user;
