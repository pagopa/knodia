-- Add eservice_purpose_form_answer table — list of pre-filled purpose form
-- answers published by a Producer on a ReceiveData e-service. The Consumer
-- selects one when creating a Purpose; the backend snapshots it into
-- Purpose.formAnswersJson. See KN-75.

CREATE TABLE IF NOT EXISTS ${NAMESPACE}_eservice."eservice_purpose_form_answer" (
	"description" text NOT NULL,
	"eservice_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" text NOT NULL,
	"schema" jsonb NOT NULL,
	"texts" jsonb NOT NULL,
	"ui_schema" jsonb NOT NULL,
	"ui_texts" jsonb NOT NULL,
	"version" text NOT NULL
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
