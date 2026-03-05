-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE SCHEMA IF NOT EXISTS ${NAMESPACE}_organization;

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_organization."organization" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "organization_id_metadata_v_unique" UNIQUE("id","metadata_version")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_organization."organization_attribute" (
	"code" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"metadata_version" bigint NOT NULL,
	"scheme" text NOT NULL,
	CONSTRAINT "organization_attribute_pk" PRIMARY KEY("organization_id","scheme","code")
);

ALTER TABLE ${NAMESPACE}_organization."organization_attribute" ADD CONSTRAINT "organization_attribute_organization_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES ${NAMESPACE}_organization."organization"("id") ON DELETE cascade;

ALTER TABLE ${NAMESPACE}_organization."organization_attribute" ADD CONSTRAINT "organization_attribute_organization_id_metadata_v_fkey"
  FOREIGN KEY ("organization_id","metadata_version") REFERENCES ${NAMESPACE}_organization."organization"("id","metadata_version");

-- Grant privileges to ${NAMESPACE}_organization_process_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_organization TO ${NAMESPACE}_organization_process_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_organization TO ${NAMESPACE}_organization_process_user;

GRANT USAGE ON SCHEMA ${NAMESPACE}_organization TO ${NAMESPACE}_agreement_process_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_organization TO ${NAMESPACE}_agreement_process_user;

GRANT USAGE ON SCHEMA ${NAMESPACE}_organization TO ${NAMESPACE}_eservice_process_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_organization TO ${NAMESPACE}_eservice_process_user;
