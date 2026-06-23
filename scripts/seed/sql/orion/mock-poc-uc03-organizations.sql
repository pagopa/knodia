-- POC Use Case 03 — Orion side.
-- Organization IDs match scripts/local-auth/local-cognito.mjs and generate-token.mjs.
-- ${NAMESPACE} is substituted at runtime by seed.sh via sed.

-- supervisoryBodyOrion publishes the lookup/metadata (provide-data) e-service on Orion
-- and holds the ERDS attribute.
INSERT INTO ${NAMESPACE}_organization."organization" (id, name, metadata_version, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000107', 'Supervisory Body Orion', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO ${NAMESPACE}_organization."organization_attribute" (organization_id, scheme, code, metadata_version)
VALUES ('00000000-0000-4000-8000-000000000107', 'vc_poc_attributes', 'erds', 0)
ON CONFLICT ON CONSTRAINT organization_attribute_pk DO NOTHING;

-- systemSERCOrion publishes the relay (receive-data) e-service on Orion, consumes
-- systemSERCLynx's relay (evidence return), and holds the ERDS attribute.
INSERT INTO ${NAMESPACE}_organization."organization" (id, name, metadata_version, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000106', 'System SERC Orion', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO ${NAMESPACE}_organization."organization_attribute" (organization_id, scheme, code, metadata_version)
VALUES ('00000000-0000-4000-8000-000000000106', 'vc_poc_attributes', 'erds', 0)
ON CONFLICT ON CONSTRAINT organization_attribute_pk DO NOTHING;
