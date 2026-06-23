-- POC UC03 mock relay receive-data e-service for the lynx knode.
-- Producer is systemSERCLynx (scripts/seed/sql/lynx/poc-use-case-03.sql).
-- Same shape as the orion relay (scripts/seed/sql/orion/mock-poc-uc03-relay-eservice.sql),
-- distinct UUIDs/producer. ${NAMESPACE} and ${ENVIRONMENT} are substituted by seed.sh.

INSERT INTO ${NAMESPACE}_eservice."eservice" (
  id, producer_id, name, description, mode,
  is_consumer_operator_identification_required, is_signal_hub_enabled,
  metadata_version, created_at, updated_at
) VALUES (
  'b4e2d9f1-2c3d-4e4f-9a51-000000000311',
  '00000000-0000-4000-8000-000000000105',
  '{"en": "ERDS Relay - Lynx"}'::jsonb,
  '{"en": "Cross-Border receive-data E-Service published by a SERC: relays an ERD dispatch (the sender''s message or the delivery evidences) from another SERC and returns an acknowledgement."}'::jsonb,
  'ReceiveData',
  true, false,
  0, now(), now()
) ON CONFLICT (id) DO UPDATE SET
  producer_id = EXCLUDED.producer_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  mode = EXCLUDED.mode,
  is_consumer_operator_identification_required = EXCLUDED.is_consumer_operator_identification_required,
  is_signal_hub_enabled = EXCLUDED.is_signal_hub_enabled,
  updated_at = now();

INSERT INTO ${NAMESPACE}_eservice."eservice_version" (
  id, eservice_id, version_number, state,
  access_token_audience, access_token_duration, access_token_type,
  max_daily_calls_per_consumer, max_daily_calls_per_knode,
  metadata_version, created_at, updated_at
) VALUES (
  'b4e2d9f1-2c3d-4e4f-9a51-000000000312',
  'b4e2d9f1-2c3d-4e4f-9a51-000000000311',
  1, 'Active',
  ARRAY['mock.lynx.${ENVIRONMENT}.knodia.com'], 3600, 'Bearer',
  1000, 10000,
  0, now(), now()
) ON CONFLICT (id) DO UPDATE SET
  eservice_id = EXCLUDED.eservice_id,
  version_number = EXCLUDED.version_number,
  state = EXCLUDED.state,
  access_token_audience = EXCLUDED.access_token_audience,
  access_token_duration = EXCLUDED.access_token_duration,
  access_token_type = EXCLUDED.access_token_type,
  max_daily_calls_per_consumer = EXCLUDED.max_daily_calls_per_consumer,
  max_daily_calls_per_knode = EXCLUDED.max_daily_calls_per_knode,
  updated_at = now();

INSERT INTO ${NAMESPACE}_eservice."eservice_interface" (
  id, eservice_id, eservice_version_id,
  checksum, content_type, name, path, pretty_name,
  metadata_version, created_at, updated_at
) VALUES (
  'b4e2d9f1-2c3d-4e4f-9a51-000000000313',
  'b4e2d9f1-2c3d-4e4f-9a51-000000000311',
  'b4e2d9f1-2c3d-4e4f-9a51-000000000312',
  '8ed701e5014579334367b915ec568f76b5d4e98487eb0b18b1d0039c21c767c5',
  'application/yaml',
  'mock-bearer-poc-uc03-relay-eservice.yaml',
  'b4e2d9f1-2c3d-4e4f-9a51-000000000313/mock-bearer-poc-uc03-relay-eservice.yaml',
  '{"en": "mock-bearer-poc-uc03-relay-eservice.yaml"}'::jsonb,
  0, now(), now()
) ON CONFLICT (id) DO UPDATE SET
  eservice_id = EXCLUDED.eservice_id,
  eservice_version_id = EXCLUDED.eservice_version_id,
  checksum = EXCLUDED.checksum,
  content_type = EXCLUDED.content_type,
  name = EXCLUDED.name,
  path = EXCLUDED.path,
  pretty_name = EXCLUDED.pretty_name,
  updated_at = now();

INSERT INTO ${NAMESPACE}_eservice."eservice_version_required_attribute" (
  eservice_id, eservice_version_id, group_id, scheme, code, metadata_version
) VALUES (
  'b4e2d9f1-2c3d-4e4f-9a51-000000000311',
  'b4e2d9f1-2c3d-4e4f-9a51-000000000312',
  1, 'vc_poc_attributes', 'erds',
  0
) ON CONFLICT ON CONSTRAINT eservice_v_req_attribute_pk DO NOTHING;

DELETE FROM ${NAMESPACE}_eservice."eservice_category"
 WHERE eservice_id = 'b4e2d9f1-2c3d-4e4f-9a51-000000000311';

INSERT INTO ${NAMESPACE}_eservice."eservice_category" (
  eservice_id, scheme, code, metadata_version
) VALUES (
  'b4e2d9f1-2c3d-4e4f-9a51-000000000311',
  'vc_example_eservice_categories', 'citizen.residence.digital_domicile',
  0
);

-- Pre-filled purpose-form option (Confluence "Purpose Form Use Case 03"). The
-- INSTITUTIONAL / LEGAL_OBLIGATION set. NOTE: the option must be valid against
-- the form schema configured on THIS producer's knode (Lynx runs
-- schemas-withriskanalysis), so it carries the with-risk-analysis answer set;
-- the Orion relay option uses the basic set because Orion runs schemas-basic.
INSERT INTO ${NAMESPACE}_eservice."eservice_purpose_form_option" (
  id, eservice_id, name, description,
  form_answers_json, form_schema_version,
  metadata_version
) VALUES (
  'b4e2d9f1-2c3d-4e4f-9a51-000000000314',
  'b4e2d9f1-2c3d-4e4f-9a51-000000000311',
  '{"en": "Communication between certified electronic delivery systems"}'::jsonb,
  '{"en": "Communication between providers of qualified certified electronic delivery systems in the member state pursuant to EU Regulation No. 910/2014"}'::jsonb,
  '{"purpose":"INSTITUTIONAL","institutionalPurpose":"Forwarding a message from an eIDAS certified electronic delivery system","usesPersonalData":"YES","personalDataTypes":["WITH_IDENTIFYING_DATA"],"legalBasis":["LEGAL_OBLIGATION"],"legalObligationReference":"Article 3, point 36 of EU Regulation No. 910/2014","declarationConfirmGDPR":"true","knowsDataQuantity":"NO","deliveryMethod":"CLEARTEXT","policyProvided":"YES","policyProvidedMedium":"PRINT","confirmPrincipleIntegrityAndDiscretion":"true","doneDpia":"NO","dataDownload":"NO","purposePursuit":"MERE_CORRECTNESS","checkedExistenceMereCorrectnessInteropCatalogue":"true","isRequestOnBehalfOfThirdParties":"NO"}'::jsonb,
  '1.0',
  0
) ON CONFLICT (id) DO UPDATE SET
  eservice_id = EXCLUDED.eservice_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  form_answers_json = EXCLUDED.form_answers_json,
  form_schema_version = EXCLUDED.form_schema_version;
