-- POC Use Case 01 — consumer side (Orion).
-- Organization IDs match scripts/local-auth/local-cognito.mjs and generate-token.mjs.
-- ${NAMESPACE} is substituted at runtime by seed.sh via sed.

-- academyOrion consumes the qualifications eservices published on Lynx and
-- holds the trainingInstitutes attribute.
INSERT INTO ${NAMESPACE}_organization."organization" (id, name, metadata_version, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000104', 'Academy Orion', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO ${NAMESPACE}_organization."organization_attribute" (organization_id, scheme, code, metadata_version)
VALUES ('00000000-0000-4000-8000-000000000104', 'vc_poc_attributes', 'training_institutes', 0)
ON CONFLICT ON CONSTRAINT organization_attribute_pk DO NOTHING;
