-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE SCHEMA IF NOT EXISTS ${NAMESPACE}_agreement;

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_agreement."agreement" (
	"consumer_id" uuid NOT NULL,
	"consumer_knode_id" text NOT NULL,
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

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_agreement."agreement_required_attribute" (
	"code" text NOT NULL,
	"agreement_id" uuid NOT NULL,
	"group_id" integer NOT NULL,
	"metadata_version" bigint NOT NULL,
	"scheme" text NOT NULL,
	CONSTRAINT "agreement_req_attribute_pk" PRIMARY KEY("agreement_id","group_id","scheme","code")
);

-- Foreign key constraints with DEFERRABLE INITIALLY DEFERRED
-- Each ADD CONSTRAINT is preceded by DROP CONSTRAINT IF EXISTS for idempotency

ALTER TABLE ${NAMESPACE}_agreement."agreement_required_attribute" DROP CONSTRAINT IF EXISTS "agreement_req_attribute_agreement_id_fk";
ALTER TABLE ${NAMESPACE}_agreement."agreement_required_attribute" ADD CONSTRAINT "agreement_req_attribute_agreement_id_fk" FOREIGN KEY ("agreement_id") REFERENCES ${NAMESPACE}_agreement."agreement"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_agreement."agreement_required_attribute" DROP CONSTRAINT IF EXISTS "agreement_req_attribute_agreement_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_agreement."agreement_required_attribute" ADD CONSTRAINT "agreement_req_attribute_agreement_id_metadata_v_fkey" FOREIGN KEY ("agreement_id","metadata_version") REFERENCES ${NAMESPACE}_agreement."agreement"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

-- Grant privileges to _agreement_rmw_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_agreement_rmw_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_agreement_rmw_user;

-- Grant privileges to ${NAMESPACE}_agreement_process_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_agreement_process_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_agreement_process_user;
