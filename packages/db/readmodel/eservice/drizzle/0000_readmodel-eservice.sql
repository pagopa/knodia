CREATE SCHEMA "eservice";
--> statement-breakpoint
CREATE TABLE "eservice"."eservice" (
	"categories" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_signal_hub_enabled" boolean NOT NULL,
	"metadata_version" integer NOT NULL,
	"mode" text NOT NULL,
	"name" text NOT NULL,
	"producer_id" uuid NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eservice"."eservice_interface" (
	"checksum" text NOT NULL,
	"content_type" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"eservice_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata_version" integer NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"pretty_name" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eservice"."eservice_version" (
	"access_token_audience" text NOT NULL,
	"access_token_duration" text NOT NULL,
	"access_token_type" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"eservice_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"interface_id" uuid NOT NULL,
	"max_daily_calls_per_consumer" text NOT NULL,
	"max_daily_calls_per_knode" text NOT NULL,
	"max_daily_calls_total" text NOT NULL,
	"metadata_version" integer NOT NULL,
	"state" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"version_number" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eservice"."eservice_version_attribute_group" (
	"attribute_ids" text[] NOT NULL,
	"eservice_id" uuid NOT NULL,
	"eservice_version_id" uuid NOT NULL,
	"group_id" integer NOT NULL,
	"metadata_version" integer NOT NULL,
	CONSTRAINT "eservice_version_attribute_group_pk" PRIMARY KEY("eservice_version_id","group_id")
);
--> statement-breakpoint
ALTER TABLE "eservice"."eservice_interface" ADD CONSTRAINT "eservice_interface_eservice_id_eservice_id_fk" FOREIGN KEY ("eservice_id") REFERENCES "eservice"."eservice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eservice"."eservice_interface" ADD CONSTRAINT "eservice_interface_eservice_id_metadata_version_fkey" FOREIGN KEY ("eservice_id","metadata_version") REFERENCES "eservice"."eservice"("id","metadata_version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eservice"."eservice_version" ADD CONSTRAINT "eservice_version_eservice_id_eservice_id_fk" FOREIGN KEY ("eservice_id") REFERENCES "eservice"."eservice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eservice"."eservice_version" ADD CONSTRAINT "eservice_version_interface_id_eservice_interface_id_fk" FOREIGN KEY ("interface_id") REFERENCES "eservice"."eservice_interface"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eservice"."eservice_version" ADD CONSTRAINT "eservice_version_eservice_id_metadata_version_fkey" FOREIGN KEY ("eservice_id","metadata_version") REFERENCES "eservice"."eservice"("id","metadata_version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eservice"."eservice_version_attribute_group" ADD CONSTRAINT "eservice_version_attribute_group_eservice_id_eservice_id_fk" FOREIGN KEY ("eservice_id") REFERENCES "eservice"."eservice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eservice"."eservice_version_attribute_group" ADD CONSTRAINT "eservice_version_attribute_group_eservice_version_id_eservice_version_id_fk" FOREIGN KEY ("eservice_version_id") REFERENCES "eservice"."eservice_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eservice"."eservice_version_attribute_group" ADD CONSTRAINT "eservice_version_attribute_group_eservice_id_metadata_version_fkey" FOREIGN KEY ("eservice_id","metadata_version") REFERENCES "eservice"."eservice"("id","metadata_version") ON DELETE no action ON UPDATE no action;
