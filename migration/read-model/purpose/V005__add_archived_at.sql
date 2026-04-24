-- Add archived_at timestamp column to purpose table

ALTER TABLE ${NAMESPACE}_purpose."purpose"
  ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
