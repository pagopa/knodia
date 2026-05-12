-- Mock e-service for the lynx knode.
-- ${NAMESPACE} and ${ENVIRONMENT} are substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_eservice."eservice" (
  id, producer_id, name, description, mode,
  is_consumer_operator_identification_required, is_signal_hub_enabled,
  metadata_version, created_at, updated_at
) VALUES (
  'e7f5837e-75f4-431d-9465-73366d27bef2',
  '00000000-0000-4000-8000-000000000004',
  '{"en": "Mock E-service Lynx"}'::jsonb,
  '{"en": "Mock e-service used to validate the access-token flow end-to-end"}'::jsonb,
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
  '29721f0d-e36e-4157-bcdc-9629ace0f85b',
  'e7f5837e-75f4-431d-9465-73366d27bef2',
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
  'd44bcdeb-d0dc-46c3-abf6-dd2862fdd7ad',
  'e7f5837e-75f4-431d-9465-73366d27bef2',
  '29721f0d-e36e-4157-bcdc-9629ace0f85b',
  '3084f7bd01f1d1e06567f19d7e25c3f3f94368582ee5a614bca4806576a48d64',
  'application/yaml',
  'mock-bearer-eservice.yaml',
  'd44bcdeb-d0dc-46c3-abf6-dd2862fdd7ad/mock-bearer-eservice.yaml',
  '{"en": "mock-bearer-eservice.yaml"}'::jsonb,
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
  'e7f5837e-75f4-431d-9465-73366d27bef2',
  '29721f0d-e36e-4157-bcdc-9629ace0f85b',
  1, 'vc_territorial_units', 'nuts3',
  0
) ON CONFLICT ON CONSTRAINT eservice_v_req_attribute_pk DO NOTHING;

INSERT INTO ${NAMESPACE}_eservice."eservice_category" (
  eservice_id, scheme, code, metadata_version
) VALUES (
  'e7f5837e-75f4-431d-9465-73366d27bef2',
  'vc_example_eservice_categories', 'citizen.identity.birth_date',
  0
) ON CONFLICT ON CONSTRAINT eservice_category_pk DO NOTHING;
