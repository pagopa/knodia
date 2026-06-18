-- POC UC01 mock qualifications e-service for the lynx knode (provide-data).
-- Producer is studentRegistryLynx (scripts/seed/sql/lynx/poc-use-case-01.sql).
-- ${NAMESPACE} and ${ENVIRONMENT} are substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_eservice."eservice" (
  id, producer_id, name, description, mode,
  is_consumer_operator_identification_required, is_signal_hub_enabled,
  metadata_version, created_at, updated_at
) VALUES (
  '4e769859-52d9-40d3-a54c-2de4ba44da10',
  '00000000-0000-4000-8000-000000000103',
  '{"en": "Student Qualifications - Lynx"}'::jsonb,
  '{"en": "Cross-Border E-Service that returns the qualifications held by a student identified by uidStudent, with Bearer-token access."}'::jsonb,
  'ProvideData',
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
  '7046e499-ec54-4ea4-8821-fd22b5ee7ae4',
  '4e769859-52d9-40d3-a54c-2de4ba44da10',
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
  '72937dcf-e40b-4fa9-8e54-33a21407d19c',
  '4e769859-52d9-40d3-a54c-2de4ba44da10',
  '7046e499-ec54-4ea4-8821-fd22b5ee7ae4',
  '3c32ea57705bf61ec17716b429cf667a76fdb8ff5dcabfd166ca6da7c23a3af9',
  'application/yaml',
  'mock-bearer-poc-uc01-qualifications-eservice.yaml',
  '72937dcf-e40b-4fa9-8e54-33a21407d19c/mock-bearer-poc-uc01-qualifications-eservice.yaml',
  '{"en": "mock-bearer-poc-uc01-qualifications-eservice.yaml"}'::jsonb,
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
  '4e769859-52d9-40d3-a54c-2de4ba44da10',
  '7046e499-ec54-4ea4-8821-fd22b5ee7ae4',
  1, 'vc_poc_attributes', 'training_institutes',
  0
) ON CONFLICT ON CONSTRAINT eservice_v_req_attribute_pk DO NOTHING;

-- Wipe all categories for this eservice and reinsert the canonical set, so
-- any future category change is captured idempotently on dev/multinode reruns.
DELETE FROM ${NAMESPACE}_eservice."eservice_category"
 WHERE eservice_id = '4e769859-52d9-40d3-a54c-2de4ba44da10';

INSERT INTO ${NAMESPACE}_eservice."eservice_category" (
  eservice_id, scheme, code, metadata_version
) VALUES (
  '4e769859-52d9-40d3-a54c-2de4ba44da10',
  'vc_example_eservice_categories', 'citizen.training.qualifications',
  0
);
