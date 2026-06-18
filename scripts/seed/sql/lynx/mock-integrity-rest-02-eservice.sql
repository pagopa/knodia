-- Mock Integrity Rest 02 e-service for the Lynx knode.
-- ${NAMESPACE} and ${ENVIRONMENT} are substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_eservice."eservice" (
  id, producer_id, name, description, mode,
  is_consumer_operator_identification_required, is_signal_hub_enabled,
  metadata_version, created_at, updated_at
) VALUES (
  'cf9dde0a-336a-43e0-a5f7-14b698a0586e',
  '00000000-0000-4000-8000-000000000004',
  '{"en": "Mockup 06 Company Address (Integrity REST 02) - Lynx"}'::jsonb,
  '{"en": "Cross-Border E-Service that returns a legal entity address."}'::jsonb,
  'ProvideData',
  false, false,
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
  'a72aa082-69f0-4ae2-ae61-051138118ab3',
  'cf9dde0a-336a-43e0-a5f7-14b698a0586e',
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
  '62708c81-8862-48bf-8140-49804d18c7e6',
  'cf9dde0a-336a-43e0-a5f7-14b698a0586e',
  'a72aa082-69f0-4ae2-ae61-051138118ab3',
  'f8fb082f938fa17855a329462b71849213ca3c5a12f22aad7ac05edee1d4ec41',
  'application/yaml',
  'mock-bearer-integrity-rest-02-eservice.yaml',
  '62708c81-8862-48bf-8140-49804d18c7e6/mock-bearer-integrity-rest-02-eservice.yaml',
  '{"en": "mock-bearer-integrity-rest-02-eservice.yaml"}'::jsonb,
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
  'cf9dde0a-336a-43e0-a5f7-14b698a0586e',
  'a72aa082-69f0-4ae2-ae61-051138118ab3',
  1, 'vc_territorial_units', 'nuts1',
  0
) ON CONFLICT ON CONSTRAINT eservice_v_req_attribute_pk DO NOTHING;

-- Wipe all categories for this eservice and reinsert the canonical set, so
-- any future category change is captured idempotently on dev/multinode reruns.
DELETE FROM ${NAMESPACE}_eservice."eservice_category"
 WHERE eservice_id = 'cf9dde0a-336a-43e0-a5f7-14b698a0586e';

INSERT INTO ${NAMESPACE}_eservice."eservice_category" (
  eservice_id, scheme, code, metadata_version
) VALUES (
  'cf9dde0a-336a-43e0-a5f7-14b698a0586e',
  'vc_example_eservice_categories', 'organization.private_company.address',
  0
);
