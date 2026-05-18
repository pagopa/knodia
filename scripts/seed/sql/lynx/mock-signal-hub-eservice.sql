-- Mock Signal Hub e-service for the lynx knode.
-- ${NAMESPACE} and ${ENVIRONMENT} are substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_eservice."eservice" (
  id, producer_id, name, description, mode,
  is_consumer_operator_identification_required, is_signal_hub_enabled,
  metadata_version, created_at, updated_at
) VALUES (
  '634ac97e-47cb-4aed-bb0a-b3936ee6f6c7',
  '00000000-0000-4000-8000-000000000004',
  '{"en": "Mockup 03 Residence (Signal Hub Bearer) - Lynx"}'::jsonb,
  '{"en": "Cross-Border E-Service that returns the residence of a natural person identified by Codice Fiscale and exposes Signal Hub pseudonymization, with Bearer-token access."}'::jsonb,
  'ProvideData',
  true, true,
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
  'fa2a800a-5058-4859-b68a-bfbd3ee863c0',
  '634ac97e-47cb-4aed-bb0a-b3936ee6f6c7',
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
  'e5540a33-703e-4527-9880-05e7d347f93e',
  '634ac97e-47cb-4aed-bb0a-b3936ee6f6c7',
  'fa2a800a-5058-4859-b68a-bfbd3ee863c0',
  'bf833368a618dae2082fd99d8d7cbb10d455e8aea3ceffcdc2d564cea995ec8b',
  'application/yaml',
  'mock-bearer-signal-hub-eservice.yaml',
  'e5540a33-703e-4527-9880-05e7d347f93e/mock-bearer-signal-hub-eservice.yaml',
  '{"en": "mock-bearer-signal-hub-eservice.yaml"}'::jsonb,
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
  '634ac97e-47cb-4aed-bb0a-b3936ee6f6c7',
  'fa2a800a-5058-4859-b68a-bfbd3ee863c0',
  1, 'vc_territorial_units', 'nuts3',
  0
) ON CONFLICT ON CONSTRAINT eservice_v_req_attribute_pk DO NOTHING;

-- Wipe all categories for this eservice and reinsert the canonical set, so
-- any future category change is captured idempotently on dev/multinode reruns.
DELETE FROM ${NAMESPACE}_eservice."eservice_category"
 WHERE eservice_id = '634ac97e-47cb-4aed-bb0a-b3936ee6f6c7';

INSERT INTO ${NAMESPACE}_eservice."eservice_category" (
  eservice_id, scheme, code, metadata_version
) VALUES (
  '634ac97e-47cb-4aed-bb0a-b3936ee6f6c7',
  'vc_example_eservice_categories', 'citizen.residence.residence_place',
  0
);
