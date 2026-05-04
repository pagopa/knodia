-- Mock DPoP e-service for the orion knode.
-- ${NAMESPACE} and ${ENVIRONMENT} are substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_eservice."eservice" (
  id, producer_id, name, description, mode,
  is_consumer_operator_identification_required, is_signal_hub_enabled,
  metadata_version, created_at, updated_at
) VALUES (
  '905c4569-95db-4670-a146-8239fcb3f41a',
  '00000000-0000-4000-8000-000000000004',
  '{"en": "Mock DPoP E-service Orion"}'::jsonb,
  '{"en": "Mock e-service used to validate the DPoP access-token flow end-to-end"}'::jsonb,
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
  'a50299cc-f381-4089-8684-a63b2497b690',
  '905c4569-95db-4670-a146-8239fcb3f41a',
  1, 'Active',
  ARRAY['mock.orion.${ENVIRONMENT}.knodia.com'], 3600, 'DPoP',
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
  'e522049f-2301-442a-91de-e5bcaffd08be',
  '905c4569-95db-4670-a146-8239fcb3f41a',
  'a50299cc-f381-4089-8684-a63b2497b690',
  '186811e830bb8c525b6d1b06828b4f551a3b8ac23787a3a4ad1557d64c4a1c23',
  'application/yaml',
  'mock-dpop-eservice.yaml',
  'e522049f-2301-442a-91de-e5bcaffd08be/mock-dpop-eservice.yaml',
  '{"en": "mock-dpop-eservice.yaml"}'::jsonb,
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
  '905c4569-95db-4670-a146-8239fcb3f41a',
  'a50299cc-f381-4089-8684-a63b2497b690',
  1, 'vc_territorial_units', 'nuts3',
  0
) ON CONFLICT ON CONSTRAINT eservice_v_req_attribute_pk DO NOTHING;

INSERT INTO ${NAMESPACE}_eservice."eservice_category" (
  eservice_id, scheme, code, metadata_version
) VALUES (
  '905c4569-95db-4670-a146-8239fcb3f41a',
  'vc_example_eservice_categories', 'citizen.identity.birth_date',
  0
) ON CONFLICT ON CONSTRAINT eservice_category_pk DO NOTHING;
