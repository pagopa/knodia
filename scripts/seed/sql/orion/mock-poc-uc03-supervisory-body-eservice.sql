-- POC UC03 mock supervisory-body provide-data e-service (lookupERDS + getERDSMetadata) for the orion knode.
-- Producer is supervisoryBodyOrion (scripts/seed/sql/orion/poc-use-case-03.sql).
-- ${NAMESPACE} and ${ENVIRONMENT} are substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_eservice."eservice" (
  id, producer_id, name, description, mode,
  is_consumer_operator_identification_required, is_signal_hub_enabled,
  metadata_version, created_at, updated_at
) VALUES (
  'a3f1c8e0-1b2c-4d3e-8f40-000000000301',
  '00000000-0000-4000-8000-000000000107',
  '{"en": "ERDS Lookup & Metadata - Orion"}'::jsonb,
  '{"en": "Cross-Border provide-data E-Service published by the supervisory body: looks up which SERC serves a recipient (lookupERDS) and returns that SERC''s metadata (getERDSMetadata). Bearer-token access."}'::jsonb,
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
  'a3f1c8e0-1b2c-4d3e-8f40-000000000302',
  'a3f1c8e0-1b2c-4d3e-8f40-000000000301',
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
  'a3f1c8e0-1b2c-4d3e-8f40-000000000303',
  'a3f1c8e0-1b2c-4d3e-8f40-000000000301',
  'a3f1c8e0-1b2c-4d3e-8f40-000000000302',
  'e57e09d2b9b5d1d350f80dfba15248cf56518c0caf10bcff505094018640278d',
  'application/yaml',
  'mock-bearer-poc-uc03-supervisory-body-eservice.yaml',
  'a3f1c8e0-1b2c-4d3e-8f40-000000000303/mock-bearer-poc-uc03-supervisory-body-eservice.yaml',
  '{"en": "mock-bearer-poc-uc03-supervisory-body-eservice.yaml"}'::jsonb,
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
  'a3f1c8e0-1b2c-4d3e-8f40-000000000301',
  'a3f1c8e0-1b2c-4d3e-8f40-000000000302',
  1, 'vc_poc_attributes', 'erds_poc',
  0
) ON CONFLICT ON CONSTRAINT eservice_v_req_attribute_pk DO NOTHING;

-- Wipe all categories for this eservice and reinsert the canonical set, so
-- any future category change is captured idempotently on dev/multinode reruns.
DELETE FROM ${NAMESPACE}_eservice."eservice_category"
 WHERE eservice_id = 'a3f1c8e0-1b2c-4d3e-8f40-000000000301';

INSERT INTO ${NAMESPACE}_eservice."eservice_category" (
  eservice_id, scheme, code, metadata_version
) VALUES (
  'a3f1c8e0-1b2c-4d3e-8f40-000000000301',
  'vc_example_eservice_categories', 'citizen.residence.digital_domicile',
  0
);
