-- Mock ReceiveData e-service for the lynx knode.
-- ${NAMESPACE} and ${ENVIRONMENT} are substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_eservice."eservice" (
  id, producer_id, name, description, mode,
  is_consumer_operator_identification_required, is_signal_hub_enabled,
  metadata_version, created_at, updated_at
) VALUES (
  'b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08',
  '00000000-0000-4000-8000-000000000004',
  '{"en": "Mockup 04 Citizen Survey Submission (Receive data) - Lynx"}'::jsonb,
  '{"en": "Cross-Border Receive data E-Service that collects survey submissions from citizens; the Producer publishes pre-filled lawfulness-of-processing forms for the Consumer to choose from when creating a Purpose."}'::jsonb,
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
  'a4b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7',
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
  1, 'vc_territorial_units', 'nuts3',
  0
) ON CONFLICT ON CONSTRAINT eservice_v_req_attribute_pk DO NOTHING;

DELETE FROM ${NAMESPACE}_eservice."eservice_category"
 WHERE eservice_id = 'b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08';

INSERT INTO ${NAMESPACE}_eservice."eservice_category" (
  eservice_id, scheme, code, metadata_version
) VALUES (
  'b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08',
  'vc_example_eservice_categories', 'citizen.statistics.survey_submission',
  0
);

INSERT INTO ${NAMESPACE}_eservice."eservice_purpose_form_option" (
  id, eservice_id, name, description,
  form_answers_json, form_schema_version,
  metadata_version
) VALUES (
  'e4a7d3f6-ab5c-4094-9f4a-4d7e1e6f8f3b',
  'b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08',
  '{"en": "Public interest task"}'::jsonb,
  '{"en": "Pre-filled lawfulness for processing personal data in the exercise of a public interest task under Art. 6(1)(e) GDPR."}'::jsonb,
  '{"checkedExistenceMereCorrectnessInteropCatalogue":"true","confirmPrincipleIntegrityAndDiscretion":"true","dataDownload":"NO","declarationConfirmGDPR":"true","deliveryMethod":"CLEARTEXT","doneDpia":"NO","institutionalPurpose":"Citizen survey collection for statistical reporting.","isRequestOnBehalfOfThirdParties":"NO","knowsDataQuantity":"NO","legalBasis":["PUBLIC_INTEREST"],"legalBasisPublicInterest":"PUBLIC_INTEREST_TASK","publicInterestTaskText":"National statistical surveys mandated by national legislation on official statistics.","personalDataTypes":["WITH_IDENTIFYING_DATA"],"policyProvided":"YES","policyProvidedMedium":"PRINT","purpose":"INSTITUTIONAL","purposePursuit":"MERE_CORRECTNESS","usesPersonalData":"YES"}'::jsonb,
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
  '{"en": "Legal obligation"}'::jsonb,
  '{"en": "Pre-filled lawfulness for processing personal data to comply with a legal obligation under Art. 6(1)(c) GDPR."}'::jsonb,
  '{"checkedExistenceMereCorrectnessInteropCatalogue":"true","confirmPrincipleIntegrityAndDiscretion":"true","dataDownload":"NO","declarationConfirmGDPR":"true","deliveryMethod":"CLEARTEXT","doneDpia":"NO","institutionalPurpose":"Citizen survey collection required by statutory reporting obligations.","isRequestOnBehalfOfThirdParties":"NO","knowsDataQuantity":"NO","legalBasis":["LEGAL_OBLIGATION"],"legalObligationReference":"Italian National Statistics Act, art. 7 D.Lgs. 322/1989.","personalDataTypes":["WITH_IDENTIFYING_DATA"],"policyProvided":"YES","policyProvidedMedium":"PRINT","purpose":"INSTITUTIONAL","purposePursuit":"MERE_CORRECTNESS","usesPersonalData":"YES"}'::jsonb,
  '1.0',
  0
) ON CONFLICT (id) DO UPDATE SET
  eservice_id = EXCLUDED.eservice_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  form_answers_json = EXCLUDED.form_answers_json,
  form_schema_version = EXCLUDED.form_schema_version;
