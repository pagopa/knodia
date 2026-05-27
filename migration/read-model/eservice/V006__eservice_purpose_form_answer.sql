-- Add eservice_purpose_form_answer table — list of pre-filled purpose form
-- answers published by a Producer on a ReceiveData e-service. The Consumer
-- selects one when creating a Purpose; the backend snapshots `form_answers_json`
-- and `form_schema_version` into the corresponding fields on the new Purpose.
-- Columns mirror the existing `purpose` table:
--   - `form_answers_json jsonb` ← same as purpose.form_answers_json (V001)
--   - `form_schema_version text` ← same as purpose.form_schema_version (V002)
--   - `name` / `description` ← same shape as eservice.name / eservice.description
-- The form schema (schema / uiSchema / texts / uiTexts) is NOT stored in DB:
-- it lives on file system in purpose-process and is fetched via the existing
-- runtime mechanism, consistent with how the ProvideData flow works. See KN-75.

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_eservice."eservice_purpose_form_answer" (
	"description" jsonb NOT NULL,
	"eservice_id" uuid NOT NULL,
	"form_answers_json" jsonb NOT NULL,
	"form_schema_version" text NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" jsonb NOT NULL
);

ALTER TABLE ${NAMESPACE}_eservice."eservice_purpose_form_answer" DROP CONSTRAINT IF EXISTS "eservice_purpose_form_answer_eservice_id_eservice_id_fk";
ALTER TABLE ${NAMESPACE}_eservice."eservice_purpose_form_answer" ADD CONSTRAINT "eservice_purpose_form_answer_eservice_id_eservice_id_fk" FOREIGN KEY ("eservice_id") REFERENCES ${NAMESPACE}_eservice."eservice"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_eservice."eservice_purpose_form_answer" DROP CONSTRAINT IF EXISTS "eservice_purpose_form_answer_eservice_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_eservice."eservice_purpose_form_answer" ADD CONSTRAINT "eservice_purpose_form_answer_eservice_id_metadata_v_fkey" FOREIGN KEY ("eservice_id","metadata_version") REFERENCES ${NAMESPACE}_eservice."eservice"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

-- Re-apply SELECT grants to existing users so that the new table is readable.
-- (V002/V003/V005 only granted on tables existing at their time.)
GRANT SELECT ON ${NAMESPACE}_eservice."eservice_purpose_form_answer" TO ${NAMESPACE}_purpose_process_user;
GRANT SELECT ON ${NAMESPACE}_eservice."eservice_purpose_form_answer" TO ${NAMESPACE}_authorization_server_user;
GRANT SELECT ON ${NAMESPACE}_eservice."eservice_purpose_form_answer" TO ${NAMESPACE}_signal_hub_user;
