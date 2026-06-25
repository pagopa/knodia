-- Mock e-service for the lynx knode.
-- ${NAMESPACE} and ${ENVIRONMENT} are substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_eservice."eservice" (
  id, producer_id, name, description, mode,
  is_consumer_operator_identification_required, is_signal_hub_enabled,
  metadata_version, created_at, updated_at
) VALUES (
  '4ed2b4f9-e974-4e69-84d6-7074af92cd4f',
  '00000000-0000-4000-8000-000000000004',
  '{"en": "Mockup 05 Company Addresses (Bearer) - Lynx"}'::jsonb,
  '{"en": "Cross-Border E-Service that returns the registered addresses of legal entities, with Bearer-token access and async processing."}'::jsonb,
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
  '8c86125f-ce3e-4fc7-8ea6-4b8c45c241e7',
  '4ed2b4f9-e974-4e69-84d6-7074af92cd4f',
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
  '7add7dfd-dece-44e4-9d21-7a9c9404506a',
  '4ed2b4f9-e974-4e69-84d6-7074af92cd4f',
  '8c86125f-ce3e-4fc7-8ea6-4b8c45c241e7',
  'f69c2412b6d17e8609676568ffe2d657a547d4ddd683083dcbbcadf6615e1c7c',
  'application/yaml',
  'mock-bearer-async-consumption-eservice.yaml',
  '7add7dfd-dece-44e4-9d21-7a9c9404506a/mock-bearer-async-consumption-eservice.yaml',
  '{"en": "mock-bearer-async-consumption-eservice.yaml"}'::jsonb,
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
  '4ed2b4f9-e974-4e69-84d6-7074af92cd4f',
  '8c86125f-ce3e-4fc7-8ea6-4b8c45c241e7',
  1, 'vc_territorial_units', 'nuts3',
  0
) ON CONFLICT ON CONSTRAINT eservice_v_req_attribute_pk DO NOTHING;

-- Wipe all categories for this eservice and reinsert the canonical set, so
-- any future category change is captured idempotently on dev/multinode reruns.
DELETE FROM ${NAMESPACE}_eservice."eservice_category"
 WHERE eservice_id = '4ed2b4f9-e974-4e69-84d6-7074af92cd4f';

INSERT INTO ${NAMESPACE}_eservice."eservice_category" (
  eservice_id, scheme, code, metadata_version
) VALUES (
  '4ed2b4f9-e974-4e69-84d6-7074af92cd4f',
  'vc_example_eservice_categories', 'organization.private_company.address',
  0
);
