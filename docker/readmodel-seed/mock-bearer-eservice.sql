-- Seeds the producer-side rows for the mock e-service (eservice + version
-- + interface + required attribute + category).

INSERT INTO ${NAMESPACE}_eservice."eservice" (
  id, producer_id, name, description, mode,
  is_consumer_operator_identification_required, is_signal_hub_enabled,
  metadata_version, created_at, updated_at
) VALUES (
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000004',
  '{"en": "Mock Bearer E-service"}'::jsonb,
  '{"en": "Mock e-service used to validate the Bearer access-token flow end-to-end"}'::jsonb,
  'ProvideData',
  false, false,
  0, now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO ${NAMESPACE}_eservice."eservice_version" (
  id, eservice_id, version_number, state,
  access_token_audience, access_token_duration, access_token_type,
  max_daily_calls_per_consumer, max_daily_calls_per_knode,
  metadata_version, created_at, updated_at
) VALUES (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  1, 'Active',
  ARRAY['mock-eservice.knodia.local'], 3600, 'Bearer',
  1000, 10000,
  0, now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO ${NAMESPACE}_eservice."eservice_interface" (
  id, eservice_id, eservice_version_id,
  checksum, content_type, name, path, pretty_name,
  metadata_version, created_at, updated_at
) VALUES (
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '186811e830bb8c525b6d1b06828b4f551a3b8ac23787a3a4ad1557d64c4a1c23',
  'application/yaml',
  'mock-bearer-eservice.yaml',
  'interfaces/mock-bearer-eservice.yaml',
  '{"en": "mock-bearer-eservice.yaml"}'::jsonb,
  0, now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO ${NAMESPACE}_eservice."eservice_version_required_attribute" (
  eservice_id, eservice_version_id, group_id, scheme, code, metadata_version
) VALUES (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  1, 'vc_territorial_units', 'nuts3',
  0
) ON CONFLICT ON CONSTRAINT eservice_v_req_attribute_pk DO NOTHING;

INSERT INTO ${NAMESPACE}_eservice."eservice_category" (
  eservice_id, scheme, code, metadata_version
) VALUES (
  '10000000-0000-4000-8000-000000000001',
  'vc_example_eservice_categories', 'citizen.identity.birth_date',
  0
) ON CONFLICT ON CONSTRAINT eservice_category_pk DO NOTHING;
