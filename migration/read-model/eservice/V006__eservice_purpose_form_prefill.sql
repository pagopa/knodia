CREATE TABLE IF NOT EXISTS ${NAMESPACE}_eservice."eservice_purpose_form_prefill" (
	"description" jsonb NOT NULL,
	"eservice_id" uuid NOT NULL,
	"form_answers_json" jsonb NOT NULL,
	"form_schema_version" text NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata_version" bigint NOT NULL,
	"name" jsonb NOT NULL
);

ALTER TABLE ${NAMESPACE}_eservice."eservice_purpose_form_prefill" DROP CONSTRAINT IF EXISTS "eservice_purpose_form_prefill_eservice_id_eservice_id_fk";
ALTER TABLE ${NAMESPACE}_eservice."eservice_purpose_form_prefill" ADD CONSTRAINT "eservice_purpose_form_prefill_eservice_id_eservice_id_fk" FOREIGN KEY ("eservice_id") REFERENCES ${NAMESPACE}_eservice."eservice"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ${NAMESPACE}_eservice."eservice_purpose_form_prefill" DROP CONSTRAINT IF EXISTS "eservice_purpose_form_prefill_eservice_id_metadata_v_fkey";
ALTER TABLE ${NAMESPACE}_eservice."eservice_purpose_form_prefill" ADD CONSTRAINT "eservice_purpose_form_prefill_eservice_id_metadata_v_fkey" FOREIGN KEY ("eservice_id","metadata_version") REFERENCES ${NAMESPACE}_eservice."eservice"("id","metadata_version") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;

GRANT SELECT, INSERT, UPDATE, DELETE ON ${NAMESPACE}_eservice."eservice_purpose_form_prefill" TO ${NAMESPACE}_eservice_rmw_user;
GRANT SELECT ON ${NAMESPACE}_eservice."eservice_purpose_form_prefill" TO ${NAMESPACE}_eservice_process_user;
GRANT SELECT ON ${NAMESPACE}_eservice."eservice_purpose_form_prefill" TO ${NAMESPACE}_agreement_process_user;
GRANT SELECT ON ${NAMESPACE}_eservice."eservice_purpose_form_prefill" TO ${NAMESPACE}_purpose_process_user;
GRANT SELECT ON ${NAMESPACE}_eservice."eservice_purpose_form_prefill" TO ${NAMESPACE}_authorization_server_user;
GRANT SELECT ON ${NAMESPACE}_eservice."eservice_purpose_form_prefill" TO ${NAMESPACE}_signal_hub_user;
