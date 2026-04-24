-- Add suspension timestamp columns to purpose table

ALTER TABLE ${NAMESPACE}_purpose."purpose"
  ADD COLUMN IF NOT EXISTS "suspended_by_consumer_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "suspended_by_producer_at" timestamp with time zone;
