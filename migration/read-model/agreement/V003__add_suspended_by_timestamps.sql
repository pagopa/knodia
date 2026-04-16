-- Add suspension timestamp columns to agreement table

ALTER TABLE ${NAMESPACE}_agreement."agreement"
  ADD COLUMN IF NOT EXISTS "suspended_by_consumer_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "suspended_by_producer_at" timestamp with time zone;
