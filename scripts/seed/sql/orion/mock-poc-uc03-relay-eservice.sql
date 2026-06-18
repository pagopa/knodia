-- POC UC03 mock relay receive-data e-service for the orion knode.
-- Producer is systemSERCOrion (scripts/seed/sql/orion/poc-use-case-03.sql).
-- Same shape as the lynx relay (scripts/seed/sql/lynx/mock-poc-uc03-relay-eservice.sql),
-- distinct UUIDs/producer. ${NAMESPACE} and ${ENVIRONMENT} are substituted by seed.sh.

INSERT INTO ${NAMESPACE}_eservice."eservice" (
  id, producer_id, name, description, mode,
  is_consumer_operator_identification_required, is_signal_hub_enabled,
  metadata_version, created_at, updated_at
) VALUES (
  'c5f3e0a2-3d4e-4f5a-ab62-000000000321',
  '00000000-0000-4000-8000-000000000106',
  '{"en": "ERDS Relay - Orion"}'::jsonb,
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
  'c5f3e0a2-3d4e-4f5a-ab62-000000000322',
  'c5f3e0a2-3d4e-4f5a-ab62-000000000321',
  1, 'Active',
  ARRAY['mock.orion.${ENVIRONMENT}.knodia.com'], 3600, 'Bearer',
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
  'c5f3e0a2-3d4e-4f5a-ab62-000000000323',
  'c5f3e0a2-3d4e-4f5a-ab62-000000000321',
  'c5f3e0a2-3d4e-4f5a-ab62-000000000322',
  'e517f0c4523b3d82921df9731ed2882d2b1a06bdd0eec91732db10af765fbf1f',
  'application/yaml',
  'mock-bearer-poc-uc03-relay-eservice.yaml',
  'c5f3e0a2-3d4e-4f5a-ab62-000000000323/mock-bearer-poc-uc03-relay-eservice.yaml',
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
  'c5f3e0a2-3d4e-4f5a-ab62-000000000321',
  'c5f3e0a2-3d4e-4f5a-ab62-000000000322',
  1, 'vc_poc_attributes', 'erds_poc',
  0
) ON CONFLICT ON CONSTRAINT eservice_v_req_attribute_pk DO NOTHING;

DELETE FROM ${NAMESPACE}_eservice."eservice_category"
 WHERE eservice_id = 'c5f3e0a2-3d4e-4f5a-ab62-000000000321';

INSERT INTO ${NAMESPACE}_eservice."eservice_category" (
  eservice_id, scheme, code, metadata_version
) VALUES (
  'c5f3e0a2-3d4e-4f5a-ab62-000000000321',
  'vc_example_eservice_categories', 'citizen.residence.digital_domicile',
  0
);

-- Pre-filled purpose-form option (Confluence "Purpose Form Use Case 03"). The
-- minimal INSTITUTIONAL / LEGAL_OBLIGATION set valid against the basic 1.0 schema.
INSERT INTO ${NAMESPACE}_eservice."eservice_purpose_form_option" (
  id, eservice_id, name, description,
  form_answers_json, form_schema_version,
  metadata_version
) VALUES (
  'c5f3e0a2-3d4e-4f5a-ab62-000000000324',
  'c5f3e0a2-3d4e-4f5a-ab62-000000000321',
  '{"en": "Communication between certified electronic delivery systems"}'::jsonb,
  '{"en": "Communication between providers of qualified certified electronic delivery systems in the member state pursuant to EU Regulation No. 910/2014"}'::jsonb,
  '{"purpose":"INSTITUTIONAL","institutionalPurpose":"Forwarding a message from an eIDAS certified electronic delivery system","usesPersonalData":"YES","personalDataTypes":["WITH_IDENTIFYING_DATA"],"legalBasis":["LEGAL_OBLIGATION"],"legalObligationReference":"Article 3, point 36 of EU Regulation No. 910/2014","declarationConfirmGDPR":"true"}'::jsonb,
  '1.0',
  0
) ON CONFLICT (id) DO UPDATE SET
  eservice_id = EXCLUDED.eservice_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  form_answers_json = EXCLUDED.form_answers_json,
  form_schema_version = EXCLUDED.form_schema_version;
