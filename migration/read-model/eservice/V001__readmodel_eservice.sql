-- Flyway versioned migration: V001__readmodel_eservice.sql
-- Creates the read model schema, tables, and foreign key constraints
-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

CREATE SCHEMA IF NOT EXISTS ${NAMESPACE}_eservice;

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_eservice."eservice" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description" jsonb NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_consumer_operator_identification_required" boolean NOT NULL,
	"is_signal_hub_enabled" boolean NOT NULL,
	"metadata_version" integer NOT NULL,
	"mode" text NOT NULL,
	"name" jsonb NOT NULL,
	"producer_id" uuid NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "eservice_id_metadata_v_unique" UNIQUE("id","metadata_version")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_eservice."eservice_category" (
	"code" text NOT NULL,
	"eservice_id" uuid NOT NULL,
	"metadata_version" integer NOT NULL,
	"scheme" text NOT NULL,
	CONSTRAINT "eservice_category_pk" PRIMARY KEY("eservice_id","metadata_version","scheme","code")
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_eservice."eservice_interface" (
	"checksum" text NOT NULL,
	"content_type" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"eservice_id" uuid NOT NULL,
	"eservice_version_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata_version" integer NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"pretty_name" jsonb NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_eservice."eservice_version" (
	"access_token_audience" text[] NOT NULL,
	"access_token_duration" integer NOT NULL,
	"access_token_type" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"eservice_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"max_daily_calls_per_consumer" integer NOT NULL,
	"max_daily_calls_per_knode" integer NOT NULL,
	"metadata_version" integer NOT NULL,
	"state" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"version_number" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_eservice."eservice_version_required_attribute" (
	"code" text NOT NULL,
	"eservice_id" uuid NOT NULL,
	"eservice_version_id" uuid NOT NULL,
	"group_id" integer NOT NULL,
	"metadata_version" integer NOT NULL,
	"scheme" text NOT NULL,
	CONSTRAINT "eservice_v_req_attribute_pk" PRIMARY KEY("eservice_version_id","group_id","scheme","code")
);

-- Foreign key constraints with DEFERRABLE INITIALLY DEFERRED
-- Each ADD CONSTRAINT is preceded by DROP CONSTRAINT IF EXISTS for idempotency

ALTER TABLE ${NAMESPACE}_eservice."eservice_category" DROP CONSTRAINT IF EXISTS "eservice_category_eservice_id_eservice_id_fk";
ALTER TABLE ${NAMESPACE}_eservice."eservice_category" ADD CONSTRAINT "eservice_category_eservice_id_eservice_id_fk" FOREIGN KEY ("eservice_id") REFERENCES ${NAMESPACE}_eservice."eservice"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_eservice."eservice_category" DROP CONSTRAINT IF EXISTS "eservice_category_eservice_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_eservice."eservice_category" ADD CONSTRAINT "eservice_category_eservice_id_metadata_v_fkey" FOREIGN KEY ("eservice_id","metadata_version") REFERENCES ${NAMESPACE}_eservice."eservice"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_eservice."eservice_interface" DROP CONSTRAINT IF EXISTS "eservice_interface_eservice_id_eservice_id_fk";
ALTER TABLE ${NAMESPACE}_eservice."eservice_interface" ADD CONSTRAINT "eservice_interface_eservice_id_eservice_id_fk" FOREIGN KEY ("eservice_id") REFERENCES ${NAMESPACE}_eservice."eservice"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_eservice."eservice_interface" DROP CONSTRAINT IF EXISTS "eservice_interface_eservice_v_id_eservice_version_id_fk"; --added --> statement-breakpoint
ALTER TABLE ${NAMESPACE}_eservice."eservice_interface" ADD CONSTRAINT "eservice_interface_eservice_v_id_eservice_v_id_fk" FOREIGN KEY ("eservice_version_id") REFERENCES ${NAMESPACE}_eservice."eservice_version"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED; --updated --> statement-breakpoint

ALTER TABLE ${NAMESPACE}_eservice."eservice_interface" DROP CONSTRAINT IF EXISTS "eservice_interface_eservice_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_eservice."eservice_interface" ADD CONSTRAINT "eservice_interface_eservice_id_metadata_v_fkey" FOREIGN KEY ("eservice_id","metadata_version") REFERENCES ${NAMESPACE}_eservice."eservice"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_eservice."eservice_version" DROP CONSTRAINT IF EXISTS "eservice_v_eservice_id_eservice_id_fk";
ALTER TABLE ${NAMESPACE}_eservice."eservice_version" ADD CONSTRAINT "eservice_v_eservice_id_eservice_id_fk" FOREIGN KEY ("eservice_id") REFERENCES ${NAMESPACE}_eservice."eservice"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_eservice."eservice_version" DROP CONSTRAINT IF EXISTS "eservice_v_eservice_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_eservice."eservice_version" ADD CONSTRAINT "eservice_v_eservice_id_metadata_v_fkey" FOREIGN KEY ("eservice_id","metadata_version") REFERENCES ${NAMESPACE}_eservice."eservice"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_eservice."eservice_version_required_attribute" DROP CONSTRAINT IF EXISTS "eservice_v_req_attribute_eservice_id_eservice_id_fk";
ALTER TABLE ${NAMESPACE}_eservice."eservice_version_required_attribute" ADD CONSTRAINT "eservice_v_req_attribute_eservice_id_eservice_id_fk" FOREIGN KEY ("eservice_id") REFERENCES ${NAMESPACE}_eservice."eservice"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_eservice."eservice_version_required_attribute" DROP CONSTRAINT IF EXISTS "eservice_v_req_attribute_eservice_v_id_eservice_v_id_fk";
ALTER TABLE ${NAMESPACE}_eservice."eservice_version_required_attribute" ADD CONSTRAINT "eservice_v_req_attribute_eservice_v_id_eservice_v_id_fk" FOREIGN KEY ("eservice_version_id") REFERENCES ${NAMESPACE}_eservice."eservice_version"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_eservice."eservice_version_required_attribute" DROP CONSTRAINT IF EXISTS "eservice_v_req_attribute_eservice_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_eservice."eservice_version_required_attribute" ADD CONSTRAINT "eservice_v_req_attribute_eservice_id_metadata_v_fkey" FOREIGN KEY ("eservice_id","metadata_version") REFERENCES ${NAMESPACE}_eservice."eservice"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;
