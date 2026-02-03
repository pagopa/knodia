CREATE SCHEMA IF NOT EXISTS "eservice";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eservice"."eservice" (
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
	CONSTRAINT "eservice_id_metadata_version_unique" UNIQUE("id","metadata_version")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eservice"."eservice_category" (
	"code" text NOT NULL,
	"eservice_id" uuid NOT NULL,
	"metadata_version" integer NOT NULL,
	"scheme" text NOT NULL,
	CONSTRAINT "eservice_category_pk" PRIMARY KEY("eservice_id","metadata_version","scheme","code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eservice"."eservice_interface" (
	"checksum" text NOT NULL,
	"content_type" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"eservice_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata_version" integer NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"pretty_name" jsonb NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eservice"."eservice_version" (
	"access_token_audience" text[] NOT NULL,
	"access_token_duration" integer NOT NULL,
	"access_token_type" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"eservice_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"interface_id" uuid NOT NULL,
	"max_daily_calls_per_consumer" integer NOT NULL,
	"max_daily_calls_per_knode" integer NOT NULL,
	"metadata_version" integer NOT NULL,
	"state" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"version_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eservice"."eservice_version_required_attribute" (
	"code" text NOT NULL,
	"eservice_id" uuid NOT NULL,
	"eservice_version_id" uuid NOT NULL,
	"group_id" integer NOT NULL,
	"metadata_version" integer NOT NULL,
	"scheme" text NOT NULL,
	CONSTRAINT "eservice_version_required_attribute_pk" PRIMARY KEY("eservice_version_id","group_id","scheme","code")
);
--> statement-breakpoint
ALTER TABLE "eservice"."eservice_category" DROP CONSTRAINT IF EXISTS "eservice_category_eservice_id_eservice_id_fk"; --added --> statement-breakpoint
ALTER TABLE "eservice"."eservice_category" ADD CONSTRAINT "eservice_category_eservice_id_eservice_id_fk" FOREIGN KEY ("eservice_id") REFERENCES "eservice"."eservice"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED; --updated --> statement-breakpoint
ALTER TABLE "eservice"."eservice_category" DROP CONSTRAINT IF EXISTS "eservice_category_eservice_id_metadata_version_fkey"; --added --> statement-breakpoint
ALTER TABLE "eservice"."eservice_category" ADD CONSTRAINT "eservice_category_eservice_id_metadata_version_fkey" FOREIGN KEY ("eservice_id","metadata_version") REFERENCES "eservice"."eservice"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED; --updated --> statement-breakpoint
ALTER TABLE "eservice"."eservice_interface" DROP CONSTRAINT IF EXISTS "eservice_interface_eservice_id_eservice_id_fk"; --added --> statement-breakpoint
ALTER TABLE "eservice"."eservice_interface" ADD CONSTRAINT "eservice_interface_eservice_id_eservice_id_fk" FOREIGN KEY ("eservice_id") REFERENCES "eservice"."eservice"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED; --updated --> statement-breakpoint
ALTER TABLE "eservice"."eservice_interface" DROP CONSTRAINT IF EXISTS "eservice_interface_eservice_id_metadata_version_fkey"; --added --> statement-breakpoint
ALTER TABLE "eservice"."eservice_interface" ADD CONSTRAINT "eservice_interface_eservice_id_metadata_version_fkey" FOREIGN KEY ("eservice_id","metadata_version") REFERENCES "eservice"."eservice"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED; --updated --> statement-breakpoint
ALTER TABLE "eservice"."eservice_version" DROP CONSTRAINT IF EXISTS "eservice_version_eservice_id_eservice_id_fk"; --added --> statement-breakpoint
ALTER TABLE "eservice"."eservice_version" ADD CONSTRAINT "eservice_version_eservice_id_eservice_id_fk" FOREIGN KEY ("eservice_id") REFERENCES "eservice"."eservice"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED; --updated --> statement-breakpoint
ALTER TABLE "eservice"."eservice_version" DROP CONSTRAINT IF EXISTS "eservice_version_interface_id_eservice_interface_id_fk"; --added --> statement-breakpoint
ALTER TABLE "eservice"."eservice_version" ADD CONSTRAINT "eservice_version_interface_id_eservice_interface_id_fk" FOREIGN KEY ("interface_id") REFERENCES "eservice"."eservice_interface"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED; --updated --> statement-breakpoint
ALTER TABLE "eservice"."eservice_version" DROP CONSTRAINT IF EXISTS "eservice_version_eservice_id_metadata_version_fkey"; --added --> statement-breakpoint
ALTER TABLE "eservice"."eservice_version" ADD CONSTRAINT "eservice_version_eservice_id_metadata_version_fkey" FOREIGN KEY ("eservice_id","metadata_version") REFERENCES "eservice"."eservice"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED; --updated --> statement-breakpoint
ALTER TABLE "eservice"."eservice_version_required_attribute" DROP CONSTRAINT IF EXISTS "eservice_version_required_attribute_eservice_id_eservice_id_fk"; --added --> statement-breakpoint
ALTER TABLE "eservice"."eservice_version_required_attribute" ADD CONSTRAINT "eservice_version_required_attribute_eservice_id_eservice_id_fk" FOREIGN KEY ("eservice_id") REFERENCES "eservice"."eservice"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED; --updated --> statement-breakpoint
ALTER TABLE "eservice"."eservice_version_required_attribute" DROP CONSTRAINT IF EXISTS "eservice_version_required_attribute_eservice_version_id_eservice_version_id_fk"; --added --> statement-breakpoint
ALTER TABLE "eservice"."eservice_version_required_attribute" ADD CONSTRAINT "eservice_version_required_attribute_eservice_version_id_eservice_version_id_fk" FOREIGN KEY ("eservice_version_id") REFERENCES "eservice"."eservice_version"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED; --updated --> statement-breakpoint
ALTER TABLE "eservice"."eservice_version_required_attribute" DROP CONSTRAINT IF EXISTS "eservice_version_required_attribute_eservice_id_metadata_version_fkey"; --added --> statement-breakpoint
ALTER TABLE "eservice"."eservice_version_required_attribute" ADD CONSTRAINT "eservice_version_required_attribute_eservice_id_metadata_version_fkey" FOREIGN KEY ("eservice_id","metadata_version") REFERENCES "eservice"."eservice"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED; --updated 