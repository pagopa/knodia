-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

-- object_id/object_type are absent for SeedUpdate signals, which reference no object.
ALTER TABLE ${NAMESPACE}_signal_hub."signal" ALTER COLUMN "object_id" DROP NOT NULL;
ALTER TABLE ${NAMESPACE}_signal_hub."signal" ALTER COLUMN "object_type" DROP NOT NULL;

-- Reconcile existing SeedUpdate rows: they were stored with empty-string object columns.
UPDATE ${NAMESPACE}_signal_hub."signal"
SET "object_id" = NULL, "object_type" = NULL
WHERE "signal_type" = 'SeedUpdate';

-- Object columns are present iff the signal references an object (everything but SeedUpdate).
ALTER TABLE ${NAMESPACE}_signal_hub."signal"
ADD CONSTRAINT "signal_object_columns_match_signal_type" CHECK (
  ("signal_type" = 'SeedUpdate' AND "object_id" IS NULL AND "object_type" IS NULL)
  OR ("signal_type" <> 'SeedUpdate' AND "object_id" IS NOT NULL AND "object_type" IS NOT NULL)
);
