CREATE SCHEMA "eservice";
--> statement-breakpoint
CREATE TABLE "eservice"."events" (
	"sequence_num" bigserial PRIMARY KEY NOT NULL,
	"stream_id" uuid NOT NULL,
	"version" bigint NOT NULL,
	"correlation_id" text,
	"type" text NOT NULL,
	"data" "bytea" NOT NULL,
	"log_date" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_stream_id_version_unique" UNIQUE("stream_id","version")
);
