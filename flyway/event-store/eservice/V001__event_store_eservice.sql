-- Drizzle source: 0000_event-store-eservice.sql
CREATE SCHEMA IF NOT EXISTS "eservice";

CREATE TABLE "eservice"."events" (
	"correlation_id" text NOT NULL,
	"data" "bytea" NOT NULL,
	"log_date" timestamp with time zone DEFAULT now() NOT NULL,
	"sequence_num" bigserial PRIMARY KEY NOT NULL,
	"stream_id" uuid NOT NULL,
	"type" text NOT NULL,
	"version" bigint NOT NULL,
	CONSTRAINT "events_stream_id_version_unique" UNIQUE("stream_id","version")
);
