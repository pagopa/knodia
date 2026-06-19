-- POC Use Case 03 — Lynx side.
-- Organization IDs match scripts/local-auth/local-cognito.mjs and generate-token.mjs.
-- ${NAMESPACE} is substituted at runtime by seed.sh via sed.

-- systemSERCLynx publishes the relay (receive-data) e-service on Lynx, consumes the
-- supervisory body's lookup/metadata e-service and systemSERCOrion's relay, and holds
-- the erdsPOC attribute.
INSERT INTO ${NAMESPACE}_organization."organization" (id, name, metadata_version, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000105', 'System SERC Lynx', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO ${NAMESPACE}_organization."organization_attribute" (organization_id, scheme, code, metadata_version)
VALUES ('00000000-0000-4000-8000-000000000105', 'vc_poc_attributes', 'erds_poc', 0)
ON CONFLICT ON CONSTRAINT organization_attribute_pk DO NOTHING;
