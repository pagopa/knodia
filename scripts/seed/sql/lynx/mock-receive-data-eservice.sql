-- Mock ReceiveData e-service for the lynx knode.
-- ${NAMESPACE} and ${ENVIRONMENT} are substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_eservice."eservice" (
  id, producer_id, name, description, mode,
  is_consumer_operator_identification_required, is_signal_hub_enabled,
  metadata_version, created_at, updated_at
) VALUES (
  'b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08',
  '00000000-0000-4000-8000-000000000004',
  '{"en": "Mockup 04 Company Digital Domicile (Receive data) - Lynx"}'::jsonb,
  '{"en": "Cross-Border Receive data E-Service for forwarding the digital domicile of a legal entity. Signature: ACK = sendDigitalContact(legal_entity, contact_point). Producer publishes pre-filled lawfulness forms the Consumer picks when creating a Purpose."}'::jsonb,
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
  'c2e5b1d4-8f3a-4e72-9d28-2b5c9c4f6d19',
  'b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08',
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

-- The interface YAML referenced by `path` / `name` is generated from the
-- Receive-data router in apps/services/mock-eservice/src/routers/ and uploaded
-- to S3 / MinIO by scripts/seed/seed.sh.
INSERT INTO ${NAMESPACE}_eservice."eservice_interface" (
  id, eservice_id, eservice_version_id,
  checksum, content_type, name, path, pretty_name,
  metadata_version, created_at, updated_at
) VALUES (
  'd3f6c2e5-9a4b-4f83-be39-3c6d0d5e7e2a',
  'b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08',
  'c2e5b1d4-8f3a-4e72-9d28-2b5c9c4f6d19',
  '43b4f456b7d662f2536449e317c5c11330811ff7f8ccdcb7c1a7dcfd07d6bda0',
  'application/yaml',
  'mock-receive-data-eservice.yaml',
  'd3f6c2e5-9a4b-4f83-be39-3c6d0d5e7e2a/mock-receive-data-eservice.yaml',
  '{"en": "mock-receive-data-eservice.yaml"}'::jsonb,
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
  'b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08',
  'c2e5b1d4-8f3a-4e72-9d28-2b5c9c4f6d19',
  1, 'knodia', 'testing_organization',
  0
) ON CONFLICT ON CONSTRAINT eservice_v_req_attribute_pk DO NOTHING;

DELETE FROM ${NAMESPACE}_eservice."eservice_category"
 WHERE eservice_id = 'b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08';

INSERT INTO ${NAMESPACE}_eservice."eservice_category" (
  eservice_id, scheme, code, metadata_version
) VALUES (
  'b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08',
  'vc_example_eservice_categories', 'organization.private_company.digital_domicile',
  0
);

-- Three pre-filled purpose-form options for E-service 04 (Confluence "Purpose
-- Form mockup 04"). All three share purpose=INSTITUTIONAL, usesPersonalData=NO
-- and isRequestOnBehalfOfThirdParties=NO; they differ on the third-party
-- data usage profile.
INSERT INTO ${NAMESPACE}_eservice."eservice_purpose_form_option" (
  id, eservice_id, name, description,
  form_answers_json, form_schema_version,
  metadata_version
) VALUES (
  'e4a7d3f6-ab5c-4094-9f4a-4d7e1e6f8f3b',
  'b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08',
  '{"en": "Company contacts — with confidential third-party data"}'::jsonb,
  '{"en": "Retrieve a company''s contacts for institutional communications, with access to confidential or strictly reserved third-party non-personal data."}'::jsonb,
  '{"purpose":"INSTITUTIONAL","institutionalPurpose":"Service to receive a company''s contacts.","usesPersonalData":"NO","usesThirdPartyNonPersonalData":"YES","usesThirdPartyConfidentialData":"YES","isRequestOnBehalfOfThirdParties":"NO"}'::jsonb,
  '1.0',
  0
) ON CONFLICT (id) DO UPDATE SET
  eservice_id = EXCLUDED.eservice_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  form_answers_json = EXCLUDED.form_answers_json,
  form_schema_version = EXCLUDED.form_schema_version;

INSERT INTO ${NAMESPACE}_eservice."eservice_purpose_form_option" (
  id, eservice_id, name, description,
  form_answers_json, form_schema_version,
  metadata_version
) VALUES (
  'f5b8e4a7-bc6d-41a5-aa5b-5e8f2f7a9a4c',
  'b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08',
  '{"en": "Company contacts — with non-confidential third-party data"}'::jsonb,
  '{"en": "Retrieve a company''s contacts for institutional communications, with access to third-party non-personal data that is not confidential or strictly reserved."}'::jsonb,
  '{"purpose":"INSTITUTIONAL","institutionalPurpose":"Service to receive a company''s contacts.","usesPersonalData":"NO","usesThirdPartyNonPersonalData":"YES","usesThirdPartyConfidentialData":"NO","isRequestOnBehalfOfThirdParties":"NO"}'::jsonb,
  '1.0',
  0
) ON CONFLICT (id) DO UPDATE SET
  eservice_id = EXCLUDED.eservice_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  form_answers_json = EXCLUDED.form_answers_json,
  form_schema_version = EXCLUDED.form_schema_version;

INSERT INTO ${NAMESPACE}_eservice."eservice_purpose_form_option" (
  id, eservice_id, name, description,
  form_answers_json, form_schema_version,
  metadata_version
) VALUES (
  'a6c9f5b8-cd7e-42b6-bb6c-6f9a3a8b0b5d',
  'b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08',
  '{"en": "Company contacts — without third-party data"}'::jsonb,
  '{"en": "Retrieve a company''s contacts for institutional communications, without access to any third-party non-personal data."}'::jsonb,
  '{"purpose":"INSTITUTIONAL","institutionalPurpose":"Service to receive a company''s contacts.","usesPersonalData":"NO","usesThirdPartyNonPersonalData":"NO","isRequestOnBehalfOfThirdParties":"NO"}'::jsonb,
  '1.0',
  0
) ON CONFLICT (id) DO UPDATE SET
  eservice_id = EXCLUDED.eservice_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  form_answers_json = EXCLUDED.form_answers_json,
  form_schema_version = EXCLUDED.form_schema_version;
