-- POC UC01 mock setQualification e-service for the lynx knode (receive-data).
-- Producer is studentRegistryLynx (scripts/seed/sql/lynx/poc-use-case-01.sql).
-- Distinct e-service from the provide-data getQualifications one.
-- ${NAMESPACE} and ${ENVIRONMENT} are substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_eservice."eservice" (
  id, producer_id, name, description, mode,
  is_consumer_operator_identification_required, is_signal_hub_enabled,
  metadata_version, created_at, updated_at
) VALUES (
  'bc187d30-d5a2-40ba-b026-197199827596',
  '00000000-0000-4000-8000-000000000103',
  '{"en": "Student Qualification Registration - Lynx"}'::jsonb,
  '{"en": "Cross-Border receive-data E-Service that registers a new qualification for a student identified by uidStudent, with Bearer-token access."}'::jsonb,
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
  'efe89cc7-2eac-4684-90ae-6d93e0d65698',
  'bc187d30-d5a2-40ba-b026-197199827596',
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
  'ff8bebc1-5e1c-4f8d-8611-03e18354558f',
  'bc187d30-d5a2-40ba-b026-197199827596',
  'efe89cc7-2eac-4684-90ae-6d93e0d65698',
  'af42b2f14d3cae968eeb7a11dcf2ce322e124188be0093745ae3edf97d810f2d',
  'application/yaml',
  'mock-bearer-poc-uc01-set-qualification-eservice.yaml',
  'ff8bebc1-5e1c-4f8d-8611-03e18354558f/mock-bearer-poc-uc01-set-qualification-eservice.yaml',
  '{"en": "mock-bearer-poc-uc01-set-qualification-eservice.yaml"}'::jsonb,
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
  'bc187d30-d5a2-40ba-b026-197199827596',
  'efe89cc7-2eac-4684-90ae-6d93e0d65698',
  1, 'vc_poc_attributes', 'training_institutes',
  0
) ON CONFLICT ON CONSTRAINT eservice_v_req_attribute_pk DO NOTHING;

-- Wipe all categories for this eservice and reinsert the canonical set, so
-- any future category change is captured idempotently on dev/multinode reruns.
DELETE FROM ${NAMESPACE}_eservice."eservice_category"
 WHERE eservice_id = 'bc187d30-d5a2-40ba-b026-197199827596';

INSERT INTO ${NAMESPACE}_eservice."eservice_category" (
  eservice_id, scheme, code, metadata_version
) VALUES (
  'bc187d30-d5a2-40ba-b026-197199827596',
  'vc_example_eservice_categories', 'citizen.training.qualifications',
  0
);

-- Receive-data purpose form option (the "Purpose Form" the consumer selects when
-- registering a purpose for this e-service). form_answers_json validates against
-- the producer's purpose-form schema (schemas-withriskanalysis/1.0).
INSERT INTO ${NAMESPACE}_eservice."eservice_purpose_form_option" (
  id, eservice_id, name, description,
  form_schema_version, form_answers_json, metadata_version
) VALUES (
  '93791723-9504-4f6f-8e74-2a59d5e5f834',
  'bc187d30-d5a2-40ba-b026-197199827596',
  '{"en": "Registration of a qualification obtained abroad"}'::jsonb,
  '{"en": "Registration of a qualification obtained in an EU member state at a recognised tertiary-education institution."}'::jsonb,
  '1.0',
  '{
    "purpose": "INSTITUTIONAL",
    "institutionalPurpose": "Registrazione titolo di formazione conseguito da studente",
    "usesPersonalData": "YES",
    "personalDataTypes": ["WITH_IDENTIFYING_DATA"],
    "legalBasis": ["PUBLIC_INTEREST"],
    "legalBasisPublicInterest": "RULE_OF_LAW",
    "ruleOfLawText": "Legge 11 luglio 2002, n. 148",
    "declarationConfirmGDPR": "true",
    "knowsDataQuantity": "NO",
    "deliveryMethod": "ANONYMOUS",
    "policyProvided": "YES",
    "policyProvidedMedium": "PRINT",
    "confirmPrincipleIntegrityAndDiscretion": "true",
    "doneDpia": "NO",
    "dataDownload": "NO",
    "purposePursuit": "MERE_CORRECTNESS",
    "checkedExistenceMereCorrectnessInteropCatalogue": "true",
    "isRequestOnBehalfOfThirdParties": "NO"
  }'::jsonb,
  0
) ON CONFLICT (id) DO UPDATE SET
  eservice_id = EXCLUDED.eservice_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  form_schema_version = EXCLUDED.form_schema_version,
  form_answers_json = EXCLUDED.form_answers_json;
