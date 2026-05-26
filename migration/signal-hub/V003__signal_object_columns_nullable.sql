-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

-- object_id/object_type are absent for SeedUpdate signals, which reference no subject.
ALTER TABLE ${NAMESPACE}_signal_hub."signal" ALTER COLUMN "object_id" DROP NOT NULL;
ALTER TABLE ${NAMESPACE}_signal_hub."signal" ALTER COLUMN "object_type" DROP NOT NULL;
